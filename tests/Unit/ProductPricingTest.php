<?php

namespace Tests\Unit;

use App\Models\Product;
use Tests\TestCase;

class ProductPricingTest extends TestCase
{
    private function makeProduct(float $cost, float $markup, ?int $packFactor = null): Product
    {
        return Product::factory()
            ->when($packFactor, fn ($factory) => $factory->withPack($packFactor))
            ->create([
                'cost_price' => $cost,
                'markup_percentage' => $markup,
            ]);
    }

    public function test_member_piece_price_applies_markup_only(): void
    {
        $product = $this->makeProduct(cost: 10.00, markup: 18.00);

        // 10 * 1.18 = 11.80
        $this->assertEquals(11.80, $product->member_piece_price);
    }

    public function test_non_member_piece_price_adds_vat_on_top_of_member_price(): void
    {
        $product = $this->makeProduct(cost: 10.00, markup: 18.00);

        // member price 11.80 * 1.12 (12% VAT) = 13.216 -> rounds to 13.22
        $this->assertEquals(13.22, $product->non_member_piece_price);
    }

    public function test_pack_price_multiplies_cost_by_conversion_factor_before_markup(): void
    {
        $product = $this->makeProduct(cost: 10.00, markup: 18.00, packFactor: 10);

        // pack cost = 10 * 10 = 100; member pack price = 100 * 1.18 = 118.00
        $this->assertEquals(118.00, $product->member_pack_price);

        // non-member pack price = 118 * 1.12 = 132.16
        $this->assertEquals(132.16, $product->non_member_pack_price);
    }

    public function test_pack_price_is_null_when_product_has_no_pack_option(): void
    {
        $product = $this->makeProduct(cost: 10.00, markup: 18.00); // no packFactor

        $this->assertNull($product->member_pack_price);
        $this->assertNull($product->non_member_pack_price);
    }

    public function test_zero_cost_product_prices_at_zero(): void
    {
        $product = $this->makeProduct(cost: 0.00, markup: 18.00);

        $this->assertEquals(0.00, $product->member_piece_price);
        $this->assertEquals(0.00, $product->non_member_piece_price);
    }

    public function test_custom_markup_percentage_is_respected(): void
    {
        // Not every product has to use the 18% default — confirm per-product override works
        $product = $this->makeProduct(cost: 100.00, markup: 25.00);

        // 100 * 1.25 = 125.00
        $this->assertEquals(125.00, $product->member_piece_price);
    }
}
