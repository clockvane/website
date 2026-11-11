#!/usr/bin/env bash
# Host adapter: point the contact form at this environment's enquiry Worker (ADR-002, build once).
# Usage: set-enquiry-origin.sh <deploy-dir> [<https-origin>]
# Rewrites the origin baked in from site.config.ts contact.endpoint, in the DEPLOY COPY only; the CI
# artifact and its SHA256SUMS are never touched. No origin given: nothing is rewritten.
set -euo pipefail

dir="${1:?deploy dir}"
origin="${2:-}"
[ -n "$origin" ] || exit 0
origin="${origin%/}"
[[ "$origin" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || { echo "::error::enquiry origin must be a bare https origin"; exit 1; }

page="$dir/contact/index.html"
[ -f "$page" ] || { echo "::error::$page missing"; exit 1; }
baked="$(grep -oE '<form[^>]*action="https://[^"/]+/enquiry"' "$page" | grep -oE 'https://[^"/]+' | head -n1 || true)"
[ -n "$baked" ] || { echo "::error::no baked enquiry endpoint found in $page"; exit 1; }
[ "$baked" != "$origin" ] || exit 0

# Both origins are validated, so only "." needs escaping for sed.
esc="$(printf '%s' "$baked" | sed 's/[.]/\\./g')"
count=0
while IFS= read -r -d '' f; do
  sed -i "s#${esc}/enquiry#${origin}/enquiry#g" "$f"
  count=$((count + 1))
done < <(grep -rlZ --include='*.html' --include='*.js' -F "${baked}/enquiry" "$dir" || true)
[ "$count" -gt 0 ] || { echo "::error::nothing rewritten"; exit 1; }
if grep -rqF "${baked}/enquiry" "$dir"; then echo "::error::baked endpoint still present"; exit 1; fi
echo "Enquiry endpoint set to ${origin}/enquiry in ${count} file(s)"
