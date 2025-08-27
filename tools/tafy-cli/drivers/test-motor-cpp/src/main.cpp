#include <iostream>
#include <csignal>
#include <memory>
#include <thread>
#include <chrono>

#include "config.hpp"
#include "driver.hpp"

std::unique_ptr<motorDriver> g_driver;

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
        g_driver = std::make_unique<motorDriver>(config);
        
        std::cout << "Starting motor driver (ID: " << config.device_id << ")" << std::endl;
        g_driver->run();
        
    } catch (const std::exception& e) {
        std::cerr << "Driver failed: " << e.what() << std::endl;
        return 1;
    }

    std::cout << "Driver stopped" << std::endl;
    return 0;
}
