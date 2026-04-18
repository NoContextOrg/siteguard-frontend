# =====================
# Build stage
# =====================
FROM node:20-alpine AS build

WORKDIR /app

# Install ALL dependencies (needed for build)
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
RUN npm ci

# Copy source
COPY . .

# Build app (vite build handles TS warnings gracefully)
RUN npm run build


# =====================
# Production stage
# =====================
FROM nginx:alpine

RUN apk add --no-cache curl

COPY --from=build /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]