# Build stage for client
FROM node:20 AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production stage
FROM node:20
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "server/src/index.js"]
