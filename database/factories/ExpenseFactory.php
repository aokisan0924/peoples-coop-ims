<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'location_id' => Location::factory(),
            'supplier_id' => null,
            'recurring_expense_id' => null,
            'category' => $this->faker->randomElement(['Rent', 'Electricity', 'Water', 'Supplies', 'Salaries', 'Other']),
            'description' => null,
            'amount' => $this->faker->randomFloat(2, 200, 15000),
            'expense_date' => now()->toDateString(),
            'due_date' => null,
            'is_paid' => true,
            'payment_method' => 'cash',
            'paid_at' => now(),
            'recorded_by' => User::factory(),
            'notes' => null,
        ];
    }
}
