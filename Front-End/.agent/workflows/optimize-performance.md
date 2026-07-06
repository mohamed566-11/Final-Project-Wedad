---
description: Optimize the application for production performance
---

# Performance Optimization Workflow

## Quick Optimization (Development)

// turbo
1. Clear all caches:
```bash
php artisan cache:clear && php artisan config:clear && php artisan route:clear
```

## Full Production Optimization

// turbo-all
1. Run migrations (includes performance indexes):
```bash
php artisan migrate
```

2. Run the optimization command:
```bash
php artisan app:optimize
```

3. Verify optimization:
```bash
php artisan route:list --compact
```

## Cache Management

### Clear Dashboard Stats (run when data changes significantly)
```bash
php artisan app:cache-clear --stats
```

### Clear All App Cache
```bash
php artisan app:cache-clear
```

## Database Optimization Tips

1. **Indexes Added** - The migration `2026_02_04_220000_add_performance_indexes.php` adds indexes to:
   - `users`: is_active, created_at, life_stage_id
   - `doctors`: verification_status, is_active, specialization, is_available, rating
   - `consultations`: doctor_id+status, user_id+status, date+status
   - `payments`: status, created_at
   - `articles`: status, published_at
   - `contact_us`: is_read, created_at
   - `join_us`: status, specialty

2. **Query Analyzer** - Check slow queries:
```bash
php artisan db:monitor
```

## Caching Strategy

| Data Type | Cache Duration | Clear On |
|-----------|---------------|----------|
| Dashboard Stats | 5 minutes | Manual/Data change |
| Site Settings | 24 hours | Settings update |
| Life Stages | 24 hours | Rarely changes |
| FAQs | 1 hour | FAQ update |
| Doctor List | 30 minutes | Doctor update |
| Articles | 1 hour | Article publish |

## Performance Monitoring

1. Check response times in browser DevTools
2. Monitor database query count per request
3. Check cache hit rate with `php artisan cache:stats`
