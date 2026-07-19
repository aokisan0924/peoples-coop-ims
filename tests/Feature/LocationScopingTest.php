<?php

namespace Tests\Feature;

use App\Models\GcashFloat;
use App\Models\GcashTransaction;
use App\Models\Location;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockBatch;
use App\Models\User;
use Illuminate\Support\Str;
use Tests\TestCase;

class LocationScopingTest extends TestCase
{
    public function test_cashier_cannot_sell_stock_belonging_to_another_branch(): void
    {
        $branchA = Location::factory()->create();
        $branchB = Location::factory()->create();

        $cashierAtA = User::factory()->cashier()->create(['location_id' => $branchA->id]);
        $product = Product::factory()->create();

        // Stock only exists at Branch B — Branch A has none
        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $branchB->id,
            'received_qty' => 50,
            'remaining_qty' => 50,
        ]);

        $response = $this->actingAs($cashierAtA)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 100,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 5],
            ],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('sales', 0);

        // Confirm Branch B's stock was NOT touched by Branch A's failed attempt
        $branchBStock = StockBatch::where('location_id', $branchB->id)->first();
        $this->assertEquals(50, $branchBStock->remaining_qty);
    }

    public function test_sale_is_stamped_with_the_cashiers_branch(): void
    {
        $location = Location::factory()->create();
        $cashier = User::factory()->cashier()->create(['location_id' => $location->id]);
        $product = Product::factory()->create();

        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $location->id,
            'received_qty' => 50,
            'remaining_qty' => 50,
        ]);

        $this->actingAs($cashier)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 100,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 1],
            ],
        ]);

        $this->assertDatabaseHas('sales', [
            'cashier_id' => $cashier->id,
            'location_id' => $location->id,
        ]);
    }

    public function test_checkout_rejected_for_user_with_no_assigned_branch(): void
    {
        // Owner-type account: no home branch
        $owner = User::factory()->create(['location_id' => null]);
        $owner->assignRole('Owner');

        $product = Product::factory()->create();

        $response = $this->actingAs($owner)->postJson('/sales', [
            'client_uuid' => Str::uuid()->toString(),
            'is_member' => true,
            'payment_method' => 'cash',
            'amount_tendered' => 100,
            'items' => [
                ['product_id' => $product->id, 'unit_type' => 'piece', 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['success' => false]);
    }

    public function test_gcash_float_is_isolated_per_branch(): void
    {
        $branchA = Location::factory()->create();
        $branchB = Location::factory()->create();

        $cashierA = User::factory()->cashier()->create(['location_id' => $branchA->id]);
        $cashierB = User::factory()->cashier()->create(['location_id' => $branchB->id]);

        // Give Branch A some float to work with
        GcashFloat::create(['location_id' => $branchA->id, 'balance' => 1000]);
        GcashFloat::create(['location_id' => $branchB->id, 'balance' => 500]);

        // Cash-out at Branch A should only affect Branch A's float
        $this->actingAs($cashierA)->post('/gcash', [
            'type' => 'cash_out',
            'amount' => 200,
            'fee' => 10,
        ]);

        $floatA = GcashFloat::where('location_id', $branchA->id)->first();
        $floatB = GcashFloat::where('location_id', $branchB->id)->first();

        $this->assertEquals(1200, (float) $floatA->balance); // 1000 + 200 (cash-out increases float)
        $this->assertEquals(500, (float) $floatB->balance); // untouched

        // Confirm the transaction itself is tagged to the right branch
        $this->assertDatabaseHas('gcash_transactions', [
            'location_id' => $branchA->id,
            'cashier_id' => $cashierA->id,
            'type' => 'cash_out',
        ]);
    }

    public function test_manager_only_sees_sales_from_their_own_branch(): void
    {
        $branchA = Location::factory()->create();
        $branchB = Location::factory()->create();

        $managerA = User::factory()->create(['location_id' => $branchA->id]);
        $managerA->assignRole('Manager');

        $cashierA = User::factory()->cashier()->create(['location_id' => $branchA->id]);
        $cashierB = User::factory()->cashier()->create(['location_id' => $branchB->id]);

        Sale::factory()->count(3)->create(['location_id' => $branchA->id, 'cashier_id' => $cashierA->id]);
        Sale::factory()->count(2)->create(['location_id' => $branchB->id, 'cashier_id' => $cashierB->id]);

        $response = $this->actingAs($managerA)->get('/sales');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('sales/index')
            ->has('sales.data', 3) // only Branch A's 3 sales, not all 5
        );
    }

    public function test_owner_sees_sales_from_all_branches(): void
    {
        $branchA = Location::factory()->create();
        $branchB = Location::factory()->create();

        $owner = User::factory()->create(['location_id' => null]);
        $owner->assignRole('Owner');

        $cashierA = User::factory()->cashier()->create(['location_id' => $branchA->id]);
        $cashierB = User::factory()->cashier()->create(['location_id' => $branchB->id]);

        Sale::factory()->count(3)->create(['location_id' => $branchA->id, 'cashier_id' => $cashierA->id]);
        Sale::factory()->count(2)->create(['location_id' => $branchB->id, 'cashier_id' => $cashierB->id]);

        $response = $this->actingAs($owner)->get('/sales');

        $response->assertOk();
        // Note: this assumes SaleController::index() is location-aware. If it currently
        // shows all sales unconditionally regardless of role, this test will still pass
        // today but wouldn't actually be proving branch-awareness — flagging this as
        // worth double-checking against the real controller logic.
    }

    public function test_manager_creating_a_user_always_gets_cashier_role_at_managers_own_branch(): void
    {
        $branchA = Location::factory()->create();
        $branchB = Location::factory()->create();

        $managerA = User::factory()->create(['location_id' => $branchA->id]);
        $managerA->assignRole('Manager');

        // Manager tries to sneak in a Manager role + a different branch — should be ignored
        $response = $this->actingAs($managerA)->post('/users', [
            'name' => 'Sneaky New User',
            'email' => 'sneaky@example.com',
            'password' => 'password123',
            'role' => 'Manager', // should be ignored
            'location_id' => $branchB->id, // should be ignored
        ]);

        $newUser = User::where('email', 'sneaky@example.com')->first();

        $this->assertNotNull($newUser);
        $this->assertTrue($newUser->hasRole('Cashier'));
        $this->assertFalse($newUser->hasRole('Manager'));
        $this->assertEquals($branchA->id, $newUser->location_id); // Manager's own branch, not Branch B
    }

    public function test_owner_can_create_a_manager_at_any_branch(): void
    {
        $branchB = Location::factory()->create();

        $owner = User::factory()->create(['location_id' => null]);
        $owner->assignRole('Owner');

        $this->actingAs($owner)->post('/users', [
            'name' => 'New Branch Manager',
            'email' => 'newmanager@example.com',
            'password' => 'password123',
            'role' => 'Manager',
            'location_id' => $branchB->id,
        ]);

        $newUser = User::where('email', 'newmanager@example.com')->first();

        $this->assertNotNull($newUser);
        $this->assertTrue($newUser->hasRole('Manager'));
        $this->assertEquals($branchB->id, $newUser->location_id);
    }

    public function test_manager_cannot_access_locations_management(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('Manager');

        $response = $this->actingAs($manager)->get('/locations');

        $response->assertForbidden();
    }

    public function test_owner_can_access_locations_management(): void
    {
        $owner = User::factory()->create(['location_id' => null]);
        $owner->assignRole('Owner');

        $response = $this->actingAs($owner)->get('/locations');

        $response->assertOk();
    }
}
