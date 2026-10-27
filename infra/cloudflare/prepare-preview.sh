#!/usr/bin/env bash
# Host adapter: turn the verified CI artifact into a deployable preview directory.
# Usage: prepare-preview.sh <artifact-dir> <out-dir>
# Deploy-time only (ADR-002): the artifact itself carries no environment flags.
set -euo pipefail

src="${1:?artifact dir}"
out="${2:?output dir}"

[ -d "$src" ] || { echo "::error::artifact dir $src missing"; exit 1; }
[ ! -e "$out" ] || { echo "::error::$out already exists"; exit 1; }

# The artifact is data only: refuse links and special files.
if [ -n "$(find "$src" ! -type f ! -type d -print -quit)" ]; then
  echo "::error::artifact contains non-regular files"
  exit 1
fi

# Verify the manifest written by the build job.
(cd "$src" && sha256sum --check --quiet SHA256SUMS)

mkdir -p "$out"
cp -r "$src"/. "$out"/
rm -f "$out/SHA256SUMS"

# Previews are never indexed (NFR-SEO-2): header and robots.txt, in the deployed copy only.
printf 'User-agent: *\nDisallow: /\n' > "$out/robots.txt"

dir="$(dirname "${BASH_SOURCE[0]}")/../headers"
{
  if [ -f "$dir/_headers" ]; then cat "$dir/_headers"; printf '\n'; fi
  printf '/*\n  X-Robots-Tag: noindex, nofollow\n'
} > "$out/_headers"
