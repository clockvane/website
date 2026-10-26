---
name: delivery-protocol
description: Step-by-step protocol every agent follows to deliver a ticket or fix review feedback - branch, commit, verify, push, open or update the pull request, hand off. Load at the start of ACTION=implement or ACTION=fix.
---

# Delivery protocol

The work order gives you `ROLE`, `ACTION`, `ISSUE` and/or `PR`. The scheduler has already
synced `main` and set the issue to `status:in-progress`. Do not change status labels except to set
`status:blocked`.

## ACTION=implement
1. **Understand.** `gh issue view <ISSUE> --comments`. Re-read the acceptance criteria and any
   `Depends on #N` (if a dependency is still open, comment, set `status:blocked`, stop).
2. **Branch.** If a remote branch for this issue already exists (`git ls-remote --heads origin
   "*/<ISSUE>-*"`), check it out and continue it. Otherwise:
   `git switch -c <ROLE>/<ISSUE>-<short-slug> origin/main`.
3. **Work in small commits.** Conventional Commit subject, body if useful, and the trailer:
   ```
   feat(contact): add server-side validation

   Agent-Role: sde3
   ```
   Stage only the files your ticket changes, by name (`git add <file> …`, never `git add -A` or
   `git add .`), and check `git status` first: stray build output or caches must not be committed.
   Use `git commit -F <file>` or `-m` per paragraph. Never `--no-verify`, never amend pushed commits.
4. **Verify against the Definition of Done** in CLAUDE.md. Run the project's lint, type-check,
   test and build commands (see the README/ADR-001). Fix failures before pushing.
5. **Self-review.** `git diff origin/main...HEAD`. Remove debug code, unrelated changes and
   secrets. Keep the PR focused on this ticket. Run your role file's self-check if it has one, and
   check the diff the way its reviewers will (accessibility and contrast for anything visual, the
   ADRs and `docs/engineering/standards.md` for code): fixing it now is cheaper than a review round.
6. **Push.** `git push -u origin HEAD`.
7. **Open the PR.** Write the body from `.github/pull_request_template.md` (all sections, evidence
   included, `Closes #<ISSUE>`) into a file under `.agentops-scratch/`, then:
   ```
   gh pr create --base main --title "<type>(<scope>): <summary> (#<ISSUE>)" \
     --body-file .agentops-scratch/pr-body.md --label "agent:<ROLE>" --label "type:<type>"
   ```
   Add `gate:N` for gate PRs, `arch-impact` / `ui-review` / `security-sensitive` if the issue has them.
8. **Hand off.** `gh issue comment <ISSUE> --body "PR #<n> opened. <one line> — <ROLE>"`. Stop.

## ACTION=fix (review feedback or failing CI)
1. `gh pr checkout <PR>`, then `git merge origin/main` if the branch is behind and conflicts exist
   (resolve them; never rebase or force-push a shared branch).
2. Read what failed:
   - Reviews: `gh pr view <PR> --json reviews --jq '.reviews[-6:][] | .body'`
   - CI: `gh pr checks <PR>`, then `gh run view <run-id> --log-failed | tail -n 150`
3. Fix every BLOCKER and MAJOR. Fix MINORs when cheap. If you disagree with a finding, reply once
   in a PR comment with a concrete technical reason instead of changing the code.
4. Verify (steps 4 and 5 above — including your role's self-check), commit with the trailer, `git push`.
5. `gh pr comment <PR> --body "Addressed: <bullets of what changed> — <ROLE>"`. Stop.

## Never
- Merge, force-push, push to `main`, or touch governance files.
- Start a second ticket in the same run.
- Leave dev servers, watchers or browsers running.
