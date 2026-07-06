<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AboutUs;
use App\Models\Faq;
use App\Models\ContactUs;
use App\Models\JoinUs;
use App\Models\SettingsSite;
use App\Models\LifeStage;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Consultation;
use App\Models\Article;
use App\Http\Resources\ArticleResource;
use App\Traits\ApiResponse;
use App\Utils\TranslationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class PublicController extends Controller
{
    use ApiResponse;

    /**
     * Get About Us page content
     * GET /api/v1/about-us
     */
    public function getAboutUs()
    {
        $about = AboutUs::first();

        if (!$about) {
            return $this->errorResponse('About us content not found', 404);
        }

        // Get platform statistics
        $stats = [
            'total_users' => User::where('is_active', true)->count(),
            'total_doctors' => Doctor::where('verification_status', 'verified')->where('is_active', true)->count(),
            'total_consultations' => Consultation::where('status', 'completed')->count(),
            'satisfaction_rate' => 98, // This could be calculated from reviews
        ];

        return $this->successResponse([
            'about' => [
                'id' => $about->id,
                'title' => $about->title,
                'description' => $about->description,
                'image_url' => $about->image ? url('storage/about/' . $about->image) : null,
                'mission' => [
                    'title' => $about->mission_title ?? 'رسالتنا',
                    'description' => $about->mission_desc,
                ],
                'vision' => [
                    'title' => $about->vision_title ?? 'رؤيتنا',
                    'description' => $about->vision_desc,
                ],
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Get FAQs list
     * GET /api/v1/faqs
     */
    public function getFaqs(Request $request)
    {
        $query = Faq::where('is_active', true)->orderBy('order');

        // Filter by life stage
        if ($request->filled('life_stage_id')) {
            $query->where('life_stage_id', $request->life_stage_id);
        }

        // Search in questions and answers
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                    ->orWhere('answer', 'like', "%{$search}%");
            });
        }

        $faqs = $query->with('lifeStage')->get();

        // Group FAQs by life stage
        $groupedFaqs = [
            'general' => [],
        ];

        foreach ($faqs as $faq) {
            $faqData = [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
                'life_stage' => $faq->lifeStage ? [
                    'id' => $faq->lifeStage->id,
                    'name' => $faq->lifeStage->name,
                    'name_ar' => TranslationHelper::lifeStage($faq->lifeStage->name),
                ] : null,
                'order' => $faq->order,
            ];

            if ($faq->life_stage_id) {
                $stageKey = $faq->lifeStage->slug ?? $faq->lifeStage->name;
                if (!isset($groupedFaqs[$stageKey])) {
                    $groupedFaqs[$stageKey] = [];
                }
                $groupedFaqs[$stageKey][] = $faqData;
            } else {
                $groupedFaqs['general'][] = $faqData;
            }
        }

        return $this->successResponse([
            'faqs' => $faqs->map(fn($faq) => [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
                'life_stage' => $faq->lifeStage ? [
                    'id' => $faq->lifeStage->id,
                    'name' => $faq->lifeStage->name,
                    'name_ar' => TranslationHelper::lifeStage($faq->lifeStage->name),
                ] : null,
                'order' => $faq->order,
            ]),
            'grouped_by_life_stage' => $groupedFaqs,
        ]);
    }

    /**
     * Submit contact form
     * POST /api/v1/contact-us
     */
    public function submitContact(Request $request)
    {
        // Rate limiting: 3 messages per hour per IP
        $key = 'contact-form:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->errorResponse(
                "لقد تجاوزت الحد المسموح. يرجى المحاولة بعد " . ceil($seconds / 60) . " دقيقة.",
                429
            );
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => ['nullable', 'regex:/^01[0125][0-9]{8}$/'],
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ], [
            'name.required' => 'الاسم مطلوب',
            'email.required' => 'البريد الإلكتروني مطلوب',
            'email.email' => 'البريد الإلكتروني غير صحيح',
            'phone.regex' => 'رقم الهاتف غير صحيح',
            'subject.required' => 'الموضوع مطلوب',
            'message.required' => 'الرسالة مطلوبة',
        ]);

        $contact = ContactUs::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'subject' => $request->subject,
            'message' => $request->message,
            'ip_address' => $request->ip(),
        ]);

        RateLimiter::hit($key, 3600); // 1 hour

        return $this->successResponse([
            'message_id' => $contact->id,
            'estimated_response_time' => '24-48 hours',
        ], 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.', 201);
    }

    /**
     * Get contact information
     * GET /api/v1/contact-info
     */
    public function getContactInfo()
    {
        $settings = SettingsSite::getSettings();

        return $this->successResponse([
            'email' => $settings->email,
            'phone' => $settings->phone,
            'address' => [
                'country' => $settings->country,
                'city' => $settings->city,
                'street' => $settings->street,
            ],
            'working_hours' => 'السبت - الخميس: 9:00 - 18:00',
            'social_media' => [
                'facebook' => $settings->facebook_url,
                'twitter' => $settings->twitter_url,
                'instagram' => $settings->instagram_url,
                'youtube' => $settings->youtube_url,
            ],
        ]);
    }

    /**
     * Submit join as doctor request
     * POST /api/v1/join-us
     */
    public function submitJoinRequest(Request $request)
    {
        // Rate limiting
        $key = 'join-request:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 2)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->errorResponse(
                "لقد تجاوزت الحد المسموح. يرجى المحاولة بعد " . ceil($seconds / 60) . " دقيقة.",
                429
            );
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => ['required', 'regex:/^01[0125][0-9]{8}$/'],
            'specialty' => 'required|string|max:100',
            'license_number' => 'required|string|max:100',
            'consultation_price' => 'required|numeric|min:0',
        ], [
            'name.required' => 'الاسم مطلوب',
            'email.required' => 'البريد الإلكتروني مطلوب',
            'email.email' => 'البريد الإلكتروني غير صحيح',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.regex' => 'رقم الهاتف غير صحيح',
            'specialty.required' => 'التخصص مطلوب',
            'license_number.required' => 'رقم الترخيص مطلوب',
            'consultation_price.required' => 'سعر الاستشارة مطلوب',
            'consultation_price.numeric' => 'سعر الاستشارة يجب أن يكون رقماً',
        ]);

        // Check if email already registered as doctor
        if (Doctor::where('email', $request->email)->exists()) {
            return $this->errorResponse('هذا البريد الإلكتروني مسجل بالفعل كطبيب', 400);
        }

        // Check for duplicate application
        if (JoinUs::where('email', $request->email)->orWhere('phone', $request->phone)->exists()) {
            return $this->errorResponse('لقد قمت بتقديم طلب انضمام مسبقاً', 409);
        }

        $joinRequest = JoinUs::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'specialty' => $request->specialty,
            'license_number' => $request->license_number,
            'consultation_price' => $request->consultation_price,
            'ip_address' => $request->ip(),
            'status' => 'pending',
        ]);

        RateLimiter::hit($key, 86400); // 24 hours

        return $this->successResponse([
            'application_id' => $joinRequest->id,
            'next_steps' => [
                'سنقوم بمراجعة طلبك',
                'سنتواصل معك عبر البريد الإلكتروني',
                'سيتم طلب المستندات المطلوبة',
                'ستحصل على حساب بعد الموافقة',
            ],
        ], 'تم تقديم طلبك بنجاح! سنتواصل معك خلال 48 ساعة.', 201);
    }

    /**
     * Get public site settings
     * GET /api/v1/settings
     */
    public function getSiteSettings()
    {
        $settings = SettingsSite::getSettings();

        return $this->successResponse([
            'site_name' => $settings->name,
            'email' => $settings->email,
            'phone' => $settings->phone,
            'address' => [
                'country' => $settings->country,
                'city' => $settings->city,
                'street' => $settings->street,
            ],
            'description' => $settings->small_description,
            'logo_url' => $settings->logo ? \Illuminate\Support\Facades\Storage::disk('public')->url($settings->logo) : null,
            'favicon_url' => $settings->favicon ? \Illuminate\Support\Facades\Storage::disk('public')->url($settings->favicon) : null,
            'social_media' => [
                'facebook' => $settings->facebook_url,
                'twitter' => $settings->twitter_url,
                'instagram' => $settings->instagram_url,
                'youtube' => $settings->youtube_url,
            ],
        ]);
    }

    /**
     * Get Terms and Conditions
     * GET /api/v1/terms
     */
    public function getTerms()
    {
        $settings = SettingsSite::getSettings();

        return $this->successResponse([
            'terms' => [
                'title' => 'الشروط والأحكام',
                'content' => $settings->terms_content ?? null,
                'last_updated' => $settings->updated_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Get Privacy Policy
     * GET /api/v1/privacy
     */
    public function getPrivacy()
    {
        $settings = SettingsSite::getSettings();

        return $this->successResponse([
            'privacy' => [
                'title' => 'سياسة الخصوصية',
                'content' => $settings->privacy_content ?? null,
                'last_updated' => $settings->updated_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Get all life stages
     * GET /api/v1/life-stages
     */
    public function getLifeStages()
    {
        $lifeStages = LifeStage::all()->map(function ($stage) {
            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'name_ar' => TranslationHelper::lifeStage($stage->name),
                'slug' => $stage->slug,
                'description' => $stage->description,
                'icon' => $stage->icon,
                'stats' => [
                    'total_users' => User::where('life_stage_id', $stage->id)->count(),
                    'total_articles' => Article::where('life_stage_id', $stage->id)->where('status', 'approved')->count(),
                    'total_doctors' => $stage->doctors()->where('is_active', true)->count(),
                ],
            ];
        });

        return $this->successResponse([
            'life_stages' => $lifeStages,
        ]);
    }

    /**
     * Get single life stage details
     * GET /api/v1/life-stages/{slug}
     */
    public function getLifeStage($slug)
    {
        $stage = LifeStage::where('slug', $slug)->first();

        if (!$stage) {
            return $this->errorResponse('المرحلة الحياتية غير موجودة', 404);
        }

        // ── المقالات ──────────────────────────────────────────────────────
        $articles = Article::where('life_stage_id', $stage->id)
            ->where('status', 'approved')
            ->with(['doctor', 'lifeStage'])
            ->latest()
            ->take(6)
            ->get();

        // Fallback: لو مفيش مقالات مرتبطة بهذه المرحلة جيب أحدث 3 approved
        if ($articles->isEmpty()) {
            $articles = Article::where('status', 'approved')
                ->with(['doctor', 'lifeStage'])
                ->latest()
                ->take(3)
                ->get();
        }

        $articlesResource = ArticleResource::collection($articles)->resolve();

        // ── الأطباء ───────────────────────────────────────────────────────────
        $doctors = $stage->doctors()
            ->where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->take(6)
            ->get();

        // Fallback: لو مفيش أطباء مربوطين بالمرحلة جيب 6 أطباء عشوائياً
        if ($doctors->isEmpty()) {
            $doctors = Doctor::where('is_active', true)
                ->whereIn('verification_status', ['approved', 'verified'])
                ->inRandomOrder()
                ->take(6)
                ->get();
        }

        $mappedDoctors = $doctors->map(fn($doctor) => [
            'id'                  => $doctor->id,
            'name'                => $doctor->name,
            'specialization_ar'   => TranslationHelper::specialization($doctor->specialization),
            'rating'              => (float) ($doctor->rating ?? 4.5),
            'image_url'           => $doctor->image
                ? app('App\Utils\ImageManager')->getImageUrl($doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png')
                : url('profiles/default-doctor.png'),
            'consultation_price'  => (float) $doctor->consultation_price,
            'years_of_experience' => $doctor->years_of_experience,
            'total_consultations' => $doctor->total_consultations ?? 0,
            'is_available'        => $doctor->is_available,
        ]);
            // ]);

        // Get FAQs for this stage
        $faqs = Faq::where('life_stage_id', $stage->id)
            ->where('is_active', true)
            ->orderBy('order')
            ->take(5)
            ->get()
            ->map(fn($faq) => [
                'question' => $faq->question,
                'answer' => $faq->answer,
            ]);

        // Get features based on stage
        $features = $this->getStageFeatures($stage->name);

        return $this->successResponse([
            'life_stage' => [
                'id' => $stage->id,
                'name' => $stage->name,
                'name_ar' => TranslationHelper::lifeStage($stage->name),
                'slug' => $stage->slug,
                'description' => $stage->description,
                'icon' => $stage->icon,
                'features' => $features,
                'tools' => $this->getStageTools($stage->name),
                'related_articles' => $articlesResource,
                'available_doctors' => $mappedDoctors,
                'faqs' => $faqs,
            ],
        ]);
    }

    // Helper methods
    private function getStageFeatures($stageName): array
    {
        $features = [
            'pre-marriage' => [
                'فحوصات طبية شاملة',
                'استشارات نفسية',
                'تخطيط صحي',
                'دليل شامل للمقبلين',
            ],
            'married-life' => [
                'دعم الخصوبة',
                'متابعة الصحة الإنجابية',
                'استشارات زوجية',
                'نصائح لحياة صحية',
            ],
            'motherhood' => [
                'متابعة الحمل أسبوعياً',
                'رعاية ما بعد الولادة',
                'دليل العناية بالطفل',
                'مجتمع الأمهات',
            ],
        ];

        return $features[$stageName] ?? $features['motherhood'] ?? [];
    }

    private function getStageTools($stageName): array
    {
        $allTools = [
            'mood' => ['title' => 'متتبع المزاج', 'url' => '/trackers/mood', 'icon' => '🎭', 'description' => 'سجلي مشاعرك وحللي نمط مزاجك اليومي'],
            'weight' => ['title' => 'متتبع الوزن', 'url' => '/trackers/weight', 'icon' => '⚖️', 'description' => 'راقبي وزنك المثالي ومؤشر كتلة الجسم'],
            'period' => ['title' => 'متتبع الدورة الشهرية', 'url' => '/trackers/period', 'icon' => '📅', 'description' => 'تابعي دورتك الشهرية وأيام التبويض'],
            'fertility' => ['title' => 'متتبع الخصوبة', 'url' => '/trackers/fertility', 'icon' => '🌸', 'description' => 'حددي أيام الخصوبة العالية لزيادة فرص الحمل'],
            'pregnancy' => ['title' => 'متتبع الحمل', 'url' => '/trackers/pregnancy', 'icon' => '🤰', 'description' => 'تابعي حملك أسبوعاً بأسبوع مع نصائح مخصصة'],
        ];

        $stageToolKeys = [
            'pre-marriage' => ['mood', 'weight'],
            'married-life' => ['period', 'fertility', 'mood', 'weight'],
            'motherhood' => ['pregnancy', 'period', 'fertility', 'mood', 'weight'],
        ];

        $keys = $stageToolKeys[$stageName] ?? ['mood', 'weight'];

        return array_values(array_intersect_key($allTools, array_flip($keys)));
    }

}
