<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class LocationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->city() . ' Branch',
            'address' => $this->faker->address(),
            'phone' => $this->faker->phoneNumber(),
            'is_main' => false,
            'is_active' => true,
        ];
    }
}
