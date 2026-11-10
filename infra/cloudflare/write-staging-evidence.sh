#!/usr/bin/env bash
# Write evidence.env, the staging evidence read by find-artifact-run.sh. One writer, one format:
#   ci_run_id=<digits>          the ci.yml run that built the artifact
#   sums_sha256=<64 hex>        sha256 of that artifact's SHA256SUMS
# Usage: write-staging-evidence.sh <ci-run-id> <sums-sha256> <output-dir>
set -euo pipefail

run_id="${1:?ci run id}"
sums="${2:?sha256 of SHA256SUMS}"
out="${3:?output dir}"
[[ "$run_id" =~ ^[0-9]+$ ]] || { echo "::error::bad ci run id" >&2; exit 1; }
[[ "$sums" =~ ^[0-9a-f]{64}$ ]] || { echo "::error::bad sums hash" >&2; exit 1; }
mkdir -p "$out"
printf 'ci_run_id=%s\nsums_sha256=%s\n' "$run_id" "$sums" > "$out/evidence.env"
