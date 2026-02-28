FROM node:22-slim AS base
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy app
COPY . .

# Build TypeScript
RUN npx tsc

# Expose port
ENV PLT_SERVER_PORT=3042
EXPOSE 3042

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3042/status || exit 1

# Start
CMD ["npx", "wattpm", "start"]
