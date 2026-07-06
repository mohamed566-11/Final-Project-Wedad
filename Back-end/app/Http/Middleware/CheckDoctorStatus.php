<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckDoctorStatus
{
    use ApiResponse;
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if(Auth::guard('doctor')->check() && !Auth::guard('doctor')->user()->is_active){
            Auth::guard('doctor')->user()->currentAccessToken()->delete();
            return $this->errorResponse('Your account has been deactivated. Please contact support.', 403);
        }
        return $next($request);
    }
}
