#!/usr/bin/env bash
# One-time setup of the Clockvane website repo and the agents' working clone.
# Run inside WSL from the unzipped kit folder:   bash agentops/bin/bootstrap.sh
#
# Overrides:  REPO_OWNER=…  REPO_NAME=…  REPO_VISIBILITY=public|private  AGENTS_DIR=…
# (Not OWNER/NAME: WSL sets $NAME to the computer name.)
set -euo pipefail

OWNER="${REPO_OWNER:-clockvane}"       # GitHub organization (or your username)
NAME="${REPO_NAME:-website}"
VISIBILITY="${REPO_VISIBILITY:-public}"
SLUG="$(printf '%s-%s' "$OWNER" "$NAME" | tr '[:upper:]' '[:lower:]')"
AGENTS_DIR="${AGENTS_DIR:-$HOME/agents/$SLUG}"
REPO="$OWNER/$NAME"
KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m !  %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m x  %s\033[0m\n' "$*"; exit 1; }
confirm() { local a; read -r -p "$1 [y/N] " a; [[ "$a" =~ ^[Yy]$ ]]; }

say "Preflight — kit $(cat "$KIT_DIR/agentops/VERSION" 2>/dev/null || echo "unknown version")"
if [[ "${NAME,,}" == "$(hostname | tr '[:upper:]' '[:lower:]')" ]]; then
  die "repo name '$NAME' is your computer name — something set it by mistake. Use REPO_NAME=website"
fi
[[ "$NAME" =~ ^[A-Za-z0-9._-]+$ && "$OWNER" =~ ^[A-Za-z0-9-]+$ ]] || die "invalid repo name '$OWNER/$NAME'"
for b in git gh python3 claude; do command -v "$b" >/dev/null || die "$b is not installed"; done
python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' || die "python3 3.9+ required"
gh auth status >/dev/null 2>&1 || die "gh is not logged in: run  gh auth login  (scopes: repo, workflow)"
login="$(gh api user --jq .login)"
uid="$(gh api user --jq .id)"
OAUTH_FIX="https://github.com/organizations/$OWNER/settings/oauth_application_policy"
if [[ "${login,,}" != "${OWNER,,}" ]]; then
  if ! gh api "orgs/$OWNER" >/dev/null 2>&1; then
    if gh api "users/$OWNER" >/dev/null 2>&1; then
      die "'$OWNER' on GitHub belongs to someone else. Run with REPO_OWNER=$login REPO_NAME=clockvane"
    fi
    die "GitHub organization '$OWNER' does not exist yet. Create it (free, 1 minute):
      https://github.com/account/organizations/new?plan=free   → name: $OWNER, owned by '$login'
    then run this script again. (Or use your own account: REPO_OWNER=$login REPO_NAME=clockvane bash $0)"
  fi
  role="$(gh api "orgs/$OWNER/memberships/$login" --jq .role 2>/dev/null || true)"
  case "$role" in
    admin) echo "organization '$OWNER': you are an owner" ;;
    member) die "you ('$login') are only a member of '$OWNER' — you must be an owner" ;;
    *) warn "could not confirm you own '$OWNER' (usually the app-access restriction below) — continuing" ;;
  esac
fi
gh auth status 2>&1 | grep -q "workflow" || warn "gh token may lack the 'workflow' scope: run  gh auth refresh -s workflow"
echo "claude $(claude --version 2>/dev/null || echo '?')"

if [[ "$VISIBILITY" != "public" ]]; then
  warn "On GitHub Free a PRIVATE repo gets no branch rulesets and no production approval gate."
  warn "The agents' merge lock and the owner-approval step would then be honour-system only."
  confirm "Continue with a private repo anyway?" || exit 1
fi

cat <<EOF

This will:
  1. create the $VISIBILITY repository $REPO and push this kit as the first commit
  2. set squash-only merges, labels, a 'protect-main' ruleset, staging/production environments
     (production needs your approval), Dependabot alerts and secret scanning
  3. clone a dedicated agents copy to $AGENTS_DIR (agentops resets this folder on every run —
     never do your own work in it)
EOF
confirm "Proceed?" || exit 1

oauth_hint() {
  if [[ "${login,,}" != "${OWNER,,}" ]]; then
    warn "New GitHub organizations block apps (including GitHub CLI) from making changes."
    warn "Fix once: open $OAUTH_FIX"
    warn "  → click 'Remove restrictions' (simplest for a one-person org), or approve 'GitHub CLI'"
    warn "  under Third-party access. Then run this script again — it is safe to re-run."
  fi
}

say "Repository"
if gh repo view "$REPO" >/dev/null 2>&1; then
  warn "$REPO already exists — reusing it"
else
  gh repo create "$REPO" "--$VISIBILITY" --disable-wiki \
    --description "Clockvane — company website, built by an AI engineering team following the SDLC" \
    || { oauth_hint; die "could not create $REPO"; }
fi

say "First commit"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cp -a "$KIT_DIR"/. "$work"/
cd "$work"
rm -rf .git .agentops-clone
find . -name __pycache__ -type d -prune -exec rm -rf {} +
sed -i "s/(bootstrap date)/$(date +%F)/" docs/sdlc/STATUS.md
python3 - "$REPO" "$SLUG" <<'PY'
import json, sys
repo, slug = sys.argv[1], sys.argv[2]
path = "agentops/config.json"
cfg = json.load(open(path, encoding="utf-8"))
cfg["repo"] = repo
cfg["paths"]["state_dir"] = f"~/.claude/agentops/{slug}"
with open(path, "w", encoding="utf-8") as fh:
    json.dump(cfg, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
PY
chmod +x agentops/bin/post-review agentops/bin/*.sh agentops/hooks/*.py agentops/agentops.py agentops/bin/statusline.py
git init -q -b main
git add -A
git -c user.name="$login" -c user.email="$uid+$login@users.noreply.github.com" \
  commit -q -m "chore: bootstrap AI engineering team and SDLC governance"
git remote add origin "https://github.com/$REPO.git"
gh auth setup-git >/dev/null 2>&1 || true
if git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then
  die "remote 'main' already has commits — push this kit manually or pick another REPO_NAME"
fi
git push -q -u origin main || { oauth_hint; die "push to $REPO failed"; }

say "Repository settings"
gh repo edit "$REPO" --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false \
  --delete-branch-on-merge --enable-auto-merge=false --enable-issues >/dev/null
gh api -X PUT "repos/$REPO/actions/permissions/workflow" -f default_workflow_permissions=read \
  -F can_approve_pull_request_reviews=false >/dev/null || warn "could not set default workflow permissions"

say "Labels"
python3 - "$REPO" <<'PY'
import json, subprocess, sys
repo = sys.argv[1]
for l in json.load(open("agentops/github/labels.json")):
    subprocess.run(["gh", "label", "create", l["name"], "--repo", repo, "--color", l["color"],
                    "--description", l["description"], "--force"], check=False, capture_output=True)
print("labels ok")
PY

say "Branch ruleset (protect-main)"
if gh api "repos/$REPO/rulesets" --jq '.[].name' 2>/dev/null | grep -qx "protect-main"; then
  echo "ruleset protect-main already exists"
elif gh api -X POST "repos/$REPO/rulesets" --input agentops/github/ruleset-main.json >/dev/null 2>&1; then
  echo "ruleset ok: PR required, linear history, required status 'agent-review/summary', no force-push"
else
  warn "ruleset could not be created (private repo on GitHub Free, or app-access restriction)"
fi

say "Environments"
gh api -X PUT "repos/$REPO/environments/staging" >/dev/null || warn "staging environment failed"
if gh api -X PUT "repos/$REPO/environments/production" --input - >/dev/null 2>&1 <<JSON
{"wait_timer":0,"prevent_self_review":false,"reviewers":[{"type":"User","id":$uid}],
 "deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}
JSON
then
  gh api -X POST "repos/$REPO/environments/production/deployment-branch-policies" -f name='v*' -f type=tag >/dev/null || true
  gh api -X POST "repos/$REPO/environments/production/deployment-branch-policies" -f name=main -f type=branch >/dev/null || true
  echo "production: deploys from main or v* tags, and only after YOU approve"
else
  warn "production environment with required reviewer failed (private repo on GitHub Free?)"
fi

say "Security features"
gh api -X PUT "repos/$REPO/vulnerability-alerts" >/dev/null 2>&1 || warn "Dependabot alerts not enabled"
gh api -X PUT "repos/$REPO/automated-security-fixes" >/dev/null 2>&1 || warn "Dependabot security fixes not enabled"
gh api -X PATCH "repos/$REPO" --input - >/dev/null 2>&1 <<'JSON' || warn "secret scanning settings not changed"
{"security_and_analysis":{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}}
JSON

say "Agents clone → $AGENTS_DIR"
mkdir -p "$(dirname "$AGENTS_DIR")" "$HOME/.claude/agentops"
if [[ ! -d "$AGENTS_DIR/.git" ]]; then
  git clone -q --branch main "https://github.com/$REPO.git" "$AGENTS_DIR"
fi
cd "$AGENTS_DIR"
touch .agentops-clone
grep -qx ".agentops-clone" .git/info/exclude 2>/dev/null || echo ".agentops-clone" >> .git/info/exclude
git config user.name "Clockvane Agents"
git config user.email "$uid+$login@users.noreply.github.com"
python3 agentops/agentops.py selftest >/dev/null 2>&1 && echo "selftest ok" || warn "selftest failed — run: python3 agentops/agentops.py selftest"
touch "$HOME/.bashrc"
sed -i '/^# Clockvane website agent team (agentops)$/d; /^alias agents=/d' "$HOME/.bashrc"
printf '\n# Clockvane website agent team (agentops)\nalias agents="python3 %s/agentops/agentops.py"\n' "$AGENTS_DIR" >> "$HOME/.bashrc"
echo "the 'agents' command now points to $AGENTS_DIR (open a new terminal to use it)"
say "Claude Code status line (lets agentops see your plan usage %)"
if confirm "Connect it now? Your current settings are backed up and an existing status line is kept"; then
  python3 agentops/agentops.py setup-statusline || warn "status line not set — run later: agents setup-statusline"
else
  echo "skipped — run later: agents setup-statusline"
fi

ps1="$(wslpath -w "$AGENTS_DIR/agentops/bin/install-scheduler.ps1" 2>/dev/null || echo "<path to install-scheduler.ps1>")"
distro="${WSL_DISTRO_NAME:-Ubuntu}"
cat > "$HOME/.claude/agentops/scheduler-command.txt" <<EOF
powershell -ExecutionPolicy Bypass -File "$ps1" -Distro $distro -AgentsDir "$AGENTS_DIR"
EOF

cat <<EOF

$(printf '\033[1;32m')Done.$(printf '\033[0m') Repo: https://github.com/$REPO

Next:
  A. Open a NEW Ubuntu terminal, run  claude , send one short message (e.g. hi), then /exit.
     (This records your plan usage for the gate.)
  B. Check everything:                agents doctor
  C. In Windows PowerShell (not Ubuntu), install the background ticker:
       $(cat "$HOME/.claude/agentops/scheduler-command.txt")
     (saved in ~/.claude/agentops/scheduler-command.txt)
  D. Start the team:                  agents start --now --hours 3
     Watch:                           agents status
EOF
