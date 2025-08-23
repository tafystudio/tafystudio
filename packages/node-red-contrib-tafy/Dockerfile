FROM nodered/node-red:3.1.0

# Copy custom nodes
COPY --chown=node-red:node-red . /nodes

# Install custom nodes
USER node-red
WORKDIR /usr/src/node-red
RUN npm install /nodes

# Ensure data directory exists
RUN mkdir -p /data

USER node-red