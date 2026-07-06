<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $roles = [
                'super_admin' => Role::where('role', 'super_admin')->first(),
                'admin'       => Role::where('role', 'admin')->first(),
            ];

            $admins = [
                [
                    'name'      => 'أحمد محمد',
                    'email'     => 'admin@widad.health',
                    'phone'     => '+20 100 000 0001',
                    'role_id'   => $roles['super_admin']?->id,
                    'is_active' => true,
                ],
                [
                    'name'      => 'محمود علي',
                    'email'     => 'finance@widad.health',
                    'phone'     => '+20 100 000 0002',
                    'role_id'   => $roles['admin']?->id,
                    'is_active' => true,
                ],
                [
                    'name'      => 'سارة أحمد',
                    'email'     => 'content@widad.health',
                    'phone'     => '+20 100 000 0003',
                    'role_id'   => $roles['admin']?->id,
                    'is_active' => true,
                ],
            ];

            foreach ($admins as $data) {
                Admin::updateOrCreate(
                    ['email' => $data['email']],
                    array_merge($data, ['password' => Hash::make('Admin@123456')])
                );
            }
        });
    }
}
