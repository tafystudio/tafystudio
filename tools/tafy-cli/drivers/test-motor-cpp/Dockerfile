# Build stage
FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    ca-certificates \
    libssl-dev \
    libyaml-cpp-dev \
    nlohmann-json3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install NATS C client
RUN git clone --depth 1 --branch v3.7.0 https://github.com/nats-io/nats.c.git /tmp/nats.c \
    && cd /tmp/nats.c \
    && cmake -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build --target install \
    && rm -rf /tmp/nats.c

# Install prometheus-cpp
RUN git clone --depth 1 --branch v1.2.1 https://github.com/jupp0r/prometheus-cpp.git /tmp/prometheus-cpp \
    && cd /tmp/prometheus-cpp \
    && git submodule update --init --recursive \
    && cmake -B build -DCMAKE_BUILD_TYPE=Release -DENABLE_TESTING=OFF \
    && cmake --build build --target install \
    && rm -rf /tmp/prometheus-cpp

WORKDIR /app

# Copy source
COPY . .

# Build
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build

# Runtime stage
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 \
    libyaml-cpp0.7 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary and config
COPY --from=builder /app/build/motor_driver /app/
COPY --from=builder /app/config /app/config
COPY --from=builder /usr/local/lib/libnats* /usr/local/lib/
COPY --from=builder /usr/local/lib/libprometheus-cpp* /usr/local/lib/

# Update library cache
RUN ldconfig

# Create non-root user
RUN useradd -m -u 1000 tafy
USER tafy

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["./motor_driver"]
