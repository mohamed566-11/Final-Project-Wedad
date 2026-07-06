<?php

namespace App\Services;

use Google\Client;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Google\Service\Calendar\EventDateTime;
use Google\Service\Calendar\ConferenceData;
use Google\Service\Calendar\ConferenceSolutionKey;
use Google\Service\Calendar\CreateConferenceRequest;
use Google\Service\Oauth2;
use App\Models\Consultation;
use App\Models\Doctor;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class GoogleMeetService
{
    protected Client $client;
    protected ?Calendar $calendarService = null;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(url(config('services.google.redirect_uri')));
        $this->client->addScope(Calendar::CALENDAR);
        $this->client->addScope(Calendar::CALENDAR_EVENTS);
        $this->client->addScope(Oauth2::USERINFO_EMAIL);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    /**
     * Get authorization URL for doctor to connect their Google account
     */
    public function getAuthUrl(int $doctorId): string
    {
        $state = Str::random(40);
        Cache::put("google_oauth_state_{$state}", $doctorId, now()->addMinutes(10));

        $this->client->setState($state);
        return $this->client->createAuthUrl();
    }

    /**
     * Handle OAuth callback and store tokens
     */
    public function handleCallback(string $code, string $state): bool
    {
        $doctorId = Cache::pull("google_oauth_state_{$state}");

        if (!$doctorId) {
            Log::error('Invalid OAuth state');
            return false;
        }

        try {
            $token = $this->client->fetchAccessTokenWithAuthCode($code);

            if (isset($token['error'])) {
                Log::error('Google OAuth error: ' . $token['error']);
                return false;
            }

            $doctor = Doctor::find($doctorId);
            if ($doctor) {
                $this->client->setAccessToken($token);
                $oauth2 = new Oauth2($this->client);
                $googleEmail = $oauth2->userinfo->get()->email;

                $doctor->update([
                    'google_access_token' => $token['access_token'],
                    'google_refresh_token' => $token['refresh_token'] ?? null,
                    'google_token_expires_at' => Carbon::now()->addSeconds($token['expires_in']),
                    'google_email' => $googleEmail,
                ]);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Google OAuth callback error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Set up calendar service with doctor's tokens
     */
    protected function setupCalendarService(Doctor $doctor): bool
    {
        if (!$doctor->google_access_token) {
            return false;
        }

        // Check if token is expired and refresh
        if ($doctor->google_token_expires_at && Carbon::parse($doctor->google_token_expires_at)->isPast()) {
            if (!$this->refreshToken($doctor)) {
                return false;
            }
        }

        $this->client->setAccessToken([
            'access_token' => $doctor->google_access_token,
            'refresh_token' => $doctor->google_refresh_token,
            'expires_in' => Carbon::parse($doctor->google_token_expires_at)->diffInSeconds(now()),
        ]);

        $this->calendarService = new Calendar($this->client);
        return true;
    }

    /**
     * Refresh expired token
     */
    protected function refreshToken(Doctor $doctor): bool
    {
        if (!$doctor->google_refresh_token) {
            return false;
        }

        try {
            $this->client->fetchAccessTokenWithRefreshToken($doctor->google_refresh_token);
            $token = $this->client->getAccessToken();

            $doctor->update([
                'google_access_token' => $token['access_token'],
                'google_token_expires_at' => Carbon::now()->addSeconds($token['expires_in']),
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Token refresh failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Create a Google Meet meeting for a consultation
     */
    public function createMeeting(Consultation $consultation): array
    {
        $doctor = $consultation->doctor;

        if (!$this->setupCalendarService($doctor)) {
            // Fallback for development if not connected
            if (config('app.debug')) {
                $meetId = strtolower(Str::random(12));
                // We use Jitsi for development mocks because it allows any URL to work instantly
                $meetLink = "https://meet.jit.si/widad-" . $meetId;

                $consultation->update([
                    'google_meet_link' => $meetLink,
                    'google_meet_id' => $meetId,
                ]);

                return [
                    'success' => true,
                    'meet_link' => $meetLink,
                    'is_mock' => true
                ];
            }

            return [
                'success' => false,
                'error' => 'الطبيب غير متصل بحساب Google',
                'needs_auth' => true,
            ];
        }

        try {
            $patient = $consultation->patient;
            // Format date to Y-m-d to avoid double time specification if date is a Carbon object
            $dateString = $consultation->date instanceof \Carbon\Carbon
                ? $consultation->date->format('Y-m-d')
                : Carbon::parse($consultation->date)->format('Y-m-d');

            $startDateTime = Carbon::parse($dateString . ' ' . $consultation->time);
            $endDateTime = $startDateTime->copy()->addMinutes($consultation->duration_minutes ?? 30);

            // Create event with Google Meet conference
            $event = new Event([
                'summary' => "استشارة طبية - {$patient->name}",
                'description' => $this->buildEventDescription($consultation),
                'start' => new EventDateTime([
                    'dateTime' => $startDateTime->toRfc3339String(),
                    'timeZone' => 'Africa/Cairo',
                ]),
                'end' => new EventDateTime([
                    'dateTime' => $endDateTime->toRfc3339String(),
                    'timeZone' => 'Africa/Cairo',
                ]),
                'attendees' => [
                    ['email' => $patient->email, 'displayName' => $patient->name],
                ],
                'conferenceData' => new ConferenceData([
                    'createRequest' => new CreateConferenceRequest([
                        'requestId' => Str::uuid()->toString(),
                        'conferenceSolutionKey' => new ConferenceSolutionKey([
                            'type' => 'hangoutsMeet',
                        ]),
                    ]),
                ]),
                'reminders' => [
                    'useDefault' => false,
                    'overrides' => [
                        ['method' => 'email', 'minutes' => 60],
                        ['method' => 'popup', 'minutes' => 15],
                    ],
                ],
            ]);

            $createdEvent = $this->calendarService->events->insert(
                'primary',
                $event,
                ['conferenceDataVersion' => 1, 'sendUpdates' => 'all']
            );

            // Extract Meet link
            $meetLink = $createdEvent->getHangoutLink();
            $conferenceData = $createdEvent->getConferenceData();
            $meetId = null;

            if ($conferenceData && $conferenceData->getConferenceId()) {
                $meetId = $conferenceData->getConferenceId();
            }

            // Update consultation with meeting details
            $consultation->update([
                'google_event_id' => $createdEvent->getId(),
                'google_meet_link' => $meetLink,
                'google_meet_id' => $meetId,
            ]);

            Log::info("Google Meet created for consultation #{$consultation->id}: {$meetLink}");

            return [
                'success' => true,
                'meet_link' => $meetLink,
                'meet_id' => $meetId,
                'event_id' => $createdEvent->getId(),
                'start_time' => $startDateTime->toIso8601String(),
                'end_time' => $endDateTime->toIso8601String(),
            ];

        } catch (\Exception $e) {
            Log::error('Failed to create Google Meet: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'فشل في إنشاء رابط الاجتماع: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Build event description
     */
    protected function buildEventDescription(Consultation $consultation): string
    {
        $patient = $consultation->patient;
        $doctor = $consultation->doctor;

        $description = "📋 تفاصيل الاستشارة\n";
        $description .= "━━━━━━━━━━━━━━━━━━━━━━\n\n";
        $description .= "👨‍⚕️ الطبيب: د. {$doctor->name}\n";
        $description .= "📌 التخصص: {$doctor->specialization_ar}\n\n";
        $description .= "👤 المريض: {$patient->name}\n";

        if ($consultation->patient_notes) {
            $description .= "\n📝 ملاحظات المريض:\n{$consultation->patient_notes}\n";
        }

        $description .= "\n━━━━━━━━━━━━━━━━━━━━━━\n";
        $description .= "🏥 منصة وداد الصحية\n";
        $description .= config('app.url');

        return $description;
    }

    /**
     * Cancel/delete a meeting
     */
    public function cancelMeeting(Consultation $consultation): bool
    {
        if (!$consultation->google_event_id) {
            return true;
        }

        $doctor = $consultation->doctor;

        if (!$this->setupCalendarService($doctor)) {
            return false;
        }

        try {
            $this->calendarService->events->delete('primary', $consultation->google_event_id, [
                'sendUpdates' => 'all',
            ]);

            $consultation->update([
                'google_event_id' => null,
                'google_meet_link' => null,
                'google_meet_id' => null,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to cancel Google Meet: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Reschedule a meeting
     */
    public function rescheduleMeeting(Consultation $consultation, string $newDate, string $newTime): array
    {
        if (!$consultation->google_event_id) {
            // Create new meeting if none exists
            return $this->createMeeting($consultation);
        }

        $doctor = $consultation->doctor;

        if (!$this->setupCalendarService($doctor)) {
            return [
                'success' => false,
                'error' => 'الطبيب غير متصل بحساب Google',
            ];
        }

        try {
            $startDateTime = Carbon::parse($newDate . ' ' . $newTime);
            $endDateTime = $startDateTime->copy()->addMinutes($consultation->duration_minutes ?? 30);

            $event = $this->calendarService->events->get('primary', $consultation->google_event_id);

            $event->setStart(new EventDateTime([
                'dateTime' => $startDateTime->toRfc3339String(),
                'timeZone' => 'Africa/Cairo',
            ]));

            $event->setEnd(new EventDateTime([
                'dateTime' => $endDateTime->toRfc3339String(),
                'timeZone' => 'Africa/Cairo',
            ]));

            $updatedEvent = $this->calendarService->events->update(
                'primary',
                $consultation->google_event_id,
                $event,
                ['sendUpdates' => 'all']
            );

            return [
                'success' => true,
                'meet_link' => $updatedEvent->getHangoutLink(),
                'event_id' => $updatedEvent->getId(),
            ];

        } catch (\Exception $e) {
            Log::error('Failed to reschedule Google Meet: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'فشل في إعادة جدولة الاجتماع',
            ];
        }
    }

    /**
     * Check if doctor has connected Google account
     */
    public function isDoctorConnected(Doctor $doctor): bool
    {
        return !empty($doctor->google_access_token);
    }

    /**
     * Disconnect doctor's Google account
     */
    public function disconnectDoctor(Doctor $doctor): bool
    {
        try {
            if ($doctor->google_access_token) {
                $this->client->revokeToken($doctor->google_access_token);
            }

            $doctor->update([
                'google_access_token' => null,
                'google_refresh_token' => null,
                'google_token_expires_at' => null,
                'google_email' => null,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to disconnect Google: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get meeting info
     */
    public function getMeetingInfo(Consultation $consultation): ?array
    {
        if (!$consultation->google_meet_link) {
            return null;
        }

        return [
            'meet_link' => $consultation->google_meet_link,
            'meet_id' => $consultation->google_meet_id,
            'event_id' => $consultation->google_event_id,
            'can_join' => $this->canJoinMeeting($consultation),
        ];
    }

    /**
     * Check if meeting can be joined (within time window)
     */
    public function canJoinMeeting(Consultation $consultation): bool
    {
        if (!$consultation->google_meet_link) {
            return false;
        }

        $startTime = Carbon::parse($consultation->date . ' ' . $consultation->time);
        $endTime = $startTime->copy()->addMinutes($consultation->duration_minutes ?? 30);
        $now = Carbon::now();

        // Can join 10 minutes before and until end time
        $joinWindowStart = $startTime->copy()->subMinutes(10);

        return $now->between($joinWindowStart, $endTime);
    }
}
