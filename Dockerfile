FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Build arguments for environment variables
ARG VITE_SERVER_API_URL
ENV VITE_SERVER_API_URL=$VITE_SERVER_API_URL
ARG VITE_SERVER_API_PREFIX
ENV VITE_SERVER_API_PREFIX=$VITE_SERVER_API_PREFIX
ARG VITE_WS_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --config.auto-install-peers=false

COPY . .
RUN pnpm run build

# Production runtime: Nginx ile statik dosya servisi
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O - http://127.0.0.1/ || exit 1


