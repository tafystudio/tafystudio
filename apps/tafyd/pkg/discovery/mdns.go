package discovery

import (
	"context"
	"fmt"
	"time"

	"github.com/grandcat/zeroconf"
	"go.uber.org/zap"
)

const (
	ServiceType = "_tafynode._tcp"
	Domain      = "local."
)

type Service struct {
	nodeID   string
	role     string
	port     int
	server   *zeroconf.Server
	logger   *zap.Logger
}

type Device struct {
	Instance string
	Service  string
	Domain   string
	HostName string
	Port     int
	Text     []string
	TTL      uint32
	AddrIPv4 []string
	AddrIPv6 []string
}

func New(nodeID, role string, port int) (*Service, error) {
	return &Service{
		nodeID: nodeID,
		role:   role,
		port:   port,
		logger: zap.L().Named("discovery"),
	}, nil
}

func (s *Service) Start() error {
	txt := []string{
		fmt.Sprintf("node_id=%s", s.nodeID),
		fmt.Sprintf("role=%s", s.role),
		"version=0.0.1",
		"platform=go",
	}

	server, err := zeroconf.Register(
		s.nodeID,      // instance
		ServiceType,   // service
		Domain,        // domain
		s.port,        // port
		txt,           // text records
		nil,           // interfaces (nil = all)
	)
	if err != nil {
		return fmt.Errorf("failed to register mDNS service: %w", err)
	}

	s.server = server
	s.logger.Info("mDNS service registered",
		zap.String("instance", s.nodeID),
		zap.String("service", ServiceType),
		zap.Int("port", s.port),
	)

	return nil
}

func (s *Service) Stop() {
	if s.server != nil {
		s.server.Shutdown()
		s.logger.Info("mDNS service stopped")
	}
}

func (s *Service) DiscoverDevices(timeout time.Duration) []Device {
	resolver, err := zeroconf.NewResolver(nil)
	if err != nil {
		s.logger.Error("Failed to create resolver", zap.Error(err))
		return nil
	}

	entries := make(chan *zeroconf.ServiceEntry)
	devices := []Device{}

	go func() {
		for entry := range entries {
			device := Device{
				Instance: entry.Instance,
				Service:  entry.Service,
				Domain:   entry.Domain,
				HostName: entry.HostName,
				Port:     entry.Port,
				Text:     entry.Text,
				TTL:      entry.TTL,
			}

			// Convert IPs to strings
			for _, ip := range entry.AddrIPv4 {
				device.AddrIPv4 = append(device.AddrIPv4, ip.String())
			}
			for _, ip := range entry.AddrIPv6 {
				device.AddrIPv6 = append(device.AddrIPv6, ip.String())
			}

			devices = append(devices, device)
		}
	}()

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	err = resolver.Browse(ctx, ServiceType, Domain, entries)
	if err != nil {
		s.logger.Error("Failed to browse services", zap.Error(err))
		return nil
	}

	<-ctx.Done()
	return devices
}