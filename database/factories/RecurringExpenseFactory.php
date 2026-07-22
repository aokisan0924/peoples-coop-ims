<?php

namespace Database\Factories;

use App\Models\Location;
use App\Models\RecurringExpense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecurringExpense>
 */
class RecurringExpenseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'location_id' => Location::factory(),
            'category' => $this->faker->randomElement(['Rent', 'Electricity', 'Water', 'Supplies', 'Salaries', 'Other']),
            'description' => null,
            'estimated_amount' => $this->faker->randomFloat(2, 500, 20000),
            'day_of_month' => $this->faker->numberBetween(1, 28),
            'is_active' => true,
            'created_by' => User::factory(),
        ];
    }
}
