<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        Location::firstOrCreate(
            ['name' => 'Main Branch'],
            ['address' => null, 'phone' => null, 'is_main' => true, 'is_active' => true]
        );

        Location::firstOrCreate(
            ['name' => 'Branch 2'],
            ['address' => null, 'phone' => null, 'is_main' => false, 'is_active' => true]
        );
    }
}
