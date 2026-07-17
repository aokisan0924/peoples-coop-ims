<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\StockBatch;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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

        // Low stock: products whose total remaining stock <= their threshold
        $lowStockProducts = Product::where('is_active', true)
            ->get()
            ->filter(fn (Product $p) => $p->total_stock <= $p->low_stock_threshold)
            ->sortBy('total_stock')
            ->take(10)
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'total_stock' => $p->total_stock,
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

        // 7-day trend
        $trend = collect(range(0, 6))->map(function ($daysAgo) use ($today) {
            $date = $today->copy()->subDays(6 - $daysAgo);
            $total = Sale::whereNull('voided_at')
                ->whereBetween('created_at', [$date->copy()->startOfDay(), $date->copy()->endOfDay()])
                ->sum('total');

            return ['date' => $date->toDateString(), 'total' => (float) $total];
        });

        return Inertia::render('dashboard', [
            'todaySales' => ['total' => (float) $todaySales->total, 'count' => (int) $todaySales->count],
            'monthSales' => ['total' => (float) $monthSales->total, 'count' => (int) $monthSales->count],
            'activeProductsCount' => $activeProductsCount,
            'lowStockCount' => $lowStockProducts->count(),
            'lowStockProducts' => $lowStockProducts,
            'expiringSoon' => $expiringSoon,
            'trend' => $trend,
        ]);
    }
}