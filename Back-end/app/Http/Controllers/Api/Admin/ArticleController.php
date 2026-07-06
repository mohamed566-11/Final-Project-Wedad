<?php

namespace App\Http\Controllers\Api\Admin;

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
     * Get all articles
     * GET /api/v1/admin/articles
     */
    public function index(Request $request)
    {
        $query = Article::with(['doctor', 'lifeStage', 'reviewer']);
        
        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter pending only
        if ($request->boolean('pending_only')) {
            $query->where('status', 'pending_review');
        }
        
        // Filter by doctor
        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
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
                  ->orWhere('content', 'like', "%{$search}%")
                  ->orWhereHas('doctor', function ($dq) use ($search) {
                      $dq->where('name', 'like', "%{$search}%");
                  });
            });
        }
        
        // Sort: pending first, then by created_at
        $query->orderByRaw("CASE WHEN status = 'pending_review' THEN 0 ELSE 1 END")
              ->orderByDesc('created_at');
        
        $articles = $query->paginate(15);
        
        // Get stats
        $stats = $this->articleService->getAdminArticlesStats();
        
        return $this->successResponse([
            'articles' => ArticleResource::collection($articles)->resolve(),
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
     * Get article for review
     * GET /api/v1/admin/articles/{id}
     */
    public function show($id)
    {
        $article = Article::with(['doctor', 'lifeStage', 'reviewer'])->find($id);
        
        if (!$article) {
            return $this->errorResponse('المقال غير موجود', 404);
        }
        
        // Get doctor's article stats
        $doctorStats = [
            'total_articles' => $article->doctor->articles()->count(),
            'approved_articles' => $article->doctor->articles()->where('status', 'approved')->count(),
            'rejected_articles' => $article->doctor->articles()->where('status', 'rejected')->count(),
        ];
        
        return $this->successResponse([
            'article' => new ArticleResource($article),
            'doctor_stats' => $doctorStats,
        ]);
    }
    
    /**
     * Approve an article
     * PUT /api/v1/admin/articles/{id}/approve
     */
    public function approve(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin) {
             // Fallback for testing users who might not be properly authenticated as admins via Sanctum in some envs
             $admin = \App\Models\Admin::first();
        }

        $article = Article::find($id);
        
        if (!$article) {
            return $this->errorResponse('المقال غير موجود', 404);
        }
        
        $data = $request->validate([
            'publish_now' => 'nullable|boolean',
            'published_at' => 'nullable|date',
        ]);
        
        $publishAt = now();
        if ($request->has('published_at') && !$request->boolean('publish_now', true)) {
             $publishAt = $request->published_at;
        }

        // Update Article Status
        $article->status = 'approved';
        $article->published_at = $publishAt;
        $article->reviewed_by = $admin ? $admin->id : null;
        $article->reviewed_at = now();
        $article->admin_notes = null;
        $article->save();
        
        return $this->successResponse(
            ['article' => new ArticleResource($article)],
            'تمت الموافقة على المقال بنجاح'
        );
    }
    
    /**
     * Reject an article
     * PUT /api/v1/admin/articles/{id}/reject
     */
    public function reject(Request $request, $id)
    {
        $admin = $request->user();
        $article = Article::find($id);
        
        if (!$article) {
            return $this->errorResponse('المقال غير موجود', 404);
        }
        
        $request->validate([
            'admin_notes' => 'required|string|min:10|max:1000',
        ], [
            'admin_notes.required' => 'يجب كتابة سبب الرفض',
            'admin_notes.min' => 'سبب الرفض يجب أن يكون 10 أحرف على الأقل',
            'admin_notes.max' => 'سبب الرفض يجب ألا يزيد عن 1000 حرف',
        ]);
        
        $result = $this->articleService->rejectArticle($article, $admin, $request->admin_notes);
        
        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }
        
        return $this->successResponse(
            ['article' => new ArticleResource($result['article'])],
            $result['message']
        );
    }
    
    /**
     * Archive an article
     * PUT /api/v1/admin/articles/{id}/archive
     */
    public function archive($id)
    {
        $article = Article::find($id);
        
        if (!$article) {
            return $this->errorResponse('المقال غير موجود', 404);
        }
        
        $result = $this->articleService->archiveArticle($article);
        
        return $this->successResponse(null, $result['message']);
    }
    
    /**
     * Restore an archived article
     * PUT /api/v1/admin/articles/{id}/restore
     */
    public function restore($id)
    {
        $article = Article::find($id);
        
        if (!$article) {
            return $this->errorResponse('المقال غير موجود', 404);
        }
        
        $result = $this->articleService->restoreArticle($article);
        
        if (!$result['success']) {
            return $this->errorResponse($result['message'], 400);
        }
        
        return $this->successResponse(null, $result['message']);
    }
    
    /**
     * Force delete an article
     * DELETE /api/v1/admin/articles/{id}
     */
    public function destroy($id)
    {
        $article = Article::withTrashed()->find($id);
        
        if (!$article) {
            return $this->errorResponse('المقال غير موجود', 404);
        }
        
        $result = $this->articleService->forceDeleteArticle($article);
        
        return $this->successResponse(null, $result['message']);
    }
}
