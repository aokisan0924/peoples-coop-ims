<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $today = Carbon::today();
        $isOwner = $user->seesAllLocations();

        // Owner sees everything (no location filter); everyone else scoped to their branch
        $locationId = $isOwner ? null : $user->location_id;

        $canSeeAnalytics = $user->hasRole('Manager') || $isOwner;

        return Inertia::render('dashboard', [
            'isOwner' => $isOwner,
            'todaySales' => $this->totalForRange($today->copy()->startOfDay(), $today->copy()->endOfDay(), $locationId),
            'weekSales' => $this->totalForRange($today->copy()->startOfWeek(), $today->copy()->endOfWeek(), $locationId),
            'monthSales' => $this->totalForRange($today->copy()->startOfMonth(), $today->copy()->endOfMonth(), $locationId),
            'yearSales' => $this->totalForRange($today->copy()->startOfYear(), $today->copy()->endOfYear(), $locationId),

            'activeProductsCount' => Product::where('is_active', true)->count(), // shared catalog, same for everyone

            'lowStockProducts' => $this->lowStockProducts($locationId),
            'expiringSoon' => $this->expiringSoon($today, $locationId),

            // Manager/Owner only — a Cashier's response must never contain revenue
            // trends or coworkers' individual sales figures, even hidden in the DOM.
            'trend' => $canSeeAnalytics ? $this->trend($today, 30, $locationId) : null,
            'paymentBreakdown' => $canSeeAnalytics ? $this->paymentBreakdown($today, $locationId) : null,
            'cashierBreakdown' => $canSeeAnalytics ? $this->cashierBreakdown($today, $locationId) : null,
            'bestSellers' => $canSeeAnalytics ? $this->bestSellers($today, $locationId) : null,

            // Owner-only: per-branch comparison table
            'branchBreakdown' => $isOwner ? $this->branchBreakdown($today) : null,
        ]);
    }

    private function totalForRange(Carbon $start, Carbon $end, ?int $locationId): array
    {
        $query = Sale::whereNull('voided_at')->whereBetween('created_at', [$start, $end]);

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        $result = $query->selectRaw('COALESCE(SUM(total), 0) as total, COUNT(*) as count')->first();

        return ['total' => (float) $result->total, 'count' => (int) $result->count];
    }

    private function lowStockProducts(?int $locationId)
    {
        $query = Product::where('is_active', true);

        if ($locationId) {
            // Branch-scoped: sum only this branch's batches
            $query->withSum(['stockBatches as branch_stock' => fn ($q) => $q->where('location_id', $locationId)], 'remaining_qty');
        } else {
            // Owner: global total across all branches
            $query->withSum('stockBatches as branch_stock', 'remaining_qty');
        }

        return $query->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'total_stock' => (int) ($p->branch_stock ?? 0),
                'low_stock_threshold' => $p->low_stock_threshold,
            ])
            ->filter(fn ($p) => $p['total_stock'] <= $p['low_stock_threshold'])
            ->sortBy('total_stock')
            ->take(10)
            ->values();
    }

    private function expiringSoon(Carbon $today, ?int $locationId)
    {
        $query = StockBatch::with('product')
            ->where('remaining_qty', '>', 0)
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [$today, $today->copy()->addDays(14)]);

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        return $query->orderBy('expiry_date')
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

    private function trend(Carbon $today, int $days, ?int $locationId)
    {
        $query = Sale::whereNull('voided_at')
            ->where('created_at', '>=', $today->copy()->subDays($days - 1)->startOfDay());

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        $rows = $query->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as total'))
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        return collect(range(0, $days - 1))->map(function ($daysAgo) use ($today, $days, $rows) {
            $date = $today->copy()->subDays($days - 1 - $daysAgo)->toDateString();
            $row = $rows->get($date);
            return ['date' => $date, 'total' => $row ? (float) $row->total : 0];
        });
    }

    private function paymentBreakdown(Carbon $today, ?int $locationId)
    {
        $query = Sale::whereNull('sales.voided_at')->where('sales.created_at', '>=', $today->copy()->startOfMonth());

        if ($locationId) {
            $query->where('sales.location_id', $locationId);
        }

        return $query->select('payment_method', DB::raw('SUM(total) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get();
    }

    private function cashierBreakdown(Carbon $today, ?int $locationId)
    {
        $query = Sale::whereNull('sales.voided_at')
            ->where('sales.created_at', '>=', $today->copy()->startOfMonth())
            ->join('users', 'users.id', '=', 'sales.cashier_id');

        if ($locationId) {
            $query->where('sales.location_id', $locationId);
        }

        return $query->select('users.name', DB::raw('SUM(sales.total) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->get();
    }

    private function bestSellers(Carbon $today, ?int $locationId)
    {
        $query = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->whereNull('sales.voided_at')
            ->where('sales.created_at', '>=', $today->copy()->startOfMonth());

        if ($locationId) {
            $query->where('sales.location_id', $locationId);
        }

        return $query->select(
                'products.name',
                DB::raw('SUM(sale_items.quantity) as units_sold'),
                DB::raw('SUM(sale_items.line_total) as revenue')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();
    }

    /**
     * Owner-only: side-by-side comparison of every branch's performance this month.
     */
    private function branchBreakdown(Carbon $today)
    {
        return Location::where('is_active', true)
            ->get()
            ->map(function (Location $location) use ($today) {
                $sales = Sale::whereNull('voided_at')
                    ->where('location_id', $location->id)
                    ->where('created_at', '>=', $today->copy()->startOfMonth())
                    ->selectRaw('COALESCE(SUM(total), 0) as total, COUNT(*) as count')
                    ->first();

                return [
                    'id' => $location->id,
                    'name' => $location->name,
                    'total_sales' => (float) $sales->total,
                    'transaction_count' => (int) $sales->count,
                ];
            });
    }
}
