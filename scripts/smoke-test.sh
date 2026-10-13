#!/usr/bin/env bash
# Checks the deployed UI is served and can reach the api-gateway through its own proxy.
#   ./scripts/smoke-test.sh https://payment-gateway-fe-payments-dev.apps.<cluster-domain>
set -euo pipefail
BASE_URL="${1:-http://localhost:4200}"

curl -fsS "$BASE_URL/healthz" >/dev/null
curl -fsS "$BASE_URL/" | grep -q '<app-root>' || { echo "index.html not served"; exit 1; }
curl -fsS "$BASE_URL/orders" | grep -q '<app-root>' || { echo "SPA fallback broken"; exit 1; }
echo "Gateway via UI proxy: $(curl -fsS "$BASE_URL/actuator/health")"
curl -fsS "$BASE_URL/api/orders" >/dev/null
echo "Smoke test PASSED"
