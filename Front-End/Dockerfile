# ╔══════════════════════════════════════════════════════════════╗
# ║           WIDAD-TECH — Frontend Dockerfile                  ║
# ║           Node 20 Build → Nginx Serve | Multi-Stage         ║
# ╚══════════════════════════════════════════════════════════════╝

# ─────────────────────────────────────────────────────────────
# Stage 1: Node Build Environment
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

LABEL stage="builder"

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build tools)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build production bundle
# vite.config.ts already has: minify, code splitting, drop_console in production
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2: Nginx Static File Server
# ─────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

LABEL maintainer="Widad-Tech Team"
LABEL description="React/Vite Frontend — Widad Health Platform"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config for SPA
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# The _redirects file is already in public/ which gets copied to dist/
# Nginx handles SPA routing via try_files (see frontend.conf)

# Security: run as non-root where possible
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
