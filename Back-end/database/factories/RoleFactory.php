<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoleFactory extends Factory
{
    protected $model = Role::class;

    public function definition(): array
    {
        return [
            'role'        => $this->faker->randomElement(['admin', 'moderator', 'analyst']),
            'permissions' => [],
            'description' => $this->faker->sentence(),
        ];
    }

    public function superAdmin(): static
    {
        return $this->state([
            'role'        => 'super_admin',
            'permissions' => ['view_analytics', 'manage_users', 'manage_financials', 'manage_chatbot', 'process_payouts', 'verify_doctors', 'manage_faqs', 'review_articles'],
        ]);
    }

    public function withPermission(string ...$permissions): static
    {
        return $this->state(['permissions' => array_values($permissions)]);
    }
}
