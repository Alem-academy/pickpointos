FROM node:20-alpine

WORKDIR /app

# 1. Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy source code
COPY . .

# 3. Build Frontend
# Pass VITE variables as build arguments so Vite can bake them into the JS bundle
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_SIGEX_GATEWAY_URL
ENV VITE_SIGEX_GATEWAY_URL=$VITE_SIGEX_GATEWAY_URL

# This creates /app/dist
RUN npm run build

# 4. Cleanup (optional, reduces size)
# RUN npm prune --production

# 5. Expose Backend Port (Railway listens on PORT env var, mostly 8080 or random)
ENV PORT=8080
EXPOSE 8080

# 6. Start the Backend Server (which serves the frontend from /dist)
CMD ["node", "parser/src/index.js"]
