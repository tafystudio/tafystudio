#pragma once

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

class motorDriver {
public:
    explicit motorDriver(const Config& config);
    ~motorDriver();

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
    
    
    // HTTP server
    std::unique_ptr<prometheus::Exposer> exposer_;
    std::thread http_thread_;
};
