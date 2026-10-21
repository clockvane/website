---
name: review-protocol
description: Protocol for an independent, read-only pull request review - severity rubric, verdict format and how to record the verdict with agentops/bin/post-review. Load at the start of ACTION=review.
---

# Review protocol

You are reviewing work you did not write. You are read-only: do not edit files, commit, push,
change labels or merge. The work order gives you `PR` and `HEAD_SHA`.

## 1. Confirm you are reviewing the right commit
`gh pr view <PR> --json headRefOid,title,body,labels,files`
If `headRefOid` is not `HEAD_SHA`, stop: the scheduler will send a fresh review later.

## 2. Gather context (cheaply)
- The linked issue: `gh issue view <ISSUE>` — acceptance criteria are your checklist.
- The diff: `gh pr diff <PR>`. Open full files only where the diff lacks context.
- Your role file says what you focus on. Do not review outside your lens unless you spot a
  BLOCKER.

## 3. Classify every finding
| Severity | Meaning | Blocks merge |
|----------|---------|--------------|
| BLOCKER | Broken, insecure, data loss, violates a golden rule in CLAUDE.md | yes |
| MAJOR | Acceptance criterion not met, logic without tests, WCAG AA failure, standards breach with real cost, wrong pattern that others will copy | yes |
| MINOR | Should be fixed soon, does not block | no |
| NIT | Optional polish | no |

Verdict is **approve** when there are zero BLOCKER and zero MAJOR findings, otherwise **changes**.
Never block on personal taste. Maximum 10 findings, most important first.

## 4. Write and record the verdict (one command)
```
agentops/bin/post-review <PR> approve|changes - <<'EOF'
### Summary
<2-3 lines: what this PR does and your overall judgement>

### Findings
1. [MAJOR] src/components/Form.tsx:42 — <problem>. Fix: <concrete suggestion>.
2. [NIT] …

### Acceptance criteria
- [x] AC1 — <evidence: test name, command output, screenshot>
- [ ] AC2 — <what is missing>
EOF
```
`post-review` posts the review comment and sets the `agent-review/<your role>` commit status on
`HEAD_SHA`. If it exits non-zero, report the error text in your final reply and stop.

## 5. Finish
Reply with one line: `REVIEWED: <approve|changes> — <role>`. Stop.
