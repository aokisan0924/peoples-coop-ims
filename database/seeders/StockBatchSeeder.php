<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\StockBatch;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class StockBatchSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = Supplier::pluck('id')->all();

        if (empty($suppliers)) {
            return; // nothing to attach batches to
        }

        Product::all()->each(function (Product $product) use ($suppliers) {
            // Give each product 1–2 initial receiving batches, at slightly varying cost/date,
            // so FIFO has something realistic to chew on (not identical batches).
            $batchCount = random_int(1, 2);

            for ($i = 0; $i < $batchCount; $i++) {
                $receivedDaysAgo = $batchCount === 2 ? (14 - ($i * 7)) : 7;
                $qty = random_int(20, 100);
                // Slight cost variance between batches, like real restocking would have
                $costVariance = $i === 0 ? 0 : round($product->cost_price * 0.03, 2);

                StockBatch::create([
                    'product_id' => $product->id,
                    'supplier_id' => $suppliers[array_rand($suppliers)],
                    'received_qty' => $qty,
                    'remaining_qty' => $qty,
                    'cost_price' => $product->cost_price + $costVariance,
                    'received_date' => now()->subDays($receivedDaysAgo)->toDateString(),
                    'expiry_date' => in_array($product->category_id, [])
                        ? null
                        : now()->addDays(random_int(30, 365))->toDateString(),
                ]);
            }
        });
    }
}
