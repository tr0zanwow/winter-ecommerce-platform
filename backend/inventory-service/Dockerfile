# Stage 1: Dependencies Builder
FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: TypeScript Compiler
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 3: Runtime Runner Context
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy distribution files, package descriptor, and pruned production dependencies with node profile ownership
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

USER node

CMD ["node", "dist/main.js"]
