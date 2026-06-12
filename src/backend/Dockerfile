FROM node:20-alpine

WORKDIR /app

# Install all deps (prisma CLI + ts-node are needed at startup for db push / seed)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate && npm run build

# Entrypoint: db push → seed (optional) → start
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
