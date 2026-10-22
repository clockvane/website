#!/usr/bin/env bash
# Install a newer agent kit into the repo, as the owner. Run inside WSL from the unzipped NEW kit:
#     bash agentops/bin/update-kit.sh
# It opens a pull request with only the kit's governance files (agentops/, .claude/agents,
# .claude/skills, CLAUDE.md, README.md, .github templates), records your approval as the
# owner, merges it, and refreshes the agents' copy. The agents' own work is never touched.
set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION="$(cat "$KIT_DIR/agentops/VERSION")"
REPO="${REPO:-$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["repo"])' "$KIT_DIR/agentops/config.json")}"
SLUG="$(printf '%s' "$REPO" | tr '/' '-' | tr '[:upper:]' '[:lower:]')"
AGENTS_DIR="${AGENTS_DIR:-$HOME/agents/$SLUG}"
STATE_DIR="${STATE_DIR:-$HOME/.claude/agentops/$SLUG}"

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m !  %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m x  %s\033[0m\n' "$*"; exit 1; }

for b in git gh python3; do command -v "$b" >/dev/null || die "$b is not installed"; done
gh auth status >/dev/null 2>&1 || die "gh is not logged in: run  gh auth login"
login="$(gh api user --jq .login)"
uid="$(gh api user --jq .id)"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
say "Kit $VERSION → $REPO"
git clone -q "${REMOTE:-https://github.com/$REPO.git}" "$work/repo"
cd "$work/repo"
echo "the repo currently has kit: $(cat agentops/VERSION 2>/dev/null || echo unknown)"
cp agentops/config.json "$work/old-config.json"

branch="chore/agentops-$(printf '%s' "$VERSION" | cut -d' ' -f1)-$(date +%H%M%S)"
git checkout -q -b "$branch"
# Bring the kit's files in WITHOUT losing changes you made to them since the last kit install
# (for example a note you added to CLAUDE.md): a three-way merge per file, like git does.
base="$(git log -1 --format=%H --grep='^chore(agentops): update agent kit' || true)"
[[ -n "$base" ]] || base="$(git rev-list --max-parents=0 HEAD | tail -1)"
echo "comparing with the last kit install: $(git log -1 --format='%h %s' "$base" | cut -c1-80)"
python3 - "$KIT_DIR" "$base" <<'PY' || die "nothing was changed — see the message above"
import os, subprocess, sys, tempfile
kit, base = sys.argv[1], sys.argv[2]
DIRS = ["agentops", ".claude/agents", ".claude/skills", ".github/ISSUE_TEMPLATE"]
FILES = ["CLAUDE.md", "README.md", ".github/pull_request_template.md", ".github/CODEOWNERS"]


def git(*args):
    return subprocess.run(["git", *args], capture_output=True)


def read(path):
    try:
        with open(path, "rb") as fh:
            return fh.read()
    except FileNotFoundError:
        return None


def at_base(path):
    r = git("show", f"{base}:{path}")
    return r.stdout if r.returncode == 0 else None


paths = set(FILES)
for d in DIRS:
    for root, _dirs, files in os.walk(os.path.join(kit, d)):
        paths.update(os.path.relpath(os.path.join(root, f), kit) for f in files)
    paths.update(git("ls-files", d).stdout.decode().splitlines())
    paths.update(git("ls-tree", "-r", "--name-only", base, "--", d).stdout.decode().splitlines())
paths = sorted(p for p in paths if p and "__pycache__" not in p.split("/") and not p.endswith(".pyc"))

taken, kept, merged, conflicts = [], [], [], []
for p in paths:
    ours, theirs, old = read(p), read(os.path.join(kit, p)), at_base(p)
    if ours == theirs:
        continue
    if ours == old:  # you didn't touch it: take the new kit's version
        if theirs is None:
            os.remove(p)
        else:
            os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
            with open(p, "wb") as fh:
                fh.write(theirs)
        taken.append(p)
        continue
    if theirs == old:  # the kit didn't change it, you did: keep yours
        kept.append(p)
        continue
    if None in (ours, theirs, old) or b"\0" in ours + theirs + old:
        conflicts.append(p)
        continue
    with tempfile.TemporaryDirectory() as t:
        names = [os.path.join(t, n) for n in ("yours", "last-kit", "new-kit")]
        for name, data in zip(names, (ours, old, theirs)):
            with open(name, "wb") as fh:
                fh.write(data)
        r = subprocess.run(["git", "merge-file", "-p", *names], capture_output=True)
    if r.returncode == 0:
        with open(p, "wb") as fh:
            fh.write(r.stdout)
        merged.append(p)
    else:
        conflicts.append(p)

print(f"kit files: {len(taken)} updated" + (f", {len(merged)} combined with your edits" if merged else "")
      + (f", {len(kept)} kept as you changed them" if kept else ""))
for label, items in (("combined (your edits + the kit's)", merged), ("kept yours", kept)):
    for p in items:
        print(f"   {label}: {p}")
if conflicts:
    print("\n !  You and the new kit changed the same lines in:")
    for p in conflicts:
        print(f"      {p}")
    print("    Nothing was changed. Ask Claude to combine them into the kit, then run this again.")
    sys.exit(3)
PY
find . -name __pycache__ -type d -prune -exec rm -rf {} +
# keep the values bootstrap wrote for this repo
python3 - "$work/old-config.json" agentops/config.json <<'PY'
import json, sys
old, new_path = json.load(open(sys.argv[1])), sys.argv[2]
new = json.load(open(new_path))
new["repo"] = old.get("repo", new["repo"])
new.setdefault("paths", {})["state_dir"] = old.get("paths", {}).get("state_dir", new["paths"].get("state_dir"))
with open(new_path, "w", encoding="utf-8") as fh:
    json.dump(new, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
PY
chmod +x agentops/bin/post-review agentops/bin/*.sh agentops/hooks/*.py agentops/agentops.py agentops/bin/statusline.py
PYTHONDONTWRITEBYTECODE=1 python3 agentops/agentops.py selftest >/dev/null 2>&1 || die "the new kit's selftest failed — nothing was changed"
find . -name __pycache__ -type d -prune -exec rm -rf {} +

git add -A
if git diff --cached --quiet; then
  echo "the repo already has these files — nothing to merge"
else
  git -c user.name="$login" -c user.email="$uid+$login@users.noreply.github.com" commit -q \
    -m "chore(agentops): update agent kit to $VERSION" -m "Owner-applied governance change."
  git push -q -u origin "$branch"
  say "Pull request"
  url="$(gh pr create --repo "$REPO" --base main --head "$branch" \
        --title "chore(agentops): update agent kit to $VERSION" \
        --body "Owner-applied update of the agent kit (governance files only) to **$VERSION**. See README for what changed.")"
  echo "$url"
  gh pr edit "$url" --add-label governance >/dev/null 2>&1 || true
  gh api -X POST "repos/$REPO/statuses/$(git rev-parse HEAD)" -f state=success -f context=agent-review/summary \
    -f description="Owner-applied governance change ($VERSION)" >/dev/null
  merged=""
  for _ in 1 2 3 4 5 6 7 8; do
    if gh pr merge "$url" --squash --delete-branch >/dev/null 2>&1; then merged=1; break; fi
    sleep 5
  done
  [[ -n "$merged" ]] || die "could not merge $url — open it, check why, and merge it yourself"
  echo "merged"
fi

say "Agents' copy → $AGENTS_DIR"
if [[ -d "$AGENTS_DIR/.git" ]]; then
  mkdir -p "$STATE_DIR"
  (
    if ! flock -n 9; then
      warn "an agent run is in progress — its copy updates itself at the next tick"
      exit 0
    fi
    git -C "$AGENTS_DIR" fetch -q origin
    git -C "$AGENTS_DIR" checkout -q -f main
    git -C "$AGENTS_DIR" reset -q --hard origin/main
    rm -f "$STATE_DIR/last_plan.json"   # let the manager plan again straight away
    echo "updated to $(cat "$AGENTS_DIR/agentops/VERSION")"
  ) 9>"$STATE_DIR/tick.lock"
else
  warn "$AGENTS_DIR not found — it updates itself at the next tick"
fi

cat <<EOF

$(printf '\033[1;32m')Done.$(printf '\033[0m') Next, in this terminal:
  agents limits                                          # check your limits (runs per day too)
  agents start --now --until 08:00 --session-limit 90    # e.g. overnight, higher limit while you sleep
  agents dashboard                                       # watch them (in its own tab)
EOF
