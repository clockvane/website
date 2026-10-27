#!/usr/bin/env bash
# Install a newer agent kit into the repo, as the owner. Run inside WSL from the unzipped NEW kit:
#     bash agentops/bin/update-kit.sh
# It opens a pull request with only the kit's governance files (agentops/, .claude/agents,
# .claude/skills, .codex, CLAUDE.md, AGENTS.md, .github templates), records your approval as the
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
# (for example a note you added to CLAUDE.md): a three-way merge per file, like git does. The merge
# base is the previous kit exactly as it shipped: saved on this laptop by the last update, or shipped
# inside this kit (_previous-kit/). Only if neither matches the repo's kit version, the repo's files at
# the last kit install are used (that can't see edits you made before that install).
current="$(cat agentops/VERSION 2>/dev/null || true)"
base_dir=""
for cand in "$STATE_DIR/kit-base" "$KIT_DIR/_previous-kit"; do
  if [[ -n "$current" && -f "$cand/agentops/VERSION" && "$(cat "$cand/agentops/VERSION")" == "$current" ]]; then
    base_dir="$cand"; break
  fi
done
base="$(git log -1 --format=%H --grep='^chore(agentops): update agent kit' || true)"
[[ -n "$base" ]] || base="$(git rev-list --max-parents=0 HEAD | tail -1)"
if [[ -n "$base_dir" ]]; then
  echo "comparing with the kit as it shipped: $current ($base_dir)"
else
  warn "no original copy of kit '$current' found — comparing with the repo at the last kit install instead"
  echo "   ($(git log -1 --format='%h %s' "$base" | cut -c1-80)). Edits you made before that install"
  echo "   can't be told apart from the kit: check the PR diff of CLAUDE.md before you continue."
fi
python3 - "$KIT_DIR" "$base" "$base_dir" <<'PY' || die "nothing was changed — see the message above"
import os, subprocess, sys, tempfile
kit, base, base_dir = sys.argv[1], sys.argv[2], sys.argv[3]
DIRS = ["agentops", ".claude/agents", ".claude/skills", ".github/ISSUE_TEMPLATE", ".codex"]
# The root README.md describes the website and belongs to the team; the kit's manual is agentops/README.md.
FILES = ["CLAUDE.md", "AGENTS.md", ".github/pull_request_template.md", ".github/CODEOWNERS"]


def git(*args):
    return subprocess.run(["git", *args], capture_output=True)


def read(path):
    try:
        with open(path, "rb") as fh:
            return fh.read()
    except FileNotFoundError:
        return None


def at_base(path):
    if base_dir:
        return read(os.path.join(base_dir, path))
    r = git("show", f"{base}:{path}")
    return r.stdout if r.returncode == 0 else None


paths = set(FILES)
for d in DIRS:
    for top in (kit, base_dir) if base_dir else (kit,):
        for root, _dirs, files in os.walk(os.path.join(top, d)):
            paths.update(os.path.relpath(os.path.join(root, f), top) for f in files)
    paths.update(git("ls-files", d).stdout.decode().splitlines())
    if not base_dir:
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
# never commit Python bytecode (the agents' safety hooks are Python): ignore it next to the agentops
# entries near the top of .gitignore, away from lines that open PRs add at the end
python3 - .gitignore <<'PY'
import sys
path = sys.argv[1]
try:
    lines = open(path, encoding="utf-8").read().splitlines()
except FileNotFoundError:
    lines = []
missing = [p for p in ("__pycache__/", "*.py[co]") if p not in lines]
if missing:
    at = next((i + 1 for i, l in enumerate(lines) if l.strip() == ".claude/settings.local.json"), None)
    if at is None:
        at = next((i + 1 for i, l in enumerate(lines) if l.strip() == ".agentops-scratch/"), len(lines))
    lines[at:at] = missing
    open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(".gitignore: added " + ", ".join(missing))
PY
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
        --body "Owner-applied update of the agent kit (governance files only) to **$VERSION**. See agentops/README.md for how the team works.")"
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

# remember this kit exactly as it shipped: the merge base for the next update
snap="$STATE_DIR/kit-base"
mkdir -p "$STATE_DIR"
rm -rf "$snap.new" && mkdir -p "$snap.new"
(
  cd "$KIT_DIR"
  for p in agentops .claude/agents .claude/skills .github/ISSUE_TEMPLATE .codex CLAUDE.md AGENTS.md \
           .github/pull_request_template.md .github/CODEOWNERS; do
    [[ -e "$p" ]] && cp -r --parents "$p" "$snap.new/"
  done
)
find "$snap.new" -name __pycache__ -type d -prune -exec rm -rf {} +
rm -rf "$snap" && mv "$snap.new" "$snap"

say "Labels"
# labels a newer kit uses (for example `early-start`) — existing labels are left as they are
python3 - "$REPO" "$KIT_DIR/agentops/github/labels.json" <<'PY' || warn "could not check labels — run bootstrap's label step later"
import json, subprocess, sys
repo, path = sys.argv[1], sys.argv[2]
res = subprocess.run(["gh", "label", "list", "--repo", repo, "--limit", "500", "--json", "name", "--jq", ".[].name"],
                     capture_output=True, text=True)
if res.returncode != 0:
    sys.exit(1)
have = set(res.stdout.split("\n"))
added = []
for label in json.load(open(path)):
    if label["name"] in have:
        continue
    r = subprocess.run(["gh", "label", "create", label["name"], "--repo", repo, "--color", label["color"],
                        "--description", label.get("description", "")], capture_output=True, text=True)
    added.append(label["name"] + ("" if r.returncode == 0 else " (failed)"))
print("added: " + ", ".join(added) if added else "all labels present")
PY

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
  agents codex-check                    # safety-tests every GPT agent's copy (needed for the 2nd GPT agent), ~2-3 min
  agents workers                        # how many agents work at once (default 2 Claude + 2 GPT)
  agents limits --runs-per-day 120      # more agents use the daily cap faster
  agents doctor                         # checks memory for 4 agents and that the scheduler finds codex
  agents start --now --until 08:00      # let them work (the check runs in the background)
  agents dashboard                      # watch them (in its own tab)
EOF
