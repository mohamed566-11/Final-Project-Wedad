<?php

namespace Tests\Traits;

use App\Models\Admin;
use App\Models\Role;

trait ActingAsAdmin
{
    protected function createAdmin(array $permissions = []): Admin
    {
        $role = Role::factory()->create([
            'role'        => empty($permissions) ? 'super_admin' : 'custom_role',
            'permissions' => empty($permissions)
                ? ['view_analytics', 'manage_users', 'manage_financials', 'manage_chatbot', 'process_payouts', 'verify_doctors', 'manage_faqs', 'review_articles']
                : $permissions,
        ]);

        return Admin::factory()->create([
            'role_id'   => $role->id,
            'is_active' => true,
        ]);
    }

    protected function actingAsAdmin(array $permissions = []): static
    {
        return $this->actingAs($this->createAdmin($permissions), 'admin');
    }
}
