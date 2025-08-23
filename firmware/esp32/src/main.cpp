/**
 * Tafy ESP32 Firmware
 * Main entry point for robot node firmware
 */

#include <Arduino.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include "config.h"
#include "wifi_manager.h"
#include "nats_client.h"
#include "device_info.h"
#include "hal_handler.h"
#include "motor_controller.h"
#include "sensor_manager.h"

// Global instances
Preferences preferences;
WiFiClient wifiClient;
DeviceInfo deviceInfo;
WiFiManager wifiManager;
NATSClient natsClient(wifiClient);
HALHandler halHandler;
MotorController motorController;
SensorManager sensorManager;

// Timing
unsigned long lastHeartbeat = 0;
unsigned long lastSensorRead = 0;
unsigned long lastMotorTelemetry = 0;
unsigned long lastSensorTelemetry = 0;
const unsigned long HEARTBEAT_INTERVAL = 10000; // 10 seconds
const unsigned long SENSOR_INTERVAL = 50;       // 50ms for sensor reading
const unsigned long MOTOR_TELEMETRY_INTERVAL = 100; // 100ms
const unsigned long SENSOR_TELEMETRY_INTERVAL = 100; // 100ms

void setup() {
    Serial.begin(115200);
    Serial.println("\n\nTafy ESP32 Firmware");
    Serial.println("Version: " + String(FIRMWARE_VERSION));
    
    // Initialize preferences
    preferences.begin("tafy", false);
    
    // Initialize device info
    deviceInfo.initialize();
    Serial.println("Device ID: " + deviceInfo.getDeviceId());
    
    // Initialize WiFi
    if (!wifiManager.begin()) {
        Serial.println("Failed to connect to WiFi");
        ESP.restart();
    }
    
    // Start mDNS
    String hostname = "tafy-" + deviceInfo.getDeviceId();
    if (MDNS.begin(hostname.c_str())) {
        Serial.println("mDNS started: " + hostname + ".local");
        
        // Add service
        MDNS.addService("_tafynode", "_tcp", 80);
        
        // Add text records
        MDNS.addServiceTxt("_tafynode", "_tcp", "node_id", deviceInfo.getDeviceId().c_str());
        MDNS.addServiceTxt("_tafynode", "_tcp", "type", "esp32");
        MDNS.addServiceTxt("_tafynode", "_tcp", "version", FIRMWARE_VERSION);
        MDNS.addServiceTxt("_tafynode", "_tcp", "caps", "motor.differential:v1.0,sensor.range.tof:v1.0");
    }
    
    // Connect to NATS
    if (preferences.getString("nats_url", "").length() > 0) {
        natsClient.setServer(preferences.getString("nats_url", ""));
        natsClient.setDeviceId(deviceInfo.getDeviceId());
        natsClient.connect();
    }
    
    // Initialize HAL handler
    halHandler.begin(&natsClient, &deviceInfo);
    
    // Initialize hardware
    motorController.begin();
    sensorManager.begin();
    
    // Register HAL command handlers
    halHandler.registerHandler("motor.differential", 
        [](JsonDocument& payload) {
            motorController.handleCommand(payload);
        });
    
    halHandler.registerHandler("sensor.range-tof",
        [](JsonDocument& payload) {
            sensorManager.handleCommand(payload);
        });
    
    Serial.println("Setup complete!");
}

void loop() {
    unsigned long now = millis();
    
    // Handle WiFi reconnection
    if (WiFi.status() != WL_CONNECTED) {
        wifiManager.reconnect();
    }
    
    // Handle NATS connection
    if (natsClient.connected()) {
        natsClient.loop();
    } else if (preferences.getString("nats_url", "").length() > 0) {
        natsClient.reconnect();
    }
    
    // Send heartbeat
    if (now - lastHeartbeat > HEARTBEAT_INTERVAL) {
        lastHeartbeat = now;
        sendHeartbeat();
    }
    
    // Read sensors
    if (now - lastSensorRead > SENSOR_INTERVAL) {
        lastSensorRead = now;
        sensorManager.update();
        
        // Check for obstacle detection (emergency stop)
        if (sensorManager.isTofAvailable() && 
            sensorManager.getFilteredRange() > 0 &&
            sensorManager.getFilteredRange() < EMERGENCY_STOP_DISTANCE_MM) {
            motorController.emergencyStopTrigger();
        }
    }
    
    // Update motor controller
    motorController.update();
    
    // Publish motor telemetry
    if (now - lastMotorTelemetry > MOTOR_TELEMETRY_INTERVAL) {
        lastMotorTelemetry = now;
        motorController.publishTelemetry(&natsClient, deviceInfo.getDeviceId());
    }
    
    // Publish sensor telemetry
    if (now - lastSensorTelemetry > SENSOR_TELEMETRY_INTERVAL) {
        lastSensorTelemetry = now;
        sensorManager.publishTelemetry(&natsClient, deviceInfo.getDeviceId());
        
        // Also publish event-based data if significant change
        if (sensorManager.hasSignificantChange()) {
            publishSensorData();
        }
    }
    
    // Handle serial commands (for debugging)
    if (Serial.available()) {
        handleSerialCommand();
    }
    
    // Small delay to prevent watchdog
    delay(1);
}

void sendHeartbeat() {
    if (!natsClient.connected()) return;
    
    JsonDocument doc;
    doc["node_id"] = deviceInfo.getDeviceId();
    doc["type"] = "esp32";
    doc["status"] = "online";
    doc["uptime"] = millis();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["wifi_rssi"] = WiFi.RSSI();
    doc["ip_address"] = WiFi.localIP().toString();
    
    String subject = "node." + deviceInfo.getDeviceId() + ".heartbeat";
    natsClient.publish(subject.c_str(), doc);
}

void publishSensorData() {
    if (!natsClient.connected()) return;
    
    // Publish range sensor data (event-based on significant change)
    float range = sensorManager.getFilteredRange();
    if (range >= 0) {
        JsonDocument rangeDoc;
        halHandler.createEnvelope(rangeDoc, "tafylabs/hal/sensor/range-tof/1.0");
        
        JsonObject payload = rangeDoc["payload"].to<JsonObject>();
        payload["sensor_id"] = "tof-front";
        payload["range_meters"] = range / 1000.0; // Convert mm to meters
        payload["quality"] = sensorManager.getRangeQuality();
        payload["status"] = sensorManager.getRangeQuality() > 0 ? "ok" : "error";
        payload["event"] = "significant_change";
        
        // Add threshold breach info if applicable
        if (range < EMERGENCY_STOP_DISTANCE_MM) {
            payload["alert"] = "obstacle_detected";
            payload["alert_threshold_mm"] = EMERGENCY_STOP_DISTANCE_MM;
        }
        
        natsClient.publish("hal.v1.sensor.range.event", rangeDoc);
    }
}

void handleSerialCommand() {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "info") {
        Serial.println("Device ID: " + deviceInfo.getDeviceId());
        Serial.println("IP: " + WiFi.localIP().toString());
        Serial.println("NATS: " + String(natsClient.connected() ? "Connected" : "Disconnected"));
        Serial.println("Free Heap: " + String(ESP.getFreeHeap()));
    } else if (command == "restart") {
        Serial.println("Restarting...");
        ESP.restart();
    } else if (command.startsWith("motor ")) {
        // Parse motor command: motor <left> <right>
        int spaceIndex = command.indexOf(' ', 6);
        if (spaceIndex > 0) {
            int left = command.substring(6, spaceIndex).toInt();
            int right = command.substring(spaceIndex + 1).toInt();
            motorController.setSpeed(left, right);
            Serial.println("Motor speeds set: L=" + String(left) + " R=" + String(right));
        }
    } else if (command == "sensor") {
        // Display sensor info
        if (sensorManager.isTofAvailable()) {
            Serial.println("ToF Sensor Status:");
            Serial.println("  Range: " + String(sensorManager.getRange()) + " mm (raw)");
            Serial.println("  Filtered: " + String(sensorManager.getFilteredRange()) + " mm");
            Serial.println("  Quality: " + String(sensorManager.getRangeQuality()) + "%");
            
            uint32_t total, valid, timeouts;
            sensorManager.getStatistics(total, valid, timeouts);
            Serial.println("  Total readings: " + String(total));
            Serial.println("  Valid readings: " + String(valid));
            Serial.println("  Timeouts: " + String(timeouts));
        } else {
            Serial.println("ToF sensor not available");
        }
    } else if (command.startsWith("calibrate ")) {
        // Calibrate sensor: calibrate <actual_distance_mm>
        int actualDist = command.substring(10).toInt();
        if (actualDist > 0) {
            sensorManager.calibrate(actualDist);
        }
    } else if (command == "clear estop") {
        motorController.emergencyStopClear();
        Serial.println("Emergency stop cleared");
    } else {
        Serial.println("Unknown command: " + command);
        Serial.println("Available commands:");
        Serial.println("  info - Show device info");
        Serial.println("  restart - Restart device");
        Serial.println("  motor <left> <right> - Set motor speeds");
        Serial.println("  sensor - Show sensor status");
        Serial.println("  calibrate <mm> - Calibrate sensor");
        Serial.println("  clear estop - Clear emergency stop");
    }
}