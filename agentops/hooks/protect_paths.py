#!/usr/bin/env python3
"""PreToolUse hook for file edits during agent runs.

- Governance files are never writable by agents.
- During ACTION=review the agent is read-only, except its own memory and the scratch folder.
- Writes outside the repository are blocked (except /tmp).
Only enforced when AGENTOPS_RUN=1 (set by the agentops runner). Exit 2 blocks the call.
"""
import json
import os
import sys

GOVERNANCE = (
    "CLAUDE.md",
    ".claude/settings.json",
    ".claude/settings.local.json",
    ".claude/agents/",
    ".claude/skills/",
    ".claude/hooks/",
    "agentops/",
    ".github/CODEOWNERS",
    "docs/product/BRIEF.md",
)
REVIEW_WRITABLE = (".claude/agent-memory-local/", ".agentops-scratch/")


def rel_path(path: str, root: str):
    full = os.path.realpath(os.path.join(root, path) if not os.path.isabs(path) else path)
    root = os.path.realpath(root)
    if full == root or full.startswith(root + os.sep):
        return os.path.relpath(full, root).replace(os.sep, "/"), True
    return full, False


def decide(path: str, root: str, action: str):
    rel, inside = rel_path(path, root)
    if not inside:
        if rel.startswith("/tmp/"):
            return None
        return f"Writing outside the repository is not allowed: {rel}"
    name = rel.rsplit("/", 1)[-1]
    if name.startswith(".env") and name not in (".env.example", ".env.sample", ".env.template"):
        return "Agents never write .env files (use .env.example)."
    for g in GOVERNANCE:
        if rel == g.rstrip("/") or (g.endswith("/") and rel.startswith(g)):
            return (f"{rel} is governance and is human-only. Open an issue labeled "
                    "`governance` + `needs-human` to propose a change.")
    if action == "review" and not rel.startswith(REVIEW_WRITABLE):
        return "Reviews are read-only. Record your verdict with agentops/bin/post-review."
    return None


def main() -> int:
    if os.environ.get("AGENTOPS_RUN") != "1":
        return 0
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    ti = data.get("tool_input") or {}
    path = ti.get("file_path") or ti.get("notebook_path") or ti.get("path")
    if not path:
        return 0
    root = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()
    msg = decide(path, root, os.environ.get("AGENTOPS_ACTION", ""))
    if msg:
        print(f"Blocked by agentops guard: {msg}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
