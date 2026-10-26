"""`agents dashboard` — a live, read-only view of the agent team in your browser.

Serves http://localhost:<port>/ from WSL (127.0.0.1 only; Windows reaches it through WSL's
localhost forwarding). Local facts — who is working, their steps, usage, past runs — come from
~/.claude/agentops. Tickets and pull requests come from GitHub through `gh`, refreshed every
minute in the background. Nothing here changes anything.
"""
from __future__ import annotations

import contextlib
import datetime as dt
import http.server
import json
import os
import re
import subprocess
import threading
import time
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Optional

TEAM = [
    ("product-owner", "Product Owner", "Product"),
    ("eng-manager", "Engineering Manager", "Delivery"),
    ("tech-lead", "Tech Lead", "Engineering"),
    ("sde3", "SDE 3", "Engineering"),
    ("sde2", "SDE 2", "Engineering"),
    ("ux-designer", "UX Designer", "Design"),
    ("content-writer", "Content Writer", "Design"),
    ("qa-engineer", "QA Engineer", "Quality"),
    ("code-reviewer", "Code Reviewer", "Quality"),
    ("security-reviewer", "Security Reviewer", "Quality"),
    ("devops-lead", "DevOps Lead", "DevOps"),
    ("devops-engineer", "DevOps Engineer", "DevOps"),
]
PHASES = ["initiation", "design", "build", "release", "operate"]
GATES = {"gate:1": "Scope approved", "gate:2": "Design approved", "gate:3": "Go-live approved"}
LOG_NAME = re.compile(r"^[\w.-]+\.jsonl$")
GITHUB_EVERY = 60.0


def agent_meta(root: Path) -> Dict[str, Dict[str, str]]:
    out: Dict[str, Dict[str, str]] = {}
    for f in (root / ".claude" / "agents").glob("*.md"):
        head = f.read_text(encoding="utf-8", errors="ignore").split("---")
        meta = dict(re.findall(r"(?m)^(\w+):\s*(.+?)\s*$", head[1] if len(head) > 2 else ""))
        out[meta.get("name", f.stem)] = {"model": meta.get("model", ""), "color": meta.get("color", "")}
    return out


# --------------------------------------------------------------------------- run steps
def _short(text: str, n: int = 160) -> str:
    text = " ".join(str(text or "").split())
    return text if len(text) <= n else text[: n - 1] + "…"


def describe_tool(name: str, inp: Dict[str, Any], root: str) -> Dict[str, str]:
    def rel(p: str) -> str:
        p = str(p or "")
        return p[len(root) + 1:] if root and p.startswith(root + "/") else p

    if name == "Read":
        return {"kind": "read", "text": f"Read {rel(inp.get('file_path'))}"}
    if name in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
        verb = "Wrote" if name == "Write" else "Edited"
        return {"kind": "edit", "text": f"{verb} {rel(inp.get('file_path') or inp.get('notebook_path'))}"}
    if name == "Bash":
        cmd = str(inp.get("command") or "")
        label = inp.get("description") or (cmd.splitlines()[0] if cmd else "")
        return {"kind": "run", "text": _short(label, 140), "detail": _short(cmd, 400)}
    if name == "Skill":
        return {"kind": "skill", "text": f"Loaded the {inp.get('skill') or inp.get('name') or ''} playbook"}
    if name in ("Glob", "Grep"):
        return {"kind": "read", "text": f"Searched files for {_short(inp.get('pattern'), 80)}"}
    if name == "WebSearch":
        return {"kind": "web", "text": f"Searched the web: {_short(inp.get('query'), 100)}"}
    if name == "WebFetch":
        return {"kind": "web", "text": f"Read web page {_short(inp.get('url'), 100)}"}
    if name in ("TodoWrite", "TaskCreate", "TaskUpdate"):
        return {"kind": "plan", "text": "Updated its checklist"}
    if name in ("Agent", "Task"):
        return {"kind": "plan", "text": f"Asked a helper: {_short(inp.get('description'), 100)}"}
    return {"kind": "other", "text": name}


def parse_steps(path: Path, root: str, limit: int = 60) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []
    by_tool: Dict[str, Dict[str, Any]] = {}
    turns, last_ts, final, cost, model = set(), None, None, None, None
    try:
        fh = open(path, encoding="utf-8", errors="ignore")
    except OSError:
        return {"steps": [], "turns": 0}
    with fh:
        for line in fh:
            try:
                ev = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(ev, dict):
                continue
            ts = ev.get("_ts") or last_ts
            last_ts = ts
            et = ev.get("type")
            if et == "system" and ev.get("subtype") == "init":
                model = ev.get("model")
            elif et == "assistant":
                msg = ev.get("message") or {}
                if msg.get("id"):
                    turns.add(msg["id"])
                for c in msg.get("content") or []:
                    if not isinstance(c, dict):
                        continue
                    if c.get("type") == "tool_use":
                        step = dict(describe_tool(c.get("name", ""), c.get("input") or {}, root), t=ts)
                        by_tool[c.get("id", "")] = step
                        steps.append(step)
                    elif c.get("type") == "text" and str(c.get("text", "")).strip():
                        steps.append({"kind": "say", "text": _short(c["text"], 220), "t": ts})
            elif et == "user":
                for c in (ev.get("message") or {}).get("content") or []:
                    if isinstance(c, dict) and c.get("type") == "tool_result" and c.get("is_error"):
                        step = by_tool.get(c.get("tool_use_id", ""))
                        if step is not None:
                            content = c.get("content")
                            if isinstance(content, list):
                                content = " ".join(str(x.get("text", "")) for x in content if isinstance(x, dict))
                            refused = "denied" in str(content) or "Blocked by agentops" in str(content)
                            step["error"] = "refused" if refused else "failed"
                            step["why"] = _short(content, 200)
            elif et == "result":
                final = ev.get("result")
                cost = ev.get("total_cost_usd")
                lines = [ln for ln in str(final or "").strip().splitlines() if ln.strip()]
                steps.append({"kind": "done", "text": _short(lines[-1] if lines else ev.get("subtype"), 220), "t": ts})
            # ---- Codex (`codex exec --json`)
            elif et == "item.completed":
                step = codex_step(ev.get("item") or {}, root)
                if step:
                    step["t"] = ts
                    steps.append(step)
                    if step["kind"] == "say":
                        final = step["full"]
            elif et == "turn.completed":
                turns.add(f"turn{len(turns)}")
                lines = [ln for ln in str(final or "").strip().splitlines() if ln.strip()]
                if lines:
                    steps.append({"kind": "done", "text": _short(lines[-1], 220), "t": ts})
            elif et == "turn.failed":
                msg = (ev.get("error") or {}).get("message") or "the run failed"
                steps.append({"kind": "done", "text": _short(msg, 220), "t": ts, "error": "failed", "why": ""})
    for st in steps:
        st.pop("full", None)
    return {"steps": steps[-limit:], "total_steps": len(steps), "turns": len(turns), "model": model,
            "cost": cost, "last_at": last_ts}


def codex_step(item: Dict[str, Any], root: str) -> Optional[Dict[str, Any]]:
    def rel(p: str) -> str:
        p = str(p or "")
        return p[len(root) + 1:] if root and p.startswith(root + "/") else p

    kind = item.get("type")
    if kind == "command_execution":
        cmd = item.get("command") or ""
        if isinstance(cmd, list):
            cmd = cmd[-1] if len(cmd) >= 3 and str(cmd[1]) in ("-c", "-lc") else " ".join(map(str, cmd))
        m = re.match(r"^(?:/\S*/)?(?:ba|z)?sh -l?c (['\"])(.*)\1$", str(cmd), re.S)
        cmd = m.group(2) if m else str(cmd)
        step = {"kind": "run", "text": _short(cmd.splitlines()[0] if cmd else "", 140), "detail": _short(cmd, 400)}
        out = str(item.get("aggregated_output") or "")
        if item.get("exit_code") not in (0, None) or item.get("status") in ("failed", "declined"):
            refused = "Blocked by agentops" in out or "denied" in out.lower() or item.get("status") == "declined"
            step.update(error="refused" if refused else "failed", why=_short(out.strip().splitlines()[-1] if out.strip() else "", 200))
        return step
    if kind == "file_change":
        changes = item.get("changes") or []
        verbs = {"add": "Created", "delete": "Deleted"}
        text = ", ".join(f"{verbs.get(c.get('kind'), 'Edited')} {rel(c.get('path'))}" for c in changes[:3])
        return {"kind": "edit", "text": _short(text + (" …" if len(changes) > 3 else ""), 200)}
    if kind == "agent_message" and str(item.get("text", "")).strip():
        return {"kind": "say", "text": _short(item["text"], 220), "full": item["text"]}
    if kind == "web_search":
        return {"kind": "web", "text": f"Searched the web: {_short(item.get('query'), 100)}"}
    if kind == "mcp_tool_call":
        return {"kind": "other", "text": f"{item.get('server', '')} {item.get('tool', '')}".strip()}
    if kind == "todo_list":
        return {"kind": "plan", "text": "Updated its checklist"}
    return None  # reasoning, notices and warnings are not steps


# --------------------------------------------------------------------------- GitHub (cached)
def make_cached_gh(ao, base):
    class CachedGH(ao.GH):
        """Answers the dispatcher's questions from data fetched once per refresh (read-only)."""

        def __init__(self, issues, prs):
            super().__init__(base.bin, base.repo)
            self._issues, self._prs, self._memo = issues, prs, {}

        def _m(self, key, fn):
            if key not in self._memo:
                self._memo[key] = fn()
            return self._memo[key]

        def open_prs(self):
            return [p for p in self._prs if p.get("state") == "OPEN"]

        def open_issues(self):
            return [i for i in self._issues if i.get("state") == "OPEN"]

        def statuses(self, sha):
            return self._m(("st", sha), lambda: base.statuses(sha))

        def check_runs(self, sha):
            return self._m(("cr", sha), lambda: base.check_runs(sha))

        def pr_files(self, n):
            return self._m(("f", n), lambda: base.pr_files(n))

        def pr_review_bodies(self, n):
            return self._m(("rb", n), lambda: base.pr_review_bodies(n))

        def issue_state(self, n):
            for i in self._issues:
                if i["number"] == n:
                    return "closed" if i.get("state") == "CLOSED" else "open"
            return self._m(("is", n), lambda: base.issue_state(n))

    return CachedGH


class Dashboard:
    def __init__(self, ao):
        self.ao = ao
        self.root = ao.REPO_ROOT
        self.meta = agent_meta(self.root)
        self.lock = threading.Lock()
        self.github: Dict[str, Any] = {"at": None, "error": "loading…"}
        self.local_cache: Dict[str, Any] = {"at": 0.0, "data": None}
        self.steps_cache: Dict[str, Any] = {}
        self.refresh_requested = threading.Event()
        self._sched: Optional[tuple] = None

    def scheduler_minutes(self, cfg) -> float:
        """The real interval of the Windows scheduled task (falls back to the config value)."""
        now = time.time()
        if self._sched and now - self._sched[0] < 600:
            return self._sched[1]
        minutes = float(cfg.get("schedule", "tick_minutes", default=10))
        with contextlib.suppress(Exception):
            out = subprocess.run(["schtasks.exe", "/query", "/tn", "AgentOps-Clockvane", "/xml"],
                                 capture_output=True, timeout=15).stdout
            utf16 = out[:2] in (b"\xff\xfe", b"\xfe\xff") or b"\x00" in out[:200]
            text = out.decode("utf-16") if utf16 else out.decode("utf-8", "ignore")
            m = re.search(r"<Interval>PT(?:(\d+)H)?(?:(\d+)M)?</Interval>", text)
            if m and (m.group(1) or m.group(2)):
                minutes = float(int(m.group(1) or 0) * 60 + int(m.group(2) or 0))
        self._sched = (now, minutes)
        return minutes

    # --- GitHub -------------------------------------------------------------
    def fetch_github(self) -> Dict[str, Any]:
        ao = self.ao
        cfg = ao.Config.load()
        state = ao.State(cfg)
        gh = ao.GH(cfg.get("gh_bin", default="gh"), cfg["repo"])
        now = time.time()
        issues = gh._json(["issue", "list", "--repo", gh.repo, "--state", "all", "--limit", "100", "--json",
                           "number,title,labels,state,url,createdAt,closedAt,body"]) or []
        prs = gh._json(["pr", "list", "--repo", gh.repo, "--state", "all", "--limit", "40", "--json",
                        "number,title,state,labels,headRefOid,headRefName,url,isDraft,createdAt,mergedAt,"
                        "closedAt,body,author"]) or []
        cached = make_cached_gh(ao, gh)(issues, prs)
        out_prs = []
        for pr in prs:
            labels = ao.label_names(pr)
            item = {"number": pr["number"], "title": pr["title"], "state": pr["state"], "url": pr["url"],
                    "labels": labels, "author_role": ao.role_from(labels, pr.get("headRefName", "")),
                    "issue": ao.linked_issue(pr), "gate": next((lb for lb in labels if lb.startswith("gate:")), None),
                    "merged_at": ao.parse_iso(pr.get("mergedAt") or ""), "created_at": ao.parse_iso(pr.get("createdAt") or "")}
            if pr["state"] == "OPEN":
                with contextlib.suppress(Exception):
                    statuses = cached.statuses(pr["headRefOid"])
                    item["ci"] = ao.ci_state(cached.check_runs(pr["headRefOid"]), statuses,
                                             item["created_at"] or now, now,
                                             cfg.get("run", "ci_grace_minutes", default=10))
                    required = ao.required_reviewers(cached.pr_files(pr["number"]), labels, item["author_role"],
                                                     cfg.matrix)
                    verdict = {s["context"][len(ao.REVIEW_CTX):]: s.get("state") for s in statuses
                               if str(s.get("context", "")).startswith(ao.REVIEW_CTX)}
                    item["reviews"] = [{"role": r, "state": {"success": "approved", "failure": "changes"}.get(
                        verdict.get(r), "waiting")} for r in required]
            out_prs.append(item)
        out_issues = [{"number": i["number"], "title": i["title"], "state": i["state"], "url": i["url"],
                       "labels": ao.label_names(i), "role": ao.role_from(ao.label_names(i)),
                       "deps": ao.dependencies(i.get("body") or ""),
                       "closed_at": ao.parse_iso(i.get("closedAt") or "")} for i in issues]
        nxt, by_lane = None, {}
        lanes = ao.active_lanes(cfg, state)
        for lane in lanes:
            with contextlib.suppress(Exception):
                # what an idle worker of this engine would pick next (everything held by a worker is skipped)
                disp = ao.Dispatcher(cfg, cached, state, now, apply=False, lane=lane, lanes=lanes,
                                     busy=ao.busy_work(state, "dashboard"), worker=lane)
                work = disp.choose(ao.read_phase(), ao.git("rev-parse", "HEAD", check=False))
                by_lane[lane] = work.__dict__ if work else None
                if lane == "claude":
                    nxt = {"work": by_lane[lane], "housekeeping": disp.actions}
        return {"at": now, "error": None, "issues": out_issues, "prs": out_prs, "next": nxt, "next_by_lane": by_lane}

    def github_loop(self) -> None:
        while True:
            try:
                data = self.fetch_github()
            except Exception as exc:  # noqa: BLE001 - show any failure on the page
                with self.lock:
                    data = dict(self.github, error=f"GitHub not reachable: {str(exc)[:200]}")
            with self.lock:
                self.github = data
            self.refresh_requested.wait(GITHUB_EVERY)
            self.refresh_requested.clear()

    # --- local --------------------------------------------------------------
    def steps_for(self, path: Path) -> Dict[str, Any]:
        try:
            st = path.stat()
        except OSError:
            return {"steps": [], "turns": 0}
        key = str(path)
        hit = self.steps_cache.get(key)
        if hit and hit[0] == (st.st_size, st.st_mtime):
            return hit[1]
        data = parse_steps(path, str(self.root))
        self.steps_cache[key] = ((st.st_size, st.st_mtime), data)
        if len(self.steps_cache) > 40:
            self.steps_cache.pop(next(iter(self.steps_cache)))
        return data

    def local(self) -> Dict[str, Any]:
        if self.local_cache["data"] and time.time() - self.local_cache["at"] < 2.5:
            return self.local_cache["data"]
        ao = self.ao
        cfg = ao.Config.load()
        state = ao.State(cfg)
        now = time.time()
        window = ao.read_window(cfg, now)
        live = ao.live_usage(cfg, now)
        ok, reasons, info = ao.gate(cfg, state, now, live=live) if live else ao.gate(cfg, state, now)
        lanes = ao.active_lanes(cfg, state)
        workers = ao.active_workers(cfg, state)
        currents = []
        for path in sorted(state.dir.glob("current_run*.json")):
            worker = "claude" if path.stem == "current_run" else path.stem[len("current_run-"):]
            cur = ao.load_json(path) or {}
            if cur and ao.pid_alive(cur.get("pid")):
                cur = dict(cur, lane=ao.worker_engine(worker), worker=worker,
                           **{k: v for k, v in self.steps_for(Path(cur.get("log", ""))).items()
                              if not (k == "model" and cur.get("model"))})
                currents.append(cur)
        currents.sort(key=lambda c: (c["lane"] != "claude", ao.worker_number(c["worker"])))
        current = currents[0] if currents else {}
        orch = state.doc("orchestrator")
        if not (orch and ao.pid_alive(orch.get("pid"))):
            orch = None
        codex = None
        if cfg.get("engines", "codex", "enabled", default=False):
            clive = ao.live_usage(cfg, now, "codex")
            cok, creasons, cinfo = ao.gate(cfg, state, now, live=clive, lane="codex") if clive \
                else ao.gate(cfg, state, now, lane="codex")
            codex = {"active": "codex" in lanes, "live": clive, "limits": ao.effective_limits(cfg, window, "codex"),
                     "gate": {"open": cok, "reasons": creasons}, "check": state.doc("codex_check") or None,
                     "off_reason": (orch or {}).get("codex_off") or ao.codex_off_reason(cfg, state),
                     "unverified": ao.unverified_workers(cfg, state),
                     "expected": {a: ao.expected_run_pct(cfg, state, a, "codex")[0]
                                  for a in ("implement", "fix", "review")}}
        runs = [r for r in state.ledger(now - 7 * ao.DAY) if r.get("kind") == "run"]
        day_start = dt.datetime.fromtimestamp(now, cfg.tz).replace(hour=0, minute=0, second=0).timestamp()
        team = []
        for role, title, group in TEAM:
            mine = [r for r in runs if r.get("role") == role]
            last = mine[-1] if mine else None
            rs = ao.role_settings(cfg, role)
            on_gpt = ao.engine_for(cfg, role, lanes) == "codex"
            team.append({"role": role, "title": title, "group": group,
                         "model": rs.get("model") if on_gpt else self.meta.get(role, {}).get("model", ""),
                         "engine": "codex" if on_gpt else "claude",
                         "planned_engine": rs.get("engine", "claude"),
                         "color": self.meta.get(role, {}).get("color", ""),
                         "working": any(c.get("role") == role for c in currents),
                         "runs_today": sum(1 for r in mine if r["started"] >= day_start),
                         "last": {k: last.get(k) for k in ("started", "action", "issue", "pr", "outcome")} if last else None})
        tick_log = ao.xp("~/.claude/agentops/tick.log")
        last_tick = tick_log.stat().st_mtime if tick_log.exists() else None
        every = self.scheduler_minutes(cfg)
        expected = {a: ao.expected_run_pct(cfg, state, a)[0] for a in ("implement", "fix", "review", "plan")}
        out_runs = []
        for r in runs[-30:]:
            item = {k: r.get(k) for k in ("started", "ended", "role", "action", "issue", "pr", "outcome", "turns",
                                          "cost_estimate_usd", "denials_total", "chained", "lane", "model", "worker")}
            item["final"] = ao.final_line(r.get("final", ""))[:220]
            item["session_pct"] = (r.get("usage_delta") or {}).get("five_hour")
            item["log"] = Path(r["log"]).name if r.get("log") else None
            out_runs.append(item)
        version = (ao.HERE / "VERSION").read_text().strip() if (ao.HERE / "VERSION").exists() else "?"
        data = {
            "now": now, "tz": dt.datetime.now(cfg.tz).strftime("%Z") or "", "kit": version, "repo": cfg["repo"],
            "phase": ao.read_phase(), "phases": PHASES, "gates": GATES,
            "window": window, "mode": cfg.get("schedule", "mode", default="on-demand"),
            "gate": {"open": ok, "reasons": reasons},
            "usage": {"live": live, "limits": info.get("limits") or ao.effective_limits(cfg, window),
                      "expected": expected, "team_week_pct": ao.team_share_live(state, now)},
            "current": current or None, "currents": currents, "lanes": lanes, "codex": codex,
            "workers": workers, "worker_counts": {lane: sum(1 for w in workers if ao.worker_engine(w) == lane)
                                                  for lane in lanes},
            "orchestrator": orch,
            "team": team, "runs": list(reversed(out_runs)),
            "last_plan": state.doc("last_plan") or None, "cooldown": state.doc("cooldown") or None,
            "last_tick": last_tick, "tick_minutes": every,
            "min_gap_minutes": cfg.get("schedule", "min_minutes_between_runs", default=25),
            "last_run_at": runs[-1]["started"] if runs else None,
        }
        self.local_cache = {"at": time.time(), "data": data}
        return data

    def state(self) -> Dict[str, Any]:
        with self.lock:
            gh = dict(self.github)
        return dict(self.local(), github=gh)

    def run_steps(self, name: str) -> Dict[str, Any]:
        if not LOG_NAME.match(name or ""):
            return {"error": "bad name"}
        cfg = self.ao.Config.load()
        path = self.ao.State(cfg).dir / "logs" / name
        if not path.is_file():
            return {"error": "not found"}
        return self.steps_for(path)


def make_handler(dash: Dashboard, page: bytes):
    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self, *_args):  # quiet
            pass

        def _send(self, code: int, body: bytes, ctype: str) -> None:
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy",
                             "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; "
                             "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):  # noqa: N802
            url = urllib.parse.urlparse(self.path)
            q = urllib.parse.parse_qs(url.query)
            try:
                if url.path in ("/", "/index.html"):
                    return self._send(200, page, "text/html; charset=utf-8")
                if url.path == "/api/state":
                    if q.get("refresh"):
                        dash.refresh_requested.set()
                    return self._send(200, json.dumps(dash.state(), default=str).encode(), "application/json")
                if url.path == "/api/run":
                    return self._send(200, json.dumps(dash.run_steps((q.get("log") or [""])[0]), default=str).encode(),
                                      "application/json")
                return self._send(404, b"not found", "text/plain")
            except Exception as exc:  # noqa: BLE001
                return self._send(500, json.dumps({"error": str(exc)[:300]}).encode(), "application/json")

    return Handler


def open_browser(url: str) -> None:
    for cmd in (["explorer.exe", url], ["wslview", url], ["xdg-open", url]):
        with contextlib.suppress(OSError):
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return


def serve(ao, port: int = 8765, open_page: bool = True) -> int:
    page = (ao.HERE / "dashboard" / "index.html").read_bytes()
    dash = Dashboard(ao)
    threading.Thread(target=dash.github_loop, daemon=True).start()
    server = None
    for p in range(port, port + 10):
        try:
            server = http.server.ThreadingHTTPServer(("127.0.0.1", p), make_handler(dash, page))
            port = p
            break
        except OSError:
            continue
    if server is None:
        raise SystemExit(f"ports {port}-{port + 9} are busy")
    url = f"http://localhost:{port}/"
    print(f"Agent dashboard: {url}   (if it doesn't open, try http://127.0.0.1:{port}/)")
    print("Read-only. Keep this terminal open while you use it; Ctrl+C stops it (the agents keep working).")
    if open_page:
        open_browser(url)
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        print("\nDashboard stopped.")
    finally:
        server.server_close()
    return 0
