<?php

namespace Database\Factories;

use App\Models\Location;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockTransfer>
 */
class StockTransferFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'from_location_id' => Location::factory(),
            'to_location_id' => Location::factory(),
            'quantity' => $this->faker->numberBetween(1, 50),
            'cost_price' => $this->faker->randomFloat(2, 5, 200),
            'batch_breakdown' => null,
            'status' => 'in_transit',
            'initiated_by' => User::factory(),
            'received_by' => null,
            'initiated_at' => now(),
            'received_at' => null,
            'notes' => null,
        ];
    }
}
