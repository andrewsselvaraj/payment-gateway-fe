# Payment Gateway Frontend

Angular 21 web app for the [payment-gateway-microservices](https://github.com/andrewsselvaraj/payment-gateway-microservices)
backend. It talks only to the `api-gateway`, packaged as an nginx container and deployed next to the backend on
**Red Hat OpenShift Service on AWS (ROSA)** by Jenkins.

| Page | Backend calls (through the api-gateway) |
|---|---|
| Dashboard | `GET /api/orders`: order counts by status, paid volume, recent orders |
| New payment | `POST /api/orders`: creates the order, which order-service charges via payment-service |
| Orders | `GET /api/orders` with search and status filter |
| Order detail | `GET /api/orders/{id}`, `GET /api/payments?orderId=`, `POST /api/payments/{id}/refund` |
| Notifications | `GET /api/notifications` |
| Header | `GET /actuator/health`: gateway up/down indicator |

Every request carries an `X-Correlation-Id`, and error messages show it so a failure can be traced through the
gateway and service logs.

## How it reaches the backend

The browser only ever calls its own origin. `/api/**` and `/actuator/health` are proxied to the gateway:

- `npm start` uses `proxy.conf.json` → `http://localhost:8080`
- the container uses nginx (`nginx/default.conf.template`) → `$API_GATEWAY_URL` (default `http://api-gateway:8080`)

So no CORS setup is needed on the gateway, and the gateway Route can stay internal-only if you want.

## Quick start

```bash
npm ci
npm start            # http://localhost:4200, backend expected on localhost:8080
npm test             # unit tests (Vitest)
npm run build        # production build in dist/payment-gateway-fe/browser
```

Start the backend first (`docker compose up --build` in payment-gateway-microservices). Mock-provider test cards:
`4242 4242 4242 4242` succeeds, `...0002` is declined, `...9995` has insufficient funds.

To run the container against a local backend:

```bash
docker compose up --build   # http://localhost:4200
```

## Deploy to ROSA

The frontend deploys into the same namespaces as the backend (`payments-dev`, `payments-prod`), so it reaches
the `api-gateway` Service by name.

```bash
oc apply -k k8s/overlays/dev
oc get route payment-gateway-fe -n payments-dev
```

The manifests add two NetworkPolicies on top of the backend's default-deny: router → frontend, and
frontend → api-gateway. The pod runs as an arbitrary non-root UID under the restricted SCC.

The `Jenkinsfile` mirrors the backend pipeline and uses the same credentials (`registry-credentials`,
`rosa-dev-token`, `rosa-prod-token`): install, unit test, build, Docker build, Trivy scan, push, dev deploy,
smoke test (`scripts/smoke-test.sh`), then gated prod promotion. The Jenkins agent also needs Node.js 22.

## Repository layout

```
src/app/core/        API client, models, correlation-id interceptor, status badge
src/app/pages/       dashboard, checkout, orders, order-detail, notifications
nginx/               nginx config template (SPA fallback, API proxy, security headers)
Dockerfile           Node build -> nginx-unprivileged runtime
Jenkinsfile          CI/CD pipeline
k8s/base, k8s/overlays/{dev,prod}   Kustomize manifests for OpenShift
scripts/smoke-test.sh
```
