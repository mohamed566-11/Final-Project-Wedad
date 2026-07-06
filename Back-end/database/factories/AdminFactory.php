<?php

namespace Database\Factories;

use App\Models\Admin;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class AdminFactory extends Factory
{
    protected $model = Admin::class;

    public function definition(): array
    {
        return [
            'name'       => $this->faker->name(),
            'email'      => $this->faker->unique()->safeEmail(),
            'password'   => Hash::make('password'),
            'phone'      => '01' . $this->faker->randomElement(['0', '1', '2', '5']) . $this->faker->numerify('########'),
            'is_active'  => true,
            'role_id'    => Role::factory(),
        ];
    }

    public function withPermissions(array $permissions): static
    {
        return $this->state(fn(array $attrs) => [
            'role_id' => Role::factory()->create([
                'role'        => 'custom',
                'permissions' => $permissions,
            ])->id,
        ]);
    }

    public function superAdmin(): static
    {
        return $this->state(fn(array $attrs) => [
            'role_id' => Role::factory()->create([
                'role'        => 'super_admin',
                'permissions' => ['view_analytics', 'manage_users', 'manage_financials', 'manage_chatbot', 'process_payouts', 'verify_doctors', 'manage_faqs', 'review_articles'],
            ])->id,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
