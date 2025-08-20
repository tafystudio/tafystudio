#ifndef DEVICE_INFO_H
#define DEVICE_INFO_H

#include <Arduino.h>
#include <Preferences.h>

class DeviceInfo {
private:
    String deviceId;
    String deviceType;
    Preferences* prefs;
    
public:
    DeviceInfo();
    void initialize();
    String getDeviceId();
    String getDeviceType();
    String getChipId();
    void regenerateId();
};

#endif // DEVICE_INFO_H