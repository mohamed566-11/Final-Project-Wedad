<?php

namespace App\Traits;

/**
 * OptimizedQueries Trait
 * Provides common query optimizations for models
 */
trait OptimizedQueries
{
    /**
     * Scope to select only essential columns for listings
     */
    public function scopeSelectEssentials($query, array $columns = [])
    {
        $defaults = ['id', 'name', 'created_at'];
        return $query->select(array_merge($defaults, $columns));
    }

    /**
     * Scope to paginate with reasonable defaults
     */
    public function scopeOptimizedPaginate($query, int $perPage = 15, int $maxPerPage = 50)
    {
        $requestedPerPage = request()->input('per_page', $perPage);
        $perPage = min((int) $requestedPerPage, $maxPerPage);
        
        return $query->paginate($perPage);
    }

    /**
     * Scope for date range filtering
     */
    public function scopeDateRange($query, ?string $startDate = null, ?string $endDate = null, string $column = 'created_at')
    {
        if ($startDate) {
            $query->whereDate($column, '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate($column, '<=', $endDate);
        }
        return $query;
    }
}
