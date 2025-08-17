.PHONY: help install build dev test lint format clean docker-build docker-push deploy-dev pre-push
.DEFAULT_GOAL := help

# Color output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

# Default target
help:
	@echo "$(GREEN)Tafy Studio Development Commands$(NC)"
	@echo "================================"
	@echo ""
	@echo "$(YELLOW)Setup & Dependencies:$(NC)"
	@echo "  install               - Install all dependencies"
	@echo "  install-tools         - Install required development tools"
	@echo "  update-deps           - Update all dependencies to latest versions"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  dev                   - Run all development servers"
	@echo "  dev-ui                - Run hub-ui development server"
	@echo "  dev-api               - Run hub-api development server"
	@echo "  dev-agent             - Run tafyd agent in debug mode"
	@echo ""
	@echo "$(YELLOW)Building:$(NC)"
	@echo "  build                 - Build all packages"
	@echo "  build-ui              - Build hub-ui"
	@echo "  build-api             - Build hub-api"
	@echo "  build-agent           - Build tafyd agent"
	@echo ""
	@echo "$(YELLOW)Testing:$(NC)"
	@echo "  test                  - Run all tests"
	@echo "  test-unit             - Run unit tests only"
	@echo "  test-integration      - Run integration tests"
	@echo "  test-coverage         - Run tests with coverage"
	@echo "  test-watch            - Run tests in watch mode"
	@echo ""
	@echo "$(YELLOW)Documentation:$(NC)"
	@echo "  docs-lint             - Lint markdown documentation"
	@echo "  docs-fix              - Fix markdown linting issues"
	@echo "  docs-links            - Check documentation links"
	@echo "  docs-serve            - Serve documentation locally"
	@echo ""
	@echo "$(YELLOW)Hub API:$(NC)"
	@echo "  hub-api-init-db       - Initialize Hub API database"
	@echo "  hub-api-migrate       - Run database migrations"
	@echo "  hub-api-shell         - Start interactive Python shell"
	@echo ""
	@echo "$(YELLOW)Code Quality:$(NC)"
	@echo "  lint                  - Run all linters"
	@echo "  format                - Format all code"
	@echo "  typecheck             - Run TypeScript type checking"
	@echo "  security-scan         - Run security vulnerability scans"
	@echo ""
	@echo "$(YELLOW)Docker:$(NC)"
	@echo "  docker-build          - Build Docker images (local arch)"
	@echo "  docker-build-all      - Build multi-arch Docker images"
	@echo "  docker-push           - Push Docker images to registry"
	@echo "  docker-test           - Run tests in Docker"
	@echo ""
	@echo "$(YELLOW)Kubernetes:$(NC)"
	@echo "  cluster-create        - Create local k3d cluster"
	@echo "  cluster-delete        - Delete local k3d cluster"
	@echo "  cluster-status        - Show cluster status"
	@echo "  deploy-dev            - Deploy to local cluster"
	@echo "  port-forward          - Forward ports for local development"
	@echo ""
	@echo "$(YELLOW)Utilities:$(NC)"
	@echo "  clean                 - Clean all build artifacts"
	@echo "  clean-deep            - Deep clean including node_modules"
	@echo "  logs                  - Show logs from all services"
	@echo ""
	@echo "$(YELLOW)Pre-Push Validation:$(NC)"
	@echo "  pre-push              - Run all checks before pushing"
	@echo "  pre-push-quick        - Quick validation (lint only)"
	@echo "  pre-push-full         - Full validation with integration tests"

# Check if required tools are installed
check-tools:
	@echo "$(YELLOW)Checking required tools...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)Node.js is required but not installed.$(NC)"; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "$(RED)pnpm is required but not installed.$(NC)"; exit 1; }
	@command -v go >/dev/null 2>&1 || { echo "$(RED)Go is required but not installed.$(NC)"; exit 1; }
	@command -v uv >/dev/null 2>&1 || { echo "$(RED)uv is required but not installed.$(NC)"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Docker is required but not installed.$(NC)"; exit 1; }
	@echo "$(GREEN)All required tools are installed!$(NC)"

# Install required development tools
install-tools:
	@echo "$(YELLOW)Installing development tools...$(NC)"
	npm install -g pnpm@latest
	curl -LsSf https://astral.sh/uv/install.sh | sh
	@echo "$(GREEN)Development tools installed!$(NC)"

# Install all dependencies
install: check-tools
	@echo "$(YELLOW)Installing all dependencies...$(NC)"
	pnpm install
	cd apps/hub-api && uv venv && source .venv/bin/activate && uv pip install -e ".[dev]"
	cd apps/tafyd && go mod download
	@echo "$(GREEN)All dependencies installed!$(NC)"

# Update all dependencies
update-deps:
	@echo "$(YELLOW)Updating dependencies...$(NC)"
	pnpm update -r --latest
	cd apps/hub-api && uv pip install --upgrade -e ".[dev]"
	cd apps/tafyd && go get -u ./... && go mod tidy
	@echo "$(GREEN)Dependencies updated!$(NC)"

# Development servers
dev:
	pnpm run dev

dev-ui:
	cd apps/hub-ui && pnpm run dev

dev-api:
	cd apps/hub-api && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-agent:
	cd apps/tafyd && go run . --debug

# Building
build: check-tools
	pnpm run build

build-ui:
	cd apps/hub-ui && pnpm run build

build-api:
	cd apps/hub-api && echo "Python apps don't need building"

build-agent:
	cd apps/tafyd && go build -o tafyd .

# Testing
test:
	pnpm run test

test-unit:
	pnpm run test:unit

test-integration:
	docker-compose -f docker-compose.test.yml up -d
	sleep 5
	pnpm run test:integration
	docker-compose -f docker-compose.test.yml down

test-coverage:
	cd apps/hub-ui && pnpm run test:coverage
	cd apps/hub-api && uv run pytest --cov
	cd apps/tafyd && go test -race -coverprofile=coverage.out ./...

test-watch:
	cd apps/hub-ui && pnpm run test:watch

# Hub API specific commands
hub-api-init-db: ## Initialize Hub API database
	@echo "$(GREEN)Initializing database...$(NC)"
	cd apps/hub-api && uv run python -m app.db.init_db

hub-api-migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	cd apps/hub-api && uv run alembic upgrade head

hub-api-shell: ## Start interactive Python shell with app context
	@echo "$(GREEN)Starting interactive shell...$(NC)"
	cd apps/hub-api && uv run python -i -c "from app.core.config import settings; from app.services import *; print('Hub API shell ready')"

# Code quality
lint:
	pnpm run lint

format:
	pnpm run format

typecheck:
	pnpm run typecheck

security-scan:
	pnpm audit
	cd apps/hub-api && source .venv/bin/activate && pip-audit --ignore-vuln GHSA-wj6h-64fc-37mp

# Docker commands
docker-build:
	docker build -f apps/hub-ui/Dockerfile -t ghcr.io/tafystudio/tafystudio/hub-ui:latest .
	docker build -f apps/hub-api/Dockerfile -t ghcr.io/tafystudio/tafystudio/hub-api:latest .
	docker build -f apps/tafyd/Dockerfile -t ghcr.io/tafystudio/tafystudio/tafyd:latest .

docker-build-all:
	docker buildx build --platform linux/amd64,linux/arm64 \
		-f apps/hub-ui/Dockerfile \
		-t ghcr.io/tafystudio/tafystudio/hub-ui:latest .
	docker buildx build --platform linux/amd64,linux/arm64 \
		-f apps/hub-api/Dockerfile \
		-t ghcr.io/tafystudio/tafystudio/hub-api:latest .
	docker buildx build --platform linux/amd64,linux/arm64 \
		-f apps/tafyd/Dockerfile \
		-t ghcr.io/tafystudio/tafystudio/tafyd:latest .

docker-push:
	docker push ghcr.io/tafystudio/tafystudio/hub-ui:latest
	docker push ghcr.io/tafystudio/tafystudio/hub-api:latest
	docker push ghcr.io/tafystudio/tafystudio/tafyd:latest

docker-test:
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Kubernetes cluster management
cluster-create:
	k3d cluster create tafy-dev \
		--servers 1 \
		--agents 2 \
		--port 9080:80@loadbalancer \
		--port 9443:443@loadbalancer \
		--registry-create tafy-registry:5000 \
		--k3s-arg "--disable=traefik@server:0"
	@echo "$(GREEN)Cluster created! Access at http://localhost:9080$(NC)"

cluster-delete:
	k3d cluster delete tafy-dev

cluster-status:
	@echo "$(YELLOW)Cluster Status:$(NC)"
	k3d cluster list
	@echo ""
	@echo "$(YELLOW)Nodes:$(NC)"
	kubectl get nodes
	@echo ""
	@echo "$(YELLOW)Pods:$(NC)"
	kubectl get pods --all-namespaces

# Deployment
deploy-dev: check-cluster
	@echo "$(YELLOW)Deploying to local cluster...$(NC)"
	# Add Helm repositories
	helm repo add nats https://nats-io.github.io/k8s/helm/charts/
	helm repo add traefik https://helm.traefik.io/traefik
	helm repo update
	# Deploy NATS
	helm upgrade --install nats nats/nats \
		--set cluster.enabled=true \
		--set cluster.replicas=1
	# Deploy Traefik
	helm upgrade --install traefik traefik/traefik \
		--set ports.web.port=9080 \
		--set ports.websecure.port=9443
	# Deploy Tafy services (when charts are ready)
	# helm upgrade --install hub charts/hub -f charts/hub/values-dev.yaml
	@echo "$(GREEN)Deployment complete!$(NC)"

check-cluster:
	@kubectl cluster-info >/dev/null 2>&1 || { echo "$(RED)No Kubernetes cluster found. Run 'make cluster-create' first.$(NC)"; exit 1; }

port-forward:
	@echo "$(YELLOW)Starting port forwarding...$(NC)"
	@echo "Hub UI will be available at http://localhost:3000"
	@echo "Hub API will be available at http://localhost:8000"
	@echo "NATS will be available at http://localhost:4222"
	kubectl port-forward svc/hub-ui 3000:3000 &
	kubectl port-forward svc/hub-api 8000:8000 &
	kubectl port-forward svc/nats 4222:4222 &

# Cleaning
clean:
	pnpm run clean
	find . -name "dist" -type d -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	find . -name ".next" -type d -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete
	find . -name ".coverage" -delete
	find . -name "coverage.xml" -delete
	find . -name "coverage.html" -delete
	find . -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name ".turbo" -type d -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)Build artifacts cleaned!$(NC)"

clean-deep: clean
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf apps/hub-api/.venv
	rm -rf apps/tafyd/vendor
	@echo "$(GREEN)Deep clean complete!$(NC)"

# Logs
logs:
	@echo "$(YELLOW)Showing logs from all services...$(NC)"
	kubectl logs -l app=hub-ui --tail=50
	kubectl logs -l app=hub-api --tail=50
	kubectl logs -l app=tafyd --tail=50

# CI/CD helpers
ci-lint:
	pnpm run lint

ci-test:
	pnpm run test:unit

ci-build:
	pnpm run build

# Documentation commands
docs-lint: ## Lint markdown documentation
	@echo "$(YELLOW)Linting documentation...$(NC)"
	@command -v markdownlint >/dev/null 2>&1 || npm install -g markdownlint-cli
	markdownlint '**/*.md' \
		--ignore node_modules \
		--ignore .venv \
		--ignore '**/node_modules/**' \
		--ignore '**/dist/**' \
		--ignore '**/.next/**'

docs-fix: ## Fix markdown linting issues
	@echo "$(YELLOW)Fixing documentation linting issues...$(NC)"
	@command -v markdownlint >/dev/null 2>&1 || npm install -g markdownlint-cli
	markdownlint '**/*.md' --fix \
		--ignore node_modules \
		--ignore .venv \
		--ignore '**/node_modules/**' \
		--ignore '**/dist/**' \
		--ignore '**/.next/**'
	@echo "$(GREEN)Documentation linting issues fixed!$(NC)"

docs-links: ## Check documentation links
	@echo "$(YELLOW)Checking documentation links...$(NC)"
	@command -v lychee >/dev/null 2>&1 || { echo "$(RED)lychee is required. Install from https://github.com/lycheeverse/lychee$(NC)"; exit 1; }
	lychee --verbose \
		--no-progress \
		--accept 200,204,206 \
		--timeout 20 \
		--max-retries 3 \
		--exclude-all-private \
		--exclude 'localhost' \
		--exclude '127.0.0.1' \
		--exclude 'example.com' \
		--exclude 'tafy.local' \
		--exclude-path .venv \
		--exclude-path node_modules \
		--exclude-path .next \
		--exclude-path dist \
		docs/**/*.md README.md

docs-site: ## Information about the documentation site
	@echo "$(YELLOW)Documentation Site Information$(NC)"
	@echo "The documentation site is deployed separately using Docusaurus."
	@echo ""
	@echo "$(CYAN)Production URL:$(NC) https://docs.tafy.studio"
	@echo "$(CYAN)Repository:$(NC) https://github.com/tafystudio/tafystudio-docs"
	@echo ""
	@echo "To work on the documentation site locally:"
	@echo "  1. Clone the tafystudio-docs repository"
	@echo "  2. Run 'npm install' to install dependencies"
	@echo "  3. Run 'npm start' to start the development server"
	@echo ""
	@echo "Documentation content is maintained in this repository's docs/ directory."

# Documentation build targets
.PHONY: docs-prepare docs-build-static docs-build-api docs-build-schemas docs-build-examples docs-clean

docs-prepare: ## Prepare all documentation for docs site build
	@echo "$(YELLOW)Preparing documentation for build...$(NC)"
	@mkdir -p .docs-build
	@make docs-build-static
	@make docs-build-api
	@make docs-build-schemas
	@make docs-build-examples
	@echo "$(GREEN)Documentation prepared in .docs-build/$(NC)"

docs-build-static: ## Copy static documentation files
	@echo "$(YELLOW)Copying static documentation...$(NC)"
	@mkdir -p .docs-build/content
	@cp -r docs/* .docs-build/content/
	@cp README.md .docs-build/content/
	@# Copy package READMEs
	@mkdir -p .docs-build/content/packages
	@for pkg in packages/*/README.md; do \
		if [ -f "$$pkg" ]; then \
			dir=$$(dirname "$$pkg"); \
			name=$$(basename "$$dir"); \
			cp "$$pkg" ".docs-build/content/packages/$$name.md"; \
		fi; \
	done
	@# Copy app READMEs
	@mkdir -p .docs-build/content/apps
	@for app in apps/*/README.md; do \
		if [ -f "$$app" ]; then \
			dir=$$(dirname "$$app"); \
			name=$$(basename "$$dir"); \
			cp "$$app" ".docs-build/content/apps/$$name.md"; \
		fi; \
	done

docs-build-api: ## Build API documentation
	@echo "$(YELLOW)Building API documentation...$(NC)"
	@mkdir -p .docs-build/api
	@# TypeScript API docs
	@if command -v typedoc >/dev/null 2>&1; then \
		echo "Building TypeScript API docs..."; \
		cd packages/sdk-ts && typedoc --out ../../.docs-build/api/typescript || true; \
		cd ../..; \
	else \
		echo "TypeDoc not found, skipping TypeScript API docs"; \
	fi
	@# Python API docs
	@if [ -d "apps/hub-api/docs" ]; then \
		echo "Building Python API docs..."; \
		cd apps/hub-api && \
		uv venv .venv-docs && \
		. .venv-docs/bin/activate && \
		uv pip install sphinx sphinx-rtd-theme sphinx-autodoc-typehints && \
		cd docs && \
		sphinx-build -b markdown . ../../../.docs-build/api/python && \
		deactivate && \
		cd ../../..; \
	else \
		echo "Python docs not configured, skipping"; \
	fi

docs-build-schemas: ## Generate HAL schema documentation
	@echo "$(YELLOW)Generating HAL schema documentation...$(NC)"
	@mkdir -p .docs-build/schemas
	@if [ -d "packages/hal-schemas" ]; then \
		cd packages/hal-schemas && \
		pnpm run generate:docs || echo "Schema docs generation not configured"; \
		cd ../..; \
	fi

docs-build-examples: ## Extract and format examples
	@echo "$(YELLOW)Extracting examples...$(NC)"
	@mkdir -p .docs-build/examples
	@# Copy example files with proper formatting
	@if [ -d "examples" ]; then \
		find examples -name "*.md" -o -name "*.py" -o -name "*.ts" -o -name "*.go" | \
		while read -r file; do \
			rel=$${file#examples/}; \
			dir=$$(dirname ".docs-build/examples/$$rel"); \
			mkdir -p "$$dir"; \
			cp "$$file" ".docs-build/examples/$$rel"; \
		done; \
	fi

docs-clean: ## Clean documentation build artifacts
	@echo "$(YELLOW)Cleaning documentation build...$(NC)"
	@rm -rf .docs-build

# Pre-push validation
pre-push: ## Run all checks before pushing (recommended before git push)
	@echo "$(YELLOW)Running pre-push validation...$(NC)"
	@echo ""
	@echo "$(YELLOW)1/6 Checking code formatting...$(NC)"
	@make format || { echo "$(RED)Formatting issues found!$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Code formatting passed$(NC)"
	@echo ""
	@echo "$(YELLOW)2/6 Running linters...$(NC)"
	@make lint || { echo "$(RED)Linting failed!$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Linting passed$(NC)"
	@echo ""
	@echo "$(YELLOW)3/6 Running type checks...$(NC)"
	@make typecheck || { echo "$(RED)Type checking failed!$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Type checking passed$(NC)"
	@echo ""
	@echo "$(YELLOW)4/6 Checking documentation...$(NC)"
	@make docs-lint || { echo "$(RED)Documentation linting failed!$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Documentation passed$(NC)"
	@echo ""
	@echo "$(YELLOW)5/6 Running unit tests...$(NC)"
	@make test-unit || { echo "$(RED)Unit tests failed!$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Unit tests passed$(NC)"
	@echo ""
	@echo "$(YELLOW)6/6 Building project...$(NC)"
	@make build || { echo "$(RED)Build failed!$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Build passed$(NC)"
	@echo ""
	@echo "$(GREEN)🎉 All pre-push checks passed! Safe to push.$(NC)"

pre-push-quick: ## Quick pre-push validation (lint and format only)
	@echo "$(YELLOW)Running quick pre-push validation...$(NC)"
	@make format
	@make lint
	@make docs-lint
	@echo "$(GREEN)✓ Quick validation passed!$(NC)"

pre-push-full: ## Full pre-push validation including integration tests
	@echo "$(YELLOW)Running full pre-push validation...$(NC)"
	@make pre-push
	@echo ""
	@echo "$(YELLOW)Running integration tests...$(NC)"
	@make test-integration || { echo "$(RED)Integration tests failed!$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Integration tests passed$(NC)"
	@echo ""
	@echo "$(GREEN)🎉 Full validation passed! Safe to push.$(NC)"

# Git hooks
install-hooks: ## Install git hooks for automated checks
	@echo "$(YELLOW)Installing git hooks...$(NC)"
	@echo '#!/bin/sh' > .git/hooks/pre-commit
	@echo '# Pre-commit hook - runs quick checks' >> .git/hooks/pre-commit
	@echo 'echo "Running pre-commit checks..."' >> .git/hooks/pre-commit
	@echo 'make format' >> .git/hooks/pre-commit
	@echo 'make lint' >> .git/hooks/pre-commit
	@echo 'make docs-lint' >> .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo '#!/bin/sh' > .git/hooks/pre-push
	@echo '# Pre-push hook - runs comprehensive checks' >> .git/hooks/pre-push
	@echo 'echo "Running pre-push validation..."' >> .git/hooks/pre-push
	@echo 'make pre-push' >> .git/hooks/pre-push
	chmod +x .git/hooks/pre-push
	@echo "$(GREEN)Git hooks installed!$(NC)"
	@echo "  - pre-commit: Runs formatting and linting"
	@echo "  - pre-push: Runs full validation suite"