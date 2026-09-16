FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml install-hooks.cjs ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_SERVER_API_URL
ARG VITE_SERVER_API_PREFIX=/api/v1
ARG VITE_SERVER_API_TIMEOUT=15000
ENV VITE_SERVER_API_URL=${VITE_SERVER_API_URL}
ENV VITE_SERVER_API_PREFIX=${VITE_SERVER_API_PREFIX}
ENV VITE_SERVER_API_TIMEOUT=${VITE_SERVER_API_TIMEOUT}

RUN pnpm build

FROM nginx:1.28-alpine
COPY deploy/nginx-frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN nginx -t
EXPOSE 8080
