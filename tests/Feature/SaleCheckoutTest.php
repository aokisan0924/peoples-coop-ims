<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockBatch;
use App\Models\User;
use Illuminate\Support\Str;
use Tests\TestCase;

class SaleCheckoutTest extends TestCase
{
    private function makeCashierAtLocation(): User
    {
        $location = Location::factory()->create();
        return User::factory()->cashier()->create(['location_id' => $location->id]);
    }

    public function test_member_sale_deducts_stock_and_charges_member_price(): void
    {
        $cashier = $this->makeCashierAtLocation();
        $product = Product::factory()->create(['cost_price' => 10.00, 'markup_percentage' => 18.00]);
        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $cashier->location_id,
            'received_qty' => 50,
            'remaining_qty' => 50,
        ]);

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
        $this->assertDatabaseHas('sales', ['subtotal' => 59.00, 'total' => 59.00, 'location_id' => $cashier->location_id]);

        $product->refresh();
        $this->assertEquals(45, $product->totalStockAt($cashier->location_id));
    }

    public function test_non_member_sale_charges_vat_inclusive_price(): void
    {
        $cashier = $this->makeCashierAtLocation();
        $product = Product::factory()->create(['cost_price' => 10.00, 'markup_percentage' => 18.00]);
        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $cashier->location_id,
            'received_qty' => 50,
            'remaining_qty' => 50,
        ]);

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
        $this->assertDatabaseHas('sales', ['total' => 66.10]);
    }

    public function test_checkout_fails_gracefully_when_stock_is_insufficient(): void
    {
        $cashier = $this->makeCashierAtLocation();
        $product = Product::factory()->create();
        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $cashier->location_id,
            'received_qty' => 3,
            'remaining_qty' => 3,
        ]);

        $response = $this->actingAs($cashier)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 100,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 10],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJson(['success' => false]);
        $this->assertDatabaseCount('sales', 0);

        $product->refresh();
        $this->assertEquals(3, $product->totalStockAt($cashier->location_id));
    }

    public function test_cash_payment_rejects_insufficient_tender(): void
    {
        $cashier = $this->makeCashierAtLocation();
        $product = Product::factory()->create(['cost_price' => 10.00, 'markup_percentage' => 18.00]);
        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $cashier->location_id,
            'received_qty' => 50,
            'remaining_qty' => 50,
        ]);

        $response = $this->actingAs($cashier)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 5,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 5],
            ],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('sales', 0);
    }

    public function test_duplicate_client_uuid_returns_existing_sale_instead_of_creating_a_new_one(): void
    {
        $cashier = $this->makeCashierAtLocation();
        $product = Product::factory()->create();
        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $cashier->location_id,
            'received_qty' => 50,
            'remaining_qty' => 50,
        ]);

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

        $first = $this->actingAs($cashier)->postJson('/sales', $payload);
        $second = $this->actingAs($cashier)->postJson('/sales', $payload);

        $first->assertJson(['success' => true]);
        $second->assertJson(['success' => true, 'was_duplicate' => true]);

        $this->assertDatabaseCount('sales', 1);

        $product->refresh();
        $this->assertEquals(45, $product->totalStockAt($cashier->location_id));
    }

    public function test_pack_sale_converts_to_base_units_correctly(): void
    {
        $cashier = $this->makeCashierAtLocation();
        $product = Product::factory()->withPack(10)->create([
            'cost_price' => 10.00,
            'markup_percentage' => 18.00,
        ]);
        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $cashier->location_id,
            'received_qty' => 100,
            'remaining_qty' => 100,
        ]);

        $response = $this->actingAs($cashier)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 300,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'pack', 'quantity' => 2],
            ],
        ]);

        $response->assertJson(['success' => true]);

        $product->refresh();
        $this->assertEquals(80, $product->totalStockAt($cashier->location_id));
    }

    public function test_checkout_rejected_when_cashier_has_no_assigned_location(): void
    {
        // An Owner-type account with no home branch should never be able to ring up a sale
        $cashier = User::factory()->cashier()->create(['location_id' => null]);
        $product = Product::factory()->create();

        $response = $this->actingAs($cashier)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 100,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJson(['success' => false]);
        $this->assertDatabaseCount('sales', 0);
    }
}
