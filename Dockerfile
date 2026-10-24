# syntax=docker/dockerfile:1

ARG BUN_VERSION=1.4.2
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS build
ARG VITE_BUILD_COMMIT=dev
ENV VITE_BUILD_COMMIT=$VITE_BUILD_COMMIT
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run generate-routes && bun run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

ENV APP_URL=""
ENV SESSION_SECRET=""
ENV HAWCONNECT_ADMIN_API_URL=""

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nodejs

COPY --from=build --chown=nodejs:nodejs /app/.output ./.output
COPY --from=build /app/package.json ./package.json

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

CMD ["bun", ".output/server/index.mjs"]
