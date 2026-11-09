#!/usr/bin/env bash
# Print "<ci-run-id> <sha256-of-SHA256SUMS>" for a commit, but only if staging succeeded for it.
# Staging evidence = a successful deploy-staging.yml run for the commit that uploaded the artifact
# `staging-evidence-<sha>` (file evidence.env: ci_run_id=<digits>, sums_sha256=<64 hex>). That ties the
# staging result to the exact ci run and artifact bytes. Absent, pending or failed staging fails closed.
# Usage: find-artifact-run.sh <commit-sha>   (needs GH_TOKEN and GITHUB_REPOSITORY; GH_BIN overrides gh for tests)
set -euo pipefail

gh_bin="${GH_BIN:-gh}"
sha="${1:?commit sha}"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "::error::bad SHA" >&2; exit 1; }

staging_run="$("$gh_bin" run list --repo "$GITHUB_REPOSITORY" --workflow deploy-staging.yml \
  --status success --commit "$sha" --json databaseId --jq '.[0].databaseId // empty')"
if [ -z "$staging_run" ]; then
  echo "::error::No successful staging deployment (deploy-staging.yml) for $sha. Failing closed." >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
"$gh_bin" run download "$staging_run" --repo "$GITHUB_REPOSITORY" --name "staging-evidence-$sha" --dir "$tmp" >&2 ||
  { echo "::error::Staging run $staging_run has no staging-evidence-$sha artifact. Failing closed." >&2; exit 1; }

file="$tmp/evidence.env"
[ -f "$file" ] && [ ! -L "$file" ] || { echo "::error::evidence.env missing in staging evidence" >&2; exit 1; }
run_id="$(sed -n -E 's/^ci_run_id=([0-9]+)$/\1/p' "$file")"
sums="$(sed -n -E 's/^sums_sha256=([0-9a-f]{64})$/\1/p' "$file")"
if [ -z "$run_id" ] || [ -z "$sums" ] || [ "$(printf '%s\n' "$run_id" | wc -l)" -ne 1 ]; then
  echo "::error::Malformed staging evidence. Failing closed." >&2
  exit 1
fi
echo "$run_id $sums"
