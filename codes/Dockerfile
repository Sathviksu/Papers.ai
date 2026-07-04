# ───────────────────────────────────────────────────────────
# Stage 1: Install dependencies
# ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install only production dependencies first (layer cache friendly)
COPY package.json package-lock.json ./
RUN npm ci

# ───────────────────────────────────────────────────────────
# Stage 2: Build the Next.js app
# ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pass build-time env vars (non-secret, NEXT_PUBLIC_* only)
# ARG NEXT_PUBLIC_FIREBASE_API_KEY
# ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY

RUN npm run build

# ───────────────────────────────────────────────────────────
# Stage 3: Minimal production image
# ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js standalone server runs on port 3000 by default
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only the standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

USER nextjs

EXPOSE 3000

# Runtime secrets are injected via --env-file or -e flags, NOT baked in
CMD ["node", "server.js"]
