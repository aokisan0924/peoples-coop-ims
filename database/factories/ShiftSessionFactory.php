<?php

namespace Database\Factories;

use App\Models\Location;
use App\Models\ShiftSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShiftSession>
 */
class ShiftSessionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'cashier_id' => User::factory(),
            'location_id' => Location::factory(),
            'starting_cash' => 2000.00,
            'expected_cash' => null,
            'actual_cash' => null,
            'cash_breakdown' => null,
            'variance' => null,
            'status' => 'open',
            'opened_at' => now(),
            'closed_at' => null,
            'notes' => null,
        ];
    }
}
