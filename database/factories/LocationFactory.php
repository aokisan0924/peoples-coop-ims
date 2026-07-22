<?php

namespace Database\Factories;

use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Location>
 */
class LocationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->city().' Branch',
            'address' => $this->faker->address(),
            'phone' => $this->faker->phoneNumber(),
            'is_main' => false,
            'is_active' => true,
        ];
    }
}
