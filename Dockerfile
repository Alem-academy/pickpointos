FROM node:20-alpine

WORKDIR /app

# 1. Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy source code
COPY . .

# 3. Build Frontend
# This creates /app/dist
RUN npm run build

# 4. Cleanup (optional, reduces size)
# RUN npm prune --production

# 5. Expose Backend Port (Railway listens on PORT env var, mostly 8080 or random)
ENV PORT=8080
EXPOSE 8080

# 6. Start the Backend Server (which serves the frontend from /dist)
CMD ["node", "parser/src/index.js"]
