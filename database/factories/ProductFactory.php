<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'sku' => 'PRD-TEST-' . strtoupper(Str::random(6)),
            'barcode' => strtoupper(Str::random(12)),
            'category_id' => Category::factory(),
            'base_unit_id' => Unit::factory(),
            'pack_unit_id' => null,
            'pack_conversion_factor' => null,
            'cost_price' => 10.00,
            'markup_percentage' => 18.00,
            'low_stock_threshold' => 10,
            'is_active' => true,
        ];
    }

    /**
     * Give this product a pack-selling option, e.g. Oreo sold per piece or per pack of 10.
     */
    public function withPack(int $factor = 10): static
    {
        return $this->state(fn () => [
            'pack_unit_id' => Unit::factory(),
            'pack_conversion_factor' => $factor,
        ]);
    }
}
