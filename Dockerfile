# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configs
COPY server/package*.json ./server/
COPY shared/ ./shared/

WORKDIR /app/server
RUN npm ci

COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app/server

ENV NODE_ENV=production

COPY --from=builder /app/server/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/server/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/server/src/templates ./dist/templates

EXPOSE 5000

CMD ["node", "dist/index.js"]
