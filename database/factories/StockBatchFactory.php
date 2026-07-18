<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

class StockBatchFactory extends Factory
{
    public function definition(): array
    {
        $qty = $this->faker->numberBetween(20, 100);

        return [
            'product_id' => Product::factory(),
            'supplier_id' => Supplier::factory(),
            'received_qty' => $qty,
            'remaining_qty' => $qty,
            'cost_price' => 10.00,
            'received_date' => now()->toDateString(),
            'expiry_date' => null,
        ];
    }
}
