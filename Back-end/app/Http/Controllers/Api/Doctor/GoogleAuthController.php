<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Services\GoogleMeetService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class GoogleAuthController extends Controller
{
    protected GoogleMeetService $googleMeetService;

    public function __construct(GoogleMeetService $googleMeetService)
    {
        $this->googleMeetService = $googleMeetService;
    }

    /**
     * Get Google OAuth URL for doctor to connect their account
     */
    public function getAuthUrl(): JsonResponse
    {
        $doctor = Auth::user();

        if (!$doctor) {
            return response()->json([
                'status' => false,
                'message' => 'لم يتم العثور على بيانات الطبيب',
            ], 404);
        }

        $authUrl = $this->googleMeetService->getAuthUrl($doctor->id);

        return response()->json([
            'status' => true,
            'data' => [
                'auth_url' => $authUrl,
            ],
        ]);
    }

    /**
     * Handle OAuth callback from Google
     */
    public function handleCallback(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'state' => 'required|string',
        ]);

        $success = $this->googleMeetService->handleCallback(
            $request->code,
            $request->state
        );

        if ($success) {
            return response()->json([
                'status' => true,
                'message' => 'تم ربط حساب Google بنجاح',
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'فشل في ربط حساب Google',
        ], 400);
    }

    /**
     * Check if doctor's Google account is connected
     */
    public function checkConnection(): JsonResponse
    {
        $doctor = Auth::user();

        if (!$doctor) {
            return response()->json([
                'status' => false,
                'message' => 'لم يتم العثور على بيانات الطبيب',
            ], 404);
        }

        $isConnected = $this->googleMeetService->isDoctorConnected($doctor);

        return response()->json([
            'status' => true,
            'data' => [
                'is_connected' => $isConnected,
                'connected_at' => $isConnected ? $doctor->updated_at : null,
                'google_email' => $doctor->google_email ?? null,
            ],
        ]);
    }

    /**
     * Disconnect Google account
     */
    public function disconnect(): JsonResponse
    {
        $doctor = Auth::user();

        if (!$doctor) {
            return response()->json([
                'status' => false,
                'message' => 'لم يتم العثور على بيانات الطبيب',
            ], 404);
        }

        $success = $this->googleMeetService->disconnectDoctor($doctor);

        if ($success) {
            return response()->json([
                'status' => true,
                'message' => 'تم فصل حساب Google بنجاح',
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'فشل في فصل حساب Google',
        ], 400);
    }
}
