<?php

namespace App\Http\Controllers;

use App\Models\InventoryCount;
use App\Models\InventoryCountItem;
use App\Models\Location;
use App\Models\Product;
use App\Services\StockDeductionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class InventoryCountController extends Controller
{
    public function __construct(private StockDeductionService $stockDeduction) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = InventoryCount::with('location', 'countedBy')->withCount('items')->orderByDesc('count_date');

        if (! $user->seesAllLocations()) {
            $query->where('location_id', $user->location_id);
        }

        return Inertia::render('inventory-counts/index', [
            'counts' => $query->limit(50)->get(),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        if (! $isOwner && ! $user->location_id) {
            abort(403, 'Only branch-assigned Managers can start an inventory count.');
        }

        return Inertia::render('inventory-counts/create', [
            'locations' => $isOwner ? Location::where('is_active', true)->orderBy('name')->get(['id', 'name']) : [],
            'isOwner' => $isOwner,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        $rules = ['count_date' => ['required', 'date'], 'notes' => ['nullable', 'string', 'max:500']];
        if ($isOwner) {
            $rules['location_id'] = ['required', 'exists:locations,id'];
        }

        $validated = $request->validate($rules);

        $count = InventoryCount::create([
            'location_id' => $isOwner ? $validated['location_id'] : $user->location_id,
            'counted_by' => $user->id,
            'count_date' => $validated['count_date'],
            'status' => 'draft',
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('inventory-counts.show', $count);
    }

    public function show(Request $request, InventoryCount $inventoryCount): Response
    {
        $this->authorizeAccess($request, $inventoryCount);

        return Inertia::render('inventory-counts/show', [
            'count' => $inventoryCount->load('items.product', 'location', 'countedBy'),
            'products' => Product::where('is_active', true)->orderBy('name')->get(['id', 'name', 'sku', 'barcode', 'cost_price']),
        ]);
    }

    /**
     * Add one product's physical count to the session. The "expected" quantity
     * is snapshotted right now, at the moment of counting — not recalculated
     * later — so the variance reflects what was true when you actually counted it.
     */
    public function addItem(Request $request, InventoryCount $inventoryCount): RedirectResponse
    {
        $this->authorizeAccess($request, $inventoryCount);

        if ($inventoryCount->status !== 'draft') {
            return back()->withErrors(['count' => 'This count has already been finalized.']);
        }

        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'counted_qty' => ['required', 'integer', 'min:0'],
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $expectedQty = $product->totalStockAt($inventoryCount->location_id);

        InventoryCountItem::updateOrCreate(
            ['inventory_count_id' => $inventoryCount->id, 'product_id' => $product->id],
            [
                'expected_qty' => $expectedQty,
                'counted_qty' => $validated['counted_qty'],
                'variance' => $validated['counted_qty'] - $expectedQty,
                'unit_cost_at_count' => $product->cost_price,
            ]
        );

        return back()->with('success', 'Count recorded.');
    }

    public function removeItem(Request $request, InventoryCount $inventoryCount, InventoryCountItem $item): RedirectResponse
    {
        $this->authorizeAccess($request, $inventoryCount);

        if ($inventoryCount->status !== 'draft') {
            return back()->withErrors(['count' => 'This count has already been finalized.']);
        }

        $item->delete();

        return back()->with('success', 'Item removed.');
    }

    /**
     * Apply every item's variance to actual stock, then lock the count.
     * Shrinkage (negative variance) is FIFO-deducted like a sale would be;
     * found stock (positive variance) becomes a new batch, same mechanism
     * used for void-sale restores and cancelled transfers.
     */
    public function finalize(Request $request, InventoryCount $inventoryCount): RedirectResponse
    {
        $this->authorizeAccess($request, $inventoryCount);

        if ($inventoryCount->status !== 'draft') {
            return back()->withErrors(['count' => 'This count has already been finalized.']);
        }

        if ($inventoryCount->items()->count() === 0) {
            return back()->withErrors(['count' => 'Add at least one counted product before finalizing.']);
        }

        try {
            DB::transaction(function () use ($inventoryCount) {
                foreach ($inventoryCount->items as $item) {
                    if ($item->variance === 0) {
                        continue;
                    }

                    if ($item->variance < 0) {
                        // Shrinkage — remove the missing stock via FIFO, same as a sale would
                        $this->stockDeduction->deduct($item->product, abs($item->variance), $inventoryCount->location_id);
                    } else {
                        // Found more than expected — add it as a new batch
                        $this->stockDeduction->restore(
                            $item->product_id,
                            $item->variance,
                            (float) $item->unit_cost_at_count,
                            'Inventory count adjustment (found stock)',
                            $inventoryCount->location_id
                        );
                    }
                }

                $inventoryCount->update(['status' => 'finalized', 'finalized_at' => now()]);
            });
        } catch (RuntimeException $e) {
            return back()->withErrors([
                'count' => "Couldn't finalize — stock has changed since counting: {$e->getMessage()}. Please re-verify this item's count.",
            ]);
        }

        return redirect()->route('inventory-counts.index')->with('success', 'Inventory count finalized. Stock has been adjusted.');
    }

    public function destroy(Request $request, InventoryCount $inventoryCount): RedirectResponse
    {
        $this->authorizeAccess($request, $inventoryCount);

        if ($inventoryCount->status !== 'draft') {
            return back()->withErrors(['count' => 'Cannot delete a finalized count — it has already adjusted your stock records.']);
        }

        $inventoryCount->delete();

        return redirect()->route('inventory-counts.index')->with('success', 'Draft count deleted.');
    }

    private function authorizeAccess(Request $request, InventoryCount $inventoryCount): void
    {
        $user = $request->user();
        if (! $user->seesAllLocations() && $inventoryCount->location_id !== $user->location_id) {
            abort(403);
        }
    }
}
