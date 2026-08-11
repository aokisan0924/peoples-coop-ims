<?php

namespace App\Http\Controllers;

use App\Models\AccountsPayable;
use App\Models\Location;
use App\Models\Product;
use App\Models\StockBatch;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockBatchController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = StockBatch::with(['product', 'supplier', 'location'])
            ->orderByDesc('received_date')
            ->orderByDesc('id');

        // A Manager only sees their own branch's receiving history — otherwise
        // every branch's batches show up mixed together with nothing to tell
        // them apart. Owner sees everything, across all branches.
        if (! $user->seesAllLocations()) {
            $query->where('location_id', $user->location_id);
        }

        return Inertia::render('stock-batches/index', [
            'batches' => $query->paginate(50),
            'isOwner' => $user->seesAllLocations(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('stock-batches/create', [
            'products' => Product::orderBy('name')->get(['id', 'name', 'sku', 'barcode', 'cost_price']),
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
            // Owner has no fixed branch and must choose which one is receiving
            // stock; a Manager's branch is fixed, so they just get told what it is.
            'locations' => $user->seesAllLocations()
                ? Location::where('is_active', true)->orderBy('name')->get(['id', 'name'])
                : null,
            'userLocationName' => $user->location?->name,
        ]);
    }

    /**
     * Current stock per product, per branch, side by side — lets a Manager or
     * Owner see at a glance which specific branch is running low on what,
     * instead of hunting through a flat list of individual receiving batches.
     */
    public function byBranch(): Response
    {
        $locations = Location::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        $stockTotals = StockBatch::selectRaw('product_id, location_id, SUM(remaining_qty) as qty')
            ->groupBy('product_id', 'location_id')
            ->get()
            ->groupBy('product_id');

        $products = Product::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'low_stock_threshold', 'reorder_target_qty'])
            ->map(function (Product $product) use ($stockTotals, $locations) {
                $byLocation = $stockTotals->get($product->id, collect())->keyBy('location_id');

                $stockByLocation = $locations->mapWithKeys(
                    fn (Location $location) => [$location->id => (int) ($byLocation->get($location->id)->qty ?? 0)]
                );

                // Per-branch, not global — a branch sitting at 12 out of a
                // threshold of 15 needs restocking up to the target for THAT
                // branch specifically, not based on stock summed elsewhere.
                $restockByLocation = $stockByLocation->map(
                    fn (int $qty) => $product->restockSuggestion($qty)
                );

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'low_stock_threshold' => $product->low_stock_threshold,
                    'reorder_target_qty' => $product->effective_reorder_target,
                    'stock_by_location' => $stockByLocation,
                    'restock_by_location' => $restockByLocation,
                    'total_stock' => $stockByLocation->sum(),
                ];
            });

        return Inertia::render('stock-batches/by-branch', [
            'locations' => $locations,
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->seesAllLocations()) {
            $validated = $request->validate([
                'product_id' => ['required', 'exists:products,id'],
                'supplier_id' => ['nullable', 'exists:suppliers,id'],
                'location_id' => ['required', 'exists:locations,id'],
                'received_qty' => ['required', 'integer', 'min:1'],
                'cost_price' => ['required', 'numeric', 'min:0'],
                'paid_on_delivery' => ['boolean'],
                'payable_due_date' => ['nullable', 'date'],
                'received_date' => ['required', 'date'],
                'expiry_date' => ['nullable', 'date', 'after:received_date'],
            ]);
        } else {
            if (! $user->location_id) {
                return back()->withErrors(['location' => 'Your account has no assigned branch. Stock receiving must be done by a branch Manager.']);
            }

            $validated = $request->validate([
                'product_id' => ['required', 'exists:products,id'],
                'supplier_id' => ['nullable', 'exists:suppliers,id'],
                'received_qty' => ['required', 'integer', 'min:1'],
                'cost_price' => ['required', 'numeric', 'min:0'],
                'paid_on_delivery' => ['boolean'],
                'payable_due_date' => ['nullable', 'date'],
                'received_date' => ['required', 'date'],
                'expiry_date' => ['nullable', 'date', 'after:received_date'],
            ]);

            $validated['location_id'] = $user->location_id;
        }

        $validated['remaining_qty'] = $validated['received_qty'];

        $batch = StockBatch::create($validated);

        if (! empty($validated['supplier_id']) && empty($validated['paid_on_delivery'])) {
            AccountsPayable::create([
                'supplier_id' => $validated['supplier_id'],
                'location_id' => $validated['location_id'],
                'stock_batch_id' => $batch->id,
                'amount' => $validated['received_qty'] * $validated['cost_price'],
                'incurred_date' => $validated['received_date'],
                'due_date' => $validated['payable_due_date'] ?? null,
                'recorded_by' => $request->user()->id,
            ]);
        }

        Product::where('id', $validated['product_id'])
            ->update(['cost_price' => $validated['cost_price']]);

        return redirect()->route('stock-batches.index')->with('success', 'Stock received.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): void
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): void
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): void
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StockBatch $stockBatch): RedirectResponse
    {
        // Only allow deleting a batch if nothing has been sold from it yet —
        // protects FIFO integrity and sales history accuracy.
        if ($stockBatch->remaining_qty !== $stockBatch->received_qty) {
            return back()->withErrors(['batch' => 'Cannot delete a batch that has already been partially sold.']);
        }

        $stockBatch->delete();

        return redirect()->route('stock-batches.index')->with('success', 'Batch removed.');
    }

    /**
     * Barcode scanner lookup endpoint — used by the receiving form
     * to instantly find a product when a barcode is scanned.
     */
    public function lookupByBarcode(Request $request): JsonResponse
    {
        $request->validate(['barcode' => ['required', 'string']]);

        $product = Product::where('barcode', $request->barcode)->first();

        if (! $product) {
            return response()->json(['found' => false], 404);
        }

        return response()->json([
            'found' => true,
            'product' => $product->only('id', 'name', 'sku', 'barcode', 'cost_price'),
        ]);
    }
}
