#ifndef CONFIG_H
#define CONFIG_H

// Firmware version
#define FIRMWARE_VERSION "1.0.0"

// Hardware pins - Differential drive motors
#define MOTOR_LEFT_PWM    25
#define MOTOR_LEFT_DIR1   26
#define MOTOR_LEFT_DIR2   27
#define MOTOR_RIGHT_PWM   32
#define MOTOR_RIGHT_DIR1  33
#define MOTOR_RIGHT_DIR2  34

// Hardware pins - Encoders (optional)
#define ENCODER_LEFT_A    35
#define ENCODER_LEFT_B    36
#define ENCODER_RIGHT_A   39
#define ENCODER_RIGHT_B   4
#define ENCODERS_ENABLED  false  // Set to true if encoders are connected

// Hardware pins - Time of Flight sensor
#define TOF_SDA 21
#define TOF_SCL 22
#define TOF_XSHUT 23

// Motor configuration
#define MOTOR_PWM_FREQ 1000
#define MOTOR_PWM_RESOLUTION 8
#define MOTOR_MAX_PWM 255
#define MOTOR_DEADZONE 10

// Encoder configuration (if enabled)
#define ENCODER_COUNTS_PER_REV 20  // Encoder counts per motor revolution
#define GEAR_RATIO 48              // Motor gear ratio
#define WHEEL_DIAMETER_MM 70       // Wheel diameter in mm

// Network configuration
#define WIFI_CONNECT_TIMEOUT 30000  // 30 seconds
#define NATS_RECONNECT_DELAY 5000   // 5 seconds
#define NATS_KEEPALIVE 60000        // 60 seconds

// Sensor configuration
#define SENSOR_RANGE_MAX_MM 2000    // 2 meters
#define SENSOR_RANGE_MIN_MM 30      // 30mm minimum
#define SENSOR_CHANGE_THRESHOLD 50  // Report if change > 50mm

// Safety limits
#define EMERGENCY_STOP_DISTANCE_MM 100  // Stop if object closer than 100mm
#define MOTOR_TIMEOUT_MS 1000           // Stop motors after 1s without command

#endif // CONFIG_H