<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'Golden Harvest Trading',
                'contact_person' => 'Rosario Mendoza',
                'phone' => '0917-123-4567',
                'email' => 'rosario@goldenharvest.ph',
                'address' => 'Km. 18 MacArthur Highway, San Jose del Monte, Bulacan',
                'payment_terms' => 'Net 15',
            ],
            [
                'name' => 'Metro Grocery Distributors Inc.',
                'contact_person' => 'Ferdinand Cruz',
                'phone' => '0918-234-5678',
                'email' => 'sales@metrogrocery.ph',
                'address' => 'Valenzuela City, Metro Manila',
                'payment_terms' => 'Net 30',
            ],
            [
                'name' => 'Bulacan Hardware Supply',
                'contact_person' => 'Ligaya Santos',
                'phone' => '0919-345-6789',
                'email' => null,
                'address' => 'Malolos City, Bulacan',
                'payment_terms' => 'COD',
            ],
            [
                'name' => 'Norte Beverages & Snacks Corp.',
                'contact_person' => 'Ramil Torres',
                'phone' => '0920-456-7890',
                'email' => 'orders@nortebeverages.ph',
                'address' => 'Sta. Maria, Bulacan',
                'payment_terms' => 'Net 15',
            ],
            [
                'name' => 'Dela Cruz Household Essentials',
                'contact_person' => 'Marites Dela Cruz',
                'phone' => '0921-567-8901',
                'email' => null,
                'address' => 'San Jose del Monte, Bulacan',
                'payment_terms' => 'COD',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::firstOrCreate(['name' => $supplier['name']], $supplier);
        }
    }
}
