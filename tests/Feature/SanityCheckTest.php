<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class SanityCheckTest extends TestCase
{
    public function test_manager_factory_state_assigns_role(): void
    {
        $manager = User::factory()->manager()->create();

        $this->assertTrue($manager->hasRole('Manager'));
    }

    public function test_cashier_factory_state_assigns_role(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->assertTrue($cashier->hasRole('Cashier'));
    }
}
