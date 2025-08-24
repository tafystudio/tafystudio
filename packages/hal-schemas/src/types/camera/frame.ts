/* eslint-disable */

/**
 * Metadata about a camera frame for streaming
 */
export interface CameraFrameMetadata {
  /**
   * Unique identifier for this camera on the device
   */
  camera_id: string;
  /**
   * Frame resolution (e.g., '640x480')
   */
  resolution: string;
  /**
   * Video format/encoding
   */
  format: 'MJPEG' | 'H264' | 'YUYV' | 'RGB' | 'BGR';
  /**
   * Frames per second
   */
  fps?: number;
  /**
   * Frame timestamp in milliseconds since epoch
   */
  timestamp: number;
  /**
   * Total frames captured since start
   */
  frame_count?: number;
  /**
   * Frame size in bytes
   */
  size?: number;
  /**
   * URL to access the video stream
   */
  url?: string;
  /**
   * Camera exposure value
   */
  exposure?: number;
  /**
   * Camera gain value
   */
  gain?: number;
}
