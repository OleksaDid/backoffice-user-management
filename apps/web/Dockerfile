# syntax=docker/dockerfile:1.7
# Build context: repository root (the web app imports the shared contracts workspace).

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace @backoffice/web --include-workspace-root --ignore-scripts --no-audit
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/web apps/web
RUN npm run build --workspace @backoffice/web \
    # Normalise permissions: the build context may come from a checkout with a strict umask.
    && chmod -R a+rX apps/web/dist apps/web/nginx

FROM nginxinc/nginx-unprivileged:1.30-alpine AS runtime
COPY --from=build /app/apps/web/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
# Runs as the unprivileged nginx user (uid 101) on port 8080. Writes only to /tmp,
# so the container works with a read-only root filesystem.
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
# Skip the image's entrypoint scripts: they rewrite config files, which a read-only
# filesystem forbids, and the configuration here needs no templating.
ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]
