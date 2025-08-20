#include "hal_handler.h"
#include "config.h"

HALHandler::HALHandler() : natsClient(nullptr), deviceInfo(nullptr) {
}

void HALHandler::begin(NATSClient* nats, DeviceInfo* info) {
    natsClient = nats;
    deviceInfo = info;
    
    // Subscribe to HAL command topics
    natsClient->subscribe("hal/v1/motor/cmd", [this](JsonDocument& doc) {
        handleHALMessage(doc);
    });
    
    natsClient->subscribe("hal/v1/system/cmd", [this](JsonDocument& doc) {
        handleHALMessage(doc);
    });
}

void HALHandler::registerHandler(const String& capability, HALCommandHandler handler) {
    commandHandlers[capability] = handler;
    Serial.println("Registered HAL handler for: " + capability);
}

void HALHandler::handleHALMessage(JsonDocument& message) {
    // Validate envelope
    if (!validateEnvelope(message)) {
        Serial.println("Invalid HAL envelope");
        return;
    }
    
    // Check if message is for this device
    String targetDevice = message["device_id"].as<String>();
    if (targetDevice != deviceInfo->getDeviceId() && targetDevice != "*") {
        return; // Not for us
    }
    
    // Extract schema and find handler
    String schema = message["schema"].as<String>();
    
    // Extract capability from schema (e.g., "tafylabs/hal/motor/differential/1.0" -> "motor.differential")
    String capability;
    if (schema.indexOf("motor/differential") != -1) {
        capability = "motor.differential";
    } else if (schema.indexOf("system/heartbeat") != -1) {
        capability = "system.heartbeat";
    }
    // Add more mappings as needed
    
    auto it = commandHandlers.find(capability);
    if (it != commandHandlers.end()) {
        JsonObject payload = message["payload"];
        JsonDocument payloadDoc;
        payloadDoc.set(payload);
        it->second(payloadDoc);
    } else {
        Serial.println("No handler for schema: " + schema);
    }
}

void HALHandler::createEnvelope(JsonDocument& doc, const String& schema) {
    doc["hal_major"] = 1;
    doc["hal_minor"] = 0;
    doc["schema"] = schema;
    doc["device_id"] = deviceInfo->getDeviceId();
    
    JsonArray caps = doc.createNestedArray("caps");
    caps.add("motor.differential:v1.0");
    caps.add("sensor.range.tof:v1.0");
    
    // Add timestamp
    doc["ts"] = millis(); // Should be ISO timestamp in production
    
    // Create empty payload object
    doc.createNestedObject("payload");
}

bool HALHandler::validateEnvelope(JsonDocument& doc) {
    // Check required fields
    if (!doc.containsKey("hal_major") || !doc.containsKey("hal_minor") ||
        !doc.containsKey("schema") || !doc.containsKey("device_id") ||
        !doc.containsKey("caps") || !doc.containsKey("ts") ||
        !doc.containsKey("payload")) {
        return false;
    }
    
    // Check HAL version
    int major = doc["hal_major"];
    if (major != 1) {
        Serial.println("Unsupported HAL version: " + String(major));
        return false;
    }
    
    return true;
}