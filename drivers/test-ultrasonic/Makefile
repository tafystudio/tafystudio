.PHONY: run test lint format clean docker-build docker-push help

DRIVER_NAME := ultrasonic
IMAGE_NAME := tafylabs/driver-ultrasonic
VERSION := 0.1.0

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	uv pip install -r requirements.txt

install-dev: ## Install development dependencies
	uv pip install -r requirements.txt
	uv pip install pytest pytest-asyncio pytest-cov ruff mypy

run: ## Run the driver locally
	TAFY_DEVICE_ID=ultrasonic-01 \
	TAFY_NATS_URL=nats://localhost:4222 \
	python -m src.main

test: ## Run tests
	pytest tests/ -v

test-coverage: ## Run tests with coverage
	pytest tests/ -v --cov=src --cov-report=html

lint: ## Run linter
	ruff check src/ tests/

format: ## Format code
	ruff format src/ tests/

type-check: ## Run type checking
	mypy src/

clean: ## Clean build artifacts
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov .mypy_cache

docker-build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(VERSION) .
	docker tag $(IMAGE_NAME):$(VERSION) $(IMAGE_NAME):latest

docker-push: docker-build ## Push Docker image
	docker push $(IMAGE_NAME):$(VERSION)
	docker push $(IMAGE_NAME):latest

dev-server: ## Run with auto-reload for development
	watchmedo auto-restart --directory=./src --pattern="*.py" --recursive python -- -m src.main
