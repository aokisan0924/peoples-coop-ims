<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\Product;
use App\Models\StockBatch;
use App\Models\StockTransfer;
use App\Services\StockDeductionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class StockTransferController extends Controller
{
    public function __construct(private StockDeductionService $stockDeduction) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = StockTransfer::with(['product', 'fromLocation', 'toLocation', 'initiatedBy', 'receivedBy'])
            ->orderByDesc('initiated_at');

        if (! $user->seesAllLocations()) {
            // Manager sees transfers where they're either the sender or the receiver
            $query->where(fn ($q) => $q->where('from_location_id', $user->location_id)
                ->orWhere('to_location_id', $user->location_id));
        }

        return Inertia::render('stock-transfers/index', [
            'transfers' => $query->limit(50)->get(),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        if (! $isOwner && ! $user->location_id) {
            abort(403, 'Only branch-assigned Managers can initiate transfers.');
        }

        return Inertia::render('stock-transfers/create', [
            'products' => Product::orderBy('name')->get(['id', 'name', 'sku']),
            // Owner picks from ALL branches; Manager only picks a destination (source is implicit)
            'sourceBranches' => $isOwner
                ? Location::where('is_active', true)->orderBy('name')->get(['id', 'name'])
                : [],
            'destinationBranches' => $isOwner
                ? Location::where('is_active', true)->orderBy('name')->get(['id', 'name'])
                : Location::where('is_active', true)->where('id', '!=', $user->location_id)->orderBy('name')->get(['id', 'name']),
            'isOwner' => $isOwner,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        if (! $isOwner && ! $user->location_id) {
            return back()->withErrors(['location' => 'Only branch-assigned Managers can initiate transfers.']);
        }

        $rules = [
            'product_id' => ['required', 'exists:products,id'],
            'to_location_id' => ['required', 'exists:locations,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];

        // Owner must explicitly pick a source branch too, since they have none of their own
        if ($isOwner) {
            $rules['from_location_id'] = ['required', 'exists:locations,id', 'different:to_location_id'];
        }

        $validated = $request->validate($rules);

        $fromLocationId = $isOwner ? $validated['from_location_id'] : $user->location_id;

        if ($validated['to_location_id'] == $fromLocationId) {
            return back()->withErrors(['to_location_id' => 'Cannot transfer stock to the same branch.']);
        }

        try {
            DB::transaction(function () use ($validated, $user, $fromLocationId) {
                $product = Product::lockForUpdate()->findOrFail($validated['product_id']);

                $result = $this->stockDeduction->deductWithBreakdown($product, $validated['quantity'], $fromLocationId);

                StockTransfer::create([
                    'product_id' => $product->id,
                    'from_location_id' => $fromLocationId,
                    'to_location_id' => $validated['to_location_id'],
                    'quantity' => $validated['quantity'],
                    'cost_price' => $result['avg_cost'],
                    'batch_breakdown' => $result['breakdown'],
                    'status' => 'in_transit',
                    'initiated_by' => $user->id,
                    'initiated_at' => now(),
                    'notes' => $validated['notes'] ?? null,
                ]);
            });
        } catch (RuntimeException $e) {
            return back()->withErrors(['quantity' => $e->getMessage()]);
        }

        return redirect()->route('stock-transfers.index')->with('success', 'Transfer initiated — stock is now in transit.');
    }

    public function confirmReceipt(Request $request, StockTransfer $transfer): RedirectResponse
    {
        $user = $request->user();

        if ($transfer->status !== 'in_transit') {
            return back()->withErrors(['transfer' => 'This transfer is no longer in transit.']);
        }

        if (! $user->seesAllLocations() && $user->location_id !== $transfer->to_location_id) {
            abort(403, 'Only the receiving branch can confirm this transfer.');
        }

        DB::transaction(function () use ($transfer, $user) {
            if (! empty($transfer->batch_breakdown)) {
                // Preserve the source batches' individual expiry dates and costs —
                // a transfer spanning two source batches with different expiry
                // dates becomes two destination batches, not one blended one.
                foreach ($transfer->batch_breakdown as $row) {
                    StockBatch::create([
                        'product_id' => $transfer->product_id,
                        'location_id' => $transfer->to_location_id,
                        'supplier_id' => null, // internal transfer, not a purchase
                        'received_qty' => $row['quantity'],
                        'remaining_qty' => $row['quantity'],
                        'cost_price' => $row['cost_price'],
                        'received_date' => now()->toDateString(),
                        'expiry_date' => $row['expiry_date'] ?? null,
                    ]);
                }
            } else {
                // Fallback for transfers initiated before batch_breakdown existed —
                // no per-batch detail was ever captured for these, so this is the
                // best that can be reconstructed: one blended batch, no expiry.
                StockBatch::create([
                    'product_id' => $transfer->product_id,
                    'location_id' => $transfer->to_location_id,
                    'supplier_id' => null,
                    'received_qty' => $transfer->quantity,
                    'remaining_qty' => $transfer->quantity,
                    'cost_price' => $transfer->cost_price,
                    'received_date' => now()->toDateString(),
                    'expiry_date' => null,
                ]);
            }

            $transfer->update([
                'status' => 'received',
                'received_by' => $user->id,
                'received_at' => now(),
            ]);
        });

        return back()->with('success', 'Transfer received — stock added to your branch.');
    }

    public function cancel(Request $request, StockTransfer $transfer): RedirectResponse
    {
        $user = $request->user();

        if ($transfer->status !== 'in_transit') {
            return back()->withErrors(['transfer' => 'Only in-transit transfers can be cancelled.']);
        }

        if (! $user->seesAllLocations() && $user->location_id !== $transfer->from_location_id) {
            abort(403, 'Only the sending branch can cancel this transfer.');
        }

        DB::transaction(function () use ($transfer) {
            // Restore the stock back to the source branch
            $this->stockDeduction->restore(
                $transfer->product_id,
                $transfer->quantity,
                (float) $transfer->cost_price,
                'Transfer cancelled',
                $transfer->from_location_id
            );

            $transfer->update(['status' => 'cancelled']);
        });

        return back()->with('success', 'Transfer cancelled — stock restored to your branch.');
    }
}
