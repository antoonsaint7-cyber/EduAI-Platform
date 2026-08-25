FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
RUN mkdir -p /app/storage && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
