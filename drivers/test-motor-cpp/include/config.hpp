#pragma once

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
