<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Enums\Permission;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            [
                'role' => 'super_admin',
                'description' => 'Full system access — all permissions',
                'permissions' => Permission::all(),
            ],
            [
                'role' => 'admin',
                'description' => 'General admin — manages users, doctors, articles, consultations',
                'permissions' => [
                    Permission::MANAGE_USERS,
                    Permission::VIEW_USERS,
                    Permission::MANAGE_DOCTORS,
                    Permission::VERIFY_DOCTORS,
                    Permission::VIEW_DOCTORS,
                    Permission::MANAGE_ARTICLES,
                    Permission::REVIEW_ARTICLES,
                    Permission::MANAGE_CONSULTATIONS,
                    Permission::VIEW_CONSULTATIONS,
                    Permission::VIEW_ANALYTICS,
                    Permission::VIEW_REPORTS,
                    Permission::MANAGE_MESSAGES,
                    Permission::MANAGE_FAQS,
                    Permission::MANAGE_PAGES,
                ],
            ],
            [
                'role' => 'moderator',
                'description' => 'Content moderation — articles, FAQs, messages only',
                'permissions' => [
                    Permission::MANAGE_ARTICLES,
                    Permission::REVIEW_ARTICLES,
                    Permission::VIEW_USERS,
                    Permission::VIEW_DOCTORS,
                    Permission::VIEW_CONSULTATIONS,
                    Permission::MANAGE_FAQS,
                    Permission::MANAGE_MESSAGES,
                ],
            ],
            [
                'role' => 'financial_admin',
                'description' => 'Financial management — payments, payouts, reports',
                'permissions' => [
                    Permission::MANAGE_FINANCIALS,
                    Permission::PROCESS_PAYOUTS,
                    Permission::VIEW_ANALYTICS,
                    Permission::VIEW_REPORTS,
                    Permission::VIEW_CONSULTATIONS,
                ],
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['role' => $role['role']],
                [
                    'description' => $role['description'],
                    'permissions' => $role['permissions'],
                ]
            );
        }
    }
}
