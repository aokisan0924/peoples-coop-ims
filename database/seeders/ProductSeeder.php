<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $piece = Unit::where('name', 'Piece')->first();
        $pack = Unit::where('name', 'Pack')->first();
        $kg = Unit::where('name', 'Kilogram')->first();
        $liter = Unit::where('name', 'Liter')->first();
        $sachet = Unit::where('name', 'Sachet')->first();
        $bottle = Unit::where('name', 'Bottle')->first();

        $categories = Category::pluck('id', 'name');

        $products = [
            // name, category, base_unit, pack_unit, pack_factor, cost, markup%, low_stock
            ['Oreo Original 133g', 'Snacks', $piece, $pack, 10, 8.00, 18, 15],
            ['Lucky Me Pancit Canton', 'Instant Noodles', $piece, $pack, 24, 9.50, 18, 30],
            ['Bear Brand Powdered Milk 33g', 'Dairy', $sachet, $pack, 12, 11.00, 18, 24],
            ['Coca-Cola 1.5L', 'Beverages', $bottle, null, null, 45.00, 18, 10],
            ['Datu Puti Soy Sauce 1L', 'Condiments', $bottle, null, null, 38.00, 18, 8],
            ['Century Tuna Flakes in Oil 155g', 'Canned Goods', $piece, $pack, 12, 28.00, 18, 20],
            ['Palmolive Naturals Shampoo 180mL', 'Soap & Shampoo', $bottle, null, null, 55.00, 18, 10],
            ['Safeguard Bar Soap 90g', 'Soap & Shampoo', $piece, $pack, 6, 18.00, 18, 15],
            ['Colgate Toothpaste 150g', 'Oral Care', $piece, null, null, 62.00, 18, 12],
            ['Downy Fabric Conditioner 900mL', 'Laundry', $bottle, null, null, 68.00, 18, 8],
            ['Surf Powder Detergent 1kg', 'Laundry', $piece, null, null, 58.00, 18, 10],
            ['Rice - Dinorado', 'Rice & Grains', $kg, null, null, 48.00, 18, 50],
            ['Cooking Oil - Golden Fiesta 1L', 'Grocery', $bottle, null, null, 82.00, 18, 12],
            ['White Sugar', 'Grocery', $kg, null, null, 65.00, 18, 20],
            ['Zonrox Bleach 1L', 'Cleaning Supplies', $bottle, null, null, 32.00, 18, 10],
            ['Joy Dishwashing Liquid 250mL', 'Cleaning Supplies', $bottle, null, null, 24.00, 18, 15],
            ['Yosi Marlboro Red (per stick)', 'Grocery', $piece, $pack, 20, 6.50, 18, 40],
            ['San Miguel Pale Pilsen 320mL', 'Beverages - Alcoholic', $bottle, null, null, 38.00, 18, 24],
            ['Extension Cord 5m', 'Electrical', $piece, null, null, 95.00, 18, 5],
            ['PVC Pipe 1/2 inch (per length)', 'Plumbing', $piece, null, null, 55.00, 18, 8],
            ['Ballpen - Black (Panda)', 'School & Office Supplies', $piece, $pack, 12, 3.50, 18, 30],
            ['Notebook 80 leaves', 'School & Office Supplies', $piece, null, null, 15.00, 18, 25],
        ];

        foreach ($products as [$name, $categoryName, $baseUnit, $packUnit, $packFactor, $cost, $markup, $threshold]) {
            $categoryId = $categories[$categoryName] ?? $categories['Grocery'] ?? null;

            if (!$categoryId || !$baseUnit) {
                continue; // skip if a referenced category/unit wasn't found — keeps seeder resilient
            }

            $sku = 'PRD-' . now()->format('ymd') . '-' . strtoupper(Str::random(4));

            Product::firstOrCreate(
                ['name' => $name],
                [
                    'sku' => $sku,
                    'barcode' => $sku, // seeded products get an internal barcode; real scans will overwrite via editing later
                    'category_id' => $categoryId,
                    'base_unit_id' => $baseUnit->id,
                    'pack_unit_id' => $packUnit?->id,
                    'pack_conversion_factor' => $packFactor,
                    'cost_price' => $cost,
                    'markup_percentage' => $markup,
                    'low_stock_threshold' => $threshold,
                    'is_active' => true,
                ]
            );
        }
    }
}
