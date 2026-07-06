<?php

namespace App\Providers;

use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    use ApiResponse;
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiter();
        


    }
        protected function configureRateLimiter()
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip())->response(function () {
                return $this->errorResponse('Too many requests. Please try again after a minute.', 429);
            });
        });


        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())->response(function () {
                return $this->errorResponse('Too many login attempts. Please try again after a minute.', 429);
            });
        });
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())->response(function () {
                return $this->errorResponse('Too many registration attempts. Please try again after a minute.', 429);
            });
        });

        // Chatbot Rate Limiters
        RateLimiter::for('chatbot_public', function (Request $request) {
            return Limit::perMinute(config('chatbot.limits.public_rate_per_minute', 10))
                ->by($request->ip())
                ->response(function () {
                    return $this->errorResponse('تم تجاوز حد الرسائل. حاولي مرة أخرى بعد دقيقة.', 429);
                });
        });

        RateLimiter::for('chatbot_auth', function (Request $request) {
            return Limit::perMinute(config('chatbot.limits.auth_rate_per_minute', 30))
                ->by($request->user()?->id ?: $request->ip())
                ->response(function () {
                    return $this->errorResponse('تم تجاوز حد الرسائل. حاولي مرة أخرى بعد دقيقة.', 429);
                });
        });

        // Guest chatbot status polling — keyed by guest token to prevent IDOR probing
        RateLimiter::for('guest-chatbot-status', function (Request $request) {
            return Limit::perMinute(30)->by(
                $request->header('X-Guest-Session-Token') ?? $request->ip()
            );
        });

        // Chat Rate Limiters
        RateLimiter::for('chat_message', function (Request $request) {
            $guard = $request->user('doctor') ? 'doctor' : 'patient';
            $key = $guard . ':' . ($request->user()?->id ?: $request->ip());
            return Limit::perMinute(30)->by($key)
                ->response(fn() => $this->errorResponse('تجاوزت حد الرسائل المسموح به (30/دقيقة)', 429));
        });

        RateLimiter::for('chat_polling', function (Request $request) {
            $guard = $request->user('doctor') ? 'doctor' : 'patient';
            $key = $guard . ':' . ($request->user()?->id ?: $request->ip());
            return Limit::perMinute(60)->by($key)
                ->response(fn() => $this->errorResponse('طلبات كثيرة جداً', 429));
        });
    }
}
