# Clockvane — company website, built by an AI engineering team

*Automation that runs like clockwork.*

This repository is built by 12 Claude Code agents that work like an engineering department:
written requirements, design reviews, ADRs, tickets, pull requests, independent reviewers,
CI/CD, and three sign-off gates that only you (the owner) can pass. They run in WSL Ubuntu on your
laptop, one small unit of work at a time, only after you say `agents start`, only when you are
not using Claude yourself, and only while your plan has room left.

- **Owner:** @MohammedAbdulFarhan08 — you approve the gates, add secrets, approve production deploys.
- **Brand:** Clockvane · GitHub `clockvane/website` · domain clockvane.com (not live yet). Domain
  and email live in one config file, so switching them on later is a small ticket.
- Agents' rules: [`CLAUDE.md`](CLAUDE.md) · Process: [`docs/sdlc/WORKFLOW.md`](docs/sdlc/WORKFLOW.md)

---

## 1. The team

| Agent | Model / effort | Does | Reviews |
|-------|----------------|------|---------|
| `product-owner` | Sonnet · medium | PRD, personas, metrics, competitor scan — stands in for you day to day | product, content, design docs; gate PRs |
| `eng-manager` | Sonnet · medium | Grooms the backlog, sequences sprints, opens gate PRs, retros | substitute reviewer |
| `tech-lead` | **Opus** · high | ADR-001 stack, architecture, NFRs, standards | architecture docs, `arch-impact` PRs |
| `ux-designer` | Sonnet · high | Sitemap, wireframes, design system, home-page prototype | `ui-review` PRs |
| `content-writer` | Sonnet · medium | Voice & tone, copy deck per page, SEO copy | — |
| `sde3` | Sonnet · high | Scaffold, design-system code, shared components, forms, hard bugs | — |
| `sde2` | Sonnet · medium | Pages and sections from existing components and approved copy | — |
| `qa-engineer` | Sonnet · medium | Test strategy, e2e / accessibility / Lighthouse suites | every code PR (runs the tests) |
| `code-reviewer` | Sonnet · high, read-only | Independent staff-level review | every code PR |
| `security-reviewer` | Sonnet · high, read-only in reviews | Threat model, headers/CSP, privacy | deps, pipelines, server code, forms |
| `devops-lead` | Sonnet · high | ADR-002 hosting, CI/CD design, environments, releases, exit plan | pipeline and infra PRs |
| `devops-engineer` | Sonnet · medium | Workflows, Dockerfile, IaC, Lighthouse CI, Dependabot | — |

Why SDE3 vs SDE2 still matters with agents: the SDE3 gets the pattern-setting and tricky work at
higher effort; the SDE2 gets well-specified tickets at lower effort and must reuse existing
patterns. That keeps quality up and usage down.

## 2. How it works

```
 every 30 min (Windows Task Scheduler → WSL)
   └─ agentops tick
        1. housekeeping  — no AI cost
           • read open PRs and issues with gh
           • route the next required review (agentops/review-matrix.json)
           • every required review approved on the same commit → set agent-review/summary ✅
           • normal PR → squash-merge      • gate PR → label needs-human, wait for YOU
        2. choose ONE unit of AI work:  fix > review > resume > next ready ticket > EM planning
        3. gate it — skip this tick if any of these is true:
           • you haven't run `agents start` (or the window you gave has ended)
           • you used Claude Code in the last 20 min   • plan usage near the limits
           • team already used its weekly share       • daily cap / spacing / quiet hours
           • a usage-limit cooldown is active          • ~/.claude/agentops/PAUSE exists
        4. run exactly one:  claude -p --agent <role>  (dontAsk permissions, turn/size caps,
           45-min timeout, guard hooks, limit detection → cooldown until reset)
```

The phases and gates:

| Phase | Outputs | Gate (you merge the `gate:N` PR) |
|-------|---------|----------------------------------|
| initiation | PRD, personas, metrics, competitor scan | **Gate 1** — scope |
| design | ADR-001 stack, ADR-002 hosting, architecture, NFRs, sitemap, wireframes, design system, prototype, copy deck, threat model, test strategy, CI/CD design | **Gate 2** — design |
| build | Sprint 0 walking skeleton, then pages/features, each through reviewed PRs | — |
| release | release checklist, staging sign-off | **Gate 3** — go-live, then you approve the production deploy |
| operate | updates, retros, improvements | — |

### Why the reviews are commit statuses, not GitHub "Approve"
Every agent pushes as **your** GitHub account, and GitHub never lets an account approve its own
PR. So each reviewer records its verdict as a commit status `agent-review/<role>` on the exact
commit it reviewed (via `agentops/bin/post-review`), and the `protect-main` ruleset requires the
`agent-review/summary` status that the dispatcher sets only when every required reviewer
approved. New commits wipe old verdicts automatically. This is a strong **process lock**, not a
security boundary — see §8 for the upgrade path to a separate bot identity.

### Why the repo should be public
On GitHub Free, branch rulesets and the "production needs my approval" environment rule only
work on public repos. Public also gives unlimited free Actions minutes, and the repo doubles as a
portfolio piece showing clients how you engineer. Nothing secret lives in it (secret scanning +
push protection are switched on). Private works too, but then those locks are honour-system only,
unless you pay for GitHub Pro.

## 3. Before you start

Everything runs in **WSL Ubuntu** (same setup as your Shipd `olympus-factory`). Windows only
provides the 30-minute clock through Task Scheduler.

- WSL Ubuntu with `git`, `python3` (3.9+), `gh` (logged in as `MohammedAbdulFarhan08`, scopes
  `repo` + `workflow`), and **Node.js LTS** (via nvm) — the stack the agents choose will almost
  certainly need it. Docker is optional (8 GB RAM is tight).
- Keep all files in the Linux home (`~/…`), never under `/mnt/c` — builds there are many times slower.
- Give WSL a bit more memory for builds and the test browser. `C:\Users\<you>\.wslconfig`:
  ```ini
  [wsl2]
  memory=5GB
  processors=6
  swap=8GB
  ```
  then run `wsl --shutdown` in PowerShell and reopen Ubuntu. Don't go above 5-6 GB on an 8 GB
  laptop — Windows itself needs the rest. (The default is half your RAM, 4 GB.)
- For overnight windows, set Windows power so the laptop doesn't sleep while plugged in —
  nothing runs while it sleeps.
- Claude Code **2.1.259 or newer** (`claude update`), logged in with your Claude subscription.
- **Turn off usage credits** (claude.ai → Settings → Usage), or set a small monthly cap. Then a
  limit simply pauses the agents instead of spending money. The agents are also blocked from
  Fable models, because in `-p` mode Claude Code bills Fable to usage credits without asking.

## 4. Setup (about 20 minutes)

1. **Unzip the kit in WSL** (not on the Windows drive — it is much slower):
   ```bash
   mkdir -p ~/kits && cd ~/kits
   cp /mnt/c/Users/<you>/Downloads/clockvane-website-kit.zip .
   unzip -o clockvane-website-kit.zip
   cd clockvane-website
   ```
2. **Create the GitHub organization `clockvane`** (free, 1 minute) — this gives you
   github.com/clockvane and keeps the website out of your personal profile:
   - https://github.com/account/organizations/new?plan=free → name `clockvane`, owned by your account.
   - New organizations block apps from making changes. Open
     https://github.com/organizations/clockvane/settings/oauth_application_policy and click
     **Remove restrictions** (simplest for a one-person org), or approve **GitHub CLI** there.
   - Optional: add anything you already know to `docs/product/BRIEF.md` (services, location).
3. **Bootstrap** (creates `clockvane/website`, ruleset, labels, environments, security settings,
   and a separate agents clone at `~/agents/clockvane-website`). It is safe to re-run:
   ```bash
   bash agentops/bin/bootstrap.sh
   # no organization? use your own account instead:
   # REPO_OWNER=MohammedAbdulFarhan08 REPO_NAME=clockvane bash agentops/bin/bootstrap.sh
   ```
4. **Never work in `~/agents/clockvane-website` yourself.** agentops resets it before every run.
   Clone the repo somewhere else for your own reading/editing.
5. **Status line** — this is how agentops learns your real plan usage (5-hour and weekly %,
   which include claude.ai and other devices). Bootstrap offers to connect it; or run
   `agents setup-statusline` (backs up `~/.claude/settings.json`, keeps an existing status line).
   Then open Claude Code once and send one message.
6. **Check it** — open a new Ubuntu terminal (bootstrap added the `agents` command):
   ```bash
   agents doctor     # prerequisites
   agents next       # what it would do next, changes nothing
   ```
7. **Install the background ticker** from Windows PowerShell. Bootstrap prints the exact command
   and saves it in `~/.claude/agentops/scheduler-command.txt`. It runs
   `agentops/bin/tick.sh`, which loads nvm and `~/.local/bin` (background shells don't).
   It ticks every 30 minutes but does nothing until you start the agents.
8. **Start them** whenever you like — see the next section.

## 4a. Starting and stopping (you decide when)

| Command (in Ubuntu) | What it does |
|---------------------|--------------|
| `agents start` | Agents work until you say stop. The first run starts right away. |
| `agents start --hours 6` | Work for the next 6 hours, then stop by themselves. |
| `agents start --until 07:30` | Work until 07:30 (your local time), e.g. overnight. |
| `agents start --now` | Same, but don't wait for the 20-minute quiet period after your own Claude use. |
| `agents stop` | No new runs. A run in progress finishes (max 45 min). |
| `agents stop --kill` | Also end the run in progress now (its unpushed work is dropped and redone later). |
| `agents start --hours 2 --session-limit 90` | Same, with a different session limit for this start only. |
| `agents limits --session 96` | Set how far into your plan the agents may go (saved; see §6). `agents limits` shows them. |
| `agents status` | Started or not, live plan usage, your limits, planning state, last runs (add `--live` to check usage now). |
| `agents dashboard` | Opens a live dashboard in your browser (see below). |

### The dashboard

`agents dashboard` (in its own Ubuntu tab) opens **http://localhost:8765** in your Windows browser:

- **Right now:** which agent is working, on which ticket or PR, for how long, and each step it
  takes (files read and edited, commands, web searches, refused commands) as it happens. When
  nobody is working: why (spacing, your limit, stopped) and who goes next.
- **Plan usage:** session and weekly bars with your limit marked, and how big a run usually is.
- **Work board:** Ready, In progress, In review (with each reviewer's verdict), **Needs you**,
  Waiting (and what for), Done. Cards link to GitHub.
- **Team:** all 12 agents: working now, last run, or not used yet. **Recent runs:** result,
  time, turns, usage; click a run to replay its steps.

It only reads: your laptop's agent logs, and GitHub (refreshed every minute). It listens only on
your own computer. Closing it does not affect the agents.

Even when started, a run only begins if you're not using Claude Code yourself (unless `--now`)
and the run fits under your usage limits (§6). Prefer a fixed timetable instead? Set
`"schedule": {"mode": "always", "allowed_hours": "23:00-07:30"}` in your local config (§6).

## 5. Your job as the owner

| When | What you do |
|------|-------------|
| A `gate:N` PR is labeled `needs-human` | Read it (for Gate 2 open `docs/design/prototype/index.html`). Approve = **merge it**. Want changes = comment, then add the `owner-feedback` label; the author agent revises it. |
| An issue/PR is labeled `needs-human` | Answer in a comment, then remove the label. |
| An issue asks for an account or secret | Create it yourself; add the secret in GitHub Settings → Secrets (or the `production` environment). Agents never touch credentials. |
| A production deploy is waiting | Actions → the run → **Review deployments** → approve. |
| You want to change the rules | Edit `CLAUDE.md`, `.claude/`, or `agentops/` in your own clone and open a PR. Agents cannot edit these. |
| You need all your usage for something else | `agents stop` (add `--kill` to end a run in progress). |

Tip: watch the repo on GitHub (Custom → Issues, PRs) and filter notifications by `needs-human`.

## 6. Usage rules (shared Pro plan)

Defaults in `agentops/config.json`. Put personal changes in
`~/.claude/agentops/config.local.json` (same keys, only what you change) — it survives the clone
reset and needs no PR.

| Setting | Default | Meaning |
|---------|---------|---------|
| `schedule.mode` | on-demand | Agents work only after `agents start`. `always` = any time inside `allowed_hours` |
| `idle.quiet_minutes` | 20 | No agent run while any of your other Claude Code sessions was active in the last 20 min |
| `usage.five_hour_stop_pct` | 75 | **Your session limit.** `agents limits --session 96` |
| `usage.seven_day_stop_pct` | 85 | **Your weekly limit** (you + agents). `agents limits --weekly 90` |
| `usage.team_seven_day_share_pct` | **50** | Most of the week the agents *themselves* may use. `agents limits --team-share 60` |
| `usage.expected_run_pct.*` | implement 20, fix 10, review 8, plan 5 | Starting guess of how much of a session one run uses; replaced by measured values after a few runs |
| `usage.stop_runs_at_limit` | true | A run that reaches your limit while working is stopped (picked up again later) |
| `usage.live.max_age_minutes` | 15 | How old a usage reading may be; older → one tiny check request first (~$0.001) |
| `run.plan_retry_minutes` / `run.max_plan_failures` | 30 / 3 | A failed planning run is retried after 30 min, at most 3 times per GitHub state |
| `usage.safety_margin_pct`, `uncalibrated_max_runs_per_5h` | 8, 2 | Only used if no live reading can be taken |
| `schedule.max_runs_per_day` | 12 | Hard daily cap |
| `schedule.min_minutes_between_runs` | 25 | Spacing between runs |
| `schedule.allowed_hours` | 00:00-24:00 | Only used in `always` mode, e.g. `"23:00-07:30"` (IST) |
| `run.max_budget_usd.*` | 1-4 | Per-run size cap from Claude Code's *estimate* (you are not billed this on a subscription) |
| `run.max_turns.*` | 30-70 | Per-run turn cap |

How usage is measured: every Claude request returns your plan's real usage — including what you
use on claude.ai, the desktop app or other machines. agentops saves the newest reading from agent
runs, from the status line, or from a one-word check request on the smallest model when the last
reading is older than 15 minutes. A run starts only if **current usage + its expected size ≤ your
limit**, its spending cap is lowered to fit, and it is stopped if usage reaches the limit anyway.
How much each kind of run costs is measured after every run, so the expected sizes become your
real numbers. If Claude itself reports a limit, agentops waits until the reset time.

Check any time: `python3 agentops/agentops.py status`.

**Honest expectation on Pro:** one agent run (one ticket, review or fix) can use a sizeable part
of a Pro 5-hour window. With the defaults you should expect a handful of runs per day, so the
full SDLC to a launched MVP is a matter of weeks, not days. Max 5x makes it roughly 5x faster with
no other change. Levers if you want it faster on Pro: switch `tech-lead` to `model: sonnet`,
lower `effort` in the reviewer files (high → medium), or allow more runs at night.

## 7. Swapping in the real brand, domain and email later

Open an issue: "Brand: real name is X, domain Y, email Z". The EM turns it into tickets: the site
config change (one file), DNS + custom domain steps for the host in ADR-002 (you do the account
part), and the contact pipeline switch. Marketing agents can then be added the same way: new
files in `.claude/agents/`, new rules in `review-matrix.json`.

## 8. Safety model and upgrade path

- Agents can't merge, push to `main`, force-push, set statuses for other roles, touch secrets,
  rulesets or environments, run cloud CLIs (`gcloud`, `aws`, `wrangler`…), read `.env`/SSH/gh
  credentials, or edit governance files — enforced three ways: Claude Code deny rules
  (`agentops/claude-run-settings.json`), guard hooks (`agentops/hooks/`), and the GitHub ruleset.
- Runs use `dontAsk` mode: anything not on the allowlist is denied, never prompted.
- Every run is logged in `~/.claude/agentops/clockvane-website/` (ledger + full stream log).
- **Upgrade later:** create a GitHub App (or one machine-user account) for the reviewers, so
  approvals become real GitHub reviews and the agents stop acting as you. agentops only needs
  the `post-review` script changed.

## 9. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Nothing happens at all | `agents status` — most likely "not started": run `agents start`. It also shows the last planning result and refused commands. |
| "would pass your limit" | Working as intended: the next run doesn't fit under your limit. Raise it (`agents limits --session 96`) or wait for the reset time shown. |
| Dashboard page doesn't load | Is `agents dashboard` still running in an Ubuntu tab? Try http://127.0.0.1:8765. Another port: `agents dashboard --port 8800`. |
| Updating the kit | Unzip the new kit, then `bash <kit>/agentops/bin/update-kit.sh` (opens, approves and merges a governance PR as you, then refreshes the agents' copy). |
| `status` says "owner active" all the time | A Claude Code session of yours keeps writing. Close it, or lower `idle.quiet_minutes`. |
| Gate says "usage unknown" | Configure the status line (step 5) and send one message in Claude Code. |
| A PR sits forever | `python3 agentops/agentops.py next` shows why: CI pending, `needs-human`, or a gate PR waiting for you. |
| "Refusing to run: .agentops-clone not found" | You ran agentops outside the agents clone. That is the safety catch. |
| Scheduler does nothing | `wsl -l -v` for the distro name; check `~/.claude/agentops/tick.log`. |
| Unknown flag `--permission-prompts` | `claude update` (needs 2.1.259+). |

Unit tests for the scheduler: `python3 agentops/agentops.py selftest`.
