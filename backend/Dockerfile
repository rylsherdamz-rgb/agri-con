FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
RUN npx prisma generate

COPY backend/ ./

EXPOSE 8080
CMD ["node", "server.js"]