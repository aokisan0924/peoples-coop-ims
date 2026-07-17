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

        return Inertia::render('dashboard', [
            'todaySales' => $this->totalForRange($today->copy()->startOfDay(), $today->copy()->endOfDay()),
            'weekSales' => $this->totalForRange($today->copy()->startOfWeek(), $today->copy()->endOfWeek()),
            'monthSales' => $this->totalForRange($today->copy()->startOfMonth(), $today->copy()->endOfMonth()),
            'yearSales' => $this->totalForRange($today->copy()->startOfYear(), $today->copy()->endOfYear()),

            'activeProductsCount' => Product::where('is_active', true)->count(),

            'lowStockProducts' => $this->lowStockProducts(),
            'expiringSoon' => $this->expiringSoon($today),

            'trend' => $this->trend($today, 30),
            'paymentBreakdown' => $this->paymentBreakdown($today),
            'cashierBreakdown' => $this->cashierBreakdown($today),
            'bestSellers' => $this->bestSellers($today),
        ]);
    }

    private function totalForRange(Carbon $start, Carbon $end): array
    {
        $result = Sale::whereNull('voided_at')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('COALESCE(SUM(total), 0) as total, COUNT(*) as count')
            ->first();

        return ['total' => (float) $result->total, 'count' => (int) $result->count];
    }

    /**
     * Single query using withSum instead of the old N+1 per-product accessor calls.
     */
    private function lowStockProducts()
    {
        return Product::where('is_active', true)
            ->withSum(['stockBatches as total_stock' => fn ($q) => $q], 'remaining_qty')
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'total_stock' => (int) ($p->total_stock ?? 0),
                'low_stock_threshold' => $p->low_stock_threshold,
            ])
            ->filter(fn ($p) => $p['total_stock'] <= $p['low_stock_threshold'])
            ->sortBy('total_stock')
            ->take(10)
            ->values();
    }

    private function expiringSoon(Carbon $today)
    {
        return StockBatch::with('product')
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
    }

    private function trend(Carbon $today, int $days)
    {
        $rows = Sale::whereNull('voided_at')
            ->where('created_at', '>=', $today->copy()->subDays($days - 1)->startOfDay())
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as total'))
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        return collect(range(0, $days - 1))->map(function ($daysAgo) use ($today, $days, $rows) {
            $date = $today->copy()->subDays($days - 1 - $daysAgo)->toDateString();
            $row = $rows->get($date);
            return ['date' => $date, 'total' => $row ? (float) $row->total : 0];
        });
    }

    private function paymentBreakdown(Carbon $today)
    {
        return Sale::whereNull('sales.voided_at')
            ->where('sales.created_at', '>=', $today->copy()->startOfMonth())
            ->select('payment_method', DB::raw('SUM(total) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get();
    }

    private function cashierBreakdown(Carbon $today)
    {
        return Sale::whereNull('sales.voided_at')
            ->where('sales.created_at', '>=', $today->copy()->startOfMonth())
            ->join('users', 'users.id', '=', 'sales.cashier_id')
            ->select('users.name', DB::raw('SUM(sales.total) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->get();
    }

    private function bestSellers(Carbon $today)
    {
        return DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->whereNull('sales.voided_at')
            ->where('sales.created_at', '>=', $today->copy()->startOfMonth())
            ->select(
                'products.name',
                DB::raw('SUM(sale_items.quantity) as units_sold'),
                DB::raw('SUM(sale_items.line_total) as revenue')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();
    }
}
