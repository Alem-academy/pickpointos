FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install chromium and dependencies for html-pdf-node (Puppeteer)
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-droid-nonlatin \
    font-droid

RUN npm install --omit=dev

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
