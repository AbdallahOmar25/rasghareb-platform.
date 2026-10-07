FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production)
RUN npm ci --omit=dev || npm install --production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["node", "server.js"]

