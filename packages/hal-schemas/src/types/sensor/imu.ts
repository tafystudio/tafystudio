/* eslint-disable */

/**
 * Data from IMU sensors (accelerometer, gyroscope, magnetometer)
 */
export interface InertialMeasurementUnitData {
  acceleration: {
    /**
     * X-axis acceleration in m/s²
     */
    x_meters_per_sec2: number;
    /**
     * Y-axis acceleration in m/s²
     */
    y_meters_per_sec2: number;
    /**
     * Z-axis acceleration in m/s²
     */
    z_meters_per_sec2: number;
    [k: string]: unknown;
  };
  angular_velocity: {
    /**
     * X-axis angular velocity in rad/s
     */
    x_rad_per_sec: number;
    /**
     * Y-axis angular velocity in rad/s
     */
    y_rad_per_sec: number;
    /**
     * Z-axis angular velocity in rad/s
     */
    z_rad_per_sec: number;
    [k: string]: unknown;
  };
  magnetic_field?: {
    /**
     * X-axis magnetic field in Gauss
     */
    x_gauss?: number;
    /**
     * Y-axis magnetic field in Gauss
     */
    y_gauss?: number;
    /**
     * Z-axis magnetic field in Gauss
     */
    z_gauss?: number;
    [k: string]: unknown;
  };
  orientation?: {
    quaternion?: {
      w: number;
      x: number;
      y: number;
      z: number;
      [k: string]: unknown;
    };
    euler?: {
      /**
       * Roll angle in radians
       */
      roll_rad?: number;
      /**
       * Pitch angle in radians
       */
      pitch_rad?: number;
      /**
       * Yaw angle in radians
       */
      yaw_rad?: number;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  /**
   * IMU temperature
   */
  temperature_celsius?: number;
  calibration_status?: {
    system?: number;
    accelerometer?: number;
    gyroscope?: number;
    magnetometer?: number;
    [k: string]: unknown;
  };
}
