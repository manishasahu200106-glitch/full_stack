# ==========================================
# Stage 1: Build React static assets with Vite
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies cleanly
RUN npm install

# Copy source code
COPY . .

# Build-time argument for backend API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:5000/api}

# Build optimized production bundle
RUN npm run build

# ==========================================
# Stage 2: Serve static files using Nginx
# ==========================================
FROM nginx:alpine

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose web server port
EXPOSE 80

# Healthcheck for container monitoring
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/health || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
