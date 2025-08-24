package server

import (
	"encoding/json"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
	"github.com/pion/webrtc/v3/pkg/media"
	"github.com/rs/zerolog/log"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/camera"
	"github.com/tafystudio/tafystudio/drivers/camera-usb/internal/config"
)

// WebRTCServer handles WebRTC streaming
type WebRTCServer struct {
	camera       *camera.Camera
	config       webrtc.Configuration
	videoTrack   *webrtc.TrackLocalStaticSample
	mu           sync.RWMutex
	peers        map[string]*WebRTCPeer
	frameChannel chan []byte
}

// WebRTCPeer represents a WebRTC peer connection
type WebRTCPeer struct {
	ID         string
	Connection *webrtc.PeerConnection
	VideoTrack *webrtc.TrackLocalStaticSample
}

// SignalMessage represents WebRTC signaling messages
type SignalMessage struct {
	Type      string                     `json:"type"`
	PeerID    string                     `json:"peer_id,omitempty"`
	Offer     *webrtc.SessionDescription `json:"offer,omitempty"`
	Answer    *webrtc.SessionDescription `json:"answer,omitempty"`
	Candidate *webrtc.ICECandidate       `json:"candidate,omitempty"`
}

// NewWebRTCServer creates a new WebRTC server
func NewWebRTCServer(camera *camera.Camera, cfg config.WebRTCConfig) (*WebRTCServer, error) {
	if !cfg.Enabled {
		return nil, fmt.Errorf("WebRTC is disabled in configuration")
	}
	// Create video track
	videoTrack, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeH264},
		"video",
		"tafy-camera",
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create video track: %w", err)
	}
	
	// Build ICE servers configuration
	var iceServers []webrtc.ICEServer
	
	// Add STUN servers
	if len(cfg.STUNServers) > 0 {
		iceServers = append(iceServers, webrtc.ICEServer{
			URLs: cfg.STUNServers,
		})
	}
	
	// Add TURN servers
	for _, turn := range cfg.TURNServers {
		iceServers = append(iceServers, webrtc.ICEServer{
			URLs:       []string{turn.URL},
			Username:   turn.Username,
			Credential: turn.Credential,
		})
	}
	
	server := &WebRTCServer{
		camera: camera,
		config: webrtc.Configuration{
			ICEServers: iceServers,
		},
		videoTrack:   videoTrack,
		peers:        make(map[string]*WebRTCPeer),
		frameChannel: make(chan []byte, 10),
	}
	
	// Start frame sender
	go server.frameSender()
	
	return server, nil
}

// HandleWebRTCSignaling handles WebRTC signaling via WebSocket
func (s *WebRTCServer) HandleWebRTCSignaling(conn *websocket.Conn, peerID string) {
	log.Info().Str("peer_id", peerID).Msg("New WebRTC peer")
	defer log.Info().Str("peer_id", peerID).Msg("WebRTC peer disconnected")
	
	// Clean up on disconnect
	defer func() {
		s.mu.Lock()
		if peer, exists := s.peers[peerID]; exists {
			peer.Connection.Close()
			delete(s.peers, peerID)
		}
		s.mu.Unlock()
	}()
	
	for {
		var msg SignalMessage
		if err := conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Error().Err(err).Msg("WebSocket error")
			}
			break
		}
		
		msg.PeerID = peerID
		
		switch msg.Type {
		case "offer":
			answer, err := s.handleOffer(peerID, msg.Offer)
			if err != nil {
				log.Error().Err(err).Msg("Failed to handle offer")
				continue
			}
			
			response := SignalMessage{
				Type:   "answer",
				Answer: answer,
			}
			
			if err := conn.WriteJSON(response); err != nil {
				log.Error().Err(err).Msg("Failed to send answer")
			}
			
		case "candidate":
			if err := s.handleCandidate(peerID, msg.Candidate); err != nil {
				log.Error().Err(err).Msg("Failed to handle candidate")
			}
		}
	}
}

// handleOffer processes a WebRTC offer and returns an answer
func (s *WebRTCServer) handleOffer(peerID string, offer *webrtc.SessionDescription) (*webrtc.SessionDescription, error) {
	// Create new peer connection
	peerConnection, err := webrtc.NewPeerConnection(s.config)
	if err != nil {
		return nil, fmt.Errorf("failed to create peer connection: %w", err)
	}
	
	// Add video track
	if _, err = peerConnection.AddTrack(s.videoTrack); err != nil {
		peerConnection.Close()
		return nil, fmt.Errorf("failed to add video track: %w", err)
	}
	
	// Handle ICE connection state changes
	peerConnection.OnICEConnectionStateChange(func(connectionState webrtc.ICEConnectionState) {
		log.Info().
			Str("peer_id", peerID).
			Str("state", connectionState.String()).
			Msg("ICE connection state changed")
		
		if connectionState == webrtc.ICEConnectionStateFailed ||
			connectionState == webrtc.ICEConnectionStateDisconnected {
			s.removePeer(peerID)
		}
	})
	
	// Set remote description
	if err = peerConnection.SetRemoteDescription(*offer); err != nil {
		peerConnection.Close()
		return nil, fmt.Errorf("failed to set remote description: %w", err)
	}
	
	// Create answer
	answer, err := peerConnection.CreateAnswer(nil)
	if err != nil {
		peerConnection.Close()
		return nil, fmt.Errorf("failed to create answer: %w", err)
	}
	
	// Set local description
	if err = peerConnection.SetLocalDescription(answer); err != nil {
		peerConnection.Close()
		return nil, fmt.Errorf("failed to set local description: %w", err)
	}
	
	// Store peer
	s.mu.Lock()
	s.peers[peerID] = &WebRTCPeer{
		ID:         peerID,
		Connection: peerConnection,
		VideoTrack: s.videoTrack,
	}
	s.mu.Unlock()
	
	// Update metrics
	RecordWSConnect()
	
	return &answer, nil
}

// handleCandidate adds an ICE candidate to a peer connection
func (s *WebRTCServer) handleCandidate(peerID string, candidate *webrtc.ICECandidate) error {
	s.mu.RLock()
	peer, exists := s.peers[peerID]
	s.mu.RUnlock()
	
	if !exists {
		return fmt.Errorf("peer not found: %s", peerID)
	}
	
	if candidate == nil {
		return nil
	}
	
	return peer.Connection.AddICECandidate(candidate.ToJSON())
}

// removePeer removes a peer connection
func (s *WebRTCServer) removePeer(peerID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	if peer, exists := s.peers[peerID]; exists {
		peer.Connection.Close()
		delete(s.peers, peerID)
		RecordWSDisconnect()
		log.Info().Str("peer_id", peerID).Msg("Removed WebRTC peer")
	}
}

// frameSender continuously sends frames to WebRTC peers
func (s *WebRTCServer) frameSender() {
	ticker := time.NewTicker(time.Second / time.Duration(s.camera.Config.FPS))
	defer ticker.Stop()
	
	for range ticker.C {
		// Get frame from camera
		frame, err := s.camera.GetFrame()
		if err != nil {
			continue
		}
		
		// Get active peers count
		s.mu.RLock()
		peerCount := len(s.peers)
		s.mu.RUnlock()
		
		// Skip if no peers
		if peerCount == 0 {
			continue
		}
		
		// Convert JPEG to H264 sample
		// Note: In a real implementation, you'd use a proper video encoder
		// For now, we'll send JPEG frames as motion JPEG over RTP
		sample := media.Sample{
			Data:     frame,
			Duration: time.Second / time.Duration(s.camera.Config.FPS),
		}
		
		// Write to video track
		if err := s.videoTrack.WriteSample(sample); err != nil {
			if err != io.ErrClosedPipe {
				log.Error().Err(err).Msg("Failed to write video sample")
			}
		}
	}
}

// GetStats returns WebRTC server statistics
func (s *WebRTCServer) GetStats() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	stats := map[string]interface{}{
		"peer_count": len(s.peers),
		"peers":      []map[string]interface{}{},
	}
	
	peers := []map[string]interface{}{}
	for id, peer := range s.peers {
		peerStats := map[string]interface{}{
			"id":    id,
			"state": peer.Connection.ConnectionState().String(),
		}
		
		// Get connection stats
		statsReport := peer.Connection.GetStats()
		for _, s := range statsReport {
			if transportStats, ok := s.(webrtc.TransportStats); ok {
				peerStats["bytes_sent"] = transportStats.BytesSent
				peerStats["bytes_received"] = transportStats.BytesReceived
			}
		}
		
		peers = append(peers, peerStats)
	}
	
	stats["peers"] = peers
	return stats
}

// Close shuts down the WebRTC server
func (s *WebRTCServer) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	// Close all peer connections
	for id, peer := range s.peers {
		peer.Connection.Close()
		delete(s.peers, id)
	}
	
	// Close frame channel
	close(s.frameChannel)
	
	return nil
}