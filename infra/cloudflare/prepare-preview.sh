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

# Security headers come from the single source in infra/headers (docs/security/headers.md).
# ENQUIRY_WORKER_ORIGIN (optional https origin) is added to connect-src and form-action.
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
node "$root/infra/headers/cli.ts" --noindex > "$out/_headers"
