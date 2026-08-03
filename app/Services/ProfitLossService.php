<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Location;
use App\Models\Sale;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProfitLossService
{
    /**
     * @return array{revenue: float, cogs: float, gross_profit: float, salaries: float, other_expenses: float, expenses: float, net_profit: float, gross_margin_pct: float, net_margin_pct: float}
     */
    public function summary(string $startDate, string $endDate, ?int $locationId): array
    {
        $salesQuery = Sale::whereNull('voided_at')
            ->whereBetween('created_at', [$startDate.' 00:00:00', $endDate.' 23:59:59']);

        if ($locationId) {
            $salesQuery->where('location_id', $locationId);
        }

        $revenue = (float) $salesQuery->sum('total');

        // COGS uses the actual FIFO cost recorded at the moment each unit was sold
        // (perpetual inventory method) — more accurate than the textbook periodic
        // formula (beginning + purchases - ending), since it reflects exactly what
        // was sold rather than inferring it from stock counts, which would silently
        // absorb any shrinkage/loss/theft into "COGS" as if it were legitimate sales.
        $cogs = (float) DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->whereNull('sales.voided_at')
            ->whereBetween('sales.created_at', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->when($locationId, fn ($q) => $q->where('sales.location_id', $locationId))
            ->sum('sale_items.cost_at_sale');

        $grossProfit = $revenue - $cogs;

        // Salaries broken out as its own line item — a standard P&L presentation
        // choice — while everything else (Rent, Electricity, Water, Internet,
        // Supplies, Other) is grouped as "Other Operating Expenses". The total
        // deducted from Gross Profit is unchanged either way.
        $baseExpenseQuery = fn () => Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->when($locationId, fn ($q) => $q->where('location_id', $locationId));

        $salaries = (float) $baseExpenseQuery()->where('category', 'Salaries')->sum('amount');
        $otherExpenses = (float) $baseExpenseQuery()->where('category', '!=', 'Salaries')->sum('amount');
        $totalExpenses = $salaries + $otherExpenses;

        $netProfit = $grossProfit - $totalExpenses;

        return [
            'revenue' => round($revenue, 2),
            'cogs' => round($cogs, 2),
            'gross_profit' => round($grossProfit, 2),
            'salaries' => round($salaries, 2),
            'other_expenses' => round($otherExpenses, 2),
            'expenses' => round($totalExpenses, 2),
            'net_profit' => round($netProfit, 2),
            'gross_margin_pct' => $revenue > 0 ? round(($grossProfit / $revenue) * 100, 1) : 0,
            'net_margin_pct' => $revenue > 0 ? round(($netProfit / $revenue) * 100, 1) : 0,
        ];
    }

    /**
     * Per-branch summary for the given range — every active location, side by side.
     *
     * @return Collection<int, array{id: int, name: string, revenue: float, cogs: float, gross_profit: float, salaries: float, other_expenses: float, expenses: float, net_profit: float, gross_margin_pct: float, net_margin_pct: float}>
     */
    public function branchBreakdown(string $startDate, string $endDate): Collection
    {
        return Location::where('is_active', true)->get()->map(function (Location $location) use ($startDate, $endDate) {
            return [
                'id' => $location->id,
                'name' => $location->name,
                ...$this->summary($startDate, $endDate, $location->id),
            ];
        });
    }
}
