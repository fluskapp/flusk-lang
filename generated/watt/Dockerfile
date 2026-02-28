FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN cd apps/api && npm ci
ENV PLT_SERVER_PORT=3042
EXPOSE 3042
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:3042/status || exit 1
CMD ["npx", "wattpm", "start"]
