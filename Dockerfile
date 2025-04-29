# 1️⃣ Dependencies stage
FROM node:20-slim AS deps
WORKDIR /app

# Enable Corepack and activate pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 2️⃣ Build stage
FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy deps and app code
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy everything including your seed file
COPY . .

# Build the app
RUN pnpm build

# 3️⃣ Runtime stage
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy required runtime files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.js ./

# ✅ Copy seed script explicitly from build stage
COPY --from=builder /app/server/scripts/seedAdmin.js ./server/scripts/seedAdmin.js

EXPOSE 3000
CMD ["pnpm", "start"]
