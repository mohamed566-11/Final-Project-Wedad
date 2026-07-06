<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Services\ArticleService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    use ApiResponse;

    protected ArticleService $articleService;

    public function __construct(ArticleService $articleService)
    {
        $this->articleService = $articleService;
    }

    /**
     * Get published articles (Public)
     * GET /api/v1/articles
     */
    public function index(Request $request)
    {
        $filters = [
            'life_stage_id' => $request->life_stage_id,
            'doctor_id' => $request->doctor_id,
            'tags' => $request->tags,
            'search' => $request->search,
            'sort_by' => $request->sort_by ?? 'latest',
            'per_page' => $request->per_page ?? 12,
        ];

        $articles = $this->articleService->getPublicArticles($filters);

        // Get featured articles
        $featuredArticles = $this->articleService->getFeaturedArticles(3);

        // Get recommended articles (if user is authenticated)
        $recommendedArticles = [];
        if ($request->user()) {
            $user = $request->user();
            $lifeStageId = $user->profile?->life_stage_id;

            if ($lifeStageId) {
                $recommendedArticles = Article::where('status', 'approved')
                    ->whereNotNull('published_at')
                    ->where('published_at', '<=', now())
                    ->where('life_stage_id', $lifeStageId)
                    ->orderByDesc('views_count')
                    ->limit(4)
                    ->with(['doctor'])
                    ->get();
            }
        }

        return $this->successResponse([
            'articles' => ArticleResource::collection($articles),
            'featured_articles' => ArticleResource::collection($featuredArticles),
            'recommended_for_you' => ArticleResource::collection($recommendedArticles),
            'pagination' => [
                'total' => $articles->total(),
                'per_page' => $articles->perPage(),
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
            ],
        ]);
    }

    /**
     * Get article by slug (Public)
     * GET /api/v1/articles/{slug}
     */
    public function show(Request $request, $slug)
    {
        $article = Article::where('slug', $slug)
            ->where('status', 'approved')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->with(['doctor', 'lifeStage'])
            ->first();

        if (!$article) {
            return $this->errorResponse('المقال غير موجود أو غير منشور بعد', 404);
        }

        // Increment views
        $article->incrementViews();

        // Get related articles
        $relatedArticles = $this->articleService->getRelatedArticles($article, 3);

        return $this->successResponse([
            'article' => new ArticleResource($article),
            'related_articles' => ArticleResource::collection($relatedArticles),
        ]);
    }

    /**
     * Get doctor's published articles
     * GET /api/v1/doctors/{doctorId}/articles
     */
    public function byDoctor(Request $request, $doctorId)
    {
        $articles = Article::where('doctor_id', $doctorId)
            ->where('status', 'approved')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->with(['lifeStage'])
            ->orderByDesc('published_at')
            ->paginate(12);

        return $this->successResponse([
            'articles' => ArticleResource::collection($articles),
            'pagination' => [
                'total' => $articles->total(),
                'per_page' => $articles->perPage(),
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
            ],
        ]);
    }
}
