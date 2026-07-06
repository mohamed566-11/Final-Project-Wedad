<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Doctor;
use App\Traits\ApiResponse;
use App\Utils\TranslationHelper;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    use ApiResponse;

    /**
     * Global search across articles and doctors
     * GET /api/v1/search
     */
    public function globalSearch(Request $request)
    {
        $query = $request->get('q');
        
        if (empty($query) || strlen($query) < 2) {
            return $this->successResponse([
                'articles' => [],
                'doctors' => [],
            ]);
        }

        $articles = $this->searchArticles($query);
        $doctors = $this->searchDoctors($query);

        return $this->successResponse([
            'results' => [
                'articles' => $articles,
                'doctors' => $doctors,
            ],
            'total' => $articles->count() + $doctors->count()
        ]);
    }

    /**
     * Doctor dashboard search
     * GET /api/v1/doctor/search
     */
    public function doctorSearch(Request $request)
    {
        $query = $request->get('q');
        $doctor = $request->user();

        if (empty($query) || strlen($query) < 2) {
            return $this->successResponse([
                'patients' => [],
                'articles' => [],
                'consultations' => [],
            ]);
        }

        // Search Patients
        $patients = $doctor->patients()
            ->where('name', 'like', "%{$query}%")
            ->take(5)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'type' => 'patient',
                'name' => $p->name,
                'image_url' => $p->image ? url('storage/' . $p->image) : null,
                'life_stage' => $p->lifeStage?->name_ar,
            ]);

        // Search Own Articles
        $ownArticles = $doctor->articles()
            ->where('title', 'like', "%{$query}%")
            ->take(5)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'type' => 'article',
                'title' => $a->title,
                'status' => $a->status,
                'slug' => $a->slug,
            ]);

        // Search Consultations (by patient name)
        $consultations = $doctor->consultations()
            ->whereHas('user', function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->with('user')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'type' => 'consultation',
                'patient_name' => $c->user->name,
                'date' => $c->date->format('Y-m-d'),
                'status' => $c->status,
            ]);

        return $this->successResponse([
            'results' => [
                'patients' => $patients,
                'articles' => $ownArticles,
                'consultations' => $consultations,
            ],
            'total' => $patients->count() + $ownArticles->count() + $consultations->count()
        ]);
    }

    private function searchArticles($query)
    {
        return Article::where('status', 'approved')
            ->where(function($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('excerpt', 'like', "%{$query}%")
                  ->orWhere('content', 'like', "%{$query}%");
            })
            ->with(['doctor', 'lifeStage'])
            ->latest('published_at')
            ->take(5)
            ->get()
            ->map(fn($article) => [
                'id' => $article->id,
                'type' => 'article',
                'title' => $article->title,
                'slug' => $article->slug,
                'excerpt' => $article->excerpt,
                'image_url' => $article->image ? url('storage/' . $article->image) : null,
                'reading_time' => $article->reading_time,
                'life_stage' => $article->lifeStage ? [
                    'name_ar' => TranslationHelper::lifeStage($article->lifeStage->name),
                    'color' => TranslationHelper::stageColor($article->lifeStage->name),
                ] : null,
            ]);
    }

    private function searchDoctors($query)
    {
        return Doctor::where('is_active', true)
            ->whereIn('verification_status', ['approved', 'verified'])
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('bio', 'like', "%{$query}%")
                  ->orWhere('specialization', 'like', "%{$query}%");
            })
            ->take(5)
            ->get()
            ->map(fn($doctor) => [
                'id' => $doctor->id,
                'type' => 'doctor',
                'name' => $doctor->name,
                'specialization_ar' => TranslationHelper::specialization($doctor->specialization),
                'image_url' => $doctor->image 
                    ? (str_starts_with($doctor->image, 'http') ? $doctor->image : url($doctor->image)) 
                    : "https://ui-avatars.com/api/?name=" . urlencode($doctor->name) . "&background=0D8ABC&color=fff&size=128",
                'rating' => (float) ($doctor->rating ?? 4.5),
                'consultation_price' => (float) $doctor->consultation_price,
            ]);
    }

}