# Stage 1: Production Base
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Set environment
ENV NODE_ENV=production

# Copy package manifests
COPY package*.json ./

# Install production dependencies cleanly
RUN npm install --omit=dev --ignore-scripts

# Copy remaining backend source code
COPY . .

# Ensure non-root node user owns the app directory
RUN chown -R node:node /usr/src/app

# Switch to non-root user for security best practice
USER node

# Expose backend API port
EXPOSE 5000

# Docker Healthcheck to verify backend status
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start production server
CMD ["node", "server.js"]
