<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\StockBatch;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today();

        $todaySales = Sale::whereNull('voided_at')
            ->whereBetween('created_at', [$today->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->selectRaw('COALESCE(SUM(total), 0) as total, COUNT(*) as count')
            ->first();

        $monthSales = Sale::whereNull('voided_at')
            ->where('created_at', '>=', $today->copy()->startOfMonth())
            ->selectRaw('COALESCE(SUM(total), 0) as total, COUNT(*) as count')
            ->first();

        $activeProductsCount = Product::where('is_active', true)->count();

        // Low stock: products whose total remaining stock <= their threshold.
        // Aggregated in a single query instead of summing stock batches per-product.
        $lowStockProducts = Product::where('is_active', true)
            ->withSum('stockBatches as total_stock', 'remaining_qty')
            ->get()
            ->filter(fn (Product $p) => ($p->total_stock ?? 0) <= $p->low_stock_threshold)
            ->sortBy('total_stock')
            ->take(10)
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'total_stock' => $p->total_stock ?? 0,
                'low_stock_threshold' => $p->low_stock_threshold,
            ])
            ->values();

        // Expiring within 14 days, soonest first
        $expiringSoon = StockBatch::with('product')
            ->where('remaining_qty', '>', 0)
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [$today, $today->copy()->addDays(14)])
            ->orderBy('expiry_date')
            ->limit(10)
            ->get()
            ->map(fn (StockBatch $batch) => [
                'id' => $batch->id,
                'product_name' => $batch->product->name,
                'remaining_qty' => $batch->remaining_qty,
                'expiry_date' => $batch->expiry_date->toDateString(),
                'days_left' => $today->diffInDays($batch->expiry_date, false),
            ]);

        return Inertia::render('dashboard', [
            'todaySales' => ['total' => (float) $todaySales->total, 'count' => (int) $todaySales->count],
            'monthSales' => ['total' => (float) $monthSales->total, 'count' => (int) $monthSales->count],
            'activeProductsCount' => $activeProductsCount,
            'lowStockCount' => $lowStockProducts->count(),
            'lowStockProducts' => $lowStockProducts,
            'expiringSoon' => $expiringSoon,
        ]);
    }
}
