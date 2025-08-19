# syntax=docker/dockerfile:1

###############################################
# Dependencies layer (installs prod deps only)
###############################################
FROM node:20-alpine AS deps
WORKDIR /app

# Leverage Docker layer caching for dependencies
# Copy package manifest(s) only first
COPY package.json package-lock.json* ./
# Install prod deps; fall back to npm install if lockfile missing
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

###############################################
# Runtime layer
###############################################
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Create app directories and ensure non-root ownership
RUN mkdir -p /app/certs && chown -R node:node /app

# Add tini for proper signal handling (PID 1)
RUN apk add --no-cache tini

# Copy production node_modules and application code
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node src ./src
COPY --chown=node:node package.json ./

# Drop privileges
USER node

# Document the listening port
EXPOSE 3000

# Basic healthcheck hitting the built-in /healthz endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/healthz > /dev/null || exit 1

# Start the server
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
