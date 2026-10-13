# Multi-stage build: compile the Angular app, then serve it with unprivileged nginx.
#   docker build -t payment-gateway-fe .
#   docker run -p 8080:8080 -e API_GATEWAY_URL=http://host.docker.internal:8080 payment-gateway-fe

FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# nginx-unprivileged listens on 8080 and runs under an arbitrary non-root UID in group 0,
# which is what OpenShift's restricted SCC assigns.
FROM nginxinc/nginx-unprivileged:1.27-alpine
LABEL org.opencontainers.image.title="payment-gateway-fe" \
      org.opencontainers.image.source="https://github.com/andrewsselvaraj/payment-gateway-fe"
ENV API_GATEWAY_URL=http://api-gateway:8080
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build --chown=101:0 /workspace/dist/payment-gateway-fe/browser /usr/share/nginx/html
USER 101
EXPOSE 8080
