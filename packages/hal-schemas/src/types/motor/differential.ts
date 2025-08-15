/* eslint-disable */

/**
 * Command schema for differential drive motors
 */
export interface DifferentialDriveMotorCommand {
  /**
   * Linear velocity in meters per second
   */
  linear_meters_per_sec: number;
  /**
   * Angular velocity in radians per second
   */
  angular_rad_per_sec: number;
  /**
   * Optional duration in milliseconds (0 = indefinite)
   */
  duration_ms?: number;
  /**
   * Optional linear acceleration limit
   */
  acceleration_meters_per_sec2?: number;
  /**
   * Optional angular acceleration limit
   */
  angular_acceleration_rad_per_sec2?: number;
  /**
   * Command priority for queue management
   */
  priority?: 'low' | 'normal' | 'high' | 'emergency';
}
