/* eslint-disable */

/**
 * Control commands for camera devices
 */
export interface CameraControlCommands {
  /**
   * Command to execute
   */
  command: 'start' | 'stop' | 'snapshot' | 'configure';
  /**
   * Set camera resolution
   */
  resolution?: string;
  /**
   * Set frames per second
   */
  fps?: number;
  /**
   * Set video format
   */
  format?: 'MJPEG' | 'H264' | 'YUYV' | 'RGB' | 'BGR';
  exposure?: {
    /**
     * Exposure mode
     */
    mode?: 'auto' | 'manual';
    /**
     * Manual exposure value
     */
    value?: number;
    [k: string]: unknown;
  };
  gain?: {
    /**
     * Gain mode
     */
    mode?: 'auto' | 'manual';
    /**
     * Manual gain value
     */
    value?: number;
    [k: string]: unknown;
  };
  white_balance?: {
    /**
     * White balance mode
     */
    mode?: 'auto' | 'manual' | 'daylight' | 'cloudy' | 'tungsten' | 'fluorescent';
    /**
     * Manual color temperature in Kelvin
     */
    temperature?: number;
    [k: string]: unknown;
  };
}
