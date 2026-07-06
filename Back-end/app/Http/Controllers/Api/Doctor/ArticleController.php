<?php

namespace App\Http\Controllers\Api\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArticleRequest;
use App\Http\Requests\UpdateArticleRequest;
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
     * Get doctor's articles
     * GET /api/v1/doctor/articles
     */
    public function index(Request $request)
    {
        $doctor = $request->user();

        $query = Article::where('doctor_id', $doctor->id)
            ->with(['lifeStage']);

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'draft') {
                $query->whereIn('status', ['draft', 'archived']);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Filter by life stage
        if ($request->filled('life_stage_id')) {
            $query->where('life_stage_id', $request->life_stage_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $articles = $query->orderByDesc('created_at')->paginate(10);

        // Get stats
        $stats = $this->articleService->getDoctorArticlesStats($doctor);

        return $this->successResponse([
            'articles' => ArticleResource::collection($articles),
            'stats' => $stats,
            'pagination' => [
                'total' => $articles->total(),
                'per_page' => $articles->perPage(),
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
            ],
        ]);
    }

    /**
     * Create a new article
     * POST /api/v1/doctor/articles
     */
    public function store(StoreArticleRequest $request)
    {
        $doctor = $request->user();

        $result = $this->articleService->createArticle(
            $request->validated(),
            $doctor
        );

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }

        return $this->successResponse(
            ['article' => new ArticleResource($result['article'])],
            'تم إنشاء المقال بنجاح',
            201
        );
    }

    /**
     * Get a specific article
     * GET /api/v1/doctor/articles/{id}
     */
    public function show(Request $request, $id)
    {
        $doctor = $request->user();

        $article = Article::where('doctor_id', $doctor->id)
            ->with(['lifeStage', 'reviewer'])
            ->find($id);

        if (!$article) {
            return $this->errorResponse('المقال غير موجود', 404);
        }

        return $this->successResponse([
            'article' => new ArticleResource($article),
        ]);
    }

    /**
     * Update an article
     * PUT /api/v1/doctor/articles/{id}
     */
    public function update(UpdateArticleRequest $request, $id)
    {
        $doctor = $request->user();

        $article = Article::where('doctor_id', $doctor->id)->find($id);

        if (!$article) {
            return $this->errorResponse('المقال غير موجود', 404);
        }

        $result = $this->articleService->updateArticle($article, $request->validated());

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }

        return $this->successResponse(
            ['article' => new ArticleResource($result['article'])],
            'تم تحديث المقال بنجاح'
        );
    }

    /**
     * Submit article for review
     * PUT /api/v1/doctor/articles/{id}/submit
     */
    public function submit(Request $request, $id)
    {
        $doctor = $request->user();

        $article = Article::where('doctor_id', $doctor->id)->find($id);

        if (!$article) {
            return $this->errorResponse('المقال غير موجود', 404);
        }

        $result = $this->articleService->submitForReview($article);

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }

        return $this->successResponse(
            ['article' => new ArticleResource($result['article'])],
            $result['message']
        );
    }

    /**
     * Delete an article
     * DELETE /api/v1/doctor/articles/{id}
     */
    public function destroy(Request $request, $id)
    {
        $doctor = $request->user();

        $article = Article::where('doctor_id', $doctor->id)->find($id);

        if (!$article) {
            return $this->errorResponse('المقال غير موجود', 404);
        }

        $result = $this->articleService->deleteArticle($article);

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }

        return $this->successResponse(null, $result['message']);
    }
}
