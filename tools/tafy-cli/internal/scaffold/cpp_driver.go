package scaffold

import "fmt"

func (g *DriverGenerator) generateCppDriver(data TemplateData) error {
	files := map[string]string{
		"README.md":                 cppReadmeTemplate,
		"driver.yaml":               cppDriverYamlTemplate,
		"Dockerfile":                cppDockerfileTemplate,
		"Makefile":                  cppMakefileTemplate,
		"CMakeLists.txt":            cppCMakeTemplate,
		"src/main.cpp":              cppMainTemplate,
		"src/driver.cpp":            cppDriverImplTemplate,
		"include/driver.hpp":        cppDriverHeaderTemplate,
		"include/hal_message.hpp":   cppHALHeaderTemplate,
		"include/config.hpp":        cppConfigHeaderTemplate,
		"src/config.cpp":            cppConfigImplTemplate,
		"config/default.yaml":       cppDefaultConfigTemplate,
		".gitignore":                cppGitignoreTemplate,
		"tests/test_driver.cpp":     cppTestTemplate,
	}

	for filename, tmpl := range files {
		if err := g.writeTemplate(filename, tmpl, data); err != nil {
			return fmt.Errorf("failed to write %s: %w", filename, err)
		}
	}

	// Create empty directories
	dirs := []string{"build", "lib", "docs"}
	for _, dir := range dirs {
		if err := g.createEmptyDir(dir); err != nil {
			return fmt.Errorf("failed to create directory %s: %w", dir, err)
		}
	}

	return nil
}

const cppReadmeTemplate = `# {{.Name}} Driver

{{.Description}}

## Overview

This is a HAL-compliant {{.Type}} driver for Tafy RDOS. It provides the capability: ` + "`{{.HALCapability}}`" + `

## Features

- HAL v1.0 compliant messaging
- NATS-based communication with C++ client
- Prometheus metrics
- Health monitoring via HTTP
- Docker container support
- Modern C++17 implementation

## Requirements

- C++17 compiler (GCC 9+ or Clang 10+)
- CMake 3.14+
- NATS C client library
- yaml-cpp
- nlohmann/json
- prometheus-cpp

## Quick Start

1. Build the driver:
   ` + "```bash" + `
   make build
   ` + "```" + `

2. Run locally:
   ` + "```bash" + `
   make run
   ` + "```" + `

3. Run tests:
   ` + "```bash" + `
   make test
   ` + "```" + `

## Configuration

See ` + "`config/default.yaml`" + ` for available configuration options.

## HAL Messages

### Published Topics
- ` + "`hal.v1.{{.Type}}.{{.NameLower}}.data`" + ` - {{.TypeCapitalized}} data
- ` + "`hal.v1.device.telemetry`" + ` - Device telemetry

### Subscribed Topics  
- ` + "`hal.v1.{{.Type}}.{{.NameLower}}.cmd`" + ` - Commands
- ` + "`hal.v1.device.config`" + ` - Configuration updates

## License

Apache 2.0
`

const cppDriverYamlTemplate = `hal:
  version: "1.0"
  capability: "{{.HALCapability}}"
  
device:
  name: "{{.Name}} {{.TypeCapitalized}}"
  manufacturer: "Generic"
  model: "{{.NameUpper}}-01"
  
interfaces:
  - type: "GPIO"
    pins:
      - name: "data"
        number: 23
        direction: "input"

messages:
  publish:
    - topic: "hal.v1.{{.Type}}.{{.NameLower}}.data"
      schema: "{{.NameLower}}_data.json"
    - topic: "hal.v1.device.telemetry"
      schema: "device_telemetry.json"
      
  subscribe:
    - topic: "hal.v1.{{.Type}}.{{.NameLower}}.cmd"
      schema: "{{.NameLower}}_command.json"

configuration:
  - name: "sample_rate"
    type: "integer"
    default: 10
    min: 1
    max: 100
    unit: "Hz"
    description: "Data sampling rate"
`

const cppDockerfileTemplate = `# Build stage
FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    ca-certificates \
    libssl-dev \
    libyaml-cpp-dev \
    nlohmann-json3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install NATS C client
RUN git clone --depth 1 --branch v3.7.0 https://github.com/nats-io/nats.c.git /tmp/nats.c \
    && cd /tmp/nats.c \
    && cmake -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build --target install \
    && rm -rf /tmp/nats.c

# Install prometheus-cpp
RUN git clone --depth 1 --branch v1.2.1 https://github.com/jupp0r/prometheus-cpp.git /tmp/prometheus-cpp \
    && cd /tmp/prometheus-cpp \
    && git submodule update --init --recursive \
    && cmake -B build -DCMAKE_BUILD_TYPE=Release -DENABLE_TESTING=OFF \
    && cmake --build build --target install \
    && rm -rf /tmp/prometheus-cpp

WORKDIR /app

# Copy source
COPY . .

# Build
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build

# Runtime stage
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 \
    libyaml-cpp0.7 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary and config
COPY --from=builder /app/build/{{.NameLower}}_driver /app/
COPY --from=builder /app/config /app/config
COPY --from=builder /usr/local/lib/libnats* /usr/local/lib/
COPY --from=builder /usr/local/lib/libprometheus-cpp* /usr/local/lib/

# Update library cache
RUN ldconfig

# Create non-root user
RUN useradd -m -u 1000 tafy
USER tafy

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["./{{.NameLower}}_driver"]
`

const cppMakefileTemplate = `.PHONY: build run test clean docker-build docker-push help

DRIVER_NAME := {{.NameLower}}
IMAGE_NAME := tafylabs/driver-{{.NameLower}}
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
	TAFY_DEVICE_ID={{.NameLower}}-01 \
	TAFY_NATS_URL=nats://localhost:4222 \
	./build/{{.NameLower}}_driver

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
`

const cppCMakeTemplate = `cmake_minimum_required(VERSION 3.14)
project({{.NameLower}}_driver VERSION 0.1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Find packages
find_package(Threads REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_check_modules(YAML_CPP REQUIRED yaml-cpp)

# Find or fetch dependencies
find_package(nlohmann_json 3.2.0 QUIET)
if(NOT nlohmann_json_FOUND)
    include(FetchContent)
    FetchContent_Declare(
        nlohmann_json
        GIT_REPOSITORY https://github.com/nlohmann/json.git
        GIT_TAG v3.11.2
    )
    FetchContent_MakeAvailable(nlohmann_json)
endif()

# Source files
set(SOURCES
    src/main.cpp
    src/driver.cpp
    src/config.cpp
)

# Create executable
add_executable(${PROJECT_NAME} ${SOURCES})

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${YAML_CPP_INCLUDE_DIRS}
)

# Link libraries
target_link_libraries(${PROJECT_NAME} PRIVATE
    Threads::Threads
    nats
    ${YAML_CPP_LIBRARIES}
    nlohmann_json::nlohmann_json
    prometheus-cpp::pull
    prometheus-cpp::core
)

# Compiler flags
target_compile_options(${PROJECT_NAME} PRIVATE
    -Wall -Wextra -Wpedantic
    $<$<CONFIG:Debug>:-g -O0>
    $<$<CONFIG:Release>:-O3>
)

# Testing
option(BUILD_TESTING "Build tests" OFF)
if(BUILD_TESTING)
    enable_testing()
    add_subdirectory(tests)
endif()
`

const cppMainTemplate = `#include <iostream>
#include <csignal>
#include <memory>
#include <thread>
#include <chrono>

#include "config.hpp"
#include "driver.hpp"

std::unique_ptr<{{.Name}}Driver> g_driver;

void signalHandler(int signal) {
    std::cout << "Received signal " << signal << ", shutting down..." << std::endl;
    if (g_driver) {
        g_driver->stop();
    }
}

int main() {
    // Install signal handlers
    std::signal(SIGINT, signalHandler);
    std::signal(SIGTERM, signalHandler);

    try {
        // Load configuration
        auto config = Config::load();
        
        // Create and run driver
        g_driver = std::make_unique<{{.Name}}Driver>(config);
        
        std::cout << "Starting {{.Name}} driver (ID: " << config.device_id << ")" << std::endl;
        g_driver->run();
        
    } catch (const std::exception& e) {
        std::cerr << "Driver failed: " << e.what() << std::endl;
        return 1;
    }

    std::cout << "Driver stopped" << std::endl;
    return 0;
}
`

const cppDriverHeaderTemplate = `#pragma once

#include <atomic>
#include <memory>
#include <thread>
#include <nats/nats.h>
#include <prometheus/counter.h>
#include <prometheus/gauge.h>
#include <prometheus/exposer.h>
#include <prometheus/registry.h>

#include "config.hpp"
#include "hal_message.hpp"

class {{.Name}}Driver {
public:
    explicit {{.Name}}Driver(const Config& config);
    ~{{.Name}}Driver();

    void run();
    void stop();

private:
    void processLoop();
    void handleCommand(natsMsg* msg);
    void publishData(double value);
    void setupMetrics();
    void startHttpServer();

    static void commandCallback(natsConnection* nc, natsSubscription* sub, natsMsg* msg, void* closure);

    Config config_;
    std::atomic<bool> running_{false};
    
    // NATS
    natsConnection* nc_{nullptr};
    natsSubscription* cmd_sub_{nullptr};
    
    // Metrics
    std::shared_ptr<prometheus::Registry> registry_;
    prometheus::Counter* messages_published_{nullptr};
    prometheus::Counter* messages_failed_{nullptr};
    {{if eq .Type "sensor"}}prometheus::Gauge* readings_{nullptr};{{end}}
    
    // HTTP server
    std::unique_ptr<prometheus::Exposer> exposer_;
    std::thread http_thread_;
};
`

const cppDriverImplTemplate = `#include "driver.hpp"
#include <iostream>
#include <chrono>
#include <thread>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

{{.Name}}Driver::{{.Name}}Driver(const Config& config) : config_(config) {
    // Initialize NATS connection
    natsStatus s = natsConnection_ConnectTo(&nc_, config_.nats.url.c_str());
    if (s != NATS_OK) {
        throw std::runtime_error("Failed to connect to NATS: " + std::string(natsStatus_GetText(s)));
    }

    // Setup metrics
    setupMetrics();
    
    // Start HTTP server
    startHttpServer();
}

{{.Name}}Driver::~{{.Name}}Driver() {
    stop();
    
    if (cmd_sub_) {
        natsSubscription_Destroy(cmd_sub_);
    }
    
    if (nc_) {
        natsConnection_Close(nc_);
        natsConnection_Destroy(nc_);
    }
}

void {{.Name}}Driver::run() {
    // Subscribe to commands
    std::string cmd_topic = "hal.v1.{{.Type}}.{{.NameLower}}.cmd";
    natsStatus s = natsConnection_Subscribe(&cmd_sub_, nc_, cmd_topic.c_str(), 
                                          commandCallback, this);
    if (s != NATS_OK) {
        throw std::runtime_error("Failed to subscribe: " + std::string(natsStatus_GetText(s)));
    }

    running_ = true;
    
    // Main loop
    auto interval = std::chrono::milliseconds(1000 / config_.sample_rate);
    while (running_) {
        processLoop();
        std::this_thread::sleep_for(interval);
    }
}

void {{.Name}}Driver::stop() {
    running_ = false;
}

void {{.Name}}Driver::processLoop() {
    try {
        {{if eq .Type "sensor"}}
        // TODO: Read from actual hardware
        double value = 42.0; // Replace with actual sensor reading
        
        // Update metric
        if (readings_) {
            readings_->Set(value);
        }
        
        publishData(value);
        {{else}}
        // TODO: Implement main processing loop for {{.Type}}
        {{end}}
    } catch (const std::exception& e) {
        std::cerr << "Error in process loop: " << e.what() << std::endl;
        if (messages_failed_) {
            messages_failed_->Increment();
        }
    }
}

void {{.Name}}Driver::publishData(double value) {
    HALMessage msg;
    msg.hal_major = 1;
    msg.hal_minor = 0;
    msg.schema = "tafylabs/hal/{{.Type}}/{{.NameLower}}/1.0";
    msg.device_id = config_.device_id;
    msg.caps = {"{{.HALCapability}}:v1.0"};
    msg.ts = getCurrentTimestamp();
    
    json payload;
    payload["value"] = value;
    payload["unit"] = "TODO";
    msg.payload = payload.dump();
    
    std::string data = msg.toJson();
    std::string topic = "hal.v1.{{.Type}}.{{.NameLower}}.data";
    
    natsStatus s = natsConnection_PublishString(nc_, topic.c_str(), data.c_str());
    if (s != NATS_OK) {
        throw std::runtime_error("Failed to publish: " + std::string(natsStatus_GetText(s)));
    }
    
    if (messages_published_) {
        messages_published_->Increment();
    }
}

void {{.Name}}Driver::handleCommand(natsMsg* msg) {
    try {
        const char* data = natsMsg_GetData(msg);
        int dataLen = natsMsg_GetDataLength(msg);
        
        std::string jsonStr(data, dataLen);
        HALMessage cmd = HALMessage::fromJson(jsonStr);
        
        // TODO: Handle commands based on payload
        std::cout << "Received command: " << cmd.payload << std::endl;
        
        // Send acknowledgment
        HALMessage ack;
        ack.hal_major = 1;
        ack.hal_minor = 0;
        ack.schema = "tafylabs/hal/{{.Type}}/{{.NameLower}}/ack/1.0";
        ack.device_id = config_.device_id;
        ack.caps = {"{{.HALCapability}}:v1.0"};
        ack.ts = getCurrentTimestamp();
        
        json ackPayload;
        ackPayload["status"] = "ok";
        ackPayload["command"] = json::parse(cmd.payload);
        ack.payload = ackPayload.dump();
        
        std::string ackTopic = "hal.v1.{{.Type}}.{{.NameLower}}.ack";
        natsConnection_PublishString(nc_, ackTopic.c_str(), ack.toJson().c_str());
        
    } catch (const std::exception& e) {
        std::cerr << "Failed to handle command: " << e.what() << std::endl;
    }
    
    natsMsg_Destroy(msg);
}

void {{.Name}}Driver::commandCallback(natsConnection* nc, natsSubscription* sub, 
                                    natsMsg* msg, void* closure) {
    (void)nc;
    (void)sub;
    
    auto* driver = static_cast<{{.Name}}Driver*>(closure);
    driver->handleCommand(msg);
}

void {{.Name}}Driver::setupMetrics() {
    registry_ = std::make_shared<prometheus::Registry>();
    
    auto& messages_published_family = prometheus::BuildCounter()
        .Name("tafy_driver_messages_published_total")
        .Help("Total messages published")
        .Register(*registry_);
    messages_published_ = &messages_published_family.Add({{"{"}}"driver", "{{.NameLower}}"{{"}"}});
    
    auto& messages_failed_family = prometheus::BuildCounter()
        .Name("tafy_driver_messages_failed_total")
        .Help("Total failed messages")
        .Register(*registry_);
    messages_failed_ = &messages_failed_family.Add({{"{"}}"driver", "{{.NameLower}}"{{"}"}});
    
    {{if eq .Type "sensor"}}
    auto& readings_family = prometheus::BuildGauge()
        .Name("tafy_sensor_{{.NameLower}}_value")
        .Help("Current {{.Name}} sensor reading")
        .Register(*registry_);
    readings_ = &readings_family.Add({{"{}"}});
    {{end}}
}

void {{.Name}}Driver::startHttpServer() {
    exposer_ = std::make_unique<prometheus::Exposer>("0.0.0.0:8080");
    exposer_->RegisterCollectable(registry_);
    
    // Note: prometheus-cpp handles /metrics endpoint
    // For /health endpoint, you'd need a separate HTTP server
    // This is simplified for the template
}
`

const cppHALHeaderTemplate = `#pragma once

#include <string>
#include <vector>
#include <chrono>
#include <iomanip>
#include <sstream>
#include <nlohmann/json.hpp>

struct HALMessage {
    int hal_major;
    int hal_minor;
    std::string schema;
    std::string device_id;
    std::vector<std::string> caps;
    std::string ts;
    std::string payload; // JSON string

    std::string toJson() const {
        nlohmann::json j;
        j["hal_major"] = hal_major;
        j["hal_minor"] = hal_minor;
        j["schema"] = schema;
        j["device_id"] = device_id;
        j["caps"] = caps;
        j["ts"] = ts;
        j["payload"] = nlohmann::json::parse(payload);
        return j.dump();
    }

    static HALMessage fromJson(const std::string& jsonStr) {
        auto j = nlohmann::json::parse(jsonStr);
        HALMessage msg;
        msg.hal_major = j["hal_major"];
        msg.hal_minor = j["hal_minor"];
        msg.schema = j["schema"];
        msg.device_id = j["device_id"];
        msg.caps = j["caps"].get<std::vector<std::string>>();
        msg.ts = j["ts"];
        msg.payload = j["payload"].dump();
        return msg;
    }
};

inline std::string getCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto itt = std::chrono::system_clock::to_time_t(now);
    std::ostringstream ss;
    ss << std::put_time(gmtime(&itt), "%FT%TZ");
    return ss.str();
}
`

const cppConfigHeaderTemplate = `#pragma once

#include <string>
#include <chrono>

struct NATSConfig {
    std::string url = "nats://localhost:4222";
    std::chrono::seconds reconnect_delay{5};
    int max_reconnects = -1;
};

struct Config {
    std::string device_id;
    int sample_rate = 10;
    NATSConfig nats;
    std::chrono::steady_clock::time_point start_time;

    static Config load();
};
`

const cppConfigImplTemplate = `#include "config.hpp"
#include <iostream>
#include <fstream>
#include <cstdlib>
#include <yaml-cpp/yaml.h>

Config Config::load() {
    Config config;
    config.start_time = std::chrono::steady_clock::now();

    // Load from environment first
    const char* device_id_env = std::getenv("TAFY_DEVICE_ID");
    config.device_id = device_id_env ? device_id_env : "{{.NameLower}}-01";

    // Load config file
    const char* config_file_env = std::getenv("TAFY_CONFIG_FILE");
    std::string config_file = config_file_env ? config_file_env : "config/default.yaml";

    try {
        YAML::Node yaml = YAML::LoadFile(config_file);
        
        if (yaml["device_id"]) {
            config.device_id = yaml["device_id"].as<std::string>();
        }
        
        if (yaml["sample_rate"]) {
            config.sample_rate = yaml["sample_rate"].as<int>();
        }
        
        if (yaml["nats"]) {
            if (yaml["nats"]["url"]) {
                config.nats.url = yaml["nats"]["url"].as<std::string>();
            }
            if (yaml["nats"]["reconnect_delay"]) {
                config.nats.reconnect_delay = std::chrono::seconds(
                    yaml["nats"]["reconnect_delay"].as<int>()
                );
            }
            if (yaml["nats"]["max_reconnects"]) {
                config.nats.max_reconnects = yaml["nats"]["max_reconnects"].as<int>();
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Warning: Failed to load config file: " << e.what() << std::endl;
        std::cerr << "Using default configuration" << std::endl;
    }

    // Override with environment variables
    const char* nats_url_env = std::getenv("TAFY_NATS_URL");
    if (nats_url_env) {
        config.nats.url = nats_url_env;
    }

    return config;
}
`

const cppDefaultConfigTemplate = `device_id: "{{.NameLower}}-01"
sample_rate: 10

nats:
  url: "nats://localhost:4222"
  reconnect_delay: 5
  max_reconnects: -1

hardware:
  # TODO: Add hardware-specific configuration
`

const cppGitignoreTemplate = `# Build
build/
cmake-build-*/
.cmake/

# Binaries
{{.NameLower}}_driver
*.exe
*.dll
*.so
*.dylib
*.a

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Debug
*.dSYM/
*.pdb

# Dependencies
lib/
vendor/

# Local config
config/local.yaml
.env
`

const cppTestTemplate = `#include <gtest/gtest.h>
#include "config.hpp"
#include "hal_message.hpp"

TEST(ConfigTest, LoadDefault) {
    auto config = Config::load();
    EXPECT_FALSE(config.device_id.empty());
    EXPECT_GT(config.sample_rate, 0);
    EXPECT_FALSE(config.nats.url.empty());
}

TEST(HALMessageTest, Serialization) {
    HALMessage msg;
    msg.hal_major = 1;
    msg.hal_minor = 0;
    msg.schema = "test/schema/1.0";
    msg.device_id = "test-device";
    msg.caps = {"test:v1.0"};
    msg.ts = "2024-01-01T00:00:00Z";
    msg.payload = R"({"test": "value"})";

    std::string json = msg.toJson();
    EXPECT_FALSE(json.empty());

    HALMessage parsed = HALMessage::fromJson(json);
    EXPECT_EQ(parsed.device_id, msg.device_id);
    EXPECT_EQ(parsed.schema, msg.schema);
}

// TODO: Add more tests
`