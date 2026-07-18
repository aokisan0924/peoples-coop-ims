<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Sale;
use App\Models\StockBatch;
use App\Models\User;
use Tests\TestCase;
use Illuminate\Support\Str;

class SaleCheckoutTest extends TestCase
{
    public function test_member_sale_deducts_stock_and_charges_member_price(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create(['cost_price' => 10.00, 'markup_percentage' => 18.00]);
        StockBatch::factory()->create(['product_id' => $product->id, 'received_qty' => 50, 'remaining_qty' => 50]);

        $response = $this->actingAs($cashier)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 100,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 5],
            ],
        ]);

        $response->assertJson(['success' => true]);

        // 5 pieces * 11.80 (member price) = 59.00
        $this->assertDatabaseHas('sales', ['subtotal' => 59.00, 'total' => 59.00]);

        $product->refresh();
        $this->assertEquals(45, $product->total_stock); // 50 - 5
    }

    public function test_non_member_sale_charges_vat_inclusive_price(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create(['cost_price' => 10.00, 'markup_percentage' => 18.00]);
        StockBatch::factory()->create(['product_id' => $product->id, 'received_qty' => 50, 'remaining_qty' => 50]);

        $response = $this->actingAs($cashier)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => false,
            'payment_method' => 'cash',
            'amount_tendered' => 100,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 5],
            ],
        ]);

        $response->assertJson(['success' => true]);

        // 5 pieces * 13.22 (non-member price incl. VAT) = 66.10
        $this->assertDatabaseHas('sales', ['total' => 66.10]);
    }

    public function test_checkout_fails_gracefully_when_stock_is_insufficient(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create();
        StockBatch::factory()->create(['product_id' => $product->id, 'received_qty' => 3, 'remaining_qty' => 3]);

        $response = $this->actingAs($cashier)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 100,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 10], // more than available
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJson(['success' => false]);

        // Critically: no sale record should exist — the whole transaction must roll back
        $this->assertDatabaseCount('sales', 0);

        $product->refresh();
        $this->assertEquals(3, $product->total_stock); // untouched
    }

    public function test_cash_payment_rejects_insufficient_tender(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create(['cost_price' => 10.00, 'markup_percentage' => 18.00]);
        StockBatch::factory()->create(['product_id' => $product->id, 'received_qty' => 50, 'remaining_qty' => 50]);

        $response = $this->actingAs($cashier)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 5, // total will be 59.00 — not enough
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 5],
            ],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('sales', 0);
    }

    public function test_duplicate_client_uuid_returns_existing_sale_instead_of_creating_a_new_one(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create();
        StockBatch::factory()->create(['product_id' => $product->id, 'received_qty' => 50, 'remaining_qty' => 50]);

        $uuid = Str::uuid()->toString();
        $payload = [
            'client_uuid' => $uuid,
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 100,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 5],
            ],
        ];

        // Simulate the offline sync engine retrying the same sale twice
        // (e.g. flaky connection dropped after the first request succeeded server-side
        // but before the client got the response)
        $first = $this->actingAs($cashier)->postJson('/sales', $payload);
        $second = $this->actingAs($cashier)->postJson('/sales', $payload);

        $first->assertJson(['success' => true]);
        $second->assertJson(['success' => true, 'was_duplicate' => true]);

        // Only ONE sale should exist, and stock should only be deducted once
        $this->assertDatabaseCount('sales', 1);

        $product->refresh();
        $this->assertEquals(45, $product->total_stock); // 50 - 5, not 50 - 10
    }

    public function test_pack_sale_converts_to_base_units_correctly(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->withPack(10)->create([
            'cost_price' => 10.00,
            'markup_percentage' => 18.00,
        ]);
        StockBatch::factory()->create(['product_id' => $product->id, 'received_qty' => 100, 'remaining_qty' => 100]);

        $response = $this->actingAs($cashier)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 300,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'pack', 'quantity' => 2], // 2 packs = 20 base units
            ],
        ]);

        $response->assertJson(['success' => true]);

        $product->refresh();
        $this->assertEquals(80, $product->total_stock); // 100 - (2 packs * 10 pieces/pack)
    }
}
