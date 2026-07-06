<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\PatientMedicalFile;
use App\Models\Prescription;
use App\Models\Pregnancy;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PatientDashboardController extends Controller
{
    use ApiResponse;

    public function stats(Request $request)
    {
        $user = $request->user();
        
        $upcoming_appointments = Consultation::where('user_id', $user->id)
            ->where('date', '>=', Carbon::today())
            ->whereIn('status', ['pending', 'confirmed'])
            ->count();
            
        $medical_records = PatientMedicalFile::where('user_id', $user->id)->count();
        
        // Count prescriptions from consultations or direct prescriptions
        $active_prescriptions = Prescription::where('user_id', $user->id)->count();

        // Active Pregnancy Info
        $activePregnancy = Pregnancy::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        $pregnancyInfo = null;
        if ($activePregnancy) {
            $lmp = Carbon::parse($activePregnancy->last_menstrual_period);
            $daysPregnant = $lmp->diffInDays(Carbon::today());
            $currentWeek = (int) floor($daysPregnant / 7);
            $dueDate = Carbon::parse($activePregnancy->due_date);
            $daysRemaining = Carbon::today()->diffInDays($dueDate, false);

            $pregnancyInfo = [
                'is_active' => true,
                'current_week' => $currentWeek,
                'due_date' => $dueDate->format('Y-m-d'),
                'days_remaining' => $daysRemaining,
                'pregnancy_status' => $activePregnancy->pregnancy_status,
            ];
        }
        
        return $this->successResponse([
            'upcoming_appointments' => $upcoming_appointments,
            'medical_records' => $medical_records,
            'active_prescriptions' => $active_prescriptions,
            'pregnancy' => $pregnancyInfo,
        ], 'تم جلب إحصائيات لوحة التحكم بنجاح');
    }
}
