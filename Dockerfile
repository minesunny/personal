# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV RESUME_DATA_DIR=/app/data

RUN apk add --no-cache libc6-compat \
  && addgroup -S nodejs -g 1001 \
  && adduser -S nextjs -u 1001 -G nodejs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/src/data ./data

RUN chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000

CMD ["npm", "run", "start"]
