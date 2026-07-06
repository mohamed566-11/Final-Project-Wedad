<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckAdminStatus
{
    use ApiResponse;
    
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if(Auth::guard('admin')->check() && !Auth::guard('admin')->user()->is_active){
            Auth::guard('admin')->user()->currentAccessToken()->delete();
            return $this->errorResponse('Your account has been deactivated. Please contact support.', 403);
        }
        return $next($request);
    }
}
