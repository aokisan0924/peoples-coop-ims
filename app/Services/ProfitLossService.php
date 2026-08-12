<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\InventoryCount;
use App\Models\Location;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProfitLossService
{
    public function summary(string $startDate, string $endDate, ?int $locationId): array
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

    /**
     * Per-branch summary for the given range — every active location, side by side.
     */
    public function branchBreakdown(string $startDate, string $endDate)
    {
        return Location::where('is_active', true)->get()->map(function (Location $location) use ($startDate, $endDate) {
            return [
                'id' => $location->id,
                'name' => $location->name,
                ...$this->summary($startDate, $endDate, $location->id),
            ];
        });
    }

    /**
     * Periodic-method reconciliation: COGS = Beginning Inventory + Purchases − Ending
     * Inventory, cross-checked against the perpetual (actual, FIFO/sale-based) COGS
     * from summary(). Beginning/Ending Inventory come from finalized physical
     * InventoryCounts — NOT from the live FIFO batch balance — because using the
     * system's own running balance as "ending inventory" would just reproduce the
     * perpetual COGS by construction and could never reveal shrinkage. The whole
     * point of the periodic cross-check is an independent, physically-verified
     * number to compare against.
     *
     * If no finalized count exists on/before the relevant boundary date, that side
     * of the reconciliation is left null and reconciliation_complete is false —
     * the perpetual figures (revenue/cogs/expenses/net_profit) are still returned
     * and are still accurate on their own.
     */
    public function reconciliation(string $startDate, string $endDate, ?int $locationId): array
    {
        $perpetual = $this->summary($startDate, $endDate, $locationId);

        $beginningCount = $this->latestFinalizedCountOnOrBefore($startDate, $locationId, strict: true);
        $endingCount = $this->latestFinalizedCountOnOrBefore($endDate, $locationId, strict: false);

        $beginningInventory = $beginningCount ? $this->countValue($beginningCount) : null;
        $endingInventory = $endingCount ? $this->countValue($endingCount) : null;

        $purchases = $this->purchasesDuring($startDate, $endDate, $locationId);

        $impliedCogs = null;
        $shrinkageVariance = null;

        if ($beginningInventory !== null && $endingInventory !== null && $purchases !== null) {
            $impliedCogs = $beginningInventory + $purchases - $endingInventory;
            // Positive = periodic method implies MORE left inventory than sales
            // account for -> unexplained shrinkage (theft, damage, miscount).
            // Negative = sales COGS exceeds what the physical counts + purchases
            // explain -> likely a counting error or a missed purchase entry.
            $shrinkageVariance = round($impliedCogs - $perpetual['cogs'], 2);
        }

        return [
            ...$perpetual,
            'beginning_inventory' => $beginningInventory,
            'beginning_inventory_date' => $beginningCount?->count_date?->toDateString(),
            'ending_inventory' => $endingInventory,
            'ending_inventory_date' => $endingCount?->count_date?->toDateString(),
            'purchases' => $purchases,
            'implied_cogs' => $impliedCogs !== null ? round($impliedCogs, 2) : null,
            'shrinkage_variance' => $shrinkageVariance,
            'reconciliation_complete' => $impliedCogs !== null,
        ];
    }

    /**
     * @param bool $strict If true, only counts strictly BEFORE $date qualify (used
     *                     for "beginning" — a count taken ON the period's first day
     *                     represents that day's starting position). If false, a
     *                     count ON $date also qualifies (used for "ending").
     */
    private function latestFinalizedCountOnOrBefore(string $date, ?int $locationId, bool $strict): ?InventoryCount
    {
        return InventoryCount::where('status', 'finalized')
            ->when($strict, fn ($q) => $q->where('count_date', '<', $date), fn ($q) => $q->where('count_date', '<=', $date))
            ->when($locationId, fn ($q) => $q->where('location_id', $locationId))
            ->orderByDesc('count_date')
            ->with('items')
            ->first();
    }

    private function countValue(InventoryCount $count): float
    {
        return round($count->items->sum(fn ($item) => $item->counted_qty * (float) $item->unit_cost_at_count), 2);
    }

    /**
     * Sums what was received into stock during the period, at cost — confirmed
     * against the actual stock_batches schema (received_qty, cost_price,
     * received_date; received_date is a plain date column, not a timestamp).
     */
    private function purchasesDuring(string $startDate, string $endDate, ?int $locationId): ?float
    {
        if (!Schema::hasTable('stock_batches')) {
            return null;
        }

        $query = DB::table('stock_batches')
            ->whereBetween('received_date', [$startDate, $endDate]);

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        return (float) $query->sum(DB::raw('received_qty * cost_price'));
    }
}
