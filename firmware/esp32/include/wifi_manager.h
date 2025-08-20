#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>
#include <Preferences.h>
#include <ESPAsyncWebServer.h>
#include <ESPAsyncWiFiManager.h>

class WiFiManager {
private:
    Preferences* prefs;
    AsyncWebServer* server;
    AsyncWiFiManager* wifiManager;
    bool configured;
    unsigned long lastReconnectAttempt;
    
public:
    WiFiManager();
    ~WiFiManager();
    
    bool begin();
    void reconnect();
    bool isConfigured();
    void startConfigPortal();
    void saveCredentials(const String& ssid, const String& password);
    String getSSID();
    bool isConnected();
};

#endif // WIFI_MANAGER_H