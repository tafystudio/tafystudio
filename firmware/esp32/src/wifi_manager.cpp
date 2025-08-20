#include "wifi_manager.h"
#include "config.h"
#include <Arduino.h>

extern Preferences preferences;

WiFiManager::WiFiManager() : server(nullptr), wifiManager(nullptr), configured(false), lastReconnectAttempt(0) {
    prefs = &preferences;
}

WiFiManager::~WiFiManager() {
    if (server) delete server;
    if (wifiManager) delete wifiManager;
}

bool WiFiManager::begin() {
    // Check if we have saved credentials
    String ssid = prefs->getString("wifi_ssid", "");
    String password = prefs->getString("wifi_pass", "");
    
    if (ssid.length() > 0) {
        Serial.println("Connecting to saved WiFi: " + ssid);
        WiFi.mode(WIFI_STA);
        WiFi.begin(ssid.c_str(), password.c_str());
        
        // Wait for connection
        unsigned long startTime = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - startTime < WIFI_CONNECT_TIMEOUT) {
            delay(500);
            Serial.print(".");
        }
        Serial.println();
        
        if (WiFi.status() == WL_CONNECTED) {
            Serial.println("Connected to WiFi!");
            Serial.println("IP: " + WiFi.localIP().toString());
            configured = true;
            return true;
        } else {
            Serial.println("Failed to connect to saved WiFi");
        }
    }
    
    // Start config portal
    startConfigPortal();
    return false;
}

void WiFiManager::startConfigPortal() {
    Serial.println("Starting WiFi configuration portal");
    
    // Create unique AP name
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char apName[32];
    snprintf(apName, sizeof(apName), "Tafy-ESP32-%02X%02X%02X", mac[3], mac[4], mac[5]);
    
    // Start access point
    WiFi.mode(WIFI_AP);
    WiFi.softAP(apName);
    Serial.println("AP started: " + String(apName));
    Serial.println("AP IP: " + WiFi.softAPIP().toString());
    
    // Create web server
    if (!server) {
        server = new AsyncWebServer(80);
    }
    
    // Serve configuration page
    server->on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        String html = R"(
<!DOCTYPE html>
<html>
<head>
    <title>Tafy ESP32 Setup</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial; text-align: center; padding: 20px; }
        input { width: 80%; padding: 10px; margin: 10px; }
        button { background: #2196F3; color: white; padding: 10px 20px; border: none; }
    </style>
</head>
<body>
    <h1>Tafy ESP32 Setup</h1>
    <form action="/save" method="POST">
        <input type="text" name="ssid" placeholder="WiFi Network Name" required><br>
        <input type="password" name="pass" placeholder="WiFi Password" required><br>
        <input type="text" name="nats" placeholder="NATS URL (optional)"><br>
        <button type="submit">Save & Connect</button>
    </form>
</body>
</html>
        )";
        request->send(200, "text/html", html);
    });
    
    // Handle form submission
    server->on("/save", HTTP_POST, [this](AsyncWebServerRequest *request) {
        String ssid = "";
        String pass = "";
        String nats = "";
        
        if (request->hasParam("ssid", true)) {
            ssid = request->getParam("ssid", true)->value();
        }
        if (request->hasParam("pass", true)) {
            pass = request->getParam("pass", true)->value();
        }
        if (request->hasParam("nats", true)) {
            nats = request->getParam("nats", true)->value();
        }
        
        if (ssid.length() > 0 && pass.length() > 0) {
            saveCredentials(ssid, pass);
            if (nats.length() > 0) {
                prefs->putString("nats_url", nats);
            }
            
            request->send(200, "text/html", "Configuration saved! Restarting...");
            delay(1000);
            ESP.restart();
        } else {
            request->send(400, "text/plain", "Missing parameters");
        }
    });
    
    server->begin();
}

void WiFiManager::saveCredentials(const String& ssid, const String& password) {
    prefs->putString("wifi_ssid", ssid);
    prefs->putString("wifi_pass", password);
    configured = true;
}

void WiFiManager::reconnect() {
    if (millis() - lastReconnectAttempt < 5000) {
        return; // Don't reconnect too frequently
    }
    
    lastReconnectAttempt = millis();
    
    String ssid = prefs->getString("wifi_ssid", "");
    String password = prefs->getString("wifi_pass", "");
    
    if (ssid.length() > 0) {
        Serial.println("Attempting WiFi reconnection...");
        WiFi.disconnect();
        WiFi.begin(ssid.c_str(), password.c_str());
    }
}

bool WiFiManager::isConfigured() {
    return configured;
}

String WiFiManager::getSSID() {
    return prefs->getString("wifi_ssid", "");
}

bool WiFiManager::isConnected() {
    return WiFi.status() == WL_CONNECTED;
}