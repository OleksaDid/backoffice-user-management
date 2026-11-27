# syntax=docker/dockerfile:1.7
# Build context: repository root (the API bundles the shared contracts workspace).

ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace @backoffice/api --include-workspace-root --ignore-scripts --no-audit

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN npm run build --workspace @backoffice/api \
    # Normalise permissions: the build context may come from a checkout with a strict umask.
    && chmod -R a+rX apps/api/dist apps/api/migrations apps/api/package.json packages/contracts/package.json

FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace @backoffice/api --omit=dev --ignore-scripts --no-audit

FROM ${NODE_IMAGE} AS runtime
# Git commit of the build, reported by /api/health/live (CI passes it; local builds say dev).
ARG REVISION=dev
ENV NODE_ENV=production \
    APP_REVISION=${REVISION} \
    # Fits the 512 MB container limit with headroom for buffers and native memory.
    NODE_OPTIONS=--max-old-space-size=384 \
    # Lets `npm run migrate` work on a read-only root filesystem (only /tmp is writable).
    NPM_CONFIG_CACHE=/tmp/.npm \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app
COPY --from=prod-deps --chown=root:root /app/node_modules node_modules
COPY --from=build --chown=root:root /app/packages/contracts/package.json packages/contracts/
COPY --from=build --chown=root:root /app/apps/api/package.json apps/api/
COPY --from=build --chown=root:root /app/apps/api/dist apps/api/dist
COPY --from=build --chown=root:root /app/apps/api/migrations apps/api/migrations
WORKDIR /app/apps/api
# Files are owned by root and read-only for the unprivileged runtime user.
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/api/health/live >/dev/null || exit 1
CMD ["node", "--enable-source-maps", "dist/main.js"]
