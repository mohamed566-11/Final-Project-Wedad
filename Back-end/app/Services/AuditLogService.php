<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditLogService
{
    /**
     * Persist one audit log record for an admin API request.
     */
    public function logAdminRequest(Request $request, ?Admin $admin, Response $response): void
    {
        try {
            $route = $request->route();
            $routeParams = $route?->parameters() ?? [];

            $resourceType = null;
            $resourceId = null;

            foreach ($routeParams as $key => $value) {
                if (is_object($value) && method_exists($value, 'getKey')) {
                    $resourceType = class_basename($value);
                    $resourceId = (string) $value->getKey();
                    break;
                }

                if (in_array($key, ['id', 'admin', 'doctor', 'patient', 'successStory'], true)) {
                    $resourceType = ucfirst((string) $key);
                    $resourceId = is_scalar($value) ? (string) $value : null;
                    break;
                }
            }

            $payload = $this->sanitizeRequestData($request);

            AuditLog::create([
                'admin_id' => $admin?->id,
                'method' => $request->method(),
                'endpoint' => $request->path(),
                'action' => $route?->getName(),
                'resource_type' => $resourceType,
                'resource_id' => $resourceId,
                'status_code' => (int) $response->getStatusCode(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_data' => $payload,
                'response_message' => $this->extractResponseMessage($response),
                'metadata' => [
                    'query' => $request->query(),
                ],
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Remove sensitive fields and represent uploaded files safely.
     */
    private function sanitizeRequestData(Request $request): array
    {
        $payload = $request->except([
            'password',
            'password_confirmation',
            'current_password',
            'token',
            'otp',
        ]);

        $files = array_keys($request->allFiles());
        foreach ($files as $fileKey) {
            $payload[$fileKey] = '[uploaded_file]';
        }

        return $payload;
    }

    /**
     * Read API response message when available.
     */
    private function extractResponseMessage(Response $response): ?string
    {
        $content = $response->getContent();
        if (!$content) {
            return null;
        }

        $decoded = json_decode($content, true);
        if (!is_array($decoded)) {
            return null;
        }

        $message = $decoded['message'] ?? null;
        if (!is_string($message)) {
            return null;
        }

        return mb_substr($message, 0, 500);
    }
}
