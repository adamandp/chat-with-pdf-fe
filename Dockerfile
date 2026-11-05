# syntax=docker/dockerfile:1
FROM oven/bun:1.4.2 AS bun

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock ./
COPY scripts/sync-pdf-worker.mjs ./scripts/sync-pdf-worker.mjs
RUN bun install --frozen-lockfile

FROM dependencies AS builder
COPY . .
ARG NEXT_PUBLIC_API_MOCKING=enabled
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_MOCKING=${NEXT_PUBLIC_API_MOCKING} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
