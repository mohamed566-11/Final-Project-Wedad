<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Role;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AdminManagementController extends Controller
{
    use ApiResponse;

    /**
     * Get all admins
     * GET /api/v1/admin/admins
     */
    public function index(Request $request)
    {
        $query = Admin::with('role');

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        // Active status filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $admins = $query->orderByDesc('created_at')->paginate(15);

        // Transform admins data
        $transformedAdmins = $admins->getCollection()->map(function ($admin) {
            return $this->transformAdmin($admin);
        });

        return $this->successResponse([
            'admins' => $transformedAdmins,
            'pagination' => [
                'total' => $admins->total(),
                'per_page' => $admins->perPage(),
                'current_page' => $admins->currentPage(),
                'last_page' => $admins->lastPage(),
            ],
        ]);
    }

    /**
     * Get a specific admin
     * GET /api/v1/admin/admins/{id}
     */
    public function show($id)
    {
        $admin = Admin::with('role')->find($id);

        if (!$admin) {
            return $this->errorResponse('المسؤول غير موجود', 404);
        }

        return $this->successResponse([
            'admin' => $this->transformAdmin($admin),
        ]);
    }

    /**
     * Create a new admin
     * POST /api/v1/admin/admins
     */
    public function store(Request $request)
    {
        // Only super admins can create new admins
        $currentAdmin = $request->user();
        if (!$currentAdmin->isSuperAdmin()) {
            return $this->errorResponse('ليس لديك صلاحية لإنشاء مسؤول جديد', 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                \Illuminate\Validation\Rule::unique('admins', 'email')->whereNull('deleted_at')
            ],
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role_id' => 'required|exists:roles,id',
        ], [
            'name.required' => 'الاسم مطلوب',
            'email.required' => 'البريد الإلكتروني مطلوب',
            'email.email' => 'البريد الإلكتروني غير صحيح',
            'email.unique' => 'البريد الإلكتروني مستخدم بالفعل',
            'password.required' => 'كلمة المرور مطلوبة',
            'password.min' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
            'role_id.required' => 'الدور مطلوب',
            'role_id.exists' => 'الدور غير موجود',
        ]);

        // If an admin exists with this email but is soft-deleted, restore it
        $admin = Admin::withTrashed()->where('email', $request->email)->first();

        if ($admin && $admin->trashed()) {
            $admin->restore();
            $admin->update([
                'name' => $request->name,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'role_id' => $request->role_id,
                'is_active' => true,
            ]);
        } else {
            $admin = Admin::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'role_id' => $request->role_id,
                'is_active' => true,
            ]);
        }

        return $this->successResponse([
            'admin' => $this->transformAdmin($admin->load('role')),
        ], 'تم إنشاء المسؤول بنجاح', 201);
    }

    /**
     * Update an admin
     * PUT /api/v1/admin/admins/{id}
     */
    public function update(Request $request, $id)
    {
        $currentAdmin = $request->user();

        // Only super admins can update other admins
        if (!$currentAdmin->isSuperAdmin() && $currentAdmin->id != $id) {
            return $this->errorResponse('ليس لديك صلاحية لتعديل هذا المسؤول', 403);
        }

        $admin = Admin::find($id);

        if (!$admin) {
            return $this->errorResponse('المسؤول غير موجود', 404);
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'email',
                \Illuminate\Validation\Rule::unique('admins', 'email')->ignore($id)->whereNull('deleted_at')
            ],
            'password' => 'sometimes|nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role_id' => 'sometimes|required|exists:roles,id',
        ]);

        $updateData = $request->only(['name', 'email', 'phone', 'role_id']);

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $admin->update($updateData);

        return $this->successResponse([
            'admin' => $this->transformAdmin($admin->fresh()->load('role')),
        ], 'تم تحديث المسؤول بنجاح');
    }

    /**
     * Toggle admin status
     * PUT /api/v1/admin/admins/{id}/toggle-status
     */
    public function toggleStatus(Request $request, $id)
    {
        $currentAdmin = $request->user();

        if (!$currentAdmin->isSuperAdmin()) {
            return $this->errorResponse('ليس لديك صلاحية لتغيير حالة المسؤول', 403);
        }

        $admin = Admin::find($id);

        if (!$admin) {
            return $this->errorResponse('المسؤول غير موجود', 404);
        }

        // Cannot deactivate yourself
        if ($admin->id === $currentAdmin->id) {
            return $this->errorResponse('لا يمكنك إيقاف حسابك الخاص', 400);
        }

        // Cannot deactivate other super admins (optional protection)
        if ($admin->isSuperAdmin()) {
            return $this->errorResponse('لا يمكنك إيقاف حساب مسؤول عام', 400);
        }

        $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $admin->update([
            'is_active' => $request->is_active,
        ]);

        // If deactivating, revoke all tokens
        if (!$request->is_active) {
            $admin->tokens()->delete();
        }

        $message = $request->is_active
            ? 'تم تفعيل حساب المسؤول بنجاح'
            : 'تم إيقاف حساب المسؤول بنجاح';

        return $this->successResponse([
            'admin' => [
                'id' => $admin->id,
                'is_active' => $admin->is_active,
            ],
        ], $message);
    }

    /**
     * Delete an admin
     * DELETE /api/v1/admin/admins/{id}
     */
    public function destroy(Request $request, $id)
    {
        $currentAdmin = $request->user();

        if (!$currentAdmin->isSuperAdmin()) {
            return $this->errorResponse('ليس لديك صلاحية لحذف المسؤول', 403);
        }

        $admin = Admin::find($id);

        if (!$admin) {
            return $this->errorResponse('المسؤول غير موجود', 404);
        }

        // Cannot delete yourself
        if ($admin->id === $currentAdmin->id) {
            return $this->errorResponse('لا يمكنك حذف حسابك الخاص', 400);
        }

        // Cannot delete super admins
        if ($admin->isSuperAdmin()) {
            return $this->errorResponse('لا يمكنك حذف حساب مسؤول عام', 400);
        }

        // Revoke all tokens
        $admin->tokens()->delete();

        // Hard delete
        $admin->forceDelete();

        return $this->successResponse(null, 'تم حذف المسؤول بنجاح');
    }

    /**
     * Get available roles
     * GET /api/v1/admin/roles
     */
    public function roles()
    {
        $roles = Role::all()->map(function ($role) {
            return [
                'id' => $role->id,
                'role' => $role->role,
                'description' => $role->description,
                'permissions' => $role->permissions ?? [],
            ];
        });

        return $this->successResponse([
            'roles' => $roles,
        ]);
    }

    /**
     * Transform admin data
     */
    private function transformAdmin(Admin $admin): array
    {
        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'phone' => $admin->phone,
            'role' => $admin->role ? [
                'id' => $admin->role->id,
                'role' => $admin->role->role,
                'description' => $admin->role->description,
            ] : null,
            'is_active' => $admin->is_active,
            'is_super_admin' => $admin->isSuperAdmin(),
            'last_login_at' => $admin->last_login_at?->format('Y-m-d H:i:s'),
            'created_at' => $admin->created_at->format('Y-m-d'),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($admin->image, 'profiles', 'uploads', 'profiles/default-avatar.png'),
        ];
    }
}
