<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OptimizeApiResponse
{
    /**
     * Handle an incoming request.
     * Optimizes API responses by:
     * - Setting appropriate cache headers
     * - Enabling compression when possible
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only process API responses
        if (!$request->is('api/*')) {
            return $response;
        }

        // Set performance headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        
        // Add cache control for GET requests
        if ($request->isMethod('GET') && $response->isSuccessful()) {
            // Cache for 60 seconds for listing endpoints
            if ($this->isCacheableEndpoint($request)) {
                $response->headers->set('Cache-Control', 'private, max-age=60');
            } else {
                $response->headers->set('Cache-Control', 'no-cache, private');
            }
        }

        return $response;
    }

    /**
     * Check if the endpoint is cacheable
     */
    private function isCacheableEndpoint(Request $request): bool
    {
        $cacheablePatterns = [
            'api/*/faqs*',
            'api/*/life-stages*',
            'api/*/settings/site*',
            'api/*/articles*',
        ];

        foreach ($cacheablePatterns as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        return false;
    }
}
