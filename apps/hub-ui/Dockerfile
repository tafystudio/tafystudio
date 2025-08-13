FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable
RUN corepack prepare pnpm@9.3.0 --activate

# For monorepo, we need the workspace files
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/hub-ui/package.json ./apps/hub-ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable  
RUN corepack prepare pnpm@9.3.0 --activate

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/hub-ui/node_modules ./apps/hub-ui/node_modules
COPY . .

# Build the application
WORKDIR /app/apps/hub-ui
RUN pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/hub-ui/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub-ui/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
CMD HOSTNAME="0.0.0.0" node server.js