<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $structure = [
            'Grocery' => ['Dairy', 'Canned Goods', 'Snacks', 'Beverages', 'Condiments', 'Instant Noodles'],
            'Household' => ['Cleaning Supplies', 'Laundry', 'Paper Products'],
            'Personal Care' => ['Soap & Shampoo', 'Oral Care', 'Skin Care'],
            'Hardware' => ['Electrical', 'Plumbing', 'Tools'],
            'School & Office Supplies' => [],
            'Frozen Goods' => [],
            'Rice & Grains' => [],
            'Beverages - Alcoholic' => [],
        ];

        foreach ($structure as $parentName => $children) {
            $parent = Category::firstOrCreate(['name' => $parentName, 'parent_id' => null]);

            foreach ($children as $childName) {
                Category::firstOrCreate([
                    'name' => $childName,
                    'parent_id' => $parent->id,
                ]);
            }
        }
    }
}
