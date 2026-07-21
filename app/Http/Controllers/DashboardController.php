<?php

namespace App\Http\Controllers;

use App\Models\AccountsPayable;
use App\Models\GcashFloat;
use App\Models\GcashTransaction;
use App\Models\Location;
use App\Models\Product;
use App\Models\Sale;
use App\Models\ShiftSession;
use App\Models\StockBatch;
use App\Services\ProfitLossService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private ProfitLossService $profitLoss)
    {
    }

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
            // trends, coworkers' individual sales figures, or profit/expense data,
            // even hidden in the DOM.
            // 90 days computed once; the frontend slices the tail for a 7/30/90 toggle
            // without extra round-trips.
            'trend' => $canSeeAnalytics ? $this->trend($today, 90, $locationId) : null,
            'paymentBreakdown' => $canSeeAnalytics ? $this->paymentBreakdown($today, $locationId) : null,
            'cashierBreakdown' => $canSeeAnalytics ? $this->cashierBreakdown($today, $locationId) : null,
            'bestSellers' => $canSeeAnalytics ? $this->bestSellers($today, $locationId) : null,

            // This month's P&L snapshot — Manager sees their own branch, Owner sees
            // the company-wide total (the per-branch split is in branchBreakdown below).
            'monthProfitLoss' => $canSeeAnalytics
                ? $this->profitLoss->summary($today->copy()->startOfMonth()->toDateString(), $today->copy()->endOfMonth()->toDateString(), $locationId)
                : null,

            // Owner-only: per-branch comparison table, now including expenses/net profit
            'branchBreakdown' => $isOwner ? $this->profitLoss->branchBreakdown(
                $today->copy()->startOfMonth()->toDateString(),
                $today->copy()->endOfMonth()->toDateString()
            ) : null,

            // Financial oversight — same scoping as the analytics above (Manager: own
            // branch, Owner: everything).
            'gcashOverview' => $canSeeAnalytics ? $this->gcashOverview($today, $locationId) : null,
            'payablesSummary' => $canSeeAnalytics ? $this->payablesSummary($today, $locationId) : null,
            'openShifts' => $canSeeAnalytics ? $this->openShifts($locationId) : null,
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
        if ($locationId) {
            // Branch-scoped: this branch's own stock per product.
            return Product::where('is_active', true)
                ->withSum(['stockBatches as branch_stock' => fn ($q) => $q->where('location_id', $locationId)], 'remaining_qty')
                ->get()
                ->map(fn (Product $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'total_stock' => (int) ($p->branch_stock ?? 0),
                    'low_stock_threshold' => $p->low_stock_threshold,
                    'location_name' => null,
                ])
                ->filter(fn ($p) => $p['total_stock'] <= $p['low_stock_threshold'])
                ->sortBy('total_stock')
                ->take(10)
                ->values();
        }

        // Owner: a product can look perfectly stocked in aggregate while one
        // specific branch is actually out — summing across all branches before
        // comparing to the threshold was masking exactly that. Flag shortages
        // per branch instead, same as what a Manager at that branch would see.
        $locations = Location::where('is_active', true)->get(['id', 'name']);
        $products = Product::where('is_active', true)->get(['id', 'name', 'low_stock_threshold']);

        $rows = collect();

        foreach ($locations as $location) {
            $stockByProduct = StockBatch::where('location_id', $location->id)
                ->selectRaw('product_id, SUM(remaining_qty) as qty')
                ->groupBy('product_id')
                ->pluck('qty', 'product_id');

            foreach ($products as $product) {
                $stock = (int) ($stockByProduct[$product->id] ?? 0);

                if ($stock <= $product->low_stock_threshold) {
                    $rows->push([
                        'id' => $product->id,
                        'name' => $product->name,
                        'total_stock' => $stock,
                        'low_stock_threshold' => $product->low_stock_threshold,
                        'location_name' => $location->name,
                    ]);
                }
            }
        }

        return $rows->sortBy('total_stock')->take(10)->values();
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
     * Per-branch float balance plus today's cash-in/cash-out totals — the same
     * numbers a Manager would otherwise have to open the GCash Monitor to see.
     */
    private function gcashOverview(Carbon $today, ?int $locationId)
    {
        $locations = $locationId
            ? Location::where('id', $locationId)->get(['id', 'name'])
            : Location::where('is_active', true)->get(['id', 'name']);

        $floats = GcashFloat::whereIn('location_id', $locations->pluck('id')->all())
            ->pluck('balance', 'location_id');

        $todayMovement = GcashTransaction::whereIn('location_id', $locations->pluck('id')->all())
            ->whereBetween('created_at', [$today->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->selectRaw('location_id,
                COALESCE(SUM(CASE WHEN type = \'cash_in\' THEN amount ELSE 0 END), 0) as cash_in,
                COALESCE(SUM(CASE WHEN type = \'cash_out\' THEN amount ELSE 0 END), 0) as cash_out')
            ->groupBy('location_id')
            ->get()
            ->keyBy('location_id');

        return $locations->map(function (Location $location) use ($floats, $todayMovement) {
            $movement = $todayMovement->get($location->id);

            return [
                'location_id' => $location->id,
                'location_name' => $location->name,
                'balance' => (float) ($floats[$location->id] ?? 0),
                'today_cash_in' => (float) ($movement->cash_in ?? 0),
                'today_cash_out' => (float) ($movement->cash_out ?? 0),
            ];
        })->values();
    }

    /**
     * Outstanding money owed to suppliers — total, how much of it is overdue,
     * and the handful of largest/soonest debts worth an Owner's attention.
     */
    private function payablesSummary(Carbon $today, ?int $locationId)
    {
        $query = AccountsPayable::where('is_paid', false);

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        $totals = (clone $query)->selectRaw('COALESCE(SUM(amount), 0) as total, COUNT(*) as count')->first();

        $overdueCount = (clone $query)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today)
            ->count();

        $upcoming = (clone $query)->with('supplier:id,name')
            ->orderByRaw('due_date IS NULL, due_date ASC')
            ->limit(5)
            ->get()
            ->map(fn (AccountsPayable $p) => [
                'id' => $p->id,
                'supplier_name' => $p->supplier?->name ?? 'Unknown supplier',
                'amount' => (float) $p->amount,
                'due_date' => $p->due_date?->toDateString(),
                'is_overdue' => $p->due_date && $p->due_date->isPast(),
            ]);

        return [
            'total_unpaid' => (float) $totals->total,
            'unpaid_count' => (int) $totals->count,
            'overdue_count' => $overdueCount,
            'upcoming' => $upcoming,
        ];
    }

    /**
     * Cashiers currently mid-shift right now, across whichever branches this
     * user can see — situational awareness without opening Shift History.
     */
    private function openShifts(?int $locationId)
    {
        $query = ShiftSession::where('status', 'open')
            ->with(['cashier:id,name', 'location:id,name']);

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        return $query->orderBy('opened_at')
            ->get()
            ->map(fn (ShiftSession $shift) => [
                'id' => $shift->id,
                'cashier_name' => $shift->cashier->name,
                'location_name' => $shift->location->name,
                'starting_cash' => (float) $shift->starting_cash,
                'opened_at' => $shift->opened_at->toIso8601String(),
            ]);
    }
}
