<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Resources\Json\ResourceCollection;

trait ApiResponse
{
    
    protected function successResponse(mixed $data, string $message = 'Operation successful', int $code = 200): JsonResponse
    {
        $response = [
            'status' => true,
            'message' => $message,
            'data' => $data,
        ];

        // المتغير الذي سيحمل كائن الـ Paginator
        $paginator = null;

        // 1. حالة استخدام API Resource Collection
        if ($data instanceof ResourceCollection && $data->resource instanceof LengthAwarePaginator) {
            $paginator = $data->resource;
            $response['data'] = $data; // البيانات المنسقة
        } 
        // 2. حالة استخدام Paginator خام
        elseif ($data instanceof LengthAwarePaginator) {
            $paginator = $data;
            $response['data'] = $data->items();
        }

        // إذا تم العثور على Paginator، قم بإضافة التفاصيل الكاملة
        if ($paginator) {
            $response['pagination'] = [
                'meta' => [
                    'total'        => $paginator->total(),       // العدد الكلي للعناصر
                    'count'        => $paginator->count(),       // عدد العناصر في الصفحة الحالية
                    'per_page'     => $paginator->perPage(),     // عدد العناصر في كل صفحة
                    'current_page' => $paginator->currentPage(), // رقم الصفحة الحالية
                    'total_pages'  => $paginator->lastPage(),    // إجمالي عدد الصفحات
                    'from'         => $paginator->firstItem(),   // ترتيب أول عنصر في الصفحة (مثال: 11)
                    'to'           => $paginator->lastItem(),    // ترتيب آخر عنصر في الصفحة (مثال: 20)
                ],
                'links' => [
                    'first' => $paginator->url(1),
                    'last'  => $paginator->url($paginator->lastPage()),
                    'prev'  => $paginator->previousPageUrl(),
                    'next'  => $paginator->nextPageUrl(),
                ],
            ];
        }

        return response()->json($response, $code);
    }

    protected function errorResponse(string $message, int $code, mixed $errors = null): JsonResponse
    {
        return response()->json([
            'status' => false,
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }
}