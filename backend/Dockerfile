FROM node:20-slim
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --production
COPY backend/ ./
EXPOSE 8080
CMD ["node", "server.js"]