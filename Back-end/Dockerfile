# ╔══════════════════════════════════════════════════════════════╗
# ║           WIDAD-TECH — Backend Dockerfile                   ║
# ║           PHP 8.4-FPM | Alpine | Multi-Stage Build          ║
# ╚══════════════════════════════════════════════════════════════╝

# ─────────────────────────────────────────────────────────────
# Stage 1: Base PHP & Extensions
# ─────────────────────────────────────────────────────────────
FROM php:8.4-fpm-alpine AS base

LABEL maintainer="Widad-Tech Team"
LABEL description="Laravel 12 API — Widad Health Platform"

# ── System dependencies ──────────────────────────────────────
RUN apk add --no-cache \
    # Build tools (removed after install)
    $PHPIZE_DEPS \
    # Core utilities
    bash \
    curl \
    git \
    unzip \
    # MySQL client
    mysql-client \
    # GD image library (for any image processing)
    oniguruma-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    # ZIP support
    libzip-dev \
    zip \
    # Internationalization
    icu-dev \
    icu-libs \
    # GMP (required by minishlink/web-push for VAPID)
    gmp-dev \
    gmp \
    # Supercronic/process management
    supervisor \
    # For storage permissions
    shadow

# ── PHP Extensions ───────────────────────────────────────────
RUN docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        gd \
        zip \
        bcmath \
        mbstring \
        exif \
        intl \
        pcntl \
        opcache \
        gmp \
        sockets

# ── Redis Extension (phpredis — faster than predis) ──────────
RUN pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /tmp/pear

# ── Cleanup build deps ───────────────────────────────────────
RUN apk del $PHPIZE_DEPS \
    && rm -rf /var/cache/apk/*

# ─────────────────────────────────────────────────────────────
# Stage 2: Composer Dependencies (isolated, cached)
# ─────────────────────────────────────────────────────────────
FROM base AS composer-deps

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy dependency files first for layer caching
COPY composer.json composer.lock ./

# Install production dependencies only, skip scripts
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --optimize-autoloader \
    --prefer-dist

# ─────────────────────────────────────────────────────────────
# Stage 3: PHP Runtime (production-ready)
# ─────────────────────────────────────────────────────────────
FROM base AS runtime

# ── PHP Configuration ─────────────────────────────────────────
COPY docker/php/php.ini /usr/local/etc/php/conf.d/widad.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

# ── App Directory Setup ───────────────────────────────────────
WORKDIR /var/www/html

# Create non-root user matching nginx (uid 82 = www-data in Alpine)
RUN addgroup -g 1000 -S widad \
    && adduser -u 1000 -S widad -G widad -G www-data

# ── Copy Application Files ────────────────────────────────────
# Copy vendor from composer stage (cached separately)
COPY --from=composer-deps /app/vendor ./vendor

# Copy app code
COPY --chown=widad:widad . .

# ── Storage & Cache Setup ─────────────────────────────────────
RUN mkdir -p \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R widad:widad storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# ── Entrypoint ────────────────────────────────────────────────
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER widad

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
