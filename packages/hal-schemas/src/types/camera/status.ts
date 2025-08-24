/* eslint-disable */

/**
 * Status information for a camera device
 */
export interface CameraStatus {
  /**
   * Unique identifier for this camera on the device
   */
  camera_id: string;
  /**
   * Current camera status
   */
  status: 'ready' | 'streaming' | 'error' | 'disconnected';
  /**
   * Current resolution
   */
  resolution?: string;
  /**
   * Current frames per second
   */
  fps?: number;
  /**
   * Total frames captured
   */
  frame_count?: number;
  /**
   * Total capture errors
   */
  error_count?: number;
  /**
   * Last error message
   */
  last_error?: string;
  /**
   * URL to access the video stream
   */
  stream_url?: string;
  capabilities?: {
    /**
     * Supported resolutions
     */
    resolutions?: string[];
    /**
     * Supported video formats
     */
    formats?: string[];
    /**
     * Maximum supported FPS
     */
    max_fps?: number;
    [k: string]: unknown;
  };
}
