<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['name' => 'Piece', 'abbreviation' => 'pc'],
            ['name' => 'Pack', 'abbreviation' => 'pack'],
            ['name' => 'Box', 'abbreviation' => 'box'],
            ['name' => 'Kilogram', 'abbreviation' => 'kg'],
            ['name' => 'Gram', 'abbreviation' => 'g'],
            ['name' => 'Liter', 'abbreviation' => 'L'],
            ['name' => 'Milliliter', 'abbreviation' => 'mL'],
            ['name' => 'Sachet', 'abbreviation' => 'sachet'],
            ['name' => 'Bottle', 'abbreviation' => 'btl'],
            ['name' => 'Can', 'abbreviation' => 'can'],
            ['name' => 'Roll', 'abbreviation' => 'roll'],
            ['name' => 'Bundle', 'abbreviation' => 'bundle'],
        ];

        foreach ($units as $unit) {
            Unit::firstOrCreate(['name' => $unit['name']], $unit);
        }
    }
}
