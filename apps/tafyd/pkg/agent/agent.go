package agent

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/tafystudio/tafystudio/apps/tafyd/pkg/discovery"
	tafynats "github.com/tafystudio/tafystudio/apps/tafyd/pkg/nats"
	"go.uber.org/zap"
)

type Config struct {
	NodeID   string
	NATSUrl  string
	Role     string
	MDNSPort int
}

type Agent struct {
	config    Config
	logger    *zap.Logger
	nats      *tafynats.Client
	discovery *discovery.Service
}

func New(config Config) (*Agent, error) {
	logger := zap.L().Named("agent")

	// Generate node ID if not provided
	if config.NodeID == "" {
		config.NodeID = fmt.Sprintf("node-%s", uuid.New().String()[:8])
	}

	return &Agent{
		config: config,
		logger: logger,
	}, nil
}

func (a *Agent) Run(ctx context.Context) error {
	a.logger.Info("Agent starting", zap.String("node_id", a.config.NodeID))

	// Connect to NATS
	natsClient, err := tafynats.NewClient(a.config.NATSUrl, a.config.NodeID)
	if err != nil {
		return fmt.Errorf("failed to create NATS client: %w", err)
	}
	a.nats = natsClient

	if err := a.nats.Connect(ctx); err != nil {
		return fmt.Errorf("failed to connect to NATS: %w", err)
	}
	defer a.nats.Close()

	// Start mDNS discovery
	discoveryService, err := discovery.New(a.config.NodeID, a.config.Role, a.config.MDNSPort)
	if err != nil {
		return fmt.Errorf("failed to create discovery service: %w", err)
	}
	a.discovery = discoveryService

	if err := a.discovery.Start(); err != nil {
		return fmt.Errorf("failed to start discovery: %w", err)
	}
	defer a.discovery.Stop()

	// Start heartbeat
	go a.heartbeat(ctx)

	// Start device discovery
	go a.discoverDevices(ctx)

	// Wait for context cancellation
	<-ctx.Done()
	a.logger.Info("Agent shutting down")

	return nil
}

func (a *Agent) heartbeat(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	subject := fmt.Sprintf("node.%s.heartbeat", a.config.NodeID)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			data := map[string]interface{}{
				"node_id":   a.config.NodeID,
				"role":      a.config.Role,
				"timestamp": time.Now().UTC().Format(time.RFC3339),
				"status":    "online",
			}

			if err := a.nats.PublishJSON(subject, data); err != nil {
				a.logger.Error("Failed to send heartbeat", zap.Error(err))
			} else {
				a.logger.Debug("Heartbeat sent")
			}
		}
	}
}

func (a *Agent) discoverDevices(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Run discovery immediately
	a.runDiscovery()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			a.runDiscovery()
		}
	}
}

func (a *Agent) runDiscovery() {
	a.logger.Debug("Running device discovery")

	devices := a.discovery.DiscoverDevices(5 * time.Second)
	for _, device := range devices {
		a.logger.Info("Discovered device",
			zap.String("name", device.Instance),
			zap.String("service", device.Service),
			zap.Strings("addresses", device.AddrIPv4),
		)

		// Publish discovered device to NATS
		subject := "device.discovered"
		if err := a.nats.PublishJSON(subject, device); err != nil {
			a.logger.Error("Failed to publish discovered device", zap.Error(err))
		}
	}
}