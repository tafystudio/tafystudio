package discovery

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/nats"
)

// Service provides camera discovery functionality
type Service struct {
	mu              sync.RWMutex
	cameras         []Camera
	lastScan        time.Time
	scanInterval    time.Duration
	natsClient      *nats.Client
	nodeID          string
	stopChan        chan struct{}
	running         bool
}

// NewService creates a new discovery service
func NewService(natsClient *nats.Client, nodeID string, scanInterval time.Duration) *Service {
	return &Service{
		natsClient:   natsClient,
		nodeID:       nodeID,
		scanInterval: scanInterval,
		stopChan:     make(chan struct{}),
	}
}

// Start begins the discovery service
func (s *Service) Start() error {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return fmt.Errorf("discovery service already running")
	}
	s.running = true
	s.mu.Unlock()
	
	// Do initial scan
	if err := s.scan(); err != nil {
		log.Error().Err(err).Msg("Initial camera scan failed")
	}
	
	// Start periodic scanning
	go s.scanLoop()
	
	// Subscribe to discovery requests
	if s.natsClient != nil && s.natsClient.Connected() {
		go s.handleDiscoveryRequests()
	}
	
	log.Info().Msg("Camera discovery service started")
	return nil
}

// Stop stops the discovery service
func (s *Service) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	if !s.running {
		return
	}
	
	s.running = false
	close(s.stopChan)
	
	log.Info().Msg("Camera discovery service stopped")
}

// GetCameras returns the list of discovered cameras
func (s *Service) GetCameras() []Camera {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	// Return a copy
	cameras := make([]Camera, len(s.cameras))
	copy(cameras, s.cameras)
	return cameras
}

// GetCamera returns a specific camera by device path
func (s *Service) GetCamera(device string) (*Camera, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	for _, cam := range s.cameras {
		if cam.Device == device {
			// Return a copy
			camera := cam
			return &camera, nil
		}
	}
	
	return nil, fmt.Errorf("camera not found: %s", device)
}

// scan performs a camera discovery scan
func (s *Service) scan() error {
	log.Debug().Msg("Scanning for cameras")
	
	cameras, err := DiscoverCameras()
	if err != nil {
		return fmt.Errorf("camera discovery failed: %w", err)
	}
	
	s.mu.Lock()
	s.cameras = cameras
	s.lastScan = time.Now()
	s.mu.Unlock()
	
	log.Info().Int("count", len(cameras)).Msg("Camera scan complete")
	
	// Publish discovery results if NATS is available
	if s.natsClient != nil && s.natsClient.Connected() {
		s.publishDiscoveryResults()
	}
	
	return nil
}

// scanLoop performs periodic scanning
func (s *Service) scanLoop() {
	ticker := time.NewTicker(s.scanInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			if err := s.scan(); err != nil {
				log.Error().Err(err).Msg("Periodic camera scan failed")
			}
		case <-s.stopChan:
			return
		}
	}
}

// handleDiscoveryRequests handles NATS discovery requests
func (s *Service) handleDiscoveryRequests() {
	subject := fmt.Sprintf("hal.v1.camera.discovery.request.%s", s.nodeID)
	
	err := s.natsClient.SubscribeCommands(func(cmd interface{}) {
		// Handle discovery request
		s.mu.RLock()
		cameras := s.cameras
		lastScan := s.lastScan
		s.mu.RUnlock()
		
		// Send response
		response := map[string]interface{}{
			"node_id":   s.nodeID,
			"cameras":   cameras,
			"last_scan": lastScan,
			"timestamp": time.Now(),
		}
		
		data, err := json.Marshal(response)
		if err != nil {
			log.Error().Err(err).Msg("Failed to marshal discovery response")
			return
		}
		
		replySubject := fmt.Sprintf("hal.v1.camera.discovery.response.%s", s.nodeID)
		if err := s.natsClient.Publish(replySubject, data); err != nil {
			log.Error().Err(err).Msg("Failed to publish discovery response")
		}
	})
	
	if err != nil {
		log.Error().Err(err).Msg("Failed to subscribe to discovery requests")
	}
}

// publishDiscoveryResults publishes camera discovery results
func (s *Service) publishDiscoveryResults() {
	s.mu.RLock()
	cameras := s.cameras
	s.mu.RUnlock()
	
	// Create discovery announcement
	announcement := map[string]interface{}{
		"node_id":     s.nodeID,
		"camera_count": len(cameras),
		"cameras":     cameras,
		"timestamp":   time.Now(),
	}
	
	data, err := json.Marshal(announcement)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal discovery announcement")
		return
	}
	
	// Publish to discovery topic
	subject := fmt.Sprintf("hal.v1.camera.discovery.announce.%s", s.nodeID)
	if err := s.natsClient.Publish(subject, data); err != nil {
		log.Error().Err(err).Msg("Failed to publish discovery announcement")
	}
}

// DiscoveryStatus represents the discovery service status
type DiscoveryStatus struct {
	Running      bool      `json:"running"`
	CameraCount  int       `json:"camera_count"`
	LastScan     time.Time `json:"last_scan"`
	ScanInterval string    `json:"scan_interval"`
}

// GetStatus returns the discovery service status
func (s *Service) GetStatus() DiscoveryStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	return DiscoveryStatus{
		Running:      s.running,
		CameraCount:  len(s.cameras),
		LastScan:     s.lastScan,
		ScanInterval: s.scanInterval.String(),
	}
}