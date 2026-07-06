<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RouteSecurityTest extends TestCase
{
    /**
     * White list of public route names or URIs that don't need auth
     */
    private $whitelistUris = [
        'api/v1/patient/auth/register',
        'api/v1/patient/auth/login',
        'api/v1/patient/password/email',
        'api/v1/patient/password/reset',
        'api/v1/patient/life-stages',
        'api/v1/patient/articles',
        'api/v1/patient/articles/{slug}',
        'api/v1/patient/doctors/{doctorId}/articles',
        'api/v1/patient/iot/debug',
        'api/v1/patient/payments/paymob/callback',
        'api/v1/patient/payments/paymob/redirect',
        
        'api/v1/doctor/auth/register',
        'api/v1/doctor/auth/login',
        'api/v1/doctor/password/email',
        'api/v1/doctor/password/reset',
        'api/v1/doctors/{id}/reviews',
    ];

    public function test_all_patient_routes_are_protected()
    {
        $routes = Route::getRoutes()->getRoutes();
        $missing = [];

        foreach ($routes as $route) {
            $uri = $route->uri();
            
            // Only check api/v1/patient routes
            if (strpos($uri, 'api/v1/patient') === 0 && !in_array($uri, $this->whitelistUris)) {
                $middlewares = $route->gatherMiddleware();
                if (!in_array('auth:patient', $middlewares)) {
                    $missing[] = "[{$route->methods()[0]}] {$uri}";
                }
            }
        }
        file_put_contents('patient_missing_routes.json', json_encode($missing, JSON_PRETTY_PRINT));
        $this->assertEmpty($missing, "Missing auth:patient middleware on:\n" . implode("\n", $missing));
    }

    public function test_all_doctor_routes_are_protected()
    {
        $routes = Route::getRoutes()->getRoutes();
        $missing = [];

        foreach ($routes as $route) {
            $uri = $route->uri();
            
            // Only check api/v1/doctor routes
            if (strpos($uri, 'api/v1/doctor') === 0 && !in_array($uri, $this->whitelistUris)) {
                $middlewares = $route->gatherMiddleware();
                if (!in_array('auth:doctor', $middlewares)) {
                    $missing[] = "[{$route->methods()[0]}] {$uri}";
                }
            }
        }
        file_put_contents('doctor_missing_routes.json', json_encode($missing, JSON_PRETTY_PRINT));
        $this->assertEmpty($missing, "Missing auth:doctor middleware on:\n" . implode("\n", $missing));
    }
}
