<?php

namespace Database\Seeders;

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
        $this->call(RoleSeeder::class);

        User::factory()->create([
            'name' => 'Jeffrae Sapla',
            'email' => 'jeffraesapla24@gmail.com',
        ])->assignRole('Manager');

        User::factory()->create([
            'name' => 'Test Cashier',
            'email' => 'cashier@example.com',
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
