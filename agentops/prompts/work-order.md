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
- If you cannot complete it, comment on the issue/PR with the reason, apply `status:blocked`
  (or `needs-human` for decisions only the owner can make), and stop.
- End your final reply with one line starting with DONE:, BLOCKED:, REVIEWED:, PLANNED: or
  NOTHING_TO_DO:.
