#ifndef NATS_CLIENT_H
#define NATS_CLIENT_H

#include <Arduino.h>
#include <WiFiClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <map>
#include <functional>

typedef std::function<void(JsonDocument&)> MessageHandler;

class NATSClient {
private:
    PubSubClient mqttClient;
    String serverUrl;
    String deviceId;
    bool isConnected;
    unsigned long lastReconnectAttempt;
    std::map<String, MessageHandler> handlers;
    
    void parseServerUrl(const String& url);
    static void mqttCallback(char* topic, byte* payload, unsigned int length);
    static NATSClient* instance;
    
public:
    NATSClient(WiFiClient& client);
    
    void setServer(const String& url);
    void setDeviceId(const String& id);
    bool connect();
    void reconnect();
    bool connected();
    void loop();
    
    bool publish(const char* subject, JsonDocument& doc);
    bool subscribe(const char* subject, MessageHandler handler);
    void unsubscribe(const char* subject);
    
    void handleMessage(char* topic, byte* payload, unsigned int length);
};

#endif // NATS_CLIENT_H