#include "driver.hpp"
#include <iostream>
#include <chrono>
#include <thread>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

motorDriver::motorDriver(const Config& config) : config_(config) {
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

motorDriver::~motorDriver() {
    stop();
    
    if (cmd_sub_) {
        natsSubscription_Destroy(cmd_sub_);
    }
    
    if (nc_) {
        natsConnection_Close(nc_);
        natsConnection_Destroy(nc_);
    }
}

void motorDriver::run() {
    // Subscribe to commands
    std::string cmd_topic = "hal.v1.actuator.motor.cmd";
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

void motorDriver::stop() {
    running_ = false;
}

void motorDriver::processLoop() {
    try {
        
        // TODO: Implement main processing loop for actuator
        
    } catch (const std::exception& e) {
        std::cerr << "Error in process loop: " << e.what() << std::endl;
        if (messages_failed_) {
            messages_failed_->Increment();
        }
    }
}

void motorDriver::publishData(double value) {
    HALMessage msg;
    msg.hal_major = 1;
    msg.hal_minor = 0;
    msg.schema = "tafylabs/hal/actuator/motor/1.0";
    msg.device_id = config_.device_id;
    msg.caps = {"actuator.motor:v1.0"};
    msg.ts = getCurrentTimestamp();
    
    json payload;
    payload["value"] = value;
    payload["unit"] = "TODO";
    msg.payload = payload.dump();
    
    std::string data = msg.toJson();
    std::string topic = "hal.v1.actuator.motor.data";
    
    natsStatus s = natsConnection_PublishString(nc_, topic.c_str(), data.c_str());
    if (s != NATS_OK) {
        throw std::runtime_error("Failed to publish: " + std::string(natsStatus_GetText(s)));
    }
    
    if (messages_published_) {
        messages_published_->Increment();
    }
}

void motorDriver::handleCommand(natsMsg* msg) {
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
        ack.schema = "tafylabs/hal/actuator/motor/ack/1.0";
        ack.device_id = config_.device_id;
        ack.caps = {"actuator.motor:v1.0"};
        ack.ts = getCurrentTimestamp();
        
        json ackPayload;
        ackPayload["status"] = "ok";
        ackPayload["command"] = json::parse(cmd.payload);
        ack.payload = ackPayload.dump();
        
        std::string ackTopic = "hal.v1.actuator.motor.ack";
        natsConnection_PublishString(nc_, ackTopic.c_str(), ack.toJson().c_str());
        
    } catch (const std::exception& e) {
        std::cerr << "Failed to handle command: " << e.what() << std::endl;
    }
    
    natsMsg_Destroy(msg);
}

void motorDriver::commandCallback(natsConnection* nc, natsSubscription* sub, 
                                    natsMsg* msg, void* closure) {
    (void)nc;
    (void)sub;
    
    auto* driver = static_cast<motorDriver*>(closure);
    driver->handleCommand(msg);
}

void motorDriver::setupMetrics() {
    registry_ = std::make_shared<prometheus::Registry>();
    
    auto& messages_published_family = prometheus::BuildCounter()
        .Name("tafy_driver_messages_published_total")
        .Help("Total messages published")
        .Register(*registry_);
    messages_published_ = &messages_published_family.Add({"driver", "motor"});
    
    auto& messages_failed_family = prometheus::BuildCounter()
        .Name("tafy_driver_messages_failed_total")
        .Help("Total failed messages")
        .Register(*registry_);
    messages_failed_ = &messages_failed_family.Add({"driver", "motor"});
    
    
}

void motorDriver::startHttpServer() {
    exposer_ = std::make_unique<prometheus::Exposer>("0.0.0.0:8080");
    exposer_->RegisterCollectable(registry_);
    
    // Note: prometheus-cpp handles /metrics endpoint
    // For /health endpoint, you'd need a separate HTTP server
    // This is simplified for the template
}
