<?php

namespace App\Http\Middleware;

use App\Services\AuditLogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditAdminActions
{
    public function __construct(private readonly AuditLogService $auditLogService)
    {
    }

    /**
     * Log sensitive admin write operations.
     *
     * This middleware logs POST/PUT/PATCH/DELETE requests under admin protected APIs.
     * It never blocks the request if logging fails.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $response;
        }

        if ($request->is('api/v1/admin/auth/*')) {
            return $response;
        }

        /** @var \App\Models\Admin|null $admin */
        $admin = $request->user('admin');

        $this->auditLogService->logAdminRequest($request, $admin, $response);

        return $response;
    }
}
