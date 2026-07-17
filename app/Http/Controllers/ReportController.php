<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function sales(): Response
    {
        $today = Carbon::today();

        $summary = [
            'today' => $this->totalForRange($today->copy()->startOfDay(), $today->copy()->endOfDay()),
            'week' => $this->totalForRange($today->copy()->startOfWeek(), $today->copy()->endOfWeek()),
            'month' => $this->totalForRange($today->copy()->startOfMonth(), $today->copy()->endOfMonth()),
            'year' => $this->totalForRange($today->copy()->startOfYear(), $today->copy()->endOfYear()),
        ];

        // Last 30 days trend, for the chart
        $trend = Sale::whereNull('voided_at')
            ->where('created_at', '>=', $today->copy()->subDays(29)->startOfDay())
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Fill in missing days with zero, so the chart doesn't have gaps
        $trendByDate = $trend->keyBy('date');
        $filledTrend = collect(range(0, 29))->map(function ($daysAgo) use ($today, $trendByDate) {
            $date = $today->copy()->subDays(29 - $daysAgo)->toDateString();
            $row = $trendByDate->get($date);
            return [
                'date' => $date,
                'total' => $row ? (float) $row->total : 0,
                'transaction_count' => $row ? (int) $row->transaction_count : 0,
            ];
        });

        // Payment method breakdown (this month)
        $paymentBreakdown = Sale::whereNull('voided_at')
            ->where('created_at', '>=', $today->copy()->startOfMonth())
            ->select('payment_method', DB::raw('SUM(total) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get();

        // Cashier breakdown (this month)
        $cashierBreakdown = Sale::whereNull('sales.voided_at')
            ->where('sales.created_at', '>=', $today->copy()->startOfMonth())
            ->join('users', 'users.id', '=', 'sales.cashier_id')
            ->select('users.name', DB::raw('SUM(sales.total) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->get();

        // Best-selling products (this month, by revenue)
        $bestSellers = DB::table('sale_items')
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

        return Inertia::render('reports/sales', [
            'summary' => $summary,
            'trend' => $filledTrend,
            'paymentBreakdown' => $paymentBreakdown,
            'cashierBreakdown' => $cashierBreakdown,
            'bestSellers' => $bestSellers,
        ]);
    }

    private function totalForRange(Carbon $start, Carbon $end): array
    {
        $result = Sale::whereNull('voided_at')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('COALESCE(SUM(total), 0) as total, COUNT(*) as count')
            ->first();

        return [
            'total' => (float) $result->total,
            'count' => (int) $result->count,
        ];
    }
}