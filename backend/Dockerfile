# Build Stage
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (default 8080)
EXPOSE 8080

# Start command
CMD ["npm", "start"]
