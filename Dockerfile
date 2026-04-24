FROM node:20-slim

# ─── Cài Chromium + font hỗ trợ tiếng Việt cho Puppeteer ───
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg \
    fonts-khmeros fonts-freefont-ttf \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Puppeteer dùng Chromium đã cài sẵn, không tải lại
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files trước để tận dụng Docker cache layer
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "index.js"]
