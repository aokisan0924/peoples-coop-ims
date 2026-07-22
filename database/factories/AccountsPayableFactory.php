<?php

namespace Database\Factories;

use App\Models\AccountsPayable;
use App\Models\Location;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AccountsPayable>
 */
class AccountsPayableFactory extends Factory
{
    public function definition(): array
    {
        return [
            'supplier_id' => Supplier::factory(),
            'location_id' => Location::factory(),
            'stock_batch_id' => null,
            'amount' => $this->faker->randomFloat(2, 500, 20000),
            'incurred_date' => now()->toDateString(),
            'due_date' => now()->addDays(15)->toDateString(),
            'is_paid' => false,
            'paid_at' => null,
            'payment_method' => null,
            'recorded_by' => User::factory(),
            'notes' => null,
        ];
    }
}
