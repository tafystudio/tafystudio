/* eslint-disable */

/**
 * Message broadcast by devices for discovery
 */
export interface DeviceDiscoveryAnnouncement {
  /**
   * Hardware platform type
   */
  device_type: 'esp32' | 'esp8266' | 'rpi' | 'jetson' | 'x86' | 'other';
  /**
   * Unique hardware identifier (MAC address or serial)
   */
  hardware_id: string;
  /**
   * Firmware version (semver)
   */
  firmware_version: string;
  /**
   * List of supported capabilities
   */
  capabilities: string[];
  network?: {
    ip_address?: string;
    mac_address?: string;
    hostname?: string;
    port?: number;
    [k: string]: unknown;
  };
  metadata?: {
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    hardware_revision?: string;
    location?: string;
    description?: string;
    [k: string]: unknown;
  };
  resources?: {
    cpu_cores?: number;
    ram_mb?: number;
    storage_mb?: number;
    cpu_freq_mhz?: number;
    [k: string]: unknown;
  };
}
