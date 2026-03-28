# Debian + системный Chromium: Puppeteer в Alpine/Railway без скачанного Chrome даёт ENOENT
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-core \
    fontconfig \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_SIGEX_GATEWAY_URL
ENV VITE_SIGEX_GATEWAY_URL=$VITE_SIGEX_GATEWAY_URL

RUN npm run build

ENV PORT=8080
EXPOSE 8080

CMD ["node", "parser/src/index.js"]
