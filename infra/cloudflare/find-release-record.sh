#!/usr/bin/env bash
# Print "<ci-run-id> <sha256-of-SHA256SUMS> <commit-sha>" recorded when a tag was released.
# The record is the release-record.txt asset of the GitHub Release (written by release.yml), so a rollback
# redeploys the originally released artifact, never a later rebuild of the same commit. Fails closed.
# Usage: find-release-record.sh <tag>   (needs GH_TOKEN and GITHUB_REPOSITORY; GH_BIN overrides gh for tests)
set -euo pipefail

gh_bin="${GH_BIN:-gh}"
tag="${1:?tag}"
[[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "::error::bad tag" >&2; exit 1; }

rec="$("$gh_bin" release download "$tag" --repo "$GITHUB_REPOSITORY" --pattern release-record.txt --output - 2>/dev/null)" ||
  { echo "::error::No release record for $tag (was it released by release.yml?). Failing closed." >&2; exit 1; }

get() { printf '%s\n' "$rec" | sed -n -E "s/^$1=($2)\$/\1/p"; }
run_id="$(get ci_run_id '[0-9]+')"
sums="$(get sums_sha256 '[0-9a-f]{64}')"
sha="$(get sha '[0-9a-f]{40}')"
rtag="$(get tag 'v[0-9]+\.[0-9]+\.[0-9]+')"
if [ -z "$run_id" ] || [ -z "$sums" ] || [ -z "$sha" ] || [ "$rtag" != "$tag" ]; then
  echo "::error::Malformed release record for $tag. Failing closed." >&2
  exit 1
fi
echo "$run_id $sums $sha"
