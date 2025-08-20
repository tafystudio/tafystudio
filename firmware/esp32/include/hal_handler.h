#ifndef HAL_HANDLER_H
#define HAL_HANDLER_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include <map>
#include <functional>
#include "nats_client.h"
#include "device_info.h"

typedef std::function<void(JsonDocument&)> HALCommandHandler;

class HALHandler {
private:
    NATSClient* natsClient;
    DeviceInfo* deviceInfo;
    std::map<String, HALCommandHandler> commandHandlers;
    
public:
    HALHandler();
    void begin(NATSClient* nats, DeviceInfo* info);
    
    void registerHandler(const String& capability, HALCommandHandler handler);
    void handleHALMessage(JsonDocument& message);
    
    void createEnvelope(JsonDocument& doc, const String& schema);
    bool validateEnvelope(JsonDocument& doc);
};

#endif // HAL_HANDLER_H