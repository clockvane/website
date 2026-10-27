#!/usr/bin/env python3
"""Claude Code status line that also saves your plan usage for agentops.

Claude Code (Pro/Max) sends `rate_limits.five_hour` / `rate_limits.seven_day` (used % and reset
time) to the status line script after each response. This script stores them so the agentops
gate knows how much of your plan is left — including usage from claude.ai and other devices,
because the percentages come from Anthropic's servers.

Configure once in ~/.claude/settings.json (agentops/README.md, setup step 5):
  "statusLine": {"type": "command",
                 "command": "python3 ~/agents/clockvane-website/agentops/bin/statusline.py"}
To keep an existing status line, set AGENTOPS_STATUSLINE_CHAIN to its command; its first output
line is appended.
"""
import json
import os
import subprocess
import sys
import time

SNAPSHOT = os.path.expanduser(os.environ.get("AGENTOPS_SNAPSHOT", "~/.claude/agentops/usage-snapshot.json"))


def save(snapshot: dict) -> None:
    os.makedirs(os.path.dirname(SNAPSHOT), exist_ok=True)
    tmp = SNAPSHOT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(snapshot, fh)
    os.replace(tmp, SNAPSHOT)


def main() -> None:
    raw = sys.stdin.read()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        print("claude")
        return
    rl = data.get("rate_limits") or {}
    five, week = rl.get("five_hour"), rl.get("seven_day")
    if five or week:
        try:
            save({"captured_at": time.time(), "five_hour": five, "seven_day": week,
                  "version": data.get("version"), "model": (data.get("model") or {}).get("id")})
        except OSError:
            pass
    parts = [f"[{(data.get('model') or {}).get('display_name', '?')}]"]
    ctx = (data.get("context_window") or {}).get("used_percentage")
    if ctx is not None:
        parts.append(f"ctx {float(ctx):.0f}%")
    if five and five.get("used_percentage") is not None:
        parts.append(f"5h {float(five['used_percentage']):.0f}%")
    if week and week.get("used_percentage") is not None:
        parts.append(f"7d {float(week['used_percentage']):.0f}%")
    chain = os.environ.get("AGENTOPS_STATUSLINE_CHAIN")
    if chain:
        try:
            out = subprocess.run(chain, shell=True, input=raw, capture_output=True, text=True, timeout=3).stdout
            if out.strip():
                parts.append(out.strip().splitlines()[0])
        except (OSError, subprocess.SubprocessError):
            pass
    print(" | ".join(parts))


if __name__ == "__main__":
    main()
