<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Doctor;
use App\Models\Admin;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ArticleService
{
    protected $imageManager;
    protected NotificationService $notificationService;

    public function __construct(\App\Utils\ImageManager $imageManager, NotificationService $notificationService)
    {
        $this->imageManager = $imageManager;
        $this->notificationService = $notificationService;
    }
    /**
     * Create a new article
     */
    public function createArticle(array $data, Doctor $doctor): array
    {
        try {
            // Generate unique slug
            $slug = $this->generateUniqueSlug($data['title']);

            // Calculate reading time
            $readingTime = $this->calculateReadingTime($data['content']);

            // Handle image upload
            $imagePath = null;
            if (isset($data['image']) && $data['image']) {
                $imagePath = $this->imageManager->uploadSingleImage($data['image'], 'articles', 'uploads');
            }

            $article = Article::create([
                'doctor_id' => $doctor->id,
                'title' => $data['title'],
                'slug' => $slug,
                'excerpt' => $data['excerpt'] ?? null,
                'content' => $data['content'],
                'image' => $imagePath,
                'status' => $data['status'] ?? 'draft',
                'life_stage_id' => $data['life_stage_id'] ?? null,
                'reading_time' => $readingTime,
            ]);

            return [
                'success' => true,
                'article' => $article->load(['doctor', 'lifeStage']),
            ];
        } catch (\Exception $e) {
            Log::error('Article creation error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء المقال',
            ];
        }
    }

    /**
     * Update an article
     */
    public function updateArticle(Article $article, array $data): array
    {
        try {
            // Check if can edit
            if (!in_array($article->status, ['draft', 'rejected'])) {
                // If approved article is edited, change status to pending
                if ($article->status === 'approved') {
                    $data['status'] = 'pending_review';
                    $data['published_at'] = null;
                } else {
                    return [
                        'success' => false,
                        'message' => 'لا يمكن تعديل هذا المقال في حالته الحالية',
                    ];
                }
            }

            // Update slug if title changed
            if (isset($data['title']) && $data['title'] !== $article->title) {
                $data['slug'] = $this->generateUniqueSlug($data['title'], $article->id);
            }

            // Recalculate reading time if content changed
            if (isset($data['content'])) {
                $data['reading_time'] = $this->calculateReadingTime($data['content']);
            }

            // Handle image upload
            if (isset($data['image']) && $data['image']) {
                // Delete old image
                if ($article->image) {
                    $this->imageManager->deleteImage($article->image, 'uploads');
                }
                $newImageName = $this->imageManager->uploadSingleImage($data['image'], 'articles', 'uploads');
                $data['image'] = $newImageName;
            }

            $article->update($data);

            return [
                'success' => true,
                'article' => $article->fresh()->load(['doctor', 'lifeStage']),
            ];
        } catch (\Exception $e) {
            Log::error('Article update error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث المقال',
            ];
        }
    }

    /**
     * Submit article for review
     */
    public function submitForReview(Article $article): array
    {
        if (!in_array($article->status, ['draft', 'rejected'])) {
            return [
                'success' => false,
                'message' => 'لا يمكن تقديم هذا المقال للمراجعة',
            ];
        }

        // Validate article has required fields
        if (empty($article->title) || empty($article->content) || strlen($article->content) < 100) {
            return [
                'success' => false,
                'message' => 'يجب أن يحتوي المقال على عنوان ومحتوى كافٍ (100 حرف على الأقل)',
            ];
        }

        $article->update([
            'status' => 'pending_review',
            'admin_notes' => null,
        ]);

        // Notify doctor that article was submitted
        $this->notificationService->notifyArticleSubmitted($article);

        return [
            'success' => true,
            'article' => $article->fresh(),
            'message' => 'تم تقديم المقال للمراجعة بنجاح',
        ];
    }

    /**
     * Approve an article (Admin)
     */
    public function approveArticle(Article $article, Admin $admin, array $data = []): array
    {
        if ($article->status !== 'pending_review') {
            return [
                'success' => false,
                'message' => 'هذا المقال ليس في حالة انتظار المراجعة',
            ];
        }

        $publishAt = isset($data['published_at'])
            ? Carbon::parse($data['published_at'])
            : now();

        $article->update([
            'status' => 'approved',
            'published_at' => $publishAt,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'admin_notes' => null,
        ]);

        // Notify doctor that article was approved
        $this->notificationService->notifyArticleApproved($article->doctor, $article);

        return [
            'success' => true,
            'article' => $article->fresh()->load(['doctor', 'reviewer']),
            'message' => 'تمت الموافقة على المقال بنجاح',
        ];
    }

    /**
     * Reject an article (Admin)
     */
    public function rejectArticle(Article $article, Admin $admin, string $reason): array
    {
        if ($article->status !== 'pending_review') {
            return [
                'success' => false,
                'message' => 'هذا المقال ليس في حالة انتظار المراجعة',
            ];
        }

        $article->update([
            'status' => 'rejected',
            'admin_notes' => $reason,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        // Notify doctor with rejection reason
        $this->notificationService->notifyArticleRejected($article->doctor, $article, $reason);

        return [
            'success' => true,
            'article' => $article->fresh(),
            'message' => 'تم رفض المقال',
        ];
    }

    /**
     * Archive an article (Admin)
     */
    public function archiveArticle(Article $article): array
    {
        $article->update(['status' => 'archived']);

        return [
            'success' => true,
            'message' => 'تم أرشفة المقال بنجاح',
        ];
    }

    /**
     * Restore archived article
     */
    public function restoreArticle(Article $article): array
    {
        if ($article->status !== 'archived') {
            return [
                'success' => false,
                'message' => 'هذا المقال ليس مؤرشفاً',
            ];
        }

        $article->update(['status' => 'draft']);

        return [
            'success' => true,
            'message' => 'تم استعادة المقال بنجاح',
        ];
    }

    /**
     * Delete article (soft delete)
     */
    public function deleteArticle(Article $article): array
    {
        if (!in_array($article->status, ['draft', 'rejected'])) {
            return [
                'success' => false,
                'message' => 'لا يمكن حذف المقالات المنشورة أو قيد المراجعة',
            ];
        }

        // Delete image
        if ($article->image) {
            $this->imageManager->deleteImage($article->image, 'uploads');
        }

        $article->delete();

        return [
            'success' => true,
            'message' => 'تم حذف المقال بنجاح',
        ];
    }

    /**
     * Force delete article (Admin only)
     */
    public function forceDeleteArticle(Article $article): array
    {
        // Delete image
        if ($article->image) {
            $this->imageManager->deleteImage($article->image, 'uploads');
        }

        $article->forceDelete();

        return [
            'success' => true,
            'message' => 'تم حذف المقال نهائياً',
        ];
    }

    /**
     * Get public articles with filters
     */
    public function getPublicArticles(array $filters = [])
    {
        $query = Article::where('status', 'approved')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->with(['doctor', 'lifeStage']);

        // Filter by life stage
        if (!empty($filters['life_stage_id'])) {
            $query->where('life_stage_id', $filters['life_stage_id']);
        }

        // Filter by doctor
        if (!empty($filters['doctor_id'])) {
            $query->where('doctor_id', $filters['doctor_id']);
        }

        // Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'latest';
        switch ($sortBy) {
            case 'popular':
                $query->orderByDesc('views_count');
                break;
            case 'reading_time':
                $query->orderBy('reading_time');
                break;
            case 'latest':
            default:
                $query->orderByDesc('published_at');
                break;
        }

        $perPage = $filters['per_page'] ?? 12;

        return $query->paginate($perPage);
    }

    /**
     * Get featured articles (most viewed this month)
     */
    public function getFeaturedArticles(int $limit = 3)
    {
        return Article::where('status', 'approved')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->whereBetween('published_at', [
                now()->startOfMonth(),
                now()->endOfMonth()
            ])
            ->orderByDesc('views_count')
            ->limit($limit)
            ->with(['doctor', 'lifeStage'])
            ->get();
    }

    /**
     * Get related articles
     */
    public function getRelatedArticles(Article $article, int $limit = 3)
    {
        return Article::where('status', 'approved')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where('id', '!=', $article->id)
            ->where(function ($query) use ($article) {
                // Same life stage
                if ($article->life_stage_id) {
                    $query->where('life_stage_id', $article->life_stage_id);
                }
            })
            ->orderByDesc('views_count')
            ->limit($limit)
            ->with(['doctor'])
            ->get();
    }



    /**
     * Get doctor's articles stats
     */
    public function getDoctorArticlesStats(Doctor $doctor): array
    {
        $stats = $doctor->articles()->selectRaw("
            count(*) as total,
            sum(case when status = 'draft' then 1 else 0 end) as draft,
            sum(case when status = 'pending_review' then 1 else 0 end) as pending_review,
            sum(case when status = 'approved' then 1 else 0 end) as approved,
            sum(case when status = 'rejected' then 1 else 0 end) as rejected,
            sum(case when status = 'archived' then 1 else 0 end) as archived,
            sum(views_count) as total_views
        ")->first();

        return [
            'total' => (int) ($stats->total ?? 0),
            'draft' => (int) ($stats->draft ?? 0),
            'pending_review' => (int) ($stats->pending_review ?? 0),
            'approved' => (int) ($stats->approved ?? 0),
            'rejected' => (int) ($stats->rejected ?? 0),
            'archived' => (int) ($stats->archived ?? 0),
            'total_views' => (int) ($stats->total_views ?? 0),
        ];
    }

    /**
     * Get admin articles stats
     */
    public function getAdminArticlesStats(): array
    {
        $stats = Article::selectRaw("
            count(*) as total,
            sum(case when status = 'pending_review' then 1 else 0 end) as pending_review,
            sum(case when status = 'approved' then 1 else 0 end) as approved,
            sum(case when status = 'rejected' then 1 else 0 end) as rejected,
            sum(case when status = 'draft' then 1 else 0 end) as draft,
            sum(case when status = 'archived' then 1 else 0 end) as archived
        ")->first();

        return [
            'total' => (int) ($stats->total ?? 0),
            'pending_review' => (int) ($stats->pending_review ?? 0),
            'approved' => (int) ($stats->approved ?? 0),
            'rejected' => (int) ($stats->rejected ?? 0),
            'draft' => (int) ($stats->draft ?? 0),
            'archived' => (int) ($stats->archived ?? 0),
        ];
    }

    /**
     * Generate unique slug
     */
    protected function generateUniqueSlug(string $title, ?int $excludeId = null): string
    {
        $slug = Str::slug($title);

        // Handle Arabic text
        if (empty($slug)) {
            $slug = preg_replace('/\s+/', '-', trim($title));
            $slug = preg_replace('/[^\p{L}\p{N}\-]/u', '', $slug);
        }

        $count = 1;
        $originalSlug = $slug;

        while (true) {
            $query = Article::where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }

            if (!$query->exists()) {
                break;
            }

            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        return $slug;
    }

    /**
     * Calculate reading time in minutes
     */
    protected function calculateReadingTime(string $content): int
    {
        // Remove HTML tags
        $text = strip_tags($content);

        // Count words (for Arabic, count by spaces)
        $wordCount = str_word_count($text);
        if ($wordCount === 0) {
            // For Arabic text, count by spaces
            $wordCount = count(explode(' ', $text));
        }

        // Average reading speed: 200 words/minute
        $readingTime = ceil($wordCount / 200);

        return max(1, $readingTime);
    }


}
