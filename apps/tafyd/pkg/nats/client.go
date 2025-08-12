package nats

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"go.uber.org/zap"
)

type Client struct {
	url      string
	name     string
	nc       *nats.Conn
	js       nats.JetStreamContext
	logger   *zap.Logger
}

func NewClient(url, name string) (*Client, error) {
	return &Client{
		url:    url,
		name:   name,
		logger: zap.L().Named("nats"),
	}, nil
}

func (c *Client) Connect(ctx context.Context) error {
	opts := []nats.Option{
		nats.Name(c.name),
		nats.ReconnectWait(2 * time.Second),
		nats.MaxReconnects(60),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			c.logger.Warn("Disconnected from NATS", zap.Error(err))
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			c.logger.Info("Reconnected to NATS", zap.String("url", nc.ConnectedUrl()))
		}),
		nats.ClosedHandler(func(nc *nats.Conn) {
			c.logger.Info("NATS connection closed")
		}),
	}

	nc, err := nats.Connect(c.url, opts...)
	if err != nil {
		return fmt.Errorf("failed to connect to NATS: %w", err)
	}

	c.nc = nc
	c.logger.Info("Connected to NATS", zap.String("url", c.url))

	// Try to enable JetStream
	js, err := nc.JetStream()
	if err != nil {
		c.logger.Warn("JetStream not available", zap.Error(err))
	} else {
		c.js = js
		c.logger.Info("JetStream enabled")
	}

	return nil
}

func (c *Client) Close() {
	if c.nc != nil {
		c.nc.Close()
	}
}

func (c *Client) Publish(subject string, data []byte) error {
	if c.nc == nil {
		return fmt.Errorf("not connected to NATS")
	}
	return c.nc.Publish(subject, data)
}

func (c *Client) PublishJSON(subject string, v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}
	return c.Publish(subject, data)
}

func (c *Client) Subscribe(subject string, handler nats.MsgHandler) (*nats.Subscription, error) {
	if c.nc == nil {
		return nil, fmt.Errorf("not connected to NATS")
	}
	return c.nc.Subscribe(subject, handler)
}

func (c *Client) Request(subject string, data []byte, timeout time.Duration) (*nats.Msg, error) {
	if c.nc == nil {
		return nil, fmt.Errorf("not connected to NATS")
	}
	return c.nc.Request(subject, data, timeout)
}