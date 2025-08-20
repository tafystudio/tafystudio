#ifndef MOTOR_CONTROLLER_H
#define MOTOR_CONTROLLER_H

#include <Arduino.h>
#include <ArduinoJson.h>

class MotorController {
private:
    int leftSpeed;
    int rightSpeed;
    unsigned long lastCommandTime;
    bool emergencyStop;
    
    // PWM channels
    static const int CHANNEL_LEFT = 0;
    static const int CHANNEL_RIGHT = 1;
    
    void setMotorPWM(int channel, int speed);
    int constrainSpeed(int speed);
    
public:
    MotorController();
    void begin();
    void update();
    
    void setSpeed(int left, int right);
    void stop();
    void emergencyStopTrigger();
    void emergencyStopClear();
    
    void handleCommand(JsonDocument& command);
    void publishTelemetry();
    
    int getLeftSpeed() { return leftSpeed; }
    int getRightSpeed() { return rightSpeed; }
    bool isEmergencyStopped() { return emergencyStop; }
};

#endif // MOTOR_CONTROLLER_H