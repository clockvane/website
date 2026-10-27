#!/usr/bin/env bash
# Host adapter: delete every Pages deployment of branch pr-<N> (preview cleanup on PR close).
# Usage: delete-preview.sh <pr-number>
# Env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CF_PAGES_PROJECT
set -euo pipefail

pr="${1:?pr number}"
[[ "$pr" =~ ^[0-9]+$ ]] || { echo "::error::PR number must be numeric"; exit 1; }
: "${CLOUDFLARE_API_TOKEN:?}" "${CLOUDFLARE_ACCOUNT_ID:?}" "${CF_PAGES_PROJECT:?}"

api="https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT}/deployments"
auth="Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
branch="pr-${pr}"

# Collect ids first (deleting while paging would shift the pages), then delete.
ids=""
for page in 1 2 3 4 5 6 7 8; do
  found="$(curl -fsS -H "$auth" "${api}?env=preview&per_page=25&page=${page}" |
    jq -r --arg b "$branch" '.result[] | select(.deployment_trigger.metadata.branch == $b) | .id')"
  ids="${ids} ${found}"
done

deleted=0
for id in $ids; do
  curl -fsS -X DELETE -H "$auth" "${api}/${id}?force=true" > /dev/null
  deleted=$((deleted + 1))
done
echo "Deleted ${deleted} deployment(s) for ${branch}."
