#!/usr/bin/env bash
# Host adapter: turn the verified CI artifact into the production deploy directory.
# Usage: prepare-production.sh <artifact-dir> <out-dir> <expected-sha256-of-SHA256SUMS>
# Same as prepare-preview.sh but indexable: no noindex header, robots.txt stays as built (ADR-002).
set -euo pipefail

src="${1:?artifact dir}"
out="${2:?output dir}"
expected="${3:?expected sha256 of SHA256SUMS}"

[ -d "$src" ] || { echo "::error::artifact dir $src missing"; exit 1; }
[ ! -e "$out" ] || { echo "::error::$out already exists"; exit 1; }

if [ -n "$(find "$src" ! -type f ! -type d -print -quit)" ]; then
  echo "::error::artifact contains non-regular files"
  exit 1
fi

[ -f "$src/SHA256SUMS" ] || { echo "::error::SHA256SUMS missing"; exit 1; }
actual="$(sha256sum "$src/SHA256SUMS" | cut -d" " -f1)"
[ "$actual" = "$expected" ] || { echo "::error::artifact identity differs from the recorded one"; exit 1; }
(cd "$src" && sha256sum --check --quiet SHA256SUMS)

mkdir -p "$out"
cp -r "$src"/. "$out"/
rm -f "$out/SHA256SUMS"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# The CSP allows the analytics origins only when this artifact loads analytics (site.config.ts token).
analytics=()
if grep -rqE --include='*.html' '<body[^>]*[[:space:]]data-analytics-token=' "$out"; then analytics=(--analytics); fi
node "$root/infra/headers/cli.ts" "${analytics[@]}" > "$out/_headers"
if grep -qi 'noindex' "$out/_headers"; then
  echo "::error::production _headers must not contain noindex"
  exit 1
fi
