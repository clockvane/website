#!/usr/bin/env bash
# Production smoke test: status 200, security headers, indexable.
# Usage: smoke-production.sh <base-url> [worker-health-url]
set -euo pipefail

url="${1:?base url}"
health="${2:-}"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

for _ in 1 2 3 4 5 6; do
  if curl -fsS -D "$tmp" -o /dev/null "$url" &&
     grep -qi "^content-security-policy:.*frame-ancestors 'none'" "$tmp" &&
     grep -qi '^strict-transport-security:.*max-age=31536000' "$tmp" &&
     grep -qi '^x-content-type-options:.*nosniff' "$tmp" &&
     ! grep -qi '^x-robots-tag:.*noindex' "$tmp"; then
    echo "OK: $url is up with CSP/HSTS/nosniff and is indexable"
    if [ -n "$health" ]; then
      curl -fsS -o /dev/null "$health" || { echo "::error::Worker health check failed: $health"; exit 1; }
      echo "OK: $health"
    fi
    exit 0
  fi
  sleep 10
done
echo "::error::Smoke test failed for $url (unreachable, missing headers, or noindex present)"
exit 1
