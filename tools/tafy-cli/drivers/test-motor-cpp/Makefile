.PHONY: build run test clean docker-build docker-push help

DRIVER_NAME := motor
IMAGE_NAME := tafylabs/driver-motor
VERSION := 0.1.0

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

configure: ## Configure the build
	cmake -B build -DCMAKE_BUILD_TYPE=Release

build: configure ## Build the driver
	cmake --build build

debug: ## Build with debug symbols
	cmake -B build -DCMAKE_BUILD_TYPE=Debug
	cmake --build build

run: build ## Run the driver locally
	TAFY_DEVICE_ID=motor-01 \
	TAFY_NATS_URL=nats://localhost:4222 \
	./build/motor_driver

test: ## Run tests
	cmake -B build -DCMAKE_BUILD_TYPE=Debug -DBUILD_TESTING=ON
	cmake --build build
	cd build && ctest -V

clean: ## Clean build artifacts
	rm -rf build

format: ## Format code
	find src include tests -name "*.cpp" -o -name "*.hpp" | xargs clang-format -i

lint: ## Run static analysis
	cppcheck --enable=all --suppress=missingIncludeSystem src/ include/

docker-build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(VERSION) .
	docker tag $(IMAGE_NAME):$(VERSION) $(IMAGE_NAME):latest

docker-push: docker-build ## Push Docker image
	docker push $(IMAGE_NAME):$(VERSION)
	docker push $(IMAGE_NAME):latest

install-deps: ## Install development dependencies
	@echo "Installing dependencies..."
	@echo "Run: sudo apt-get install build-essential cmake libyaml-cpp-dev nlohmann-json3-dev"
	@echo "For NATS C client, see: https://github.com/nats-io/nats.c"
