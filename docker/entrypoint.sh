#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# WIDAD-TECH — Docker Entrypoint Script
# Runs before the main PHP-FPM process starts
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 WIDAD-TECH Backend — Starting up..."
echo "   Environment: ${APP_ENV:-production}"
echo "   PHP Version: $(php --version | head -1)"

# ── Wait for MySQL to be ready ────────────────────────────────
echo "⏳ Waiting for MySQL connection..."
MAX_TRIES=30
COUNT=0
until php -r "
    \$pdo = new PDO(
        'mysql:host=${DB_HOST:-mysql};port=${DB_PORT:-3306};dbname=${DB_DATABASE:-widad_production}',
        '${DB_USERNAME:-widad_user}',
        '${DB_PASSWORD:-widad_secret_2024}'
    );
    echo 'Connected!';
" 2>/dev/null; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_TRIES ]; then
        echo "❌ MySQL not available after $MAX_TRIES attempts. Exiting."
        exit 1
    fi
    echo "   Waiting for MySQL... attempt $COUNT/$MAX_TRIES"
    sleep 2
done
echo "✅ MySQL connected!"

# ── Wait for Redis to be ready ────────────────────────────────
echo "⏳ Waiting for Redis connection..."
COUNT=0
until php -r "
    \$redis = new Redis();
    \$redis->connect('${REDIS_HOST:-redis}', ${REDIS_PORT:-6379});
    if ('${REDIS_PASSWORD:-}' !== '') {
        \$redis->auth('${REDIS_PASSWORD:-}');
    }
    \$redis->ping();
    echo 'Connected!';
" 2>/dev/null; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge 15 ]; then
        echo "⚠️  Redis not available — continuing anyway (will use fallback)"
        break
    fi
    echo "   Waiting for Redis... attempt $COUNT/15"
    sleep 2
done

# ── Storage Setup ─────────────────────────────────────────────
echo "📁 Setting up storage directories..."
mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# ── Run Migrations (first boot / new containers) ──────────────
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "🗄️  Running database migrations..."
    php artisan migrate --force --no-interaction
    echo "✅ Migrations completed!"
fi

# ── Laravel Optimization ──────────────────────────────────────
if [ "${APP_ENV:-production}" = "production" ]; then
    echo "⚡ Optimizing for production..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan event:cache
    echo "✅ Laravel optimized!"
fi

# ── Storage Link ──────────────────────────────────────────────
echo "🔗 Creating storage symbolic link..."
php artisan storage:link --force 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ WIDAD-TECH Backend ready!"
echo "  📍 APP_URL: ${APP_URL:-http://localhost}"
echo "  🔧 APP_ENV: ${APP_ENV:-production}"
echo "═══════════════════════════════════════════════"
echo ""

# ── Execute CMD ───────────────────────────────────────────────
exec "$@"
