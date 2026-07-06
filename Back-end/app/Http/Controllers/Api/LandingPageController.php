<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Consultation;
use App\Models\Article;
use App\Models\ConsultationReview;
use App\Models\LifeStage;
use App\Models\Faq;
use App\Models\SettingsSite;
use App\Models\Testimonial;
use App\Traits\ApiResponse;
use App\Http\Resources\ArticleResource;
use App\Utils\ImageManager;
use App\Utils\TranslationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class LandingPageController extends Controller
{
    use ApiResponse;

    protected ImageManager $imageManager;

    public function __construct(ImageManager $imageManager)
    {
        $this->imageManager = $imageManager;
    }

    /**
     * Get all landing page data
     * GET /api/v1/landing-page
     *
     * Cache: 15 minutes
     */
    public function index()
    {
        $data = Cache::remember('landing_page_data', 900, function () {
            return [
                'hero' => $this->getHeroData(),
                'stats' => $this->getStats(),
                'life_stages' => $this->getLifeStages(),
                'featured_doctors' => $this->getFeaturedDoctors(),
                'testimonials' => $this->getTestimonials(),
                'recent_articles' => $this->getRecentArticles(),
            ];
        });

        return $this->successResponse($data);
    }

    /**
     * Get live statistics
     * GET /api/v1/landing-page/stats
     *
     * Cache: 5 minutes
     */
    public function stats()
    {
        $stats = Cache::remember('landing_page_stats', 300, function () {
            return [
                'users' => [
                    'total' => User::where('is_active', true)->count(),
                    'today' => User::whereDate('created_at', today())->count(),
                    'this_week' => User::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                ],
                'doctors' => [
                    'total' => Doctor::whereIn('verification_status', ['approved', 'verified'])->where('is_active', true)->count(),
                    'verified' => Doctor::whereIn('verification_status', ['approved', 'verified'])->count(),
                    'available_now' => Doctor::where('is_available', true)->where('is_active', true)->count(),
                ],
                'consultations' => [
                    'total' => Consultation::where('status', 'completed')->count(),
                    'this_month' => Consultation::where('status', 'completed')
                        ->whereMonth('created_at', now()->month)
                        ->count(),
                    'completed_today' => Consultation::where('status', 'completed')
                        ->whereDate('ended_at', today())
                        ->count(),
                ],
                'articles' => [
                    'total' => Article::where('status', 'approved')->count(),
                    'total_views' => Article::where('status', 'approved')->sum('views_count'),
                ],
                'specializations' => [
                    'total' => Doctor::whereIn('verification_status', ['approved', 'verified'])
                        ->where('is_active', true)
                        ->distinct('specialization')
                        ->count('specialization'),
                ],
            ];
        });

        return $this->successResponse($stats);
    }

    /**
     * Get hero section dynamic data (images + trust indicators from DB)
     */
    protected function getHeroData(): array
    {
        $settings = SettingsSite::getSettings();

        return [
            'image_url' => $this->imageManager->getImageUrl($settings->hero_image, 'settings', 'public'),
            'video_url' => $settings->intro_video ?? null,
            'description' => $settings->small_description ?? null,
            'trust_indicators' => [
                ['key' => 'doctors', 'value' => Doctor::whereIn('verification_status', ['approved', 'verified'])->count(), 'label' => 'طبيب معتمد'],
                ['key' => 'users', 'value' => User::where('is_active', true)->count(), 'label' => 'مستخدمة'],
                ['key' => 'satisfaction', 'value' => $this->calculateSatisfactionRate() . '%', 'label' => 'نسبة الرضا'],
            ],
        ];
    }

    /**
     * Get platform statistics
     */
    protected function getStats(): array
    {
        return [
            'total_users' => User::where('is_active', true)->count(),
            'total_doctors' => Doctor::whereIn('verification_status', ['approved', 'verified'])->where('is_active', true)->count(),
            'total_consultations' => Consultation::where('status', 'completed')->count(),
            'satisfaction_rate' => $this->calculateSatisfactionRate(),
            'total_articles' => Article::where('status', 'approved')->count(),
        ];
    }

    /**
     * Calculate real satisfaction rate from consultation reviews
     * Returns percentage of reviews with rating >= 4 (out of 5)
     */
    protected function calculateSatisfactionRate(): float
    {
        $totalReviews = ConsultationReview::count();

        if ($totalReviews === 0) {
            return 0;
        }

        $satisfiedReviews = ConsultationReview::where('rating', '>=', 4)->count();

        return round(($satisfiedReviews / $totalReviews) * 100, 1);
    }

    /**
     * Get life stages
     */
    protected function getLifeStages(): array
    {
        $stages = LifeStage::all();

        return $stages->map(function ($stage) {
            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'name_ar' => TranslationHelper::lifeStage($stage->name),
                'slug' => $stage->slug,
                'icon' => TranslationHelper::lifeStageIcon($stage->name),
                'description' => $stage->description ?? $this->getStageDescription($stage->name),
                'users_count' => User::where('life_stage_id', $stage->id)->count(),
                'image_url' => $this->imageManager->getImageUrl($stage->image, 'life-stages', 'public'),
                'color' => TranslationHelper::stageColor($stage->name),
            ];
        })->toArray();
    }

    /**
     * Get featured doctors
     */
    protected function getFeaturedDoctors(): array
    {
        $doctors = Doctor::where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->orderByDesc('rating')
            ->orderByDesc('total_consultations')
            ->take(3)
            ->get();

        return $doctors->map(function ($doctor) {
            return [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'specialization' => $doctor->specialization,
                'specialization_ar' => TranslationHelper::specialization($doctor->specialization),
                'image_url' => $this->imageManager->getImageUrl($doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
                'rating' => (float) ($doctor->rating ?? 4.5),
                'total_consultations' => $doctor->total_consultations ?? 0,
                'years_of_experience' => $doctor->years_of_experience,
                'consultation_price' => (float) $doctor->consultation_price,
                'next_available' => $this->getNextAvailableSlot($doctor),
                'is_available' => $doctor->is_available,
            ];
        })->toArray();
    }

    /**
     * Get testimonials
     */
    protected function getTestimonials(): array
    {
        // Try to get from testimonials table if exists
        if (class_exists(Testimonial::class)) {
            try {
                $testimonials = Testimonial::where('is_active', true)
                    ->orderByDesc('created_at')
                    ->take(8)
                    ->get();

                if ($testimonials->count() > 0) {
                    return $testimonials->map(function ($t) {
                        return [
                            'id' => $t->id,
                            'patient_name' => $t->patient_name,
                            'patient_image' => $this->imageManager->getImageUrl($t->patient_image, 'profiles', 'uploads'),
                            'rating' => $t->rating,
                            'comment' => $t->comment,
                            'life_stage' => $t->life_stage,
                            'date' => $t->created_at->format('Y-m-d'),
                        ];
                    })->toArray();
                }
            } catch (\Exception $e) {
                // Table doesn't exist, use default
            }
        }

        // Default testimonials
        return [
            [
                'id' => 1,
                'patient_name' => 'مريم أحمد',
                'patient_image' => null,
                'rating' => 5,
                'comment' => 'تجربة رائعة! الأطباء محترفون والمنصة سهلة الاستخدام. أنصح بها كل أم حامل.',
                'life_stage' => 'motherhood',
                'date' => now()->subDays(5)->format('Y-m-d'),
            ],
            [
                'id' => 2,
                'patient_name' => 'فاطمة محمود',
                'patient_image' => null,
                'rating' => 5,
                'comment' => 'متابعة الحمل أصبحت أسهل بكثير مع وداد. أحب ميزة تتبع تطور الجنين الأسبوعي.',
                'life_stage' => 'motherhood',
                'date' => now()->subDays(10)->format('Y-m-d'),
            ],
            [
                'id' => 3,
                'patient_name' => 'سارة علي',
                'patient_image' => null,
                'rating' => 4,
                'comment' => 'حجز الاستشارات سهل جداً والأطباء متعاونون. شكراً وداد!',
                'life_stage' => 'married-life',
                'date' => now()->subDays(15)->format('Y-m-d'),
            ],
            [
                'id' => 4,
                'patient_name' => 'نور حسن',
                'patient_image' => null,
                'rating' => 5,
                'comment' => 'المقالات الطبية مفيدة جداً ومكتوبة بأسلوب سهل الفهم.',
                'life_stage' => 'pre-marriage',
                'date' => now()->subDays(20)->format('Y-m-d'),
            ],
        ];
    }

    /**
     * Get recent articles
     */
    protected function getRecentArticles(): array
    {
        $articles = Article::where('status', 'approved')
            ->with(['doctor', 'lifeStage'])
            ->orderByDesc('published_at')
            ->take(3)
            ->get();

        return ArticleResource::collection($articles)->resolve();
    }

    /**
     * Get FAQs for landing page (mini version)
     * GET /api/v1/landing-page/faqs
     */
    public function faqs()
    {
        $faqs = Faq::where('is_active', true)
            ->whereNull('life_stage_id')
            ->orderBy('order')
            ->take(5)
            ->get();

        return $this->successResponse([
            'faqs' => $faqs->map(fn($faq) => [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
            ]),
        ]);
    }

    /**
     * Get detailed life stage information
     * GET /api/v1/landing-page/life-stages/{slug}
     */
    public function lifeStageDetails(string $slug)
    {
        $stage = LifeStage::where('slug', $slug)
            ->orWhere('name', $slug)
            ->first();

        if (!$stage) {
            return $this->errorResponse('المرحلة غير موجودة', 404);
        }

        $data = Cache::remember("life_stage_{$slug}", 900, function () use ($stage) {
            return [
                'stage' => [
                    'id' => $stage->id,
                    'name' => $stage->name,
                    'name_ar' => TranslationHelper::lifeStage($stage->name),
                    'slug' => $stage->slug,
                    'icon' => TranslationHelper::lifeStageIcon($stage->name),
                    'description' => $stage->description ?? $this->getStageDescription($stage->name),
                    'long_description' => $this->getStageLongDescription($stage->name),
                    'image_url' => $this->imageManager->getImageUrl($stage->image, 'life-stages', 'public'),
                    'color' => TranslationHelper::stageColor($stage->name),
                    'users_count' => User::where('life_stage_id', $stage->id)->count(),
                ],
                'features' => $this->getStageFeatures($stage->name),
                'doctors' => $this->getStageDoctors($stage),
                'articles' => $this->getStageArticles($stage),
                'faqs' => $this->getStageFaqs($stage),
                'testimonials' => $this->getStageTestimonials($stage->name),
                'stats' => [
                    'doctors_count' => Doctor::where('is_active', true)
                        ->whereIn('verification_status', ['approved', 'verified'])
                        ->whereHas('lifeStages', fn($q) => $q->where('life_stages.id', $stage->id))
                        ->count(),
                    'articles_count' => Article::where('status', 'approved')
                        ->where('life_stage_id', $stage->id)
                        ->count(),
                    'users_count' => User::where('life_stage_id', $stage->id)->count(),
                ],
                'cta' => [
                    'title' => 'ابدأي رحلتك في ' . TranslationHelper::lifeStage($stage->name),
                    'button_text' => 'سجلي الآن مجاناً',
                    'button_link' => '/register?stage=' . $stage->slug,
                ],
            ];
        });

        return $this->successResponse($data);
    }

    /**
     * Get long description for stage
     */
    protected function getStageLongDescription(string $name): string
    {
        $descriptions = [
            'pre-marriage' => 'في مرحلة ما قبل الزواج، نقدم لك معلومات شاملة عن الصحة الإنجابية، الفحوصات الضرورية قبل الزواج، ونصائح للاستعداد النفسي والجسدي لحياة زوجية سعيدة.',
            'married-life' => 'في مرحلة الحياة الزوجية، نساعدك على التخطيط للأسرة، فهم دورتك الشهرية، ونقدم لك استشارات متخصصة للحفاظ على صحتك وسعادتك الزوجية.',
            'motherhood' => 'رحلة الحمل والأمومة معنا تكون أسهل وأكثر أماناً. نقدم لك متابعة أسبوعية لتطور الجنين، نصائح التغذية، والتمارين المناسبة، بالإضافة لدعم شامل للعناية بطفلك.',
        ];

        return $descriptions[$name] ?? 'محتوى شامل ومتخصص لمرحلتك الحياتية مع دعم من أفضل الأطباء المتخصصين.';
    }

    /**
     * Get features for stage
     */
    protected function getStageFeatures(string $name): array
    {
        $features = [
            'pre-marriage' => [
                ['icon' => '🩺', 'title' => 'فحوصات ما قبل الزواج', 'description' => 'قائمة الفحوصات الضرورية'],
                ['icon' => '📚', 'title' => 'التثقيف الصحي', 'description' => 'معلومات عن الصحة الإنجابية'],
                ['icon' => '💬', 'title' => 'استشارات متخصصة', 'description' => 'تحدثي مع طبيبة متخصصة'],
                ['icon' => '🧘', 'title' => 'الاستعداد النفسي', 'description' => 'نصائح للتحضير للزواج'],
            ],
            'married-life' => [
                ['icon' => '💍', 'title' => 'التخطيط للحمل', 'description' => 'نصائح ومتابعة للخصوبة'],
                ['icon' => '🍎', 'title' => 'الصحة الإنجابية', 'description' => 'استشارات طبية دورية'],
                ['icon' => '💬', 'title' => 'استشارات زوجية', 'description' => 'دعم لحياة زوجية مستقرة'],
                ['icon' => '📅', 'title' => 'تتبع الدورة', 'description' => 'أدوات ذكية لتتبع الدورة'],
            ],
            'motherhood' => [
                ['icon' => '📅', 'title' => 'متابعة أسبوعية', 'description' => 'تتبعي حملك أسبوعياً'],
                ['icon' => '👶', 'title' => 'رعاية الطفل', 'description' => 'كل ما يخص طفلك وتربيته'],
                ['icon' => '🤖', 'title' => 'تنبؤات AI', 'description' => 'كشف مبكر للمخاطر'],
                ['icon' => '👩‍⚕️', 'title' => 'استشارات فورية', 'description' => 'تواصلي مع طبيبك بسهولة'],
            ],
        ];

        return $features[$name] ?? [
            ['icon' => '👩‍⚕️', 'title' => 'استشارات متخصصة', 'description' => 'أطباء معتمدون'],
            ['icon' => '📚', 'title' => 'مقالات موثوقة', 'description' => 'محتوى طبي مراجع'],
            ['icon' => '📊', 'title' => 'أدوات التتبع', 'description' => 'تابعي صحتك بسهولة'],
            ['icon' => '🔒', 'title' => 'خصوصية تامة', 'description' => 'بياناتك محمية'],
        ];
    }

    /**
     * Get doctors for stage
     */
    protected function getStageDoctors($stage): array
    {
        $doctors = Doctor::where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->whereHas('lifeStages', fn($q) => $q->where('life_stages.id', $stage->id))
            ->orderByDesc('rating')
            ->take(4)
            ->get();

        // If no specific doctors, get general ones
        if ($doctors->isEmpty()) {
            $doctors = Doctor::where('is_active', true)
                ->where('verification_status', 'verified')
                ->orderByDesc('rating')
                ->take(4)
                ->get();
        }

        return $doctors->map(function ($doctor) {
            return [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'specialization_ar' => TranslationHelper::specialization($doctor->specialization),
                'image_url' => $this->imageManager->getImageUrl($doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
                'rating' => (float) ($doctor->rating ?? 4.5),
                'total_consultations' => $doctor->total_consultations ?? 0,
                'consultation_price' => (float) $doctor->consultation_price,
            ];
        })->toArray();
    }

    /**
     * Get articles for stage
     */
    protected function getStageArticles($stage): array
    {
        $articles = Article::where('status', 'approved')
            ->where('life_stage_id', $stage->id)
            ->with(['doctor', 'lifeStage'])
            ->orderByDesc('published_at')
            ->take(6)
            ->get();

        return ArticleResource::collection($articles)->resolve();
    }

    /**
     * Get FAQs for stage
     */
    protected function getStageFaqs($stage): array
    {
        $faqs = Faq::where('is_active', true)
            ->where('life_stage_id', $stage->id)
            ->orderBy('order')
            ->take(5)
            ->get();

        return $faqs->map(fn($faq) => [
            'id' => $faq->id,
            'question' => $faq->question,
            'answer' => $faq->answer,
        ])->toArray();
    }

    /**
     * Get testimonials for stage
     */
    protected function getStageTestimonials(string $stageName): array
    {
        if (class_exists(Testimonial::class)) {
            try {
                $testimonials = Testimonial::where('is_active', true)
                    ->where('life_stage', $stageName)
                    ->orderByDesc('created_at')
                    ->take(3)
                    ->get();

                if ($testimonials->count() > 0) {
                    return $testimonials->map(function ($t) {
                        return [
                            'id' => $t->id,
                            'patient_name' => $t->patient_name,
                            'rating' => $t->rating,
                            'comment' => $t->comment,
                        ];
                    })->toArray();
                }
            } catch (\Exception $e) {
                // Table doesn't exist
            }
        }

        return [];
    }

    /**
     * Get all doctors (public)
     * GET /api/v1/landing-page/doctors
     */
    public function allDoctors(Request $request)
    {
        $query = Doctor::where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified']);

        // Filter by specialization
        if ($request->has('specialization')) {
            $query->where('specialization', $request->specialization);
        }

        // Filter by life stage
        if ($request->has('life_stage_id')) {
            $query->whereHas('lifeStages', fn($q) => $q->where('life_stages.id', $request->life_stage_id));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('bio', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->get('sort', 'rating');
        match ($sortBy) {
            'rating' => $query->orderByDesc('rating'),
            'consultations' => $query->orderByDesc('total_consultations'),
            'price_low' => $query->orderBy('consultation_price'),
            'price_high' => $query->orderByDesc('consultation_price'),
            'experience' => $query->orderByDesc('years_of_experience'),
            default => $query->orderByDesc('rating'),
        };

        $doctors = $query->withCount([
            'reviews' => function ($q) {
                $q->where('is_published', true);
            }
        ])->paginate($request->get('per_page', 12));

        return $this->successResponse([
            'doctors' => $doctors->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialization' => $doctor->specialization,
                    'specialization_ar' => TranslationHelper::specialization($doctor->specialization),
                    'image_url' => $this->imageManager->getImageUrl($doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
                    'rating' => (float) ($doctor->rating ?? 4.5),
                    'total_consultations' => $doctor->total_consultations ?? 0,
                    'total_reviews' => $doctor->reviews_count ?? 0,
                    'years_of_experience' => $doctor->years_of_experience,
                    'consultation_price' => (float) $doctor->consultation_price,
                    'is_available' => $doctor->is_available,
                    'session_type' => $doctor->session_type ?? 'both',
                    'verification_status' => $doctor->verification_status,
                    'bio' => Str::limit($doctor->bio, 100),
                    'life_stages' => $doctor->lifeStages->map(function ($stage) {
                        return [
                            'id' => $stage->id,
                            'name' => $stage->name,
                            'name_ar' => TranslationHelper::lifeStage($stage->name),
                            'slug' => $stage->slug,
                            'color' => TranslationHelper::stageColor($stage->name),
                        ];
                    }),
                ];
            }),
            'pagination' => [
                'current_page' => $doctors->currentPage(),
                'last_page' => $doctors->lastPage(),
                'per_page' => $doctors->perPage(),
                'total' => $doctors->total(),
            ],
            'specializations' => $this->getSpecializations(),
        ]);
    }

    /**
     * Get doctor profile (public)
     * GET /api/v1/landing-page/doctors/{id}
     */
    public function doctorProfile($id)
    {
        $doctor = Doctor::where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->with(['lifeStages', 'workingHours'])
            ->find($id);

        if (!$doctor) {
            return $this->errorResponse('الطبيب غير موجود', 404);
        }

        $data = Cache::remember("public_doctor_{$id}", 600, function () use ($doctor) {
            // Get reviews — use doctor_id directly (not via consultation relationship)
            $reviews = ConsultationReview::where('doctor_id', $doctor->id)
                ->where('is_published', true)
                ->with(['patient'])
                ->orderByDesc('created_at')
                ->take(5)
                ->get();

            // Compute total_reviews from DB directly (not from cached column)
            $totalReviews = ConsultationReview::where('doctor_id', $doctor->id)
                ->where('is_published', true)
                ->count();

            // Get articles
            $articles = Article::where('doctor_id', $doctor->id)
                ->where('status', 'approved')
                ->with(['doctor', 'lifeStage'])
                ->orderByDesc('published_at')
                ->take(4)
                ->get();

            return [
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'title' => $doctor->title ?? 'طبيب',
                    'specialization' => $doctor->specialization,
                    'specialization_ar' => TranslationHelper::specialization($doctor->specialization),
                    'image_url' => $this->imageManager->getImageUrl($doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
                    'bio' => $doctor->bio,
                    'qualifications' => $doctor->qualifications,
                    'years_of_experience' => $doctor->years_of_experience,
                    'rating' => (float) ($doctor->rating ?? 4.5),
                    'total_consultations' => $doctor->total_consultations ?? 0,
                    'total_reviews' => $totalReviews,   // ← counted from DB directly
                    'consultation_price' => (float) $doctor->consultation_price,
                    'consultation_duration' => 60,
                    'is_available' => (bool) $doctor->is_available,
                    'life_stages' => $doctor->lifeStages->map(fn($s) => [
                        'id' => $s->id,
                        'name' => $s->name,
                        'name_ar' => TranslationHelper::lifeStage($s->name),
                        'slug' => $s->slug,
                    ]),
                    'working_hours' => $doctor->workingHours->groupBy('day')->map(function ($daySlots, $day) {
                        return [
                            'day' => $day,
                            'day_ar' => TranslationHelper::day($day),
                            'start_times' => $daySlots->pluck('start_time')
                                ->map(fn($t) => \Carbon\Carbon::parse($t)->format('H:i'))
                                ->values()->all(),
                        ];
                    })->values(),
                ],
                'reviews' => $reviews->map(fn($r) => [
                    'id' => $r->id,
                    'rating' => $r->rating,
                    'comment' => $r->comment,
                    'patient_name' => $r->is_anonymous
                        ? 'مريضة'
                        : ($r->patient?->name ?? 'مريضة'),
                    'date' => $r->created_at->format('Y-m-d'),
                ]),
                'articles' => ArticleResource::collection($articles)->resolve(),
                'rating_breakdown' => $this->getRatingBreakdown($doctor->id),
                'cta' => [
                    'title' => 'احجزي استشارة مع ' . $doctor->name,
                    'button_text' => 'احجزي موعدك الآن',
                    'button_link' => '/patient/consultations/book/' . $doctor->id,
                    'note' => 'سعر الاستشارة: ' . $doctor->consultation_price . ' جنيه',
                ],
            ];
        });

        return $this->successResponse($data);
    }

    /**
     * Get rating breakdown for doctor
     */
    protected function getRatingBreakdown($doctorId): array
    {
        // Fix: use doctor_id directly on consultation_reviews table
        $reviews = ConsultationReview::where('doctor_id', $doctorId)
            ->where('is_published', true)
            ->get();

        $total = $reviews->count();
        if ($total === 0)
            return ['5' => 0, '4' => 0, '3' => 0, '2' => 0, '1' => 0];

        return [
            '5' => round($reviews->where('rating', 5)->count() / $total * 100),
            '4' => round($reviews->where('rating', 4)->count() / $total * 100),
            '3' => round($reviews->where('rating', 3)->count() / $total * 100),
            '2' => round($reviews->where('rating', 2)->count() / $total * 100),
            '1' => round($reviews->where('rating', 1)->count() / $total * 100),
        ];
    }

    /**
     * Get specializations list
     */
    protected function getSpecializations(): array
    {
        return collect(TranslationHelper::allSpecializations())->map(fn($ar, $en) => [
            'value' => $en,
            'label' => $ar,
        ])->values()->toArray();
    }

    // ==================== Helper Methods ====================

    /**
     * Get stage description
     */
    protected function getStageDescription(string $name): string
    {
        $descriptions = [
            'pre-marriage' => 'استعدي للزواج بمعلومات طبية دقيقة ونصائح متخصصة',
            'married-life' => 'خططي لحياة زوجية صحية وسعيدة مع استشارات متخصصة',
            'motherhood' => 'رحلة الحمل والأمومة خطوة بخطوة مع متابعة أسبوعية شاملة ورعاية لطفلك',
        ];

        return $descriptions[$name] ?? 'محتوى مخصص لمرحلتك الحياتية';
    }

    /**
     * Get next available slot for doctor
     */
    protected function getNextAvailableSlot(Doctor $doctor): ?string
    {
        try {
            for ($i = 0; $i < 7; $i++) {
                $date = now()->addDays($i);
                $dayOfWeek = strtolower($date->format('l'));

                $workingHours = $doctor->workingHours()
                    ->where('day', $dayOfWeek)
                    ->where('is_available', true)
                    ->first();

                if ($workingHours) {
                    return $date->format('Y-m-d');
                }
            }
        } catch (\Exception $e) {
            // Working hours not set
        }

        return null;
    }

    /**
     * Get success stories for public display
     */
    public function successStories(Request $request)
    {
        $query = \App\Models\SuccessStory::active()->orderBy('order')->orderByDesc('is_featured');

        // Filter by life stage
        if ($request->has('life_stage') && $request->life_stage) {
            $query->where('life_stage', $request->life_stage);
        }

        // Featured only
        if ($request->boolean('featured_only')) {
            $query->featured();
        }

        $perPage = $request->get('per_page', 12);
        $stories = $query->paginate($perPage);

        $stageLabels = [
            'pre-marriage' => 'ما قبل الزواج',
            'married-life' => 'الحياة الزوجية',
            'motherhood' => 'الأمومة والطفولة',
        ];

        $data = $stories->getCollection()->map(function ($story) use ($stageLabels) {
            return [
                'id' => $story->id,
                'patient_name' => $story->patient_name,
                'patient_image' => $story->patient_image ? asset('storage/' . $story->patient_image) : null,
                'story' => $story->story,
                'short_story' => $story->short_story_text,
                'life_stage' => $story->life_stage,
                'life_stage_label' => $stageLabels[$story->life_stage] ?? $story->life_stage,
                'rating' => $story->rating,
                'is_featured' => $story->is_featured,
                'created_at' => $story->created_at->format('Y-m-d'),
            ];
        });

        return $this->successResponse([
            'stories' => $data,
            'pagination' => [
                'total' => $stories->total(),
                'per_page' => $stories->perPage(),
                'current_page' => $stories->currentPage(),
                'last_page' => $stories->lastPage(),
            ],
            'life_stages' => [
                ['value' => 'pre-marriage', 'label' => 'ما قبل الزواج'],
                ['value' => 'married-life', 'label' => 'الحياة الزوجية'],
                ['value' => 'motherhood', 'label' => 'الأمومة والطفولة'],
            ],
        ], 'Success stories retrieved successfully');
    }
}
