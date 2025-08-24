package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/viper"
)

// Config represents the complete configuration for the camera driver
type Config struct {
	Device string        `mapstructure:"device"`
	Node   NodeConfig    `mapstructure:"node"`
	Camera CameraConfig  `mapstructure:"camera"`
	NATS   NATSConfig    `mapstructure:"nats"`
	Server ServerConfig  `mapstructure:"server"`
	Log    LogConfig     `mapstructure:"log"`
	WebRTC WebRTCConfig  `mapstructure:"webrtc"`
}

// NodeConfig contains node identification settings
type NodeConfig struct {
	ID   string `mapstructure:"id"`
	Type string `mapstructure:"type"`
}

// CameraConfig contains camera-specific settings
type CameraConfig struct {
	Width       int    `mapstructure:"width"`
	Height      int    `mapstructure:"height"`
	FPS         int    `mapstructure:"fps"`
	Format      string `mapstructure:"format"`
	BufferCount int    `mapstructure:"buffer_count"`
	Quality     int    `mapstructure:"quality"` // JPEG quality 1-100
}

// NATSConfig contains NATS connection settings
type NATSConfig struct {
	URL         string `mapstructure:"url"`
	Name        string `mapstructure:"name"`
	ReconnectMS int    `mapstructure:"reconnect_ms"`
}

// ServerConfig contains HTTP server settings
type ServerConfig struct {
	HTTPPort    int    `mapstructure:"http_port"`
	MetricsPort int    `mapstructure:"metrics_port"`
	ReadTimeout int    `mapstructure:"read_timeout"`
	WriteTimeout int   `mapstructure:"write_timeout"`
	CORSOrigins string `mapstructure:"cors_origins"`
}

// LogConfig contains logging settings
type LogConfig struct {
	Level  string `mapstructure:"level"`
	Pretty bool   `mapstructure:"pretty"`
}

// WebRTCConfig contains WebRTC settings
type WebRTCConfig struct {
	Enabled     bool         `mapstructure:"enabled"`
	STUNServers []string     `mapstructure:"stun_servers"`
	TURNServers []TURNServer `mapstructure:"turn_servers"`
}

// TURNServer represents a TURN server configuration
type TURNServer struct {
	URL        string `mapstructure:"url"`
	Username   string `mapstructure:"username"`
	Credential string `mapstructure:"credential"`
}

// Load reads configuration from file and environment
func Load() (*Config, error) {
	cfg := &Config{
		Device: "/dev/video0",
		Node: NodeConfig{
			ID:   generateNodeID(),
			Type: "camera-usb",
		},
		Camera: CameraConfig{
			Width:       640,
			Height:      480,
			FPS:         30,
			Format:      "MJPEG",
			BufferCount: 4,
			Quality:     85,
		},
		NATS: NATSConfig{
			URL:         "nats://localhost:4222",
			Name:        "camera-driver",
			ReconnectMS: 5000,
		},
		Server: ServerConfig{
			HTTPPort:     8080,
			MetricsPort:  8081,
			ReadTimeout:  10,
			WriteTimeout: 10,
			CORSOrigins:  "*",
		},
		Log: LogConfig{
			Level:  "info",
			Pretty: false,
		},
		WebRTC: WebRTCConfig{
			Enabled: true,
			STUNServers: []string{
				"stun:stun.l.google.com:19302",
			},
			TURNServers: []TURNServer{},
		},
	}
	
	// Unmarshal config
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}
	
	// Validate configuration
	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}
	
	return cfg, nil
}

// Validate checks if the configuration is valid
func (c *Config) Validate() error {
	// Check device exists
	if _, err := os.Stat(c.Device); err != nil {
		return fmt.Errorf("camera device not found: %s", c.Device)
	}
	
	// Validate camera settings
	if c.Camera.Width <= 0 || c.Camera.Height <= 0 {
		return fmt.Errorf("invalid camera resolution: %dx%d", c.Camera.Width, c.Camera.Height)
	}
	
	if c.Camera.FPS <= 0 || c.Camera.FPS > 120 {
		return fmt.Errorf("invalid FPS: %d", c.Camera.FPS)
	}
	
	if c.Camera.Quality < 1 || c.Camera.Quality > 100 {
		return fmt.Errorf("invalid JPEG quality: %d (must be 1-100)", c.Camera.Quality)
	}
	
	// Validate ports
	if c.Server.HTTPPort <= 0 || c.Server.HTTPPort > 65535 {
		return fmt.Errorf("invalid HTTP port: %d", c.Server.HTTPPort)
	}
	
	if c.Server.MetricsPort <= 0 || c.Server.MetricsPort > 65535 {
		return fmt.Errorf("invalid metrics port: %d", c.Server.MetricsPort)
	}
	
	return nil
}

// generateNodeID creates a unique node ID if not provided
func generateNodeID() string {
	hostname, _ := os.Hostname()
	if hostname == "" {
		hostname = "unknown"
	}
	
	// Clean hostname for use as node ID
	nodeID := strings.ReplaceAll(hostname, ".", "-")
	nodeID = strings.ToLower(nodeID)
	
	return fmt.Sprintf("camera-%s", nodeID)
}