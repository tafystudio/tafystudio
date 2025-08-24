# USB Camera Driver for Tafy RDOS
FROM golang:1.23-alpine AS builder

# Install build dependencies
RUN apk add --no-cache gcc musl-dev linux-headers

# Install V4L2 development files
RUN apk add --no-cache v4l-utils-dev

WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build the camera driver
RUN go build -o camera-driver ./cmd/camera-driver

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    v4l-utils \
    ffmpeg \
    ca-certificates

# Create non-root user
RUN adduser -D -u 1000 tafy

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/camera-driver /app/

# Copy configuration
COPY config/ /app/config/

# Set ownership
RUN chown -R tafy:tafy /app

USER tafy

# Expose ports
EXPOSE 8080  # HTTP/WebSocket for MJPEG streaming
EXPOSE 8081  # Metrics/health
EXPOSE 8082  # WebRTC signaling (optional)

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081/health || exit 1

ENTRYPOINT ["/app/camera-driver"]