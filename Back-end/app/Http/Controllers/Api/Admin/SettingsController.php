<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SettingsSite;
use App\Models\Role;
use App\Models\AuditLog;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    use ApiResponse;

    /**
     * Get site settings
     * GET /api/v1/admin/settings/site
     */
    public function getSiteSettings()
    {
        $settings = SettingsSite::first();

        if (!$settings) {
            // Create default settings if not exists
            $settings = SettingsSite::create([
                'name' => 'منصة وداد الصحية',
                'email' => 'info@widad.com',
                'phone' => '',
                'country' => 'Egypt',
                'city' => 'Cairo',
            ]);
        }

        return $this->successResponse([
            'site_name' => $settings->name,
            'email' => $settings->email,
            'phone' => $settings->phone,
            'country' => $settings->country,
            'city' => $settings->city,
            'street' => $settings->street,
            'small_description' => $settings->small_description,
            'logo' => $settings->logo ? Storage::disk('public')->url($settings->logo) : null,
            'favicon' => $settings->favicon ? Storage::disk('public')->url($settings->favicon) : null,
            'social_media' => [
                'facebook' => $settings->facebook_url,
                'twitter' => $settings->twitter_url,
                'instagram' => $settings->instagram_url,
                'youtube' => $settings->youtube_url,
            ],
            'terms_content' => $settings->terms_content,
            'privacy_content' => $settings->privacy_content,
        ]);
    }

    /**
     * Update site settings
     * PUT /api/v1/admin/settings/site
     */
    public function updateSiteSettings(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'street' => 'nullable|string|max:255',
            'small_description' => 'nullable|string|max:1000',
            'logo' => 'nullable|image|mimes:png,jpg,jpeg,svg|max:2048',
            'favicon' => 'nullable|image|mimes:png,ico|max:512',
            'facebook_url' => 'nullable|url|max:255',
            'twitter_url' => 'nullable|url|max:255',
            'instagram_url' => 'nullable|url|max:255',
            'youtube_url' => 'nullable|url|max:255',
            'terms_content' => 'nullable|string',
            'privacy_content' => 'nullable|string',
        ]);

        $settings = SettingsSite::first();

        if (!$settings) {
            $settings = new SettingsSite();
        }

        // Update basic fields
        $fillableFields = [
            'name', 'email', 'phone', 'country', 'city',
            'street', 'small_description', 'facebook_url', 'twitter_url',
            'instagram_url', 'youtube_url', 'terms_content', 'privacy_content'
        ];

        foreach ($fillableFields as $field) {
            if ($request->has($field)) {
                $settings->$field = $request->$field;
            }
        }

        // Handle logo upload
        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($settings->logo) {
                Storage::disk('public')->delete($settings->logo);
            }

            $logoExt  = $request->file('logo')->getClientOriginalExtension();
            $logoPath = $request->file('logo')->storeAs('settings', 'logo.' . $logoExt, 'public');
            $settings->logo = $logoPath; // حفظ المسار الكامل: 'settings/logo.png'
        }

        // Handle favicon upload
        if ($request->hasFile('favicon')) {
            // Delete old favicon
            if ($settings->favicon) {
                Storage::disk('public')->delete($settings->favicon);
            }

            $faviconExt  = $request->file('favicon')->getClientOriginalExtension();
            $faviconPath = $request->file('favicon')->storeAs('settings', 'favicon.' . $faviconExt, 'public');
            $settings->favicon = $faviconPath; // حفظ المسار الكامل: 'settings/favicon.ico'
        }

        $settings->save();

        return $this->successResponse([
            'settings' => $settings,
        ], 'تم تحديث الإعدادات بنجاح');
    }

    /**
     * Get all roles with permissions
     * GET /api/v1/admin/settings/roles
     */
    public function getRoles()
    {
        $roles = Role::withCount('admins')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'role' => $role->role,
                'description' => $role->description,
                'permissions' => $role->permissions ?? [],
                'admins_count' => $role->admins_count,
            ];
        });

        // Available permissions list (from centralized Permission enum)
        $availablePermissions = \App\Enums\Permission::allWithDescriptions();

        return $this->successResponse([
            'roles' => $roles,
            'available_permissions' => $availablePermissions,
        ]);
    }

    /**
     * Create a new role
     * POST /api/v1/admin/settings/roles
     */
    public function createRole(Request $request)
    {
        // Only super admins can create roles
        if (!$request->user()->isSuperAdmin()) {
            return $this->errorResponse('ليس لديك صلاحية لإنشاء دور جديد', 403);
        }

        $request->validate([
            'role' => 'required|string|max:50|unique:roles,role',
            'description' => 'nullable|string|max:255',
            'permissions' => 'required|array',
            'permissions.*' => 'string',
        ], [
            'role.required' => 'اسم الدور مطلوب',
            'role.unique' => 'هذا الدور موجود بالفعل',
            'permissions.required' => 'الصلاحيات مطلوبة',
        ]);

        $role = Role::create([
            'role' => $request->role,
            'description' => $request->description,
            'permissions' => $request->permissions,
        ]);

        return $this->successResponse([
            'role' => [
                'id' => $role->id,
                'role' => $role->role,
                'description' => $role->description,
                'permissions' => $role->permissions,
            ],
        ], 'تم إنشاء الدور بنجاح', 201);
    }

    /**
     * Update a role's permissions
     * PUT /api/v1/admin/settings/roles/{id}
     */
    public function updateRole(Request $request, $id)
    {
        // Only super admins can update roles
        if (!$request->user()->isSuperAdmin()) {
            return $this->errorResponse('ليس لديك صلاحية لتعديل الأدوار', 403);
        }

        $role = Role::find($id);

        if (!$role) {
            return $this->errorResponse('الدور غير موجود', 404);
        }

        // Prevent modifying super_admin role
        if ($role->role === 'super_admin') {
            return $this->errorResponse('لا يمكن تعديل دور المسؤول العام', 400);
        }

        $request->validate([
            'description' => 'nullable|string|max:255',
            'permissions' => 'required|array',
            'permissions.*' => 'string',
        ]);

        $role->update([
            'description' => $request->description ?? $role->description,
            'permissions' => $request->permissions,
        ]);

        return $this->successResponse([
            'role' => [
                'id' => $role->id,
                'role' => $role->role,
                'description' => $role->description,
                'permissions' => $role->permissions,
            ],
        ], 'تم تحديث الدور بنجاح');
    }

    /**
     * Delete a role
     * DELETE /api/v1/admin/settings/roles/{id}
     */
    public function deleteRole(Request $request, $id)
    {
        // Only super admins can delete roles
        if (!$request->user()->isSuperAdmin()) {
            return $this->errorResponse('ليس لديك صلاحية لحذف الأدوار', 403);
        }

        $role = Role::find($id);

        if (!$role) {
            return $this->errorResponse('الدور غير موجود', 404);
        }

        // Prevent deleting super_admin or admin role
        if (in_array($role->role, ['super_admin', 'admin'])) {
            return $this->errorResponse('لا يمكن حذف هذا الدور', 400);
        }

        // Check if role has admins
        if ($role->admins()->count() > 0) {
            return $this->errorResponse('لا يمكن حذف دور له مسؤولين مرتبطين', 400);
        }

        $role->delete();

        return $this->successResponse(null, 'تم حذف الدور بنجاح');
    }

    /**
     * Get system settings (app configurations)
     * GET /api/v1/admin/settings/system
     */
    public function getSystemSettings()
    {
        return $this->successResponse([
            'app' => [
                'name' => config('app.name'),
                'environment' => config('app.env'),
                'debug' => config('app.debug'),
                'url' => config('app.url'),
            ],
            'services' => [
                'paymob' => [
                    'configured' => !empty(config('services.paymob.api_key')),
                ],
                'zoom' => [
                    'configured' => !empty(config('services.zoom.client_id')),
                ],
                'google_meet' => [
                    'configured' => !empty(config('services.google.client_id')),
                ],
                'mail' => [
                    'configured' => !empty(config('mail.mailers.smtp.host')),
                    'driver' => config('mail.default'),
                ],
            ],
            'limits' => [
                'upload_max_size' => ini_get('upload_max_filesize'),
                'post_max_size' => ini_get('post_max_size'),
                'max_execution_time' => ini_get('max_execution_time'),
            ],
        ]);
    }

    /**
     * Get admin audit logs
     * GET /api/v1/admin/settings/audit-logs
     */
    public function getAuditLogs(Request $request)
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'method' => 'nullable|in:POST,PUT,PATCH,DELETE',
            'status_code' => 'nullable|integer|min:100|max:599',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'per_page' => 'nullable|integer|min:5|max:100',
        ]);

        $query = AuditLog::with(['admin:id,name,email'])
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('endpoint', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('resource_type', 'like', "%{$search}%")
                  ->orWhereHas('admin', function ($adminQuery) use ($search) {
                      $adminQuery->where('name', 'like', "%{$search}%")
                                 ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('method')) {
            $query->where('method', (string) $request->input('method'));
        }

        if ($request->filled('status_code')) {
            $query->where('status_code', (int) $request->status_code);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $perPage = (int) ($request->per_page ?? 20);
        $logs = $query->paginate($perPage);

        return $this->successResponse($logs);
    }
}
