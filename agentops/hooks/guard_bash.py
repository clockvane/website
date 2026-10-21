#!/usr/bin/env python3
"""PreToolUse hook for Bash during agent runs.

Backstop for the deny rules in claude-run-settings.json: blocks commands that could bypass
the SDLC (merging, pushing to main, force-pushing, faking review statuses), touch the owner's
cloud accounts, or exfiltrate secrets. Exit code 2 blocks the call and shows stderr to Claude.
Only enforced when AGENTOPS_RUN=1 (set by the agentops runner).
"""
import json
import os
import re
import sys

# Command-position prefix: start of line or after ; && || | $( `
CMD = r"(?:^|[;&|`]\s*|\$\(\s*)(?:\w+=\S*\s+)*(?:sudo\s+)?"

RULES = [
    (r"\bgit\s+push\b[^;&|]*(?:\s--force(?:-with-lease)?\b|\s-f\b|\s\+[\w/:.-]+)",
     "Force-push is not allowed. Add new commits instead."),
    (r"\bgit\s+push\b[^;&|]*(?:\s|:)(?:main|master)\b",
     "Pushing to main is not allowed. Open a pull request."),
    (r"--no-verify\b", "Skipping git hooks is not allowed."),
    (r"\bgit\s+config\s+--global\b", "Changing global git config is not allowed."),
    (r"\bgh\s+pr\s+merge\b", "Agents never merge. The dispatcher merges after all checks pass."),
    (r"\bgh\s+(?:secret|variable|ruleset|auth)\b", "Secrets, variables, rulesets and auth are human-only."),
    (r"\bgh\s+repo\s+(?:delete|edit|rename|archive)\b", "Repository settings are human-only."),
    (r"\bgh\s+api\b[^;&|]*(?:/statuses/|/rulesets|/environments|/protection|/collaborators|"
     r"/hooks|/keys|/actions/secrets|/actions/variables|/actions/permissions)",
     "That GitHub API endpoint is human-only. Reviews are recorded with agentops/bin/post-review."),
    (r"\bgh\s+api\b[^;&|]*(?:-X|--method)\s*['\"]?(?:DELETE|PUT)\b",
     "DELETE/PUT calls to the GitHub API are human-only."),
    (CMD + r"(?:gcloud|gsutil|bq|aws|az|kubectl|helm|doctl|flyctl|vercel|netlify|wrangler|firebase)\b",
     "Cloud and hosting CLIs must not run on the owner's laptop. Deploys happen in CI."),
    (r"\bnpx\s+(?:-y\s+|--yes\s+)?(?:vercel|netlify-cli|netlify|wrangler|firebase-tools)\b[^;&|]*"
     r"\b(?:deploy|login|publish|secret|link|init|logout)\b",
     "Deploying or logging in to hosting from the laptop is not allowed. Deploys happen in CI."),
    (r"\bterraform\s+(?:apply|destroy|import|state)\b", "Terraform changes are applied by the human only."),
    (r"\bnpm\s+(?:publish|login|adduser|token)\b", "Publishing and npm auth are not allowed."),
    (r"(?:curl|wget)\b[^;&]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b", "Piping downloads into a shell is not allowed."),
    (r"\brm\s+-[a-zA-Z]*[rR][a-zA-Z]*\s+(?:-[a-zA-Z]+\s+)*(?:/|~|\$HOME|\.\.)(?:\s|/|$)",
     "Recursive delete outside the repository is not allowed."),
    (r"\bAGENTOPS_[A-Z_]+\s*=", "Agents may not set AGENTOPS_* variables."),
    (r"(?:^|[\s'\"=/])\.env(?:\.(?!example\b|sample\b|template\b)[\w-]+)?(?=$|[\s'\";|&)])",
     "Agents never read or write .env files (only .env.example)."),
    (r"(?:~|\$HOME|/home/[^/\s]+)/(?:\.ssh|\.aws|\.config/gh|\.config/gcloud|\.claude\.json|"
     r"\.claude/\.credentials)", "Reading credential stores is not allowed."),
]

COMPILED = [(re.compile(p, re.IGNORECASE | re.MULTILINE), msg) for p, msg in RULES]


def check(command: str):
    for rx, msg in COMPILED:
        if rx.search(command):
            return msg
    return None


def main() -> int:
    if os.environ.get("AGENTOPS_RUN") != "1":
        return 0
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    command = (data.get("tool_input") or {}).get("command") or ""
    msg = check(command)
    if msg:
        print(f"Blocked by agentops guard: {msg}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
