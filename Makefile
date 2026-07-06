# ═══════════════════════════════════════════════════════════════════════════
# WIDAD-TECH — Makefile
# Convenient Docker commands for development and production
#
# Usage:
#   make up          → Start all services (development)
#   make down        → Stop all services
#   make build       → Build all Docker images
#   make logs        → Show logs
#   make migrate     → Run migrations
#   make shell       → Open bash in app container
#   make fresh       → Fresh install (⚠️ destroys DB data)
# ═══════════════════════════════════════════════════════════════════════════

.PHONY: help up down build logs shell migrate seed fresh restart status \
        ps test queue-restart artisan tinker optimize clear-cache backup

# ── Colors ────────────────────────────────────────────────────────────────
GREEN  := \033[0;32m
YELLOW := \033[1;33m
RED    := \033[0;31m
CYAN   := \033[0;36m
NC     := \033[0m

# ── Default Target ────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "$(CYAN)╔══════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║       WIDAD-TECH Docker Commands             ║$(NC)"
	@echo "$(CYAN)╚══════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)🚀 Start & Stop:$(NC)"
	@echo "  make up           → Start all services (detached)"
	@echo "  make down         → Stop all services"
	@echo "  make restart      → Restart all services"
	@echo "  make status       → Show running containers"
	@echo ""
	@echo "$(GREEN)🔨 Build:$(NC)"
	@echo "  make build        → Build all Docker images"
	@echo "  make build-nocache → Build without cache"
	@echo ""
	@echo "$(GREEN)🗄️ Database:$(NC)"
	@echo "  make migrate      → Run migrations"
	@echo "  make seed         → Run core seeders"
	@echo "  make fresh        → ⚠️  Fresh migrate + seed (destroys data!)"
	@echo "  make backup       → Backup MySQL database"
	@echo ""
	@echo "$(GREEN)🐚 Shell & Debug:$(NC)"
	@echo "  make shell        → Open bash in app container"
	@echo "  make tinker       → Open Laravel tinker"
	@echo "  make logs         → Show all logs (follow)"
	@echo "  make logs-app     → Show app logs only"
	@echo "  make logs-queue   → Show queue worker logs"
	@echo ""
	@echo "$(GREEN)⚡ Performance:$(NC)"
	@echo "  make optimize     → Cache config/routes/views"
	@echo "  make clear-cache  → Clear all Laravel caches"
	@echo ""
	@echo "$(GREEN)🧪 Testing:$(NC)"
	@echo "  make test         → Run pest tests"
	@echo "  make queue-restart → Restart queue workers"
	@echo ""

# ── Start Services ────────────────────────────────────────────────────────
up:
	@echo "$(GREEN)🚀 Starting WIDAD-TECH services...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✅ Services started!$(NC)"
	@echo ""
	@echo "  🌐 Backend API:  http://localhost/api/v1"
	@echo "  ⚛️  Frontend:     http://localhost:3000"
	@echo "  🗄️  MySQL:        localhost:3306"
	@echo "  🔴 Redis:         localhost:6379"

# ── Stop Services ─────────────────────────────────────────────────────────
down:
	@echo "$(YELLOW)🛑 Stopping WIDAD-TECH services...$(NC)"
	docker compose down
	@echo "$(YELLOW)✅ Services stopped.$(NC)"

# ── Stop + Remove Volumes (DANGEROUS) ────────────────────────────────────
down-volumes:
	@echo "$(RED)⚠️  DESTROYING ALL DATA (volumes)...$(NC)"
	docker compose down -v
	@echo "$(RED)🗑️  All volumes removed.$(NC)"

# ── Build All Images ──────────────────────────────────────────────────────
build:
	@echo "$(CYAN)🔨 Building Docker images...$(NC)"
	docker compose build --parallel
	@echo "$(GREEN)✅ Build complete!$(NC)"

build-nocache:
	@echo "$(CYAN)🔨 Building Docker images (no cache)...$(NC)"
	docker compose build --no-cache --parallel
	@echo "$(GREEN)✅ Build complete!$(NC)"

# ── Restart All Services ──────────────────────────────────────────────────
restart:
	@echo "$(YELLOW)🔄 Restarting services...$(NC)"
	docker compose restart
	@echo "$(GREEN)✅ Restarted!$(NC)"

# ── Show Container Status ─────────────────────────────────────────────────
status:
	@echo "$(CYAN)📊 WIDAD-TECH Container Status:$(NC)"
	docker compose ps

ps: status

# ── Logs ──────────────────────────────────────────────────────────────────
logs:
	docker compose logs -f

logs-app:
	docker compose logs -f app

logs-nginx:
	docker compose logs -f nginx

logs-queue:
	docker compose logs -f queue

logs-scheduler:
	docker compose logs -f scheduler

logs-mysql:
	docker compose logs -f mysql

# ── Shell Access ──────────────────────────────────────────────────────────
shell:
	@echo "$(CYAN)🐚 Opening shell in app container...$(NC)"
	docker compose exec app bash

shell-mysql:
	@echo "$(CYAN)🐚 Opening MySQL shell...$(NC)"
	docker compose exec mysql mysql -u $${DB_USERNAME:-widad_user} -p$${DB_PASSWORD:-widad_secret_2024} $${DB_DATABASE:-widad_production}

shell-redis:
	@echo "$(CYAN)🐚 Opening Redis CLI...$(NC)"
	docker compose exec redis redis-cli -a $${REDIS_PASSWORD:-widad_redis_2024}

# ── Laravel Commands ──────────────────────────────────────────────────────
artisan:
	@echo "$(CYAN)⚡ Running: php artisan $(cmd)$(NC)"
	docker compose exec app php artisan $(cmd)

tinker:
	docker compose exec app php artisan tinker

migrate:
	@echo "$(GREEN)🗄️  Running migrations...$(NC)"
	docker compose exec app php artisan migrate --force
	@echo "$(GREEN)✅ Migrations done!$(NC)"

seed:
	@echo "$(GREEN)🌱 Running core seeders...$(NC)"
	docker compose exec app php artisan db:seed --class=RoleSeeder
	docker compose exec app php artisan db:seed --class=LifeStageSeeder
	docker compose exec app php artisan db:seed --class=SettingsSiteSeeder
	docker compose exec app php artisan db:seed --class=AdminSeeder
	@echo "$(GREEN)✅ Seeding done!$(NC)"
	@echo "$(YELLOW)⚠️  Remember: change admin password after first login!$(NC)"

fresh:
	@echo "$(RED)⚠️  WARNING: This will destroy all database data!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker compose exec app php artisan migrate:fresh --force; \
		$(MAKE) seed; \
	else \
		echo "Aborted."; \
	fi

optimize:
	@echo "$(CYAN)⚡ Optimizing Laravel for production...$(NC)"
	docker compose exec app php artisan optimize
	@echo "$(GREEN)✅ Optimized!$(NC)"

clear-cache:
	@echo "$(YELLOW)🧹 Clearing all caches...$(NC)"
	docker compose exec app php artisan optimize:clear
	@echo "$(GREEN)✅ Cleared!$(NC)"

# ── Queue ─────────────────────────────────────────────────────────────────
queue-restart:
	@echo "$(YELLOW)🔄 Restarting queue workers...$(NC)"
	docker compose exec app php artisan queue:restart
	docker compose restart queue
	@echo "$(GREEN)✅ Queue workers restarted!$(NC)"

queue-monitor:
	docker compose exec app php artisan queue:monitor redis:default

# ── Testing ───────────────────────────────────────────────────────────────
test:
	@echo "$(CYAN)🧪 Running tests...$(NC)"
	docker compose exec app php artisan test

# ── Database Backup ───────────────────────────────────────────────────────
backup:
	@echo "$(CYAN)💾 Creating database backup...$(NC)"
	@BACKUP_FILE="widad_backup_$$(date +%Y%m%d_%H%M%S).sql.gz"; \
	docker compose exec mysql mysqldump \
		-u $${DB_USERNAME:-widad_user} \
		-p$${DB_PASSWORD:-widad_secret_2024} \
		$${DB_DATABASE:-widad_production} \
		| gzip > ./docker/backups/$$BACKUP_FILE; \
	echo "$(GREEN)✅ Backup saved: docker/backups/$$BACKUP_FILE$(NC)"

# ── Schedule Test ─────────────────────────────────────────────────────────
schedule-list:
	docker compose exec app php artisan schedule:list

schedule-run:
	docker compose exec app php artisan schedule:run --verbose

# ── HF Spaces Wakeup ──────────────────────────────────────────────────────
wakeup-hf:
	docker compose exec app php artisan app:wakeup-hf-spaces
