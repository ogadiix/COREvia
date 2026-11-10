# ============================================================================
# COREvia Core Banking & CRM Platform — Multi-Stage Production Dockerfile
# Base Image: Node.js 22 Alpine (Hardened, Non-root User, Minimal Attack Surface)
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1: Dependencies Resolution
# ----------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Install build dependencies required by native packages (if any)
RUN apk add --no-cache libc6-compat python3 make g++

# Prevent Puppeteer from downloading Chromium in build stage
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN npm ci

# ----------------------------------------------------------------------------
# Stage 2: Application Build
# ----------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts server.ts drizzle.config.ts ./
COPY public ./public
COPY src ./src
COPY index.html ./

# Build client SPA and esbuild Node server
RUN npm run build

# ----------------------------------------------------------------------------
# Stage 3: Production Runtime
# ----------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

# Set production environment flags
ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Add wget for health checks
RUN apk add --no-cache wget

# Create institutional unprivileged user and group (Principle of Least Privilege)
RUN addgroup --system --gid 10001 corevia && \
    adduser --system --uid 10001 --ingroup corevia corevia

# Copy package manifests and install production-only dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled bundles and assets from builder
COPY --from=builder --chown=corevia:corevia /app/dist ./dist
COPY --from=builder --chown=corevia:corevia /app/public ./public
COPY --from=builder --chown=corevia:corevia /app/package.json ./package.json

# Copy database migrations and schema definitions for startup validation/push
COPY --chown=corevia:corevia drizzle ./drizzle
COPY --chown=corevia:corevia drizzle.config.ts ./
COPY --chown=corevia:corevia src/db ./src/db

# Switch to unprivileged runtime user
USER corevia

# Expose internal banking application port
EXPOSE 3000

# Container Healthcheck (pings /api/health every 30s)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health > /dev/null 2>&1 || exit 1

# Launch production server
CMD ["node", "dist/server.cjs"]

