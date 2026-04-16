# Build stage with optimized caching
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies with cache optimization
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code and build
COPY . .
RUN npm run build

# Production stage with minimal footprint
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built assets to nginx default location
COPY --from=build /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
