<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockBatch;
use RuntimeException;

class StockDeductionService
{
    /**
     * Deduct a quantity (in base units) from a product's stock batches, oldest first (FIFO).
     * Returns the weighted-average cost of the units actually deducted — used for margin tracking.
     *
     * @throws RuntimeException if there isn't enough stock across all batches.
     */
    public function deduct(Product $product, int $baseUnitQuantity): float
    {
        $remaining = $baseUnitQuantity;
        $totalCost = 0.0;

        $batches = StockBatch::where('product_id', $product->id)
            ->where('remaining_qty', '>', 0)
            ->orderBy('received_date')
            ->orderBy('id')
            ->lockForUpdate() // prevents race conditions on concurrent sales of the same product
            ->get();

        foreach ($batches as $batch) {
            if ($remaining <= 0) {
                break;
            }

            $takeFromBatch = min($batch->remaining_qty, $remaining);

            $batch->decrement('remaining_qty', $takeFromBatch);
            $totalCost += $takeFromBatch * (float) $batch->cost_price;
            $remaining -= $takeFromBatch;
        }

        if ($remaining > 0) {
            throw new RuntimeException(
                "Insufficient stock for \"{$product->name}\": short by {$remaining} base unit(s)."
            );
        }

        // Weighted-average cost of what was actually consumed, for accurate margin reporting
        return $baseUnitQuantity > 0 ? $totalCost / $baseUnitQuantity : 0.0;
    }

    /**
     * Restore stock for a voided sale item by creating a new batch,
     * rather than attempting to reverse-deduct the original (possibly since-depleted) batches.
     */
    public function restore(int $productId, int $baseUnitQuantity, float $unitCost, string $reason): void
    {
        StockBatch::create([
            'product_id' => $productId,
            'supplier_id' => null,
            'received_qty' => $baseUnitQuantity,
            'remaining_qty' => $baseUnitQuantity,
            'cost_price' => $unitCost,
            'received_date' => now()->toDateString(),
            'expiry_date' => null,
        ]);
    }
}
