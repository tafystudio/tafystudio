#ifndef MOTOR_CONTROLLER_H
#define MOTOR_CONTROLLER_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include <cmath>
#include "nats_client.h"

class MotorController {
private:
    int leftSpeed;
    int rightSpeed;
    int targetLeftSpeed;
    int targetRightSpeed;
    unsigned long lastCommandTime;
    unsigned long lastUpdateTime;
    bool emergencyStop;
    
    // PWM channels
    static const int CHANNEL_LEFT = 0;
    static const int CHANNEL_RIGHT = 1;
    
    // Robot parameters
    float wheelBase;      // meters
    float wheelRadius;    // meters
    float maxLinearVel;   // meters/second
    float maxAngularVel;  // radians/second
    float rampRate;       // percent per second
    
    // Odometry
    float x, y, theta;    // Position and orientation
    unsigned long lastOdometryTime;
    
    void setMotorPWM(int channel, int speed);
    int constrainSpeed(int speed);
    void updateOdometry();
    void applySpeedRamping();
    void applyMotorSpeeds();
    
public:
    MotorController();
    void begin();
    void update();
    
    void setSpeed(int left, int right);
    void stop();
    void emergencyStopTrigger();
    void emergencyStopClear();
    
    void handleCommand(JsonDocument& command);
    void publishTelemetry(NATSClient* natsClient, const String& deviceId);
    void setRobotParameters(float wb, float wr, float mlv, float mav);
    void differentialDriveIK(float linear, float angular, int& leftOut, int& rightOut);
    
    int getLeftSpeed() { return leftSpeed; }
    int getRightSpeed() { return rightSpeed; }
    bool isEmergencyStopped() { return emergencyStop; }
    void getPosition(float& px, float& py, float& ptheta) { px = x; py = y; ptheta = theta; }
    void resetOdometry() { x = y = theta = 0; }
};

#endif // MOTOR_CONTROLLER_H