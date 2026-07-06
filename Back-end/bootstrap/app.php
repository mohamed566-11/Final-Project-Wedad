<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route; // يجب استدعاء كلاس Route
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',

        then: function () {
            // مسارات المريض
            Route::middleware('api')
                ->prefix('api/v1/patient')
                ->name('patient.')
                ->group(base_path('routes/patient.php'));

            // مسارات الطبيب
            Route::middleware('api')
                ->prefix('api/v1/doctor')
                ->name('doctor.')
                ->group(base_path('routes/doctor.php'));

            // مسارات الأدمن
            Route::middleware('api')
                ->prefix('api/v1/admin')
                ->name('admin.')
                ->group(base_path('routes/admin.php'));

            // مسارات عامة (الصفحات الثابتة)
            Route::middleware('api')
                ->prefix('api/v1')
                ->name('public.')
                ->group(base_path('routes/public.php'));
        },
    )

    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api([
            // يمكنك إضافة throttle:api هنا إذا كنت تستخدمه بشكل عام
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \App\Http\Middleware\OptimizeApiResponse::class, // Performance optimization
        ]);

        $middleware->alias([
            'PatientStatus' => \App\Http\Middleware\CheckPatientStatus::class,
            'DoctorStatus' => \App\Http\Middleware\CheckDoctorStatus::class,
            'AdminStatus' => \App\Http\Middleware\CheckAdminStatus::class,
            'PatientEmailVerify' => \App\Http\Middleware\CheckPatientEmailVerify::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'DoctorVerified' => \App\Http\Middleware\CheckDoctorVerified::class,
            'admin.audit' => \App\Http\Middleware\AuditAdminActions::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions): void {

        // 1. تخصيص رسالة خطأ "غير مصرح به" (401 - Unauthenticated)
        $exceptions->render(function (AuthenticationException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'message' => 'Unauthenticated. Access denied.',
                'status' => 'error'
            ], Response::HTTP_UNAUTHORIZED); // 401
        }
        return null;
        });

        // 2. تخصيص رسالة خطأ التحقق من الصحة (422 - Validation Errors)
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $e->errors(),
                    'status' => 'error'
                ], Response::HTTP_UNPROCESSABLE_ENTITY); // 422
            }
            return null;
        });

        // 3. التعامل مع أي خطأ آخر وإرجاع JSON بدلاً من HTML
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException || $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    return response()->json([
                        'message' => 'Resource not found',
                        'status' => 'error'
                    ], 404);
                }

                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) {
                    return $e->getResponse();
                }

                $statusCode = 500;
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                    $statusCode = $e->getStatusCode();
                }

                return response()->json([
                    'message' => $e->getMessage() ?: 'Internal Server Error',
                    'exception' => get_class($e),
                    'status' => 'error',
                ], $statusCode);
            }
            return null;
        });
    })->create();
