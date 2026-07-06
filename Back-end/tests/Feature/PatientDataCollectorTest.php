<?php

use App\Models\User;
use App\Models\UserProfile;
use App\Models\Pregnancy;
use App\Models\GestationalDiabetesPrediction;
use App\Models\PatientChatbotPreference;
use App\Services\Patient\PatientDataCollectorService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('PatientDataCollectorService', function () {

    it('returns empty array for public bot type', function () {
        $user = User::factory()->create();
        $service = new PatientDataCollectorService();

        config(['chatbot.patient_context_enabled' => true]);
        PatientChatbotPreference::create([
            'user_id' => $user->id,
            'data_access_enabled' => true,
        ]);

        $result = $service->collectChatbotContext($user, 'public');

        expect($result)->toBe([]);
    });

    it('returns empty array when feature flag is disabled', function () {
        $user = User::factory()->create();
        $service = new PatientDataCollectorService();

        config(['chatbot.patient_context_enabled' => false]);

        $result = $service->collectChatbotContext($user, 'pregnancy');

        expect($result)->toBe([]);
    });

    it('returns empty array when data_access_enabled is false', function () {
        $user = User::factory()->create();
        PatientChatbotPreference::create([
            'user_id' => $user->id,
            'data_access_enabled' => false,
        ]);
        $service = new PatientDataCollectorService();

        config(['chatbot.patient_context_enabled' => true]);

        $result = $service->collectChatbotContext($user, 'pregnancy');

        expect($result)->toBe([]);
    });

    it('invalidateCache clears all bot type caches', function () {
        $user = User::factory()->create();
        $prefix = config('chatbot.patient_context.cache_prefix', 'patient_chatbot_ctx');

        Cache::put("{$prefix}:{$user->id}:motherhood", ['test'], 60);
        Cache::put("{$prefix}:{$user->id}:pregnancy", ['test'], 60);

        PatientDataCollectorService::invalidateCache($user->id);

        expect(Cache::get("{$prefix}:{$user->id}:motherhood"))->toBeNull();
        expect(Cache::get("{$prefix}:{$user->id}:pregnancy"))->toBeNull();
    });

    it('predictions never include raw probabilities', function () {
        $user = User::factory()->create();
        $pregnancy = Pregnancy::create([
            'user_id' => $user->id,
            'is_active' => true,
            'last_menstrual_period' => now()->subWeeks(10), // Required field fallback
            'due_date' => now()->addWeeks(30),
        ]);
        GestationalDiabetesPrediction::create([
            'user_id' => $user->id,
            'pregnancy_id' => $pregnancy->id,
            'risk_level' => 'High Risk',
            'risk_probability' => 0.87,  // هذا الرقم يجب ألا يظهر
        ]);
        PatientChatbotPreference::create([
            'user_id' => $user->id,
            'data_access_enabled' => true,
        ]);
        $service = new PatientDataCollectorService();
        config(['chatbot.patient_context_enabled' => true]);

        $result = $service->collectChatbotContext($user->fresh(), 'pregnancy');

        // التأكد من عدم وجود probability خام
        $json = json_encode($result);
        expect($json)->not->toContain('0.87');
        expect($json)->not->toContain('probability');
    });
});
