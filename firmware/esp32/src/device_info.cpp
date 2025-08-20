#include "device_info.h"
#include <WiFi.h>

extern Preferences preferences;

DeviceInfo::DeviceInfo() : deviceType("esp32") {
    prefs = &preferences;
}

void DeviceInfo::initialize() {
    // Try to load existing device ID
    deviceId = prefs->getString("device_id", "");
    
    // Generate new ID if none exists
    if (deviceId.length() == 0) {
        regenerateId();
    }
}

String DeviceInfo::getDeviceId() {
    return deviceId;
}

String DeviceInfo::getDeviceType() {
    return deviceType;
}

String DeviceInfo::getChipId() {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char chipId[13];
    snprintf(chipId, sizeof(chipId), "%02x%02x%02x%02x%02x%02x", 
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    return String(chipId);
}

void DeviceInfo::regenerateId() {
    // Generate device ID based on MAC address
    String chipId = getChipId();
    deviceId = "esp32-" + chipId.substring(6); // Use last 6 chars of MAC
    
    // Save to preferences
    prefs->putString("device_id", deviceId);
    
    Serial.println("Generated device ID: " + deviceId);
}