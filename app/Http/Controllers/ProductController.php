<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('products/index', [
            'products' => Product::with(['category', 'baseUnit', 'packUnit'])
                ->withSum('stockBatches as total_stock', 'remaining_qty')
                ->orderBy('name')
                ->get()
                ->map(fn (Product $product) => [
                    ...$product->toArray(),
                    'is_low_stock' => ($product->total_stock ?? 0) <= $product->low_stock_threshold,
                    'member_piece_price' => $product->member_piece_price,
                    'non_member_piece_price' => $product->non_member_piece_price,
                    'member_pack_price' => $product->member_pack_price,
                    'non_member_pack_price' => $product->non_member_pack_price,
                ]),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('products/create', [
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'units' => Unit::orderBy('name')->get(['id', 'name', 'abbreviation']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'barcode' => ['nullable', 'string', 'max:255', 'unique:products,barcode'],
            'category_id' => ['required', 'exists:categories,id'],
            'base_unit_id' => ['required', 'exists:units,id'],
            'pack_unit_id' => ['nullable', 'exists:units,id'],
            'pack_conversion_factor' => ['nullable', 'integer', 'min:2'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'markup_percentage' => ['required', 'numeric', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
        ]);

        // Auto-generate SKU: PRD-{timestamp}-{random} — simple, unique, human-scannable enough
        $validated['sku'] = 'PRD-'.now()->format('ymd').'-'.strtoupper(Str::random(4));

        // If no barcode provided, auto-generate an internal one from the SKU
        // so it can still be scanned/printed as a label
        if (empty($validated['barcode'])) {
            $validated['barcode'] = $validated['sku'];
        }

        Product::create($validated);

        return redirect()->route('products.index')->with('success', 'Product added.');
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
    public function edit(Product $product): Response
    {
        return Inertia::render('products/edit', [
            'product' => $product,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'units' => Unit::orderBy('name')->get(['id', 'name', 'abbreviation']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'barcode' => ['nullable', 'string', 'max:255', 'unique:products,barcode,'.$product->id],
            'category_id' => ['required', 'exists:categories,id'],
            'base_unit_id' => ['required', 'exists:units,id'],
            'pack_unit_id' => ['nullable', 'exists:units,id'],
            'pack_conversion_factor' => ['nullable', 'integer', 'min:2'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'markup_percentage' => ['required', 'numeric', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $product->update($validated);

        return redirect()->route('products.index')->with('success', 'Product updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): RedirectResponse
    {
        if ($product->saleItems()->exists()) {
            $product->update(['is_active' => false]);

            return redirect()->route('products.index')
                ->with('success', "\"{$product->name}\" has sales history, so it was deactivated instead of deleted.");
        }

        $product->delete();

        return redirect()->route('products.index')->with('success', 'Product removed.');
    }

    public function label(Product $product): Response
    {
        return Inertia::render('products/label', [
            'product' => $product,
        ]);
    }

    public function labelsBatch(Request $request): Response
    {
        $ids = collect(explode(',', $request->query('ids', '')))
            ->map(fn ($id) => trim($id))
            ->filter(fn ($id) => ctype_digit($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            abort(422, 'No valid product IDs were provided for label printing.');
        }

        return Inertia::render('products/labels-batch', [
            'products' => Product::whereIn('id', $ids)->get(),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $query = trim($request->query('q', ''));

        if ($query === '') {
            return response()->json(['products' => []]);
        }

        $products = Product::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('barcode', 'like', "%{$query}%")
                    ->orWhere('sku', 'like', "%{$query}%");
            })
            ->with(['category', 'baseUnit'])
            ->withSum('stockBatches as total_stock', 'remaining_qty')
            ->limit(20)
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'category' => $product->category?->name,
                'total_stock' => $product->total_stock ?? 0,
                'member_piece_price' => $product->member_piece_price,
                'member_pack_price' => $product->member_pack_price,
                'non_member_piece_price' => $product->non_member_piece_price,
                'non_member_pack_price' => $product->non_member_pack_price,
                'pack_conversion_factor' => $product->pack_conversion_factor,
            ]);

        return response()->json(['products' => $products]);
    }

    public function showBarcode(Product $product): Response
    {
        return Inertia::render('products/barcode-display', [
            'product' => $product,
        ]);
    }

    /**
     * Full active-product snapshot for offline caching — called periodically
     * while online so POS search/scan keeps working without a connection.
     */
    public function offlineSnapshot(): JsonResponse
    {
        $products = Product::where('is_active', true)
            ->with(['category', 'baseUnit'])
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'category' => $product->category?->name,
                'total_stock' => $product->total_stock,
                'member_piece_price' => $product->member_piece_price,
                'non_member_piece_price' => $product->non_member_piece_price,
                'member_pack_price' => $product->member_pack_price,
                'non_member_pack_price' => $product->non_member_pack_price,
                'pack_conversion_factor' => $product->pack_conversion_factor,
            ]);

        return response()->json(['products' => $products]);
    }
}
