FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
USER node
EXPOSE 3000
CMD ["npm","start"]
