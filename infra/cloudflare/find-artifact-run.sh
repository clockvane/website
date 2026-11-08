#!/usr/bin/env bash
# Print the id of the successful push-to-main ci run for a commit (its artifact was tested on staging).
# Usage: find-artifact-run.sh <commit-sha>   (needs GH_TOKEN and GITHUB_REPOSITORY)
set -euo pipefail

sha="${1:?commit sha}"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "::error::bad SHA" >&2; exit 1; }

run_id="$(gh run list --repo "$GITHUB_REPOSITORY" --workflow ci.yml --branch main --event push \
  --status success --commit "$sha" --json databaseId --jq '.[0].databaseId // empty')"
if [ -z "$run_id" ]; then
  echo "::error::No successful ci run on main for $sha (or its artifact expired after 90 days). Failing closed." >&2
  exit 1
fi
echo "$run_id"
