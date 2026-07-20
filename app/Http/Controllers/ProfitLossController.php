<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Location;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProfitLossController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->endOfMonth()->toDateString());

        $locationId = $isOwner ? $request->query('location_id') : $user->location_id;

        return Inertia::render('reports/profit-loss', [
            'summary' => $this->computeSummary($startDate, $endDate, $locationId),
            'startDate' => $startDate,
            'endDate' => $endDate,
            'isOwner' => $isOwner,
            'locations' => $isOwner ? Location::where('is_active', true)->orderBy('name')->get(['id', 'name']) : [],
            'selectedLocationId' => $locationId,
            'branchBreakdown' => ($isOwner && !$locationId) ? $this->branchBreakdown($startDate, $endDate) : null,
        ]);
    }

    private function computeSummary(string $startDate, string $endDate, ?int $locationId): array
    {
        $salesQuery = Sale::whereNull('voided_at')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        if ($locationId) {
            $salesQuery->where('location_id', $locationId);
        }

        $revenue = (float) $salesQuery->sum('total');

        $cogs = (float) DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->whereNull('sales.voided_at')
            ->whereBetween('sales.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->when($locationId, fn ($q) => $q->where('sales.location_id', $locationId))
            ->sum('sale_items.cost_at_sale');

        $expensesQuery = Expense::whereBetween('expense_date', [$startDate, $endDate]);

        if ($locationId) {
            $expensesQuery->where('location_id', $locationId);
        }

        $expenses = (float) $expensesQuery->sum('amount');

        $grossProfit = $revenue - $cogs;
        $netProfit = $grossProfit - $expenses;

        return [
            'revenue' => round($revenue, 2),
            'cogs' => round($cogs, 2),
            'gross_profit' => round($grossProfit, 2),
            'expenses' => round($expenses, 2),
            'net_profit' => round($netProfit, 2),
            'gross_margin_pct' => $revenue > 0 ? round(($grossProfit / $revenue) * 100, 1) : 0,
            'net_margin_pct' => $revenue > 0 ? round(($netProfit / $revenue) * 100, 1) : 0,
        ];
    }

    private function branchBreakdown(string $startDate, string $endDate)
    {
        return Location::where('is_active', true)->get()->map(function (Location $location) use ($startDate, $endDate) {
            $summary = $this->computeSummary($startDate, $endDate, $location->id);
            return ['id' => $location->id, 'name' => $location->name, ...$summary];
        });
    }
}
