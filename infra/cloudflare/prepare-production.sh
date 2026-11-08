#!/usr/bin/env bash
# Host adapter: turn the verified CI artifact into the production deploy directory.
# Usage: prepare-production.sh <artifact-dir> <out-dir>
# Same as prepare-preview.sh but indexable: no noindex header, robots.txt stays as built (ADR-002).
set -euo pipefail

src="${1:?artifact dir}"
out="${2:?output dir}"

[ -d "$src" ] || { echo "::error::artifact dir $src missing"; exit 1; }
[ ! -e "$out" ] || { echo "::error::$out already exists"; exit 1; }

if [ -n "$(find "$src" ! -type f ! -type d -print -quit)" ]; then
  echo "::error::artifact contains non-regular files"
  exit 1
fi

(cd "$src" && sha256sum --check --quiet SHA256SUMS)

mkdir -p "$out"
cp -r "$src"/. "$out"/
rm -f "$out/SHA256SUMS"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
node "$root/infra/headers/cli.ts" > "$out/_headers"
if grep -qi 'noindex' "$out/_headers"; then
  echo "::error::production _headers must not contain noindex"
  exit 1
fi
