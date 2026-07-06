<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Utils\TranslationHelper;
use Carbon\Carbon;

class ArticleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->when($this->shouldShowContent($request), $this->content),
            'image' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'articles', 'uploads', 'articles/default-article.png'),
            'image_url' => app('App\Utils\ImageManager')->getImageUrl($this->image, 'articles', 'uploads', 'articles/default-article.png'),
            'status' => $this->status,
            'status_badge' => $this->getStatusBadge(),
            'status_color' => $this->getStatusColor(),

            'life_stage' => $this->when($this->lifeStage, [
                'id' => $this->lifeStage?->id,
                'name' => $this->lifeStage?->name,
                'name_ar' => $this->getLifeStageNameAr(),
            ]),

            'views_count' => $this->views_count,
            'reading_time' => $this->reading_time,
            'reading_time_text' => $this->reading_time ? "قراءة {$this->reading_time} دقائق" : null,

            'doctor' => $this->when($this->doctor, function () use ($request) {
                return [
                    'id' => $this->doctor->id,
                    'name' => $this->doctor->name,
                    'specialization' => $this->doctor->specialization,
                    'specialization_ar' => $this->getSpecializationAr(),
                    'image' => app('App\Utils\ImageManager')->getImageUrl($this->doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
                    'image_url' => app('App\Utils\ImageManager')->getImageUrl($this->doctor->image, 'profiles', 'uploads', 'profiles/default-doctor.png'),
                    'bio' => $this->when($this->shouldShowDoctorDetails($request), $this->doctor->bio),
                    'years_of_experience' => $this->when($this->shouldShowDoctorDetails($request), $this->doctor->years_of_experience),
                    'rating' => $this->doctor->rating,
                    'total_articles' => $this->when($this->shouldShowDoctorDetails($request), fn() => $this->doctor->articles()->where('status', 'approved')->count()),
                    'total_consultations' => $this->when($this->shouldShowDoctorDetails($request), $this->doctor->total_consultations),
                ];
            }),

            'admin_notes' => $this->when($this->shouldShowAdminNotes($request), $this->admin_notes),

            'reviewer' => $this->when($this->reviewer && $this->shouldShowReviewer($request), [
                'id' => $this->reviewer?->id,
                'name' => $this->reviewer?->name,
            ]),
            'reviewed_at' => $this->reviewed_at?->format('Y-m-d H:i:s'),

            'published_at' => $this->published_at?->format('Y-m-d H:i:s'),
            'published_date' => $this->published_at?->format('Y-m-d'),
            'published_date_human' => $this->published_at ? $this->getHumanDate($this->published_at) : null,

            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get status badge text in Arabic
     */
    protected function getStatusBadge(): string
    {
        return match ($this->status) {
            'draft' => 'مسودة',
            'pending_review' => 'قيد المراجعة',
            'approved' => 'منشور',
            'rejected' => 'مرفوض',
            'archived' => 'مؤرشف',
            default => $this->status,
        };
    }

    /**
     * Get status color for UI
     */
    protected function getStatusColor(): string
    {
        return match ($this->status) {
            'draft' => 'gray',
            'pending_review' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            'archived' => 'purple',
            default => 'gray',
        };
    }

    /**
     * Get life stage name in Arabic
     */
    protected function getLifeStageNameAr(): ?string
    {
        if (!$this->lifeStage)
            return null;
        return TranslationHelper::lifeStage($this->lifeStage->name);
    }

    /**
     * Get specialization in Arabic
     */
    protected function getSpecializationAr(): ?string
    {
        if (!$this->doctor)
            return null;
        return TranslationHelper::specialization($this->doctor->specialization);
    }

    /**
     * Get human readable date
     */
    protected function getHumanDate(Carbon $date): string
    {
        // Set locale to Arabic for carbon
        Carbon::setLocale('ar');

        $diffInDays = $date->diffInDays(now());

        if ($diffInDays === 0) {
            if ($date->diffInHours(now()) < 1) {
                return 'الآن';
            }
            return 'اليوم';
        } elseif ($diffInDays === 1) {
            return 'أمس';
        } elseif ($diffInDays < 7) {
            return $date->diffForHumans();
        } elseif ($diffInDays < 30) {
            return $date->diffForHumans();
        } else {
            return $date->format('Y/m/d');
        }
    }

    /**
     * Determine if full content should be shown
     */
    protected function shouldShowContent(Request $request): bool
    {
        // Show content on detail page (when accessing single article)
        $routeName = $request->route()?->getName();
        return $routeName === 'articles.show'
            || $routeName === 'patient.articles.show'
            || $routeName === 'doctor.articles.show'
            || $routeName === 'doctor.doctor.articles.show'
            || $routeName === 'admin.articles.show'
            || $routeName === 'admin.admin.articles.show'
            || $request->has('full_content');
    }

    /**
     * Determine if doctor details should be shown
     */
    protected function shouldShowDoctorDetails(Request $request): bool
    {
        $routeName = $request->route()?->getName();
        return $routeName === 'articles.show'
            || $routeName === 'patient.articles.show';
    }

    /**
     * Determine if admin notes should be shown
     */
    protected function shouldShowAdminNotes(Request $request): bool
    {
        // Show to doctor (owner) or admin
        $user = $request->user();
        if (!$user)
            return false;

        // Admin can see all notes
        if ($user instanceof \App\Models\Admin)
            return true;

        // Doctor can see notes on their own articles
        if ($user instanceof \App\Models\Doctor && $this->doctor_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if reviewer info should be shown
     */
    protected function shouldShowReviewer(Request $request): bool
    {
        $user = $request->user();
        return $user instanceof \App\Models\Admin;
    }
}
