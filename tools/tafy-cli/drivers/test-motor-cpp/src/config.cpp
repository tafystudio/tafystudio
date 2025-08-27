#include "config.hpp"
#include <iostream>
#include <fstream>
#include <cstdlib>
#include <yaml-cpp/yaml.h>

Config Config::load() {
    Config config;
    config.start_time = std::chrono::steady_clock::now();

    // Load from environment first
    const char* device_id_env = std::getenv("TAFY_DEVICE_ID");
    config.device_id = device_id_env ? device_id_env : "motor-01";

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
