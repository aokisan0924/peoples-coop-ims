<?php

namespace App\Http\Controllers;

use App\Models\StockBatch;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class StockBatchController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('stock-batches/index', [
            'batches' => StockBatch::with(['product', 'supplier'])
                ->orderByDesc('received_date')
                ->orderByDesc('id')
                ->paginate(50),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('stock-batches/create', [
            'products' => Product::orderBy('name')->get(['id', 'name', 'sku', 'barcode', 'cost_price']),
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'received_qty' => ['required', 'integer', 'min:1'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'received_date' => ['required', 'date'],
            'expiry_date' => ['nullable', 'date', 'after:received_date'],
        ]);

        $validated['remaining_qty'] = $validated['received_qty'];

        StockBatch::create($validated);

        // Keep Product.cost_price in sync with the most recent batch received —
        // this is what powers the pricing preview on the product form.
        Product::where('id', $validated['product_id'])
            ->update(['cost_price' => $validated['cost_price']]);

        return redirect()->route('stock-batches.index')->with('success', 'Stock received.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
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

        if (!$product) {
            return response()->json(['found' => false], 404);
        }

        return response()->json([
            'found' => true,
            'product' => $product->only('id', 'name', 'sku', 'barcode', 'cost_price'),
        ]);
    }
}
