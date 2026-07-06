<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    use ApiResponse;

    /**
     * Handle an incoming request.
     *
     * Verifies that the authenticated admin has the required permission(s).
     * Super admins bypass all permission checks.
     *
     * Usage in routes:
     *   ->middleware('permission:manage_users')
     *   ->middleware('permission:manage_doctors,verify_doctors')  // requires ALL
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$permissions  One or more permission strings (ALL required)
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        /** @var \App\Models\Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return $this->errorResponse('غير مصرح بالوصول.', 401);
        }

        // Super admin bypasses all permission checks
        if ($admin->isSuperAdmin()) {
            return $next($request);
        }

        // If no specific permissions are required, allow access
        if (empty($permissions)) {
            return $next($request);
        }

        // Check if admin has AT LEAST ONE of the required permissions
        $hasPermission = false;
        foreach ($permissions as $permission) {
            if ($admin->hasPermission($permission)) {
                $hasPermission = true;
                break;
            }
        }

        if (!$hasPermission) {
            return $this->errorResponse(
                'ليس لديك صلاحية للوصول لهذا المورد. يرجى مراجعة الصلاحيات.',
                403
            );
        }

        return $next($request);
    }
}
