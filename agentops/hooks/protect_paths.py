#!/usr/bin/env python3
"""PreToolUse hook for file edits during agent runs.

- Governance files are never writable by agents.
- During ACTION=review the agent is read-only, except its own memory and the scratch folder.
- Writes outside the repository are blocked (except /tmp).
Works for Claude Code (Edit/Write: tool_input.file_path) and Codex (apply_patch: the patch text in
tool_input.command, paths on its "*** Add/Update/Delete File:" and "*** Move to:" lines).
Only enforced when AGENTOPS_RUN=1 (set by the agentops runner). Exit 2 blocks the call.
"""
import json
import os
import re
import sys
import time

GOVERNANCE = (
    "CLAUDE.md",
    "AGENTS.md",
    ".codex/",
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


PATCH_PATH = re.compile(r"^\*\*\* (?:Add File|Update File|Delete File|Move to):\s*(.+?)\s*$", re.M)


def target_paths(tool_input) -> list:
    """Every file a tool call would write."""
    if not isinstance(tool_input, dict):
        return []
    path = tool_input.get("file_path") or tool_input.get("notebook_path") or tool_input.get("path")
    if path:
        return [path]
    cmd = tool_input.get("command") or tool_input.get("patch") or tool_input.get("input") or ""
    if isinstance(cmd, list):
        cmd = "\n".join(str(c) for c in cmd)
    return PATCH_PATH.findall(str(cmd))


def note_block(tool: str, what: str, why: str) -> None:
    """Record blocks for `agents status` and the dashboard (best effort)."""
    state = os.environ.get("AGENTOPS_STATE_DIR")
    if not state:
        return
    try:
        with open(os.path.join(state, "guard.log"), "a", encoding="utf-8") as fh:
            fh.write(json.dumps({"t": time.time(), "lane": os.environ.get("AGENTOPS_LANE", "claude"),
                                 "role": os.environ.get("AGENTOPS_ROLE"), "tool": tool,
                                 "what": str(what)[:200], "why": why[:200]}) + "\n")
    except OSError:
        pass


def main() -> int:
    if os.environ.get("AGENTOPS_RUN") != "1":
        return 0
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    paths = target_paths(data.get("tool_input") or {})
    if not paths:
        return 0
    root = (os.environ.get("AGENTOPS_REPO_ROOT") or os.environ.get("CLAUDE_PROJECT_DIR")
            or data.get("cwd") or os.getcwd())
    for path in paths:
        msg = decide(path, root, os.environ.get("AGENTOPS_ACTION", ""))
        if msg:
            note_block(data.get("tool_name") or "edit", path, msg)
            print(f"Blocked by agentops guard: {msg}", file=sys.stderr)
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
