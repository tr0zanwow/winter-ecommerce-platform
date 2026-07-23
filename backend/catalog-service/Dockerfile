# Stage 1: Install Dependencies
FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Compile TypeScript Application
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 3: Minimal Production Runtime
FROM node:24-alpine AS runtime
# Copy AWS Lambda Web Adapter extension binary
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.1 /lambda-adapter /opt/extensions/lambda-adapter
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Instantiate a secure, non-root system group and user context
RUN addgroup -S nestgroup && adduser -S nestuser -G nestgroup

# Copy only production distribution bundles, package.json, and pruned node modules
COPY --from=builder --chown=nestuser:nestgroup /app/dist ./dist
COPY --from=builder --chown=nestuser:nestgroup /app/package.json ./package.json
COPY --from=builder --chown=nestuser:nestgroup /app/node_modules ./node_modules

USER nestuser

EXPOSE 3000
ENTRYPOINT ["node", "dist/main.js"]
