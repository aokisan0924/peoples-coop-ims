<?php

namespace Database\Factories;

use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'receipt_number' => 'PC-TEST-'.strtoupper(Str::random(8)),
            'client_uuid' => Str::uuid()->toString(),
            'cashier_id' => User::factory(),
            'is_member' => true,
            'subtotal' => 100.00,
            'vat_amount' => 0,
            'total' => 100.00,
            'payment_method' => 'cash',
            'amount_tendered' => 100.00,
            'change_given' => 0,
        ];
    }
}
