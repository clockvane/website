WORK ORDER
ROLE={role}
ACTION={action}
ISSUE={issue}
PR={pr}
HEAD_SHA={head_sha}
PHASE={phase}
REPO={repo}

{action_note}

Rules for this run:
- Do only this work order, as your role file and CLAUDE.md describe. One unit of work, then stop.
- Load the skill your role file names for this action before you start.
- Scratch files go in .agentops-scratch/ (git-ignored).
- You are already in the repository root: don't start commands with `cd`. Prefer one command per
  Bash call. Write PR/issue bodies to .agentops-scratch/ and pass them with --body-file.
- If a tool call is refused, retry it once as simpler separate commands before deciding you are blocked.
- Other agents work at the same time in their own copies of the repo. If you start a dev, preview or
  test server, use the PORT above (also set as $PORT), and stop it before you finish.
- If you cannot complete it, comment on the issue/PR with the reason and stop. Waiting for another
  ticket or PR: add `Depends on #N` to the issue body and apply `status:blocked` (released by itself
  when #N closes). `needs-human` only for what the owner alone can decide (CLAUDE.md rule 10).
- End your final reply with one line starting with DONE:, BLOCKED:, REVIEWED:, PLANNED: or
  NOTHING_TO_DO:.
