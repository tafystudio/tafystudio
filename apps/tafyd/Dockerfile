# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /build

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o tafyd .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /build/tafyd .

# Create non-root user
RUN adduser -D -u 1000 tafy
USER tafy

# Expose mDNS port
EXPOSE 5353/udp

# Run the agent
ENTRYPOINT ["./tafyd"]