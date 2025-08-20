#include "nats_client.h"
#include "config.h"

NATSClient* NATSClient::instance = nullptr;

NATSClient::NATSClient(WiFiClient& client) : mqttClient(client), isConnected(false), lastReconnectAttempt(0) {
    instance = this;
    mqttClient.setCallback(mqttCallback);
    mqttClient.setBufferSize(1024); // Increase buffer for larger messages
}

void NATSClient::setServer(const String& url) {
    serverUrl = url;
    parseServerUrl(url);
}

void NATSClient::setDeviceId(const String& id) {
    deviceId = id;
}

void NATSClient::parseServerUrl(const String& url) {
    // For now, assume MQTT bridge on port 1883
    // Format: nats://host:port -> mqtt://host:1883
    String host = "localhost";
    int port = 1883;
    
    if (url.startsWith("nats://")) {
        String stripped = url.substring(7);
        int colonIndex = stripped.indexOf(':');
        if (colonIndex > 0) {
            host = stripped.substring(0, colonIndex);
            // For NATS->MQTT bridge, use MQTT port
            port = 1883;
        } else {
            host = stripped;
        }
    }
    
    mqttClient.setServer(host.c_str(), port);
    Serial.println("MQTT Bridge: " + host + ":" + String(port));
}

bool NATSClient::connect() {
    if (!WiFi.isConnected()) {
        return false;
    }
    
    String clientId = "tafy-" + deviceId;
    
    Serial.println("Connecting to NATS/MQTT bridge...");
    if (mqttClient.connect(clientId.c_str())) {
        Serial.println("Connected to NATS/MQTT!");
        isConnected = true;
        
        // Subscribe to device-specific topics
        String deviceTopic = "device/" + deviceId + "/command";
        mqttClient.subscribe(deviceTopic.c_str());
        
        // Subscribe to HAL command topics
        mqttClient.subscribe("hal/v1/motor/cmd");
        mqttClient.subscribe("hal/v1/system/cmd");
        
        return true;
    }
    
    Serial.println("NATS/MQTT connection failed");
    isConnected = false;
    return false;
}

void NATSClient::reconnect() {
    if (millis() - lastReconnectAttempt < NATS_RECONNECT_DELAY) {
        return;
    }
    
    lastReconnectAttempt = millis();
    connect();
}

bool NATSClient::connected() {
    return mqttClient.connected();
}

void NATSClient::loop() {
    mqttClient.loop();
}

bool NATSClient::publish(const char* subject, JsonDocument& doc) {
    if (!connected()) return false;
    
    // Convert NATS subject to MQTT topic (replace . with /)
    String topic = String(subject);
    topic.replace('.', '/');
    
    // Serialize JSON
    String payload;
    serializeJson(doc, payload);
    
    return mqttClient.publish(topic.c_str(), payload.c_str());
}

bool NATSClient::subscribe(const char* subject, MessageHandler handler) {
    // Convert NATS subject to MQTT topic
    String topic = String(subject);
    topic.replace('.', '/');
    
    // Store handler
    handlers[topic] = handler;
    
    // Subscribe via MQTT
    return mqttClient.subscribe(topic.c_str());
}

void NATSClient::unsubscribe(const char* subject) {
    String topic = String(subject);
    topic.replace('.', '/');
    
    handlers.erase(topic);
    mqttClient.unsubscribe(topic.c_str());
}

void NATSClient::mqttCallback(char* topic, byte* payload, unsigned int length) {
    if (instance) {
        instance->handleMessage(topic, payload, length);
    }
}

void NATSClient::handleMessage(char* topic, byte* payload, unsigned int length) {
    // Parse JSON payload
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    
    if (error) {
        Serial.println("JSON parse error: " + String(error.c_str()));
        return;
    }
    
    // Find handler
    String topicStr = String(topic);
    auto it = handlers.find(topicStr);
    if (it != handlers.end()) {
        it->second(doc);
    } else {
        Serial.println("No handler for topic: " + topicStr);
    }
}