<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockBatch;
use RuntimeException;

class StockDeductionService
{
    /**
     * Deduct a quantity (in base units) from a product's stock batches, oldest first (FIFO),
     * scoped to a specific branch. Stock at one branch can never be deducted for a sale at another.
     *
     * @throws RuntimeException if there isn't enough stock at this branch.
     */
    public function deduct(Product $product, int $baseUnitQuantity, int $locationId): float
    {
        $remaining = $baseUnitQuantity;
        $totalCost = 0.0;

        $batches = StockBatch::where('product_id', $product->id)
            ->where('location_id', $locationId)
            ->where('remaining_qty', '>', 0)
            ->orderBy('received_date')
            ->orderBy('id')
            ->lockForUpdate()
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
                "Insufficient stock for \"{$product->name}\" at this branch: short by {$remaining} base unit(s)."
            );
        }

        return $baseUnitQuantity > 0 ? $totalCost / $baseUnitQuantity : 0.0;
    }

    /**
     * Restore stock for a voided sale — the new batch belongs to the same branch
     * the original sale happened at, not wherever the manager voiding it is located.
     */
    public function restore(int $productId, int $baseUnitQuantity, float $unitCost, string $reason, int $locationId): void
    {
        StockBatch::create([
            'product_id' => $productId,
            'location_id' => $locationId,
            'supplier_id' => null,
            'received_qty' => $baseUnitQuantity,
            'remaining_qty' => $baseUnitQuantity,
            'cost_price' => $unitCost,
            'received_date' => now()->toDateString(),
            'expiry_date' => null,
        ]);
    }
}
