<?php

namespace Database\Seeders;

use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([RoleSeeder::class, LocationSeeder::class]);

        $mainBranch = Location::where('name', 'Main Branch')->firstOrFail();
        $branch2 = Location::where('name', 'Branch 2')->firstOrFail();

        // Owner: cross-branch, no single location assigned — sees everything.
        User::factory()->create([
            'name' => 'Test Owner',
            'email' => 'owner@example.com',
        ])->assignRole('Owner');

        // Main Branch staff
        User::factory()->create([
            'name' => 'Test Manager',
            'email' => 'manager@example.com',
            'location_id' => $mainBranch->id,
        ])->assignRole('Manager');

        User::factory()->create([
            'name' => 'Test Cashier',
            'email' => 'cashier@example.com',
            'location_id' => $mainBranch->id,
        ])->assignRole('Cashier');

        // Branch 2 staff — kept separate on purpose, so location-scoping (and
        // stock transfers between branches) is actually exercisable in dev/QA.
        User::factory()->create([
            'name' => 'Branch 2 Manager',
            'email' => 'manager2@example.com',
            'location_id' => $branch2->id,
        ])->assignRole('Manager');

        User::factory()->create([
            'name' => 'Branch 2 Cashier',
            'email' => 'cashier2@example.com',
            'location_id' => $branch2->id,
        ])->assignRole('Cashier');

        // Inventory data — order matters: Units/Categories/Suppliers are
        // dependencies for Products, which is a dependency for Stock Batches.
        $this->call([
            UnitSeeder::class,
            CategorySeeder::class,
            SupplierSeeder::class,
            ProductSeeder::class,
            StockBatchSeeder::class,
        ]);
    }
}
