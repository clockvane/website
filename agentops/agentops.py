#!/usr/bin/env python3
"""agentops — scheduler, usage gate and dispatcher for the Clockvane website agent team.

Runs on the owner's WSL laptop, one unit of work per tick:

  1. Housekeeping (no AI cost): read PRs/issues with `gh`, route reviews, set the
     `agent-review/summary` status, squash-merge PRs whose reviews all approve, flag
     gate PRs for the owner.
  2. Choose the next unit of AI work (fix > review > resume > new issue > EM planning).
  3. Gate it: run window, daily cap, owner idle, the owner's usage limits (checked against a
     live plan-usage reading), cooldowns.
  4. Run exactly one `claude -p --agent <role>` with tight limits, stop it if plan usage reaches
     the owner's limit, record the run in a ledger and learn how much a run costs.

Python 3.9+ stdlib only. Human-owned: agents cannot edit this folder.
Usage:  python3 agentops/agentops.py {start,stop,limits,status,dashboard,tick,gate,next,doctor,selftest}
"""
from __future__ import annotations

import argparse
import contextlib
import datetime as dt
import fcntl
import hashlib
import json
import os
import re
import selectors
import signal
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent
CLONE_MARKER = REPO_ROOT / ".agentops-clone"
LOCAL_CONFIG = "~/.claude/agentops/config.local.json"
HOUR = 3600.0
DAY = 24 * HOUR
WINDOWS = {"five_hour": 5 * HOUR, "seven_day": 7 * DAY}
REVIEW_CTX = "agent-review/"
SUMMARY_CTX = "agent-review/summary"
FAIL_CONCLUSIONS = {"failure", "timed_out", "cancelled", "action_required", "startup_failure", "stale"}
PRIORITY = {"priority:p0": 0, "priority:p1": 1, "priority:p2": 2, "priority:p3": 3}


# --------------------------------------------------------------------------- helpers
def xp(p: str) -> Path:
    return Path(os.path.expanduser(os.path.expandvars(p)))


def load_json(path: Path, default: Any = None) -> Any:
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, sort_keys=True)
    os.replace(tmp, path)


def deep_merge(base: Dict[str, Any], over: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(base)
    for k, v in over.items():
        out[k] = deep_merge(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out


def get_tz(name: str) -> dt.tzinfo:
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo(name)
    except Exception:  # tzdata missing in a minimal WSL image
        if name == "Asia/Kolkata":
            return dt.timezone(dt.timedelta(hours=5, minutes=30))
        return dt.timezone.utc


def parse_iso(ts: str) -> Optional[float]:
    if not ts:
        return None
    try:
        return dt.datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return None


LOG_TZ: Optional[dt.tzinfo] = None  # set from config, so tick.log uses your local time


def log(msg: str) -> None:
    stamp = dt.datetime.now(LOG_TZ).strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{stamp}] {msg}", flush=True)


def glob_to_regex(pattern: str) -> "re.Pattern[str]":
    out, i = "", 0
    while i < len(pattern):
        if pattern.startswith("**/", i):
            out, i = out + "(?:.*/)?", i + 3
        elif pattern.startswith("**", i):
            out, i = out + ".*", i + 2
        elif pattern[i] == "*":
            out, i = out + "[^/]*", i + 1
        elif pattern[i] == "?":
            out, i = out + "[^/]", i + 1
        else:
            out, i = out + re.escape(pattern[i]), i + 1
    return re.compile("^" + out + "$")


_GLOB_CACHE: Dict[str, "re.Pattern[str]"] = {}


def path_matches(path: str, patterns: Iterable[str]) -> bool:
    for p in patterns:
        rx = _GLOB_CACHE.get(p) or _GLOB_CACHE.setdefault(p, glob_to_regex(p))
        if rx.match(path):
            return True
    return False


# --------------------------------------------------------------------------- config & state
class Config:
    def __init__(self, data: Dict[str, Any], matrix: Dict[str, Any]):
        self.d = data
        self.matrix = matrix

    @classmethod
    def load(cls, root: Path = REPO_ROOT) -> "Config":
        data = load_json(root / "agentops" / "config.json")
        matrix = load_json(root / "agentops" / "review-matrix.json")
        if not data or not matrix:
            raise SystemExit("agentops/config.json or review-matrix.json is missing or invalid JSON")
        # Personal tuning that survives the clone reset (not in git): thresholds, hours, paths.
        local = xp(os.environ.get("AGENTOPS_LOCAL_CONFIG", LOCAL_CONFIG))
        override = load_json(local)
        if isinstance(override, dict):
            data = deep_merge(data, override)
        global LOG_TZ
        LOG_TZ = get_tz(data.get("timezone", "UTC"))
        return cls(data, matrix)

    def __getitem__(self, key: str) -> Any:
        return self.d[key]

    def get(self, *keys: str, default: Any = None) -> Any:
        cur: Any = self.d
        for k in keys:
            if not isinstance(cur, dict) or k not in cur:
                return default
            cur = cur[k]
        return cur

    @property
    def tz(self) -> dt.tzinfo:
        return get_tz(self.get("timezone", default="UTC"))


class State:
    def __init__(self, cfg: Config):
        self.dir = xp(cfg.get("paths", "state_dir", default="~/.claude/agentops/clockvane-website"))
        self.dir.mkdir(parents=True, exist_ok=True)
        (self.dir / "logs").mkdir(exist_ok=True)
        self.ledger_path = self.dir / "ledger.jsonl"

    # ledger -----------------------------------------------------------
    def ledger(self, since: float = 0.0) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        try:
            with open(self.ledger_path, encoding="utf-8") as fh:
                for line in fh:
                    with contextlib.suppress(json.JSONDecodeError):
                        rec = json.loads(line)
                        if rec.get("started", 0) >= since:
                            out.append(rec)
        except FileNotFoundError:
            pass
        return out

    def append_ledger(self, rec: Dict[str, Any]) -> None:
        with open(self.ledger_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(rec, sort_keys=True) + "\n")

    def our_sessions(self, since: float = 0.0) -> set:
        return {r["session_id"] for r in self.ledger(since) if r.get("session_id")}

    # small json documents ----------------------------------------------
    def doc(self, name: str, default: Any = None) -> Any:
        return load_json(self.dir / f"{name}.json", default if default is not None else {})

    def put(self, name: str, data: Any) -> None:
        save_json(self.dir / f"{name}.json", data)

    def bump(self, key: str, by: int = 1) -> int:
        attempts = self.doc("attempts")
        attempts[key] = max(0, attempts.get(key, 0) + by)
        self.put("attempts", attempts)
        return attempts[key]

    def attempts(self, key: str) -> int:
        return self.doc("attempts").get(key, 0)


# --------------------------------------------------------------------------- usage estimation
MODEL_WEIGHTS = {"fable": 10.0, "opus": 5.0, "sonnet": 3.0, "haiku": 1.0}


def model_weight(model: str) -> float:
    model = (model or "").lower()
    for fam, w in MODEL_WEIGHTS.items():
        if fam in model:
            return w
    return 3.0


def usage_cost(usage: Dict[str, Any], model: str) -> float:
    """Relative cost units (~USD per Mtok weights). Only ratios matter: we calibrate against
    the plan percentages Claude Code reports in the status line."""
    w = model_weight(model) / 1_000_000
    return w * (
        (usage.get("input_tokens") or 0)
        + 5.0 * (usage.get("output_tokens") or 0)
        + 1.25 * (usage.get("cache_creation_input_tokens") or 0)
        + 0.1 * (usage.get("cache_read_input_tokens") or 0)
    )


@dataclass
class UsageEvent:
    ts: float
    cost: float
    session: str
    project_dir: str


def scan_transcripts(dirs: Iterable[Path], since: float) -> List[UsageEvent]:
    events: List[UsageEvent] = []
    seen = set()
    for base in dirs:
        if not base.exists():
            continue
        for root, _dirs, files in os.walk(base):
            for name in files:
                if not name.endswith(".jsonl"):
                    continue
                path = Path(root) / name
                try:
                    if path.stat().st_mtime < since:
                        continue
                except OSError:
                    continue
                rel = path.relative_to(base).parts
                project_dir = rel[0] if rel else ""
                parent_session = path.parent.parent.name if path.parent.name == "subagents" else path.stem
                try:
                    with open(path, encoding="utf-8", errors="ignore") as fh:
                        for line in fh:
                            if '"usage"' not in line or '"assistant"' not in line:
                                continue
                            try:
                                obj = json.loads(line)
                            except json.JSONDecodeError:
                                continue
                            if obj.get("type") != "assistant":
                                continue
                            msg = obj.get("message") or {}
                            usage = msg.get("usage")
                            ts = parse_iso(obj.get("timestamp", ""))
                            if not usage or ts is None or ts < since:
                                continue
                            key = (msg.get("id"), obj.get("requestId"))
                            if key != (None, None):
                                if key in seen:
                                    continue
                                seen.add(key)
                            events.append(UsageEvent(ts, usage_cost(usage, msg.get("model", "")),
                                                     obj.get("sessionId") or parent_session, project_dir))
                except OSError:
                    continue
    events.sort(key=lambda e: e.ts)
    return events


def rolled_window(events: List[Tuple[float, float]], length: float, now: float) -> float:
    """Cost inside the current window, where a window starts at the first event after the
    previous window ended (how plan windows behave)."""
    start = None
    for t, _c in events:
        if start is None or t >= start + length:
            start = t
    if start is None or now >= start + length:
        return 0.0
    return sum(c for t, c in events if t >= start)


def estimate_window(snap: Optional[Dict[str, Any]], captured_at: Optional[float], length: float,
                    events: List[Tuple[float, float]], now: float,
                    ratio_hint: Optional[float]) -> Dict[str, Any]:
    """Estimate current % used of one plan window.

    snap: {"used_percentage": float, "resets_at": epoch} from the status line snapshot.
    events: (timestamp, cost) for all local Claude Code usage.
    ratio_hint: calibrated %-per-cost-unit from earlier snapshots.
    """
    if snap and snap.get("resets_at") and snap.get("used_percentage") is not None and captured_at:
        resets_at = float(snap["resets_at"])
        pct = float(snap["used_percentage"])
        start = resets_at - length
        if now < resets_at:
            base = sum(c for t, c in events if start <= t <= captured_at)
            ratio_obs = pct / base if base > 0.3 and pct >= 1.0 else None
            ratio = ratio_obs or ratio_hint
            delta = sum(c for t, c in events if captured_at < t <= now)
            if ratio is None:
                return {"pct": pct, "source": "snapshot", "ratio_obs": None,
                        "uncertain": delta > 0}
            return {"pct": pct + ratio * delta, "source": "snapshot+local", "ratio_obs": ratio_obs,
                    "uncertain": False}
        later = [(t, c) for t, c in events if t > resets_at]
        cost = rolled_window(later, length, now)
        if ratio_hint is None:
            return {"pct": None if cost else 0.0, "source": "rolled-uncalibrated", "ratio_obs": None,
                    "uncertain": cost > 0}
        return {"pct": ratio_hint * cost, "source": "rolled+local", "ratio_obs": None, "uncertain": False}
    recent = [(t, c) for t, c in events if t >= now - 2 * length]
    cost = rolled_window(recent, length, now)
    if ratio_hint is None:
        return {"pct": None if cost else 0.0, "source": "no-snapshot", "ratio_obs": None,
                "uncertain": cost > 0}
    return {"pct": ratio_hint * cost, "source": "local-estimate", "ratio_obs": None, "uncertain": False}


def estimate_usage(cfg: Config, state: State, now: float) -> Dict[str, Any]:
    snap_doc = load_json(xp(cfg.get("paths", "snapshot_file", default="~/.claude/agentops/usage-snapshot.json")))
    captured_at = (snap_doc or {}).get("captured_at")
    dirs = [xp(d) for d in cfg.get("idle", "transcript_dirs", default=["~/.claude/projects"])]
    events = scan_transcripts(dirs, now - 8 * DAY)
    pairs = [(e.ts, e.cost) for e in events]
    calib = state.doc("calibration")
    out: Dict[str, Any] = {"snapshot_age_h": None, "windows": {}}
    if captured_at:
        out["snapshot_age_h"] = round((now - captured_at) / HOUR, 2)
    for name, length in WINDOWS.items():
        hint = (calib.get(name) or {}).get("ratio")
        res = estimate_window((snap_doc or {}).get(name), captured_at, length, pairs, now, hint)
        if res.get("ratio_obs"):
            old = hint or res["ratio_obs"]
            calib[name] = {"ratio": round(0.5 * old + 0.5 * res["ratio_obs"], 6), "at": now}
        res["ratio"] = (calib.get(name) or {}).get("ratio")
        out["windows"][name] = res
    state.put("calibration", calib)
    ours = state.our_sessions(now - 8 * DAY)
    team_cost = sum(e.cost for e in events if e.session in ours and e.ts >= now - 7 * DAY)
    r7 = out["windows"]["seven_day"].get("ratio")
    out["team_seven_day_pct"] = round(team_cost * r7, 2) if r7 else None
    out["team_seven_day_cost"] = round(team_cost, 4)
    out["events"] = events
    return out


# --------------------------------------------------------------------------- live plan usage
# Every Claude Code request returns the plan's real usage (all of the owner's Claude use, including
# claude.ai and other machines). agentops saves the newest reading from agent runs, a tiny probe
# request and the status line in one snapshot file, and gates on it.
LIMIT_OUTCOMES = {"usage-limit", "usage-limit-reached", "throttled"}
DEFAULT_EXPECTED_PCT = {"implement": 20.0, "fix": 10.0, "review": 8.0, "plan": 5.0}


def snapshot_path(cfg: "Config") -> Path:
    return xp(cfg.get("paths", "snapshot_file", default="~/.claude/agentops/usage-snapshot.json"))


def reading_from_event(ev: Dict[str, Any]) -> Optional[Dict[str, Dict[str, Any]]]:
    """{'five_hour': {'pct': 78.0, 'resets_at': epoch}, 'seven_day': {...}} from a rate_limit_event."""
    windows = (ev.get("rate_limit_info") or {}).get("unifiedWindows") or {}
    out = {}
    for name in WINDOWS:
        w = windows.get(name)
        if isinstance(w, dict) and w.get("utilization") is not None:
            out[name] = {"pct": float(w["utilization"]) * 100.0, "resets_at": w.get("resetsAt")}
    return out or None


def save_reading(cfg: "Config", reading: Dict[str, Dict[str, Any]], source: str, now: Optional[float] = None) -> None:
    now = time.time() if now is None else now
    path = snapshot_path(cfg)
    cur = load_json(path) or {}
    if (cur.get("captured_at") or 0) > now:
        return
    doc: Dict[str, Any] = {"captured_at": now, "source": source}
    for name in WINDOWS:
        w = reading.get(name)
        if w:
            doc[name] = {"used_percentage": round(float(w["pct"]), 1), "resets_at": w.get("resets_at")}
        elif isinstance(cur.get(name), dict):
            doc[name] = cur[name]
    save_json(path, doc)


def live_usage(cfg: "Config", now: float) -> Optional[Dict[str, Any]]:
    """The newest plan-usage reading if it is fresh enough to trust, else None."""
    snap = load_json(snapshot_path(cfg))
    if not isinstance(snap, dict) or not snap.get("captured_at"):
        return None
    age = now - float(snap["captured_at"])
    if age < -60 or age > cfg.get("usage", "live", "max_age_minutes", default=15) * 60:
        return None
    out: Dict[str, Any] = {"age_min": round(max(age, 0) / 60, 1), "source": snap.get("source", "status line")}
    for name in WINDOWS:
        w = snap.get(name) or {}
        pct, resets = w.get("used_percentage"), w.get("resets_at")
        if pct is None:
            return None
        if resets and float(resets) <= now:
            pct = 0.0  # that window has reset since the reading
        out[name] = float(pct)
        out[name + "_resets"] = float(resets) if resets else None
    return out


def probe_usage(cfg: "Config", state: "State") -> Optional[str]:
    """Read plan usage with a one-word request on the smallest model (~$0.001). None on success."""
    cmd = [cfg.get("claude_bin", default="claude"), "-p", "Reply with just: OK",
           "--model", cfg.get("usage", "live", "probe_model", default="haiku"), "--max-turns", "1",
           "--tools", "", "--no-session-persistence", "--output-format", "stream-json", "--verbose",
           "--settings", json.dumps({"disableAllHooks": True})]
    try:
        res = subprocess.run(cmd, cwd=state.dir, capture_output=True, text=True, timeout=120,
                             stdin=subprocess.DEVNULL)
    except (OSError, subprocess.SubprocessError) as exc:
        return f"usage check failed: {exc}"
    reading, limit_text = None, ""
    for line in res.stdout.splitlines():
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        if ev.get("type") == "rate_limit_event":
            reading = reading_from_event(ev) or reading
        elif ev.get("type") == "result" and LIMIT_RX.search(json.dumps(ev, ensure_ascii=False)):
            limit_text = json.dumps(ev, ensure_ascii=False)
    if limit_text:
        set_limit_cooldown(cfg, state, limit_text)
    if reading:
        save_reading(cfg, reading, "usage check")
        return None
    return "usage check returned no reading" + (f" ({res.stderr.strip()[:120]})" if res.stderr.strip() else "")


def effective_limits(cfg: "Config", window: Optional[Dict[str, Any]] = None) -> Dict[str, float]:
    """The owner's limits: `agents limits` (config.local.json), overridden per window by `agents start`."""
    u = cfg.get("usage", default={})
    lim = {"session": float(u.get("five_hour_stop_pct", 75)), "weekly": float(u.get("seven_day_stop_pct", 85)),
           "team_share": float(u.get("team_seven_day_share_pct", 50))}
    for k, v in ((window or {}).get("limits") or {}).items():
        if k in lim and v is not None:
            lim[k] = float(v)
    return lim


def expected_run_pct(cfg: "Config", state: "State", action: str) -> Tuple[float, str]:
    learned = ((state.doc("run_costs").get("by_action") or {}).get(action)) or {}
    if learned.get("n"):
        return max(1.0, float(learned["pct"])), f"learned from {learned['n']} run(s)"
    default = (cfg.get("usage", "expected_run_pct", default={}) or {}).get(action, DEFAULT_EXPECTED_PCT.get(action, 10.0))
    return float(default), "starting guess"


def learn_run_cost(state: "State", rec: Dict[str, Any]) -> None:
    five = (rec.get("usage_delta") or {}).get("five_hour")
    if five is None or rec.get("outcome") in LIMIT_OUTCOMES or not rec.get("action"):
        return
    costs = state.doc("run_costs")
    by = costs.setdefault("by_action", {})
    cur = by.get(rec["action"]) or {}
    n = int(cur.get("n", 0))
    by[rec["action"]] = {"pct": round(five if not n else 0.5 * cur["pct"] + 0.5 * five, 2), "n": n + 1}
    usd = rec.get("cost_estimate_usd")
    if usd and five >= 1:
        old = costs.get("usd_per_pct")
        costs["usd_per_pct"] = round(usd / five if not old else 0.5 * old + 0.5 * usd / five, 4)
    seven = (rec.get("usage_delta") or {}).get("seven_day")
    if seven is not None:
        tot = costs.setdefault("totals", {"five": 0.0, "seven": 0.0})
        tot["five"], tot["seven"] = round(tot["five"] + five, 1), round(tot["seven"] + seven, 1)
        if tot["five"] >= 20:
            costs["seven_per_five"] = round(tot["seven"] / tot["five"], 3)
    state.put("run_costs", costs)


def team_share_live(state: "State", now: float) -> float:
    """% of the weekly plan the agents used in 7 days. Weekly readings move in 1% steps, so once
    the session-to-week ratio is measured, session deltas (larger, smoother) are used instead."""
    runs = [r for r in state.ledger(now - 7 * DAY) if r.get("kind") == "run" and r.get("usage_delta")]
    ratio = state.doc("run_costs").get("seven_per_five")
    if ratio is not None:
        return round(sum((r["usage_delta"].get("five_hour") or 0.0) for r in runs) * float(ratio), 1)
    return round(sum((r["usage_delta"].get("seven_day") or 0.0) for r in runs), 1)


def run_budget(cfg: "Config", state: "State", action: str, live: Optional[Dict[str, Any]],
               limits: Dict[str, float]) -> float:
    """Per-run spending cap: the configured cap, lowered so the run ends near the owner's limit."""
    base = float((cfg.get("run", "max_budget_usd", default={}) or {}).get(action, 2.0))
    usd_per_pct = state.doc("run_costs").get("usd_per_pct")
    if not live or not usd_per_pct:
        return base
    headroom = limits["session"] - live["five_hour"]
    return round(max(0.25, min(base, headroom * float(usd_per_pct))), 2)


def clock(ts: Optional[float], tz: dt.tzinfo, now: Optional[float] = None) -> str:
    if not ts:
        return "?"
    t = dt.datetime.fromtimestamp(float(ts), tz)
    same_day = t.date() == dt.datetime.fromtimestamp(now or time.time(), tz).date()
    return t.strftime("%H:%M" if same_day else "%a %H:%M")


# --------------------------------------------------------------------------- idle detection
def project_dir_name(path: Path) -> str:
    return re.sub(r"[^A-Za-z0-9]", "-", str(path))


def claude_processes(ignore_args: Iterable[str]) -> List[Dict[str, Any]]:
    procs = []
    me = os.getpid()
    for pid in os.listdir("/proc") if os.path.isdir("/proc") else []:
        if not pid.isdigit() or int(pid) == me:
            continue
        try:
            comm = Path(f"/proc/{pid}/comm").read_text().strip()
            args = [a.decode(errors="ignore") for a in Path(f"/proc/{pid}/cmdline").read_bytes().split(b"\0") if a]
        except OSError:
            continue
        if not args:
            continue
        is_claude = comm == "claude" or os.path.basename(args[0]) == "claude" or any(
            "@anthropic-ai/claude-code" in a for a in args)
        if not is_claude:
            continue
        try:
            if b"AGENTOPS_RUN=1" in Path(f"/proc/{pid}/environ").read_bytes():
                continue
        except OSError:
            pass
        if any(a in ignore_args for a in args[1:]):
            continue
        interactive = not any(a in ("-p", "--print") for a in args[1:])
        procs.append({"pid": int(pid), "interactive": interactive, "cmd": " ".join(args)[:120]})
    return procs


def last_foreign_activity(dirs: Iterable[Path], our_sessions: set, own_project: str) -> Optional[float]:
    newest = None
    for base in dirs:
        if not base.exists():
            continue
        for project in base.iterdir():
            if not project.is_dir() or project.name == own_project:
                continue
            for root, _d, files in os.walk(project):
                for name in files:
                    if not name.endswith(".jsonl"):
                        continue
                    path = Path(root) / name
                    session = path.parent.parent.name if path.parent.name == "subagents" else path.stem
                    if session in our_sessions:
                        continue
                    with contextlib.suppress(OSError):
                        m = path.stat().st_mtime
                        if newest is None or m > newest:
                            newest = m
    return newest


def windows_busy(names: List[str]) -> List[str]:
    if not names:
        return []
    try:
        out = subprocess.run(["tasklist.exe", "/FO", "CSV", "/NH"], capture_output=True, text=True,
                             timeout=15).stdout
    except (OSError, subprocess.SubprocessError):
        return []
    running = {line.split('","')[0].strip('"').lower() for line in out.splitlines() if line}
    return [n for n in names if n.lower() in running]


# --------------------------------------------------------------------------- gate
def window_path(cfg: Config) -> Path:
    return xp(cfg.get("paths", "window_file", default="~/.claude/agentops/RUN_WINDOW.json"))


def read_window(cfg: Config, now: float) -> Optional[Dict[str, Any]]:
    """The run window opened by `agents start`. None when closed or expired."""
    win = load_json(window_path(cfg))
    if not isinstance(win, dict):
        return None
    until = win.get("until")
    if until is not None and float(until) <= now:
        return None
    return win


def next_clock_time(hhmm: str, now: float, tz: dt.tzinfo) -> float:
    """Next occurrence of a local wall-clock time like '07:30' (today, or tomorrow if passed)."""
    m = re.fullmatch(r"(\d{1,2})(?::(\d{2}))?", hhmm.strip())
    if not m or int(m.group(1)) > 23 or int(m.group(2) or 0) > 59:
        raise SystemExit(f"--until expects HH:MM (24h), got {hhmm!r}")
    local = dt.datetime.fromtimestamp(now, tz)
    target = local.replace(hour=int(m.group(1)), minute=int(m.group(2) or 0), second=0, microsecond=0)
    if target.timestamp() <= now:
        target += dt.timedelta(days=1)
    return target.timestamp()


def in_allowed_hours(spec: str, local: dt.datetime) -> bool:
    minutes = local.hour * 60 + local.minute
    for part in (spec or "00:00-24:00").split(","):
        part = part.strip()
        if not part:
            continue
        a, b = part.split("-")
        ah, am = (int(x) for x in a.split(":"))
        bh, bm = (int(x) for x in b.split(":"))
        start, end = ah * 60 + am, bh * 60 + bm
        if start <= end and start <= minutes < end:
            return True
        if start > end and (minutes >= start or minutes < end):
            return True
    return False


def gate(cfg: Config, state: State, now: float, usage: Optional[Dict[str, Any]] = None,
         check_idle: bool = True, live: Optional[Dict[str, Any]] = None, action: Optional[str] = None,
         probe: bool = False, skip_spacing: bool = False) -> Tuple[bool, List[str], Dict[str, Any]]:
    reasons: List[str] = []
    info: Dict[str, Any] = {}
    local = dt.datetime.fromtimestamp(now, cfg.tz)

    pause = xp(cfg.get("paths", "pause_file", default="~/.claude/agentops/PAUSE"))
    if pause.exists():
        reasons.append(f"paused by owner ({pause} exists — delete it to resume)")

    cooldown = state.doc("cooldown")
    if cooldown.get("until", 0) > now:
        until = dt.datetime.fromtimestamp(cooldown["until"], cfg.tz).strftime("%a %H:%M")
        reasons.append(f"cooldown until {until} ({cooldown.get('reason', 'limit')})")

    sched = cfg.get("schedule", default={})
    window = read_window(cfg, now)
    info["mode"] = sched.get("mode", "always")
    info["window"] = window
    if window:
        pass  # you started the agents explicitly: hours and weekday rules do not apply
    elif info["mode"] == "on-demand":
        reasons.append("not started — run `agents start` (or `agents start --hours 6` / `--until 07:30`)")
    else:
        if not in_allowed_hours(sched.get("allowed_hours", "00:00-24:00"), local):
            reasons.append(f"outside allowed hours {sched.get('allowed_hours')}")
        if local.strftime("%a") in (sched.get("blocked_weekdays") or []):
            reasons.append(f"{local.strftime('%a')} is a blocked day")
    if window and window.get("skip_quiet"):
        check_idle = False  # `agents start --now`: you said go, even if you just used Claude Code

    day_start = local.replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    runs_today = [r for r in state.ledger(day_start) if r.get("kind") == "run"]
    info["runs_today"] = len(runs_today)
    if len(runs_today) >= sched.get("max_runs_per_day", 8):
        reasons.append(f"daily cap reached ({len(runs_today)} runs)")
    recent = state.ledger(now - sched.get("min_minutes_between_runs", 25) * 60)
    if not skip_spacing and any(r.get("kind") == "run" for r in recent):
        reasons.append("last run was too recent")

    idle_cfg = cfg.get("idle", default={})
    if check_idle:
        dirs = [xp(d) for d in idle_cfg.get("transcript_dirs", ["~/.claude/projects"])]
        last = last_foreign_activity(dirs, state.our_sessions(now - 8 * DAY), project_dir_name(REPO_ROOT))
        info["owner_last_activity_min"] = None if last is None else round((now - last) / 60, 1)
        quiet = idle_cfg.get("quiet_minutes", 20)
        if last is not None and now - last < quiet * 60:
            reasons.append(f"owner active in Claude Code {round((now - last) / 60)} min ago (quiet period {quiet} min)")
        procs = [p for p in claude_processes(idle_cfg.get("ignore_claude_args", [])) if p["interactive"]]
        info["interactive_sessions"] = len(procs)
        if procs and idle_cfg.get("block_while_interactive_session_open"):
            reasons.append(f"{len(procs)} interactive Claude Code session(s) open")
        if idle_cfg.get("check_windows_processes"):
            busy = windows_busy(idle_cfg.get("windows_busy_processes", []))
            if busy:
                reasons.append(f"Windows apps busy: {', '.join(busy)}")

    limits = effective_limits(cfg, window)
    info["limits"] = limits
    if usage is None and live is None:
        live = live_usage(cfg, now)
        if live is None and probe and cfg.get("usage", "live", "probe", default=True):
            info["usage_check"] = probe_usage(cfg, state) or "ok"
            live = live_usage(cfg, time.time())
    if live is not None:
        info["live"] = live
        exp5 = expected_run_pct(cfg, state, action)[0] if action else 0.0
        exp7 = exp5 * float(state.doc("run_costs").get("seven_per_five") or 0.25)
        info["expected_run_pct"] = round(exp5, 1)
        for name, key, exp in (("five_hour", "session", exp5), ("seven_day", "weekly", exp7)):
            pct, lim = live[name], limits[key]
            when = f" (resets {clock(live.get(name + '_resets'), cfg.tz, now)})" if live.get(name + "_resets") else ""
            if pct >= lim:
                reasons.append(f"{key} usage {pct:.0f}% has reached your limit {lim:.0f}%{when}")
            elif exp and pct + exp > lim:
                reasons.append(f"{key} usage {pct:.0f}% + ~{exp:.0f}% for a {action} run would pass your "
                               f"limit {lim:.0f}%{when}")
        team = team_share_live(state, now)
        info["team_seven_day_pct"] = team
        if team >= limits["team_share"]:
            reasons.append(f"the team used ~{team:.0f}% of the weekly plan in 7 days (its share is "
                           f"{limits['team_share']:.0f}%)")
        return (not reasons), reasons, info

    # No fresh reading (the usage check failed): fall back to estimating from local transcripts.
    u = usage if usage is not None else estimate_usage(cfg, state, now)
    ucfg = cfg.get("usage", default={})
    margin = ucfg.get("safety_margin_pct", 8)
    if u.get("snapshot_age_h") is None or u["snapshot_age_h"] > ucfg.get("snapshot_stale_hours", 6):
        margin += ucfg.get("stale_snapshot_extra_margin_pct", 7)
    info["margin_pct"] = margin
    calibrated = False
    for name, stop_key in (("five_hour", "five_hour_stop_pct"), ("seven_day", "seven_day_stop_pct")):
        w = u["windows"][name]
        pct = w.get("pct")
        info[f"{name}_pct"] = None if pct is None else round(pct, 1)
        info[f"{name}_source"] = w.get("source")
        stop = limits["session" if name == "five_hour" else "weekly"]
        known = pct is not None and not w.get("uncertain") and (
            w.get("ratio") is not None or str(w.get("source", "")).startswith("snapshot"))
        if known:
            calibrated = True
            if pct + margin >= stop:
                reasons.append(f"{name.replace('_', ' ')} usage ~{pct:.0f}% (+{margin}% margin) ≥ stop {stop}%")
        elif pct is not None and pct + margin + 10 >= stop:
            reasons.append(f"{name.replace('_', ' ')} usage ≥ ~{pct:.0f}% and rising (uncertain) ≥ stop {stop}%")
    team = u.get("team_seven_day_pct")
    info["team_seven_day_pct"] = team
    share = limits["team_share"]
    if team is not None and team >= share:
        reasons.append(f"team used ~{team:.0f}% of the weekly plan (share {share}%)")
    if not calibrated:
        runs_5h = [r for r in state.ledger(now - 5 * HOUR) if r.get("kind") == "run"]
        cap = ucfg.get("uncalibrated_max_runs_per_5h", 2)
        if len(runs_5h) >= cap:
            reasons.append(f"usage unknown (no status-line snapshot yet): limited to {cap} runs per 5h")
    return (not reasons), reasons, info


# --------------------------------------------------------------------------- GitHub access
class GH:
    def __init__(self, bin_: str, repo: str):
        self.bin, self.repo = bin_, repo

    def _run(self, args: List[str], input_: Optional[str] = None) -> str:
        res = subprocess.run([self.bin] + args, capture_output=True, text=True, input=input_, timeout=120)
        if res.returncode != 0:
            raise RuntimeError(f"gh {' '.join(args[:4])}… failed: {res.stderr.strip()[:300]}")
        return res.stdout

    def _json(self, args: List[str]) -> Any:
        out = self._run(args)
        return json.loads(out) if out.strip() else None

    def api(self, method: str, path: str, body: Optional[Dict[str, Any]] = None) -> Any:
        args = ["api", "-X", method, path]
        if body is not None:
            args += ["--input", "-"]
        out = self._run(args, json.dumps(body) if body is not None else None)
        return json.loads(out) if out.strip() else None

    def open_prs(self) -> List[Dict[str, Any]]:
        return self._json(["pr", "list", "--repo", self.repo, "--state", "open", "--limit", "50", "--json",
                           "number,title,isDraft,labels,headRefName,headRefOid,createdAt,body,author"]) or []

    def pr_files(self, n: int) -> List[str]:
        data = self._json(["pr", "view", str(n), "--repo", self.repo, "--json", "files"]) or {}
        return [f["path"] for f in data.get("files", [])]

    def pr_review_bodies(self, n: int) -> List[str]:
        data = self._json(["pr", "view", str(n), "--repo", self.repo, "--json", "reviews"]) or {}
        return [r.get("body") or "" for r in data.get("reviews", [])]

    def check_runs(self, sha: str) -> List[Dict[str, Any]]:
        data = self.api("GET", f"repos/{self.repo}/commits/{sha}/check-runs?per_page=100") or {}
        return data.get("check_runs", [])

    def statuses(self, sha: str) -> List[Dict[str, Any]]:
        data = self.api("GET", f"repos/{self.repo}/commits/{sha}/status") or {}
        return data.get("statuses", [])

    def set_status(self, sha: str, state: str, context: str, desc: str) -> None:
        self.api("POST", f"repos/{self.repo}/statuses/{sha}",
                 {"state": state, "context": context, "description": desc[:140]})

    def merge(self, n: int, sha: str, method: str = "squash") -> None:
        self._run(["pr", "merge", str(n), "--repo", self.repo, f"--{method}", "--delete-branch",
                   "--match-head-commit", sha])

    def add_labels(self, n: int, labels: List[str]) -> None:
        self.api("POST", f"repos/{self.repo}/issues/{n}/labels", {"labels": labels})

    def remove_label(self, n: int, label: str) -> None:
        from urllib.parse import quote
        with contextlib.suppress(RuntimeError):
            self.api("DELETE", f"repos/{self.repo}/issues/{n}/labels/{quote(label, safe='')}")

    def comment(self, n: int, body: str) -> None:
        self.api("POST", f"repos/{self.repo}/issues/{n}/comments", {"body": body})

    def open_issues(self) -> List[Dict[str, Any]]:
        return self._json(["issue", "list", "--repo", self.repo, "--state", "open", "--limit", "200",
                           "--json", "number,title,labels,body,createdAt"]) or []

    def issue_state(self, n: int) -> str:
        data = self.api("GET", f"repos/{self.repo}/issues/{n}") or {}
        return data.get("state", "open")

    def head_sha(self, n: int) -> Optional[str]:
        data = self._json(["pr", "view", str(n), "--repo", self.repo, "--json", "headRefOid,state"]) or {}
        return data.get("headRefOid")


# --------------------------------------------------------------------------- dispatcher
@dataclass
class Work:
    role: str
    action: str
    issue: Optional[int] = None
    pr: Optional[int] = None
    head_sha: str = ""
    note: str = ""
    attempt_key: str = ""
    world: str = ""


def label_names(item: Dict[str, Any]) -> List[str]:
    return [lbl["name"] if isinstance(lbl, dict) else str(lbl) for lbl in item.get("labels", [])]


def role_from(labels: List[str], branch: str = "") -> Optional[str]:
    for lbl in labels:
        if lbl.startswith("agent:"):
            return lbl.split(":", 1)[1]
    if branch.startswith("dependabot/") or branch.startswith("renovate/"):
        return "devops-engineer"
    m = re.match(r"^([a-z0-9-]+)/\d+-", branch or "")
    return m.group(1) if m else None


def required_reviewers(files: List[str], labels: List[str], author: Optional[str],
                       matrix: Dict[str, Any]) -> List[str]:
    roles: set = set()
    for path in files:
        matched = False
        for rule in matrix.get("path_rules", []):
            if path_matches(path, rule["paths"]):
                roles.update(rule["reviewers"])
                matched = True
        if not matched:
            roles.update(matrix.get("fallback_reviewers", ["code-reviewer"]))
    for lbl in labels:
        roles.update(matrix.get("label_rules", {}).get(lbl, []))
    if not files and not roles:
        roles.update(matrix.get("fallback_reviewers", ["code-reviewer"]))
    if author and author in roles:
        roles.discard(author)
        sub = matrix.get("author_substitutes", {}).get(author)
        if sub and sub != author:
            roles.add(sub)
    order = matrix.get("order", [])
    return sorted(roles, key=lambda r: (order.index(r) if r in order else len(order), r))


def ci_state(check_runs: List[Dict[str, Any]], statuses: List[Dict[str, Any]], created: float,
             now: float, grace_min: float) -> str:
    external = [s for s in statuses if not str(s.get("context", "")).startswith(REVIEW_CTX)]
    if not check_runs and not external:
        return "success" if now - created > grace_min * 60 else "pending"
    if any(r.get("status") != "completed" for r in check_runs) or any(s.get("state") == "pending" for s in external):
        return "pending"
    if any(r.get("conclusion") in FAIL_CONCLUSIONS for r in check_runs) or any(
            s.get("state") in ("failure", "error") for s in external):
        return "failure"
    return "success"


def review_rounds(bodies: List[str]) -> int:
    return sum(1 for b in bodies if "agentops:review" in b and "verdict=changes" in b)


DEP_RX = re.compile(r"(?im)^\s*[-*]?\s*(?:depends on|blocked by)\s*:?\s*(.+)$")
CLOSES_RX = re.compile(r"(?i)\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)")


def dependencies(body: str) -> List[int]:
    deps: List[int] = []
    for m in DEP_RX.finditer(body or ""):
        deps += [int(x) for x in re.findall(r"#(\d+)", m.group(1))]
    return deps


def linked_issue(pr: Dict[str, Any]) -> Optional[int]:
    m = CLOSES_RX.search(pr.get("body") or "")
    if m:
        return int(m.group(1))
    m = re.match(r"^[a-z0-9-]+/(\d+)-", pr.get("headRefName") or "")
    return int(m.group(1)) if m else None


class Dispatcher:
    def __init__(self, cfg: Config, gh: GH, state: State, now: float, apply: bool = True):
        self.cfg, self.gh, self.state, self.now, self.apply = cfg, gh, state, now, apply
        self.actions: List[str] = []

    def _do(self, desc: str, fn, *args) -> None:
        self.actions.append(desc)
        if self.apply:
            fn(*args)

    def _escalate(self, number: int, reason: str) -> None:
        self._do(f"#{number}: needs-human ({reason})", self.gh.add_labels, number, ["needs-human"])
        self._do(f"#{number}: comment", self.gh.comment, number,
                 f"🚦 **Needs the owner.** {reason}\n\nRemove the `needs-human` label when resolved. — agentops")

    # ------------------------------------------------------------------ PRs
    def handle_prs(self, prs: List[Dict[str, Any]]) -> Optional[Work]:
        rcfg = self.cfg.get("run", default={})
        candidates: List[Work] = []
        for pr in sorted(prs, key=lambda p: p["number"]):
            n, sha = pr["number"], pr["headRefOid"]
            labels = label_names(pr)
            author = role_from(labels, pr.get("headRefName", ""))
            if pr.get("isDraft") or "do-not-merge" in labels:
                continue
            if "owner-feedback" in labels and author:
                key = f"owner-fix:{n}:{sha}"
                if self.state.attempts(key) >= 2:
                    self._do(f"PR #{n}: drop owner-feedback (no progress)", self.gh.remove_label, n, "owner-feedback")
                    self._escalate(n, f"`{author}` could not address the owner's feedback after 2 attempts.")
                    continue
                candidates.append(Work(author, "fix", linked_issue(pr), n, sha,
                                       "The OWNER left feedback in the PR comments. Address the owner's most recent comments.",
                                       key))
                continue
            if "needs-human" in labels:
                continue
            created = parse_iso(pr.get("createdAt", "")) or self.now
            statuses = self.gh.statuses(sha)
            ci = ci_state(self.gh.check_runs(sha), statuses, created, self.now, rcfg.get("ci_grace_minutes", 10))
            if ci == "pending":
                continue
            if ci == "failure":
                if not author:
                    continue
                key = f"fix:{n}:{sha}"
                if self.state.attempts(key) >= 2:
                    self._escalate(n, f"CI still failing after 2 fix attempts by `{author}`.")
                    continue
                candidates.append(Work(author, "fix", linked_issue(pr), n, sha,
                                       "CI is failing on this PR. Fix the failing checks.", key))
                continue
            files = self.gh.pr_files(n)
            required = required_reviewers(files, labels, author, self.cfg.matrix)
            verdict = {s["context"][len(REVIEW_CTX):]: s.get("state") for s in statuses
                       if str(s.get("context", "")).startswith(REVIEW_CTX)}
            changes = [r for r in required if verdict.get(r) == "failure"]
            missing = [r for r in required if verdict.get(r) not in ("success", "failure")]
            if changes:
                if review_rounds(self.gh.pr_review_bodies(n)) >= rcfg.get("max_review_rounds", 3):
                    self._escalate(n, f"{rcfg.get('max_review_rounds', 3)} review rounds without approval "
                                      f"(still requested by: {', '.join(changes)}). Please decide.")
                    continue
                if not author:
                    continue
                key = f"fix:{n}:{sha}"
                if self.state.attempts(key) >= 2:
                    self._escalate(n, f"`{author}` did not push a fix after 2 attempts.")
                    continue
                candidates.append(Work(author, "fix", linked_issue(pr), n, sha,
                                       f"Reviewers requested changes: {', '.join(changes)}. Address their latest reviews.",
                                       key))
                continue
            if missing:
                role = missing[0]
                key = f"review:{n}:{sha}:{role}"
                if self.state.attempts(key) >= 2:
                    self._escalate(n, f"`{role}` failed to record a review twice.")
                    continue
                candidates.append(Work(role, "review", linked_issue(pr), n, sha,
                                       f"Review PR #{n} at commit {sha[:12]} as {role}. "
                                       f"Required reviewers for this PR: {', '.join(required)}.", key))
                continue
            # every required reviewer approved this exact commit
            if verdict.get("summary") != "success":
                self._do(f"PR #{n}: summary=success", self.gh.set_status, sha, "success", SUMMARY_CTX,
                         "All required agent reviews approved: " + ", ".join(required))
            if any(lbl.startswith("gate:") for lbl in labels):
                gate_no = next(lbl for lbl in labels if lbl.startswith("gate:"))
                self._do(f"PR #{n}: waiting for owner ({gate_no})", self.gh.add_labels, n, ["needs-human"])
                self._do(f"PR #{n}: comment", self.gh.comment, n,
                         f"✅ All agent reviews approved ({', '.join(required)}).\n\n"
                         f"**Owner:** this is **{gate_no.replace(':', ' ')}**. Read it and **merge this PR to approve**, "
                         f"or comment with changes and add the `owner-feedback` label. — agentops")
                continue
            if self.cfg.get("merge", "auto_merge", default=True):
                self._do(f"PR #{n}: squash-merge", self.gh.merge, n, sha,
                         self.cfg.get("merge", "method", default="squash"))
        return candidates[0] if candidates else None

    # ------------------------------------------------------------------ issues
    def handle_issues(self, issues: List[Dict[str, Any]], prs: List[Dict[str, Any]], phase: str) -> Optional[Work]:
        rcfg = self.cfg.get("run", default={})
        linked = {linked_issue(p) for p in prs}
        dep_cache: Dict[int, str] = {}

        def dep_open(n: int) -> bool:
            if n not in dep_cache:
                dep_cache[n] = self.gh.issue_state(n)
            return dep_cache[n] != "closed"

        # 0) unblock tickets whose "Depends on #N" are all closed — housekeeping, no AI run needed.
        #    Once per ticket: if it gets blocked again, the EM looks at it.
        for issue in issues:
            labels = label_names(issue)
            n = issue["number"]
            if "status:blocked" not in labels or "needs-human" in labels:
                continue
            deps = dependencies(issue.get("body") or "")
            if not deps or self.state.attempts(f"unblock:{n}") >= 1 or any(dep_open(d) for d in deps):
                continue
            done = ", ".join(f"#{d}" for d in deps)
            self._do(f"#{n}: unblocked ({done} done)", self.gh.add_labels, n, ["status:ready"])
            self._do(f"#{n}: drop status:blocked", self.gh.remove_label, n, "status:blocked")
            self._do(f"#{n}: comment", self.gh.comment, n,
                     f"Unblocked: {done} {'is' if len(deps) == 1 else 'are'} done, so this is ready. — agentops")
            if self.apply:
                self.state.bump(f"unblock:{n}")
            issue["labels"] = [lb for lb in issue.get("labels", []) if (lb.get("name") if isinstance(lb, dict) else lb)
                               != "status:blocked"] + [{"name": "status:ready"}]

        # 1) resume in-progress issues that lost their run (crash/timeout) and have no PR
        for issue in sorted(issues, key=lambda i: i["number"]):
            labels = label_names(issue)
            n = issue["number"]
            if "status:in-progress" not in labels or n in linked or "needs-human" in labels:
                continue
            if "status:blocked" in labels:
                self._do(f"#{n}: in-progress → blocked", self.gh.remove_label, n, "status:in-progress")
                continue
            role = role_from(labels)
            if not role:
                continue
            key = f"issue:{n}"
            if self.state.attempts(key) >= rcfg.get("max_attempts_per_issue", 2):
                self._do(f"#{n}: clear in-progress", self.gh.remove_label, n, "status:in-progress")
                self._escalate(n, f"`{role}` could not open a PR after {self.state.attempts(key)} attempts.")
                continue
            return Work(role, "implement", n, note=f"Resume issue #{n} (a previous run did not finish). "
                                                   f"Check for an existing branch first.", attempt_key=key)

        # 2) new ready issues, highest priority first
        ready = []
        for issue in issues:
            labels = label_names(issue)
            if "status:ready" not in labels or "needs-human" in labels or "status:blocked" in labels:
                continue
            phases = [lbl.split(":", 1)[1] for lbl in labels if lbl.startswith("phase:")]
            if phases and phase not in phases:
                continue
            role = role_from(labels)
            if not role or issue["number"] in linked:
                continue
            if any(dep_open(d) for d in dependencies(issue.get("body", ""))):
                continue
            prio = min([PRIORITY[lbl] for lbl in labels if lbl in PRIORITY] or [2])
            ready.append((prio, issue["number"], role))
        if ready:
            _prio, n, role = sorted(ready)[0]
            return Work(role, "implement", n, note=f"Implement issue #{n}.", attempt_key=f"issue:{n}")
        return None

    # ------------------------------------------------------------------ planning
    def world_hash(self, issues: List[Dict[str, Any]], prs: List[Dict[str, Any]], main_sha: str) -> str:
        parts = [main_sha]
        parts += [f"i{i['number']}:{','.join(sorted(label_names(i)))}" for i in sorted(issues, key=lambda x: x["number"])]
        parts += [f"p{p['number']}:{p['headRefOid']}:{','.join(sorted(label_names(p)))}" for p in sorted(prs, key=lambda x: x["number"])]
        return hashlib.sha256("|".join(parts).encode()).hexdigest()[:16]

    def choose(self, phase: str, main_sha: str) -> Optional[Work]:
        prs = self.gh.open_prs()
        work = self.handle_prs(prs)
        if work:
            return work
        issues = self.gh.open_issues()
        work = self.handle_issues(issues, prs, phase)
        if work:
            return work
        world = self.world_hash(issues, prs, main_sha)
        last = self.state.doc("last_plan")
        if last.get("world") == world:
            # The EM already looked at exactly this state. Wait for something to change (a merge,
            # a label, a new issue). A failed planning run is retried after a short wait.
            rcfg = self.cfg.get("run", default={})
            age, result = self.now - last.get("at", 0), last.get("result")
            if result == "nothing":
                return None
            if result == "planned" and age < rcfg.get("plan_cooldown_minutes", 180) * 60:
                return None
            if result == "failed" and (last.get("failures", 1) >= rcfg.get("max_plan_failures", 3)
                                       or age < rcfg.get("plan_retry_minutes", 30) * 60):
                return None
        return Work("eng-manager", "plan", note=f"No ready work. Plan the next step for phase `{phase}`.",
                    world=world)


# --------------------------------------------------------------------------- running claude
LIMIT_RX = re.compile(r"hit your (session|weekly|opus|sonnet|fable)\s+limit", re.I)
RESETS_RX = re.compile(r"resets\s+([^·\n]+)", re.I)
WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def parse_reset(text: str, now: float, tz: dt.tzinfo) -> Optional[float]:
    m = RESETS_RX.search(text or "")
    if not m:
        return None
    s = m.group(1).strip().lower()
    tm = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", s)
    if not tm:
        return None
    hour, minute = int(tm.group(1)) % 12, int(tm.group(2) or 0)
    if tm.group(3) == "pm":
        hour += 12
    local_now = dt.datetime.fromtimestamp(now, tz)
    target = local_now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    wd = next((i for i, d in enumerate(WEEKDAYS) if re.search(rf"\b{d}", s)), None)
    if wd is not None:
        days = (wd - local_now.weekday()) % 7
        target += dt.timedelta(days=days)
    if target.timestamp() <= now:
        target += dt.timedelta(days=7 if wd is not None else 1)
    return target.timestamp()


def render_prompt(work: Work, phase: str, repo: str) -> str:
    tpl = (HERE / "prompts" / "work-order.md").read_text(encoding="utf-8")
    return tpl.format(role=work.role, action=work.action, issue=work.issue or "-", pr=work.pr or "-",
                      head_sha=work.head_sha or "-", phase=phase, repo=repo, action_note=work.note)


def set_limit_cooldown(cfg: Config, state: State, limit_text: str, resets_at: Optional[float] = None,
                       throttled: bool = False) -> float:
    until = resets_at or parse_reset(limit_text, time.time(), cfg.tz)
    if not until:
        weekly = "weekly" in limit_text.lower()
        until = time.time() + (12 * HOUR if weekly else (cfg.get("usage", "cooldown_minutes_on_throttle", default=30) * 60
                                                          if throttled else HOUR))
    until = min(until, time.time() + 7 * DAY) + 120
    state.put("cooldown", {"until": until, "reason": "usage limit" if limit_text else "API throttling",
                           "set_at": time.time()})
    return until


def run_claude(cfg: Config, state: State, work: Work, phase: str, dry: bool = False,
               limits: Optional[Dict[str, float]] = None, budget: Optional[float] = None,
               timeout_s: Optional[float] = None) -> Dict[str, Any]:
    rcfg = cfg.get("run", default={})
    prompt = render_prompt(work, phase, cfg["repo"])
    cmd = [cfg.get("claude_bin", default="claude"), "-p", prompt,
           "--agent", work.role,
           "--output-format", "stream-json", "--verbose",
           "--max-turns", str(rcfg.get("max_turns", {}).get(work.action, 40)),
           "--max-budget-usd", str(budget if budget is not None else rcfg.get("max_budget_usd", {}).get(work.action, 2.0)),
           "--permission-mode", "dontAsk",
           "--settings", str(HERE / "claude-run-settings.json")]
    cmd += rcfg.get("extra_claude_args", [])
    env = dict(os.environ, AGENTOPS_RUN="1", AGENTOPS_ROLE=work.role, AGENTOPS_ACTION=work.action,
               AGENTOPS_PR=str(work.pr or ""), AGENTOPS_ISSUE=str(work.issue or ""),
               AGENTOPS_HEAD_SHA=work.head_sha or "", AGENTOPS_REPO=cfg["repo"])
    started = time.time()
    rec: Dict[str, Any] = {"kind": "run", "started": started, "role": work.role, "action": work.action,
                           "issue": work.issue, "pr": work.pr, "head_sha": work.head_sha,
                           "budget_usd": float(cmd[cmd.index("--max-budget-usd") + 1])}
    first_reading: Optional[Dict[str, Any]] = None
    last_reading: Optional[Dict[str, Any]] = None
    stop_at_limit = bool(limits) and cfg.get("usage", "stop_runs_at_limit", default=True)
    if dry:
        rec.update(outcome="dry-run", cmd=" ".join(cmd[:3]) + " …")
        return rec
    stamp = dt.datetime.fromtimestamp(started).strftime("%Y%m%d-%H%M%S")
    log_path = state.dir / "logs" / f"{stamp}-{work.role}-{work.action}.jsonl"
    rec["log"] = str(log_path)
    timeout = min(rcfg.get("timeout_minutes", 45) * 60, timeout_s) if timeout_s else rcfg.get("timeout_minutes", 45) * 60
    throttles, result, limit_text = 0, None, ""
    with open(log_path, "w", encoding="utf-8") as logf:
        proc = subprocess.Popen(cmd, cwd=REPO_ROOT, env=env, stdout=subprocess.PIPE, stderr=logf,
                                stdin=subprocess.DEVNULL, start_new_session=True)
        state.put("current_run", {"role": work.role, "action": work.action, "issue": work.issue, "pr": work.pr,
                                  "note": work.note, "started": started, "log": str(log_path), "pid": proc.pid,
                                  "budget_usd": rec["budget_usd"]})
        sel = selectors.DefaultSelector()
        sel.register(proc.stdout, selectors.EVENT_READ)
        fd = proc.stdout.fileno()
        killed, buf, eof = None, b"", False
        while not killed and not eof:
            if time.time() - started > timeout:
                killed = "timeout"
                break
            if not sel.select(timeout=5):
                if proc.poll() is not None:
                    break
                continue
            # read raw chunks: a buffered readline() would hide lines from select() until more output
            chunk = os.read(fd, 65536)
            if not chunk:
                eof = True
                if not buf:
                    break
                chunk = b"\n"
            buf += chunk
            *lines, buf = buf.split(b"\n")
            for raw in lines:
                line = raw.decode("utf-8", "replace")
                if not line.strip():
                    continue
                try:
                    ev = json.loads(line)
                except json.JSONDecodeError:
                    logf.write(line + "\n")
                    continue
                if isinstance(ev, dict):
                    ev["_ts"] = round(time.time(), 1)
                    logf.write(json.dumps(ev, ensure_ascii=False) + "\n")
                else:
                    logf.write(line + "\n")
                    continue
                etype, sub = ev.get("type"), ev.get("subtype")
                if etype == "system" and sub == "init":
                    rec["session_id"] = ev.get("session_id")
                    rec["model"] = ev.get("model")
                elif etype == "system" and sub == "api_retry" and ev.get("error") == "rate_limit":
                    throttles += 1
                    if throttles >= 3:
                        killed = "throttled"
                elif "rate_limit" in str(etype):
                    info = ev.get("rate_limit_info") or ev
                    reading = reading_from_event(ev)
                    if reading:
                        first_reading = first_reading or reading
                        last_reading = reading
                        save_reading(cfg, reading, "agent run")
                        p5 = (reading.get("five_hour") or {}).get("pct")
                        p7 = (reading.get("seven_day") or {}).get("pct")
                        if stop_at_limit and ((p5 is not None and p5 >= limits["session"]) or
                                              (p7 is not None and p7 >= limits["weekly"])):
                            killed = "usage-limit-reached"
                    if str(info.get("status", "")).lower() in ("rejected", "blocked"):
                        resets = info.get("resetsAt") or info.get("resets_at")
                        if resets:
                            rec["limit_resets_at"] = float(resets) / (1000 if float(resets) > 1e11 else 1)
                        limit_text = "rate limit rejected"
                elif etype == "result":
                    result = ev
                synthetic = etype == "assistant" and (ev.get("message") or {}).get("model") == "<synthetic>"
                if etype == "result" or synthetic:
                    text = json.dumps(ev, ensure_ascii=False)
                    if LIMIT_RX.search(text):
                        limit_text = text
                if killed:
                    break
            logf.flush()
        if killed:
            with contextlib.suppress(ProcessLookupError):
                os.killpg(proc.pid, signal.SIGINT)
            with contextlib.suppress(subprocess.TimeoutExpired):
                proc.wait(timeout=20)
        if proc.poll() is None:
            with contextlib.suppress(ProcessLookupError):
                os.killpg(proc.pid, signal.SIGTERM)
            with contextlib.suppress(subprocess.TimeoutExpired):
                proc.wait(timeout=10)
        # stop dev servers/browsers the agent left behind in its process group
        with contextlib.suppress(ProcessLookupError, PermissionError):
            os.killpg(proc.pid, signal.SIGTERM)
    rec["ended"] = time.time()
    rec["exit_code"] = proc.returncode
    if result:
        rec.update(outcome=result.get("subtype") or ("error" if result.get("is_error") else "success"),
                   is_error=bool(result.get("is_error")), cost_estimate_usd=result.get("total_cost_usd"),
                   turns=result.get("num_turns"), final=(result.get("result") or "")[-400:])
        rec["session_id"] = rec.get("session_id") or result.get("session_id")
        denials = result.get("permission_denials") or []
        if denials:
            rec["denials_total"] = len(denials)
            rec["denials"] = [f"{d.get('tool_name')}: " + " ⏎ ".join(str((d.get("tool_input") or {}).get("command")
                                                              or d.get("tool_input")).splitlines())[:160]
                              for d in denials[:3]]
    else:
        rec["outcome"] = killed or "no-result"
    if killed:
        rec["outcome"] = killed
    if first_reading and last_reading:
        rec["usage_start"] = {k: round(v["pct"], 1) for k, v in first_reading.items()}
        rec["usage_end"] = {k: round(v["pct"], 1) for k, v in last_reading.items()}
        delta = {}
        for name in WINDOWS:
            a, b = first_reading.get(name), last_reading.get(name)
            if a and b and a.get("resets_at") == b.get("resets_at"):
                delta[name] = round(max(0.0, b["pct"] - a["pct"]), 1)
        rec["usage_delta"] = delta
    if limit_text or killed == "throttled":
        rec["cooldown_until"] = set_limit_cooldown(cfg, state, limit_text, rec.get("limit_resets_at"),
                                                   throttled=killed == "throttled")
        rec["outcome"] = "usage-limit" if limit_text else "throttled"
    return rec


# --------------------------------------------------------------------------- git sync
def git(*args: str, check: bool = True) -> str:
    res = subprocess.run(["git"] + list(args), cwd=REPO_ROOT, capture_output=True, text=True, timeout=180)
    if check and res.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed: {res.stderr.strip()[:300]}")
    return res.stdout.strip()


def sync_clone(branch: str) -> str:
    git("fetch", "origin", "--prune", "--quiet")
    git("checkout", "-q", "-f", branch)
    git("reset", "-q", "--hard", f"origin/{branch}")
    git("clean", "-q", "-fd", "-e", CLONE_MARKER.name, "-e", ".agentops-scratch/")
    return git("rev-parse", "HEAD")


def read_phase(root: Path = REPO_ROOT) -> str:
    try:
        text = (root / "docs" / "sdlc" / "STATUS.md").read_text(encoding="utf-8")
    except FileNotFoundError:
        return "initiation"
    m = re.search(r"(?im)^\s*phase:\s*([a-z-]+)", text)
    return m.group(1) if m else "initiation"


# --------------------------------------------------------------------------- commands
@contextlib.contextmanager
def tick_lock(state: State):
    fh = open(state.dir / "tick.lock", "w")
    try:
        fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        fh.close()
        raise SystemExit("another tick is running")
    try:
        yield
    finally:
        fcntl.flock(fh, fcntl.LOCK_UN)
        fh.close()


def cmd_tick(args: argparse.Namespace) -> int:
    """One check. Runs work back-to-back while there is work, the gate is open and time is left."""
    cfg = Config.load()
    state = State(cfg)
    if not CLONE_MARKER.exists() and not args.dry_run:
        raise SystemExit(f"Refusing to run: {CLONE_MARKER.name} not found. Run agentops only in the dedicated "
                         "agents clone created by bootstrap (it resets local changes).")
    with tick_lock(state):
        tick_start = time.time()
        runs = 0
        while True:
            rcfg = cfg.get("run", default={})
            rec = tick_step(args, cfg, state, chained=runs > 0, tick_start=tick_start)
            if rec is None:
                break
            runs += 1
            if rec.get("outcome") != "success":
                break  # after a failure or a usage stop, let the next check decide
            if runs >= int(rcfg.get("max_runs_per_tick", 8)):
                log(f"back-to-back: {runs} runs in this check (the most allowed); the next check continues")
                break
            if time.time() - tick_start > float(rcfg.get("chain_minutes", 25)) * 60:
                log(f"back-to-back: {runs} runs, time is up for this check; the next check continues")
                break
            cfg = Config.load()  # pick up limit changes made meanwhile
        return 0


def tick_step(args: argparse.Namespace, cfg: Config, state: State, chained: bool, tick_start: float) -> Optional[Dict[str, Any]]:
    """Housekeeping + at most one agent run. Returns the run record, or None if nothing ran."""
    now = time.time()
    rcfg = cfg.get("run", default={})
    branch = cfg.get("default_branch", default="main")
    main_sha = sync_clone(branch) if not args.dry_run else git("rev-parse", "HEAD", check=False)
    gh = GH(cfg.get("gh_bin", default="gh"), cfg["repo"])
    disp = Dispatcher(cfg, gh, state, now, apply=not args.dry_run)
    work = disp.choose(read_phase(), main_sha)
    for a in disp.actions:
        log(f"housekeeping: {a}")
    if disp.actions and not args.dry_run:
        state.append_ledger({"kind": "housekeeping", "started": now, "actions": disp.actions})
    if not work:
        log("nothing to do (waiting for the owner or for CI)" if not chained else "back-to-back: no more ready work")
        return None
    if args.dry_run and chained:
        return None
    log(f"next: {work.role} {work.action} issue={work.issue} pr={work.pr} — {work.note[:90]}")
    ok, reasons, info = gate(cfg, state, now, action=work.action, probe=not args.dry_run, skip_spacing=chained) \
        if not args.force else (True, [], {})
    if not ok:
        log("gated: " + "; ".join(reasons))
        return None
    if args.dry_run:
        log("dry-run: would run now")
        return None
    # every run must end before the check's hard limit (Windows stops a scheduled task after 1 h)
    left = float(rcfg.get("tick_hard_limit_minutes", 55)) * 60 - (time.time() - tick_start)
    if left < float(rcfg.get("min_run_minutes", 8)) * 60:
        log("not enough time left in this check for another run; the next check continues")
        return None
    if any(a.endswith("squash-merge") for a in disp.actions):
        main_sha = sync_clone(branch)
    phase = read_phase()
    limits = effective_limits(cfg, read_window(cfg, now))
    budget = run_budget(cfg, state, work.action, info.get("live"), limits)
    if work.attempt_key:
        state.bump(work.attempt_key)
    if work.action == "implement" and work.issue:
        with contextlib.suppress(RuntimeError):
            gh.add_labels(work.issue, ["status:in-progress"])
            gh.remove_label(work.issue, "status:ready")
    live = info.get("live") or {}
    log(f"running {work.role} ({work.action}){' back-to-back' if chained else ''} … session usage "
        f"{live.get('five_hour', '?')}%, your limit {limits['session']:.0f}%, budget ${budget}")
    try:
        rec = run_claude(cfg, state, work, phase, limits=limits, budget=budget, timeout_s=left)
    finally:
        with contextlib.suppress(FileNotFoundError):
            (state.dir / "current_run.json").unlink()
    rec["chained"] = chained
    if rec.get("outcome") in LIMIT_OUTCOMES and work.attempt_key:
        state.bump(work.attempt_key, -1)  # stopped for usage: not the agent's failure
    if work.action == "plan" and rec.get("outcome") not in LIMIT_OUTCOMES:
        result = plan_result(rec)
        last = state.doc("last_plan")
        failures = ((last.get("failures", 0) if last.get("world") == work.world else 0) + 1) \
            if result == "failed" else 0
        state.put("last_plan", {"world": work.world, "at": now, "result": result, "failures": failures,
                                "final": (rec.get("final") or "")[-300:]})
    learn_run_cost(state, rec)
    if work.action == "fix" and work.pr and "owner-fix" in work.attempt_key:
        with contextlib.suppress(RuntimeError):
            if gh.head_sha(work.pr) != work.head_sha:
                gh.remove_label(work.pr, "owner-feedback")
                gh.remove_label(work.pr, "needs-human")
    state.append_ledger(rec)
    used = (rec.get("usage_delta") or {}).get("five_hour")
    log(f"run finished: {rec.get('outcome')} turns={rec.get('turns')} est=${rec.get('cost_estimate_usd')} "
        f"session+{used if used is not None else '?'}% log={rec.get('log')}")
    if rec.get("denials"):
        log(f"refused tool calls ({rec.get('denials_total')}): " + " | ".join(rec["denials"]))
    return rec


def final_line(text: str) -> str:
    lines = [ln.strip() for ln in (text or "").strip().splitlines() if ln.strip()]
    return lines[-1] if lines else ""


def plan_result(rec: Dict[str, Any]) -> str:
    """'planned' / 'nothing' only when the EM finished cleanly and said so; anything else failed."""
    if rec.get("outcome") != "success" or rec.get("is_error"):
        return "failed"
    last, final = final_line(rec.get("final", "")), rec.get("final") or ""
    for marker, result in (("NOTHING_TO_DO", "nothing"), ("PLANNED:", "planned")):
        if last.startswith(marker):
            return result
    if "BLOCKED:" in last:
        return "failed"
    if "NOTHING_TO_DO" in final:
        return "nothing"
    return "planned" if "PLANNED:" in final else "failed"


def agent_run_pids() -> List[int]:
    """PIDs of claude processes started by agentops (they carry AGENTOPS_RUN=1)."""
    pids = []
    for pid in os.listdir("/proc") if os.path.isdir("/proc") else []:
        if not pid.isdigit():
            continue
        try:
            comm = Path(f"/proc/{pid}/comm").read_text().strip()
            env = Path(f"/proc/{pid}/environ").read_bytes()
        except OSError:
            continue
        if b"AGENTOPS_RUN=1" in env and comm in ("claude", "node"):
            pids.append(int(pid))
    return pids


def cmd_start(args: argparse.Namespace) -> int:
    cfg = Config.load()
    now = time.time()
    until = None
    if args.hours:
        until = now + float(args.hours) * HOUR
    if args.until:
        until = next_clock_time(args.until, now, cfg.tz)
    win: Dict[str, Any] = {"opened_at": now, "until": until, "skip_quiet": bool(args.now)}
    window_limits = {k: v for k, v in (("session", args.session_limit), ("weekly", args.weekly_limit)) if v is not None}
    for k, v in window_limits.items():
        if not 1 <= v <= 100:
            raise SystemExit(f"--{k}-limit must be between 1 and 100")
    if window_limits:
        win["limits"] = window_limits
    save_json(window_path(cfg), win)
    lim = effective_limits(cfg, win)
    pause = xp(cfg.get("paths", "pause_file", default="~/.claude/agentops/PAUSE"))
    if pause.exists():
        pause.unlink()
        print("Removed the PAUSE file.")
    when = "until you run `agents stop`" if until is None else \
        "until " + dt.datetime.fromtimestamp(until, cfg.tz).strftime("%a %d %b %H:%M")
    print(f"Agents started {when}.")
    print(f"They start a run only while session usage stays under {lim['session']:.0f}% and weekly usage under "
          f"{lim['weekly']:.0f}%{' (for this start only)' if window_limits else ''}; change with `agents limits`.")
    print("They still wait while you use Claude Code yourself (20 min quiet period)." if not args.now else
          "Quiet-period check is OFF for this window (--now).")
    if args.no_tick:
        print("The scheduler will pick up work at its next tick (every 30 min).")
        return 0
    print("Running the first tick now …")
    return cmd_tick(argparse.Namespace(dry_run=False, force=False))


def cmd_stop(args: argparse.Namespace) -> int:
    cfg = Config.load()
    with contextlib.suppress(FileNotFoundError):
        window_path(cfg).unlink()
    print("Agents stopped: no new runs will start.")
    pids = agent_run_pids()
    if not pids:
        return 0
    if not args.kill:
        print(f"One run is still finishing (pid {pids[0]}, at most {cfg.get('run', 'timeout_minutes', default=45)} min). "
              "Use `agents stop --kill` to end it now.")
        return 0
    for pid in pids:
        with contextlib.suppress(ProcessLookupError, PermissionError):
            os.killpg(os.getpgid(pid), signal.SIGINT)
    print(f"Interrupted {len(pids)} running agent process(es). Anything it had not pushed yet is dropped; "
          "the item is picked up again on the next start.")
    return 0


def setup_statusline(settings_path: Path, script: Path) -> str:
    """Point Claude Code's status line at agentops/bin/statusline.py, keeping any existing one."""
    import shlex
    cmd = f"python3 {shlex.quote(str(script))}"
    data: Dict[str, Any] = {}
    if settings_path.exists():
        raw = settings_path.read_text(encoding="utf-8")
        try:
            data = json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            raise SystemExit(f"{settings_path} is not valid JSON — fix it first, or add the status line by hand "
                             "(README step 5).")
        backup = settings_path.with_name(settings_path.name + ".bak-agentops")
        if not backup.exists():
            backup.write_text(raw, encoding="utf-8")
    old = (data.get("statusLine") or {}).get("command") or ""
    if "agentops/bin/statusline.py" in old:
        return f"already set up: {old}"
    if old:
        cmd = f"AGENTOPS_STATUSLINE_CHAIN={shlex.quote(old)} {cmd}"
    data["statusLine"] = {"type": "command", "command": cmd}
    settings_path.parent.mkdir(parents=True, exist_ok=True)
    with open(settings_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    return f"set: {cmd}" + (" (your old status line is kept and shown after it)" if old else "")


def cmd_setup_statusline(args: argparse.Namespace) -> int:
    print("Claude Code status line " + setup_statusline(xp("~/.claude/settings.json"), HERE / "bin" / "statusline.py"))
    print("Now open Claude Code once and send one message, so your plan usage gets recorded.")
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    cfg = Config.load()
    state = State(cfg)
    now = time.time()
    tz = cfg.tz
    if getattr(args, "live", False):
        err = probe_usage(cfg, state)
        if err:
            print(f"  ! {err}")
    ok, reasons, info = gate(cfg, state, now)
    version = (HERE / "VERSION").read_text().strip() if (HERE / "VERSION").exists() else "?"
    print(f"agentops status — {dt.datetime.fromtimestamp(now, tz):%a %d %b %H:%M %Z}   (kit {version})")
    print(f"  repo: {cfg['repo']}   phase: {read_phase()}")
    win = info.get("window")
    if win:
        until = "until stopped" if win.get("until") is None else "until " + clock(win["until"], tz, now)
        print(f"  agents: STARTED {until}{' (quiet check off)' if win.get('skip_quiet') else ''}")
    else:
        print(f"  agents: {'not started (on-demand mode)' if info.get('mode') == 'on-demand' else 'always-on mode'}")
    if agent_run_pids():
        print("  a run is in progress right now")
    lim = info["limits"]
    print(f"  your limits: session {lim['session']:.0f}% · weekly {lim['weekly']:.0f}% · team share of the week "
          f"{lim['team_share']:.0f}%   (change: agents limits --session N)")
    live = info.get("live")
    if live:
        print(f"  plan usage now: session {live['five_hour']:.0f}% (resets {clock(live.get('five_hour_resets'), tz, now)})"
              f" · weekly {live['seven_day']:.0f}% (resets {clock(live.get('seven_day_resets'), tz, now)})"
              f"   [{live['source']}, {live['age_min']:.0f} min ago]")
    else:
        print("  plan usage now: no fresh reading — `agents status --live` checks it (costs ~$0.001)")
    print(f"  team used ~{team_share_live(state, now):.0f}% of the weekly plan in the last 7 days")
    sizes = []
    for action in ("implement", "fix", "review", "plan"):
        pct, src = expected_run_pct(cfg, state, action)
        sizes.append(f"{action} ~{pct:.0f}%{'' if src.startswith('learned') else '*'}")
    print(f"  a run starts only if it fits under your limit: {', '.join(sizes)} of a session"
          f"{'  (* starting guess until measured)' if '*' in ''.join(sizes) else ''}")
    print(f"  owner last active: {info.get('owner_last_activity_min')} min ago; "
          f"runs today: {info.get('runs_today')}/{cfg.get('schedule', 'max_runs_per_day')}")
    lp = state.doc("last_plan")
    if lp:
        line = f"  last planning: {lp.get('result')} at {clock(lp.get('at'), tz, now)}"
        if lp.get("result") == "failed":
            if lp.get("failures", 1) >= cfg.get("run", "max_plan_failures", default=3):
                line += f" — failed {lp.get('failures')} times, waiting for a change on GitHub or for you"
            else:
                line += f" — retry after {clock(lp['at'] + cfg.get('run', 'plan_retry_minutes', default=30) * 60, tz, now)}"
        print(line)
        if lp.get("result") == "failed" and lp.get("final"):
            print(f"     ↳ {final_line(lp['final'])[:150]}")
    cd = state.doc("cooldown")
    if cd.get("until", 0) > now:
        print(f"  cooldown until {clock(cd['until'], tz, now)} ({cd.get('reason')})")
    print(f"  gate: {'OPEN' if ok else 'CLOSED'}")
    for r in reasons:
        print(f"    - {r}")
    print("  last runs:")
    runs = [r for r in state.ledger(now - 2 * DAY) if r.get("kind") == "run"][-8:]
    if not runs:
        print("    (none yet)")
    for r in runs:
        used = (r.get("usage_delta") or {}).get("five_hour")
        print(f"    {clock(r['started'], tz, now):9s} {r.get('role'):17s} {r.get('action'):9s} "
              f"#{r.get('issue') or r.get('pr') or '-':<4} → {r.get('outcome')}, {r.get('turns')} turns, "
              f"est ${r.get('cost_estimate_usd')}{f', session +{used:.0f}%' if used is not None else ''}")
        if r.get("denials"):
            print(f"       refused: {' ⏎ '.join(r['denials'][0].splitlines())[:110]}")
        if r.get("outcome") != "success" or "BLOCKED" in final_line(r.get("final", "")):
            if r.get("final"):
                print(f"       ↳ {final_line(r['final'])[:120]}")
    return 0


def cmd_limits(args: argparse.Namespace) -> int:
    path = xp(os.environ.get("AGENTOPS_LOCAL_CONFIG", LOCAL_CONFIG))
    local = load_json(path) or {}
    if not isinstance(local, dict):
        raise SystemExit(f"{path} is not a JSON object — fix or delete it")
    keys = (("session", "five_hour_stop_pct"), ("weekly", "seven_day_stop_pct"),
            ("team_share", "team_seven_day_share_pct"))
    usage = local.setdefault("usage", {})
    changed = False
    if args.reset:
        for _a, key in keys:
            changed |= usage.pop(key, None) is not None
    for attr, key in keys:
        v = getattr(args, attr)
        if v is not None:
            if not 1 <= v <= 100:
                raise SystemExit(f"--{attr.replace('_', '-')} must be between 1 and 100")
            usage[key] = v
            changed = True
    if getattr(args, "runs_per_day", None) is not None:
        if not 1 <= args.runs_per_day <= 500:
            raise SystemExit("--runs-per-day must be between 1 and 500")
        local.setdefault("schedule", {})["max_runs_per_day"] = int(args.runs_per_day)
        changed = True
    if args.reset and isinstance(local.get("schedule"), dict):
        changed |= local["schedule"].pop("max_runs_per_day", None) is not None
        if not local["schedule"]:
            local.pop("schedule")
    if not usage:
        local.pop("usage")
    if changed:
        save_json(path, local)
        print(f"Saved to {path}")
    cfg = Config.load()
    lim = effective_limits(cfg)
    print(f"Agents start a run only while it fits under these limits of your Claude plan:")
    print(f"  session (5-hour) usage  {lim['session']:.0f}%")
    print(f"  weekly usage            {lim['weekly']:.0f}%")
    print(f"  team share of the week  {lim['team_share']:.0f}%  (what the agents themselves may use in 7 days)")
    print(f"  runs per day            {cfg.get('schedule', 'max_runs_per_day', default=12)}")
    print("A run that reaches a limit while working is stopped and picked up again later.")
    win = read_window(cfg, time.time())
    if win and win.get("limits"):
        print(f"The current start window overrides: {win['limits']}")
    print("Change:  agents limits --session 96 --weekly 90 --team-share 60 --runs-per-day 80")
    print("Defaults:  agents limits --reset")
    return 0


def cmd_dashboard(args: argparse.Namespace) -> int:
    sys.path.insert(0, str(HERE))
    import dashboard
    return dashboard.serve(sys.modules[__name__], port=args.port, open_page=not args.no_open)


def cmd_gate(args: argparse.Namespace) -> int:
    cfg = Config.load()
    state = State(cfg)
    ok, reasons, info = gate(cfg, state, time.time())
    print(json.dumps({"open": ok, "reasons": reasons, "info": info}, indent=2, default=str))
    return 0 if ok else 1


def cmd_next(args: argparse.Namespace) -> int:
    cfg = Config.load()
    state = State(cfg)
    gh = GH(cfg.get("gh_bin", default="gh"), cfg["repo"])
    disp = Dispatcher(cfg, gh, state, time.time(), apply=False)
    work = disp.choose(read_phase(), git("rev-parse", "HEAD", check=False))
    for a in disp.actions:
        print(f"would: {a}")
    print(json.dumps(work.__dict__ if work else None, indent=2))
    return 0


def cmd_doctor(args: argparse.Namespace) -> int:
    cfg = Config.load()
    problems = 0

    def check(label: str, fn) -> None:
        nonlocal problems
        try:
            res = fn()
            print(f"  ✔ {label}: {res}")
        except Exception as exc:  # noqa: BLE001 - report everything
            problems += 1
            print(f"  ✘ {label}: {exc}")

    def ver(binary: str) -> str:
        return subprocess.run([binary, "--version"], capture_output=True, text=True, timeout=30).stdout.strip()

    def claude_ok() -> str:
        v = ver(cfg.get("claude_bin", default="claude"))
        m = re.search(r"(\d+)\.(\d+)\.(\d+)", v)
        if not m or tuple(map(int, m.groups())) < (2, 1, 259):
            raise RuntimeError(f"{v or 'not found'} — need ≥ 2.1.259 (run `claude update`)")
        return v

    def gh_ok() -> str:
        out = subprocess.run([cfg.get("gh_bin", default="gh"), "auth", "status"], capture_output=True, text=True)
        if out.returncode != 0:
            raise RuntimeError("not logged in — run `gh auth login`")
        return "logged in"

    def repo_ok() -> str:
        out = subprocess.run([cfg.get("gh_bin", default="gh"), "repo", "view", cfg["repo"], "--json",
                              "visibility,defaultBranchRef"], capture_output=True, text=True)
        if out.returncode != 0:
            raise RuntimeError(out.stderr.strip()[:200])
        d = json.loads(out.stdout)
        return f"{d['visibility'].lower()}, default branch {d['defaultBranchRef']['name']}"

    def statusline_ok() -> str:
        s = load_json(xp("~/.claude/settings.json"), {}) or {}
        cmd = (s.get("statusLine") or {}).get("command", "")
        if "statusline.py" not in cmd:
            raise RuntimeError("status line not configured — run: agents setup-statusline")
        snap = load_json(xp(cfg.get("paths", "snapshot_file")))
        if not snap:
            return "configured; no snapshot yet (open Claude Code once)"
        return f"configured; snapshot {round((time.time() - snap['captured_at']) / HOUR, 1)} h old"

    def node_ok() -> str:
        env_cmd = f'export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; ' \
                  f'export PATH="$HOME/.local/bin:$PATH"; node --version && npm --version && command -v claude'
        out = subprocess.run(["bash", "-c", env_cmd], capture_output=True, text=True, timeout=60)
        lines = out.stdout.split()
        if out.returncode != 0 or len(lines) < 3:
            raise RuntimeError("node/npm/claude not found the way the scheduler starts them — install Node LTS "
                               "with nvm (README step 1) and Claude Code with its normal installer")
        return f"node {lines[0]}, npm {lines[1]} (as the scheduler sees it)"

    version = (HERE / "VERSION").read_text().strip() if (HERE / "VERSION").exists() else "unknown"
    print(f"agentops doctor — kit {version}")
    check("python", lambda: sys.version.split()[0])
    check("node for scheduled runs", node_ok)
    check("claude", claude_ok)
    check("gh", gh_ok)
    check("repo", repo_ok)
    check("clone marker", lambda: "present" if CLONE_MARKER.exists() else (_ for _ in ()).throw(
        RuntimeError("missing — this is not the dedicated agents clone")))
    check("status line", statusline_ok)
    check("transcripts", lambda: ", ".join(str(xp(d)) for d in cfg.get("idle", "transcript_dirs") if xp(d).exists())
          or (_ for _ in ()).throw(RuntimeError("no transcript dir found")))
    check("timezone", lambda: str(dt.datetime.now(cfg.tz).tzname()))
    return 1 if problems else 0


def cmd_selftest(args: argparse.Namespace) -> int:
    import unittest
    suite = unittest.defaultTestLoader.discover(str(HERE / "tests"))
    res = unittest.TextTestRunner(verbosity=1).run(suite)
    return 0 if res.wasSuccessful() else 1


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(prog="agentops", description=__doc__.split("\n")[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("tick", help="housekeeping + at most one agent run")
    t.add_argument("--dry-run", action="store_true", help="show what would happen; change nothing")
    t.add_argument("--force", action="store_true", help="skip the usage/idle gate (use with care)")
    t.set_defaults(fn=cmd_tick)
    s = sub.add_parser("start", help="let the agents work (until `stop`, or for --hours / --until)")
    s.add_argument("--hours", type=float, help="work for this many hours, e.g. 6")
    s.add_argument("--until", help="work until this local time, e.g. 07:30")
    s.add_argument("--now", action="store_true", help="skip the quiet-period check for this window")
    s.add_argument("--no-tick", action="store_true", help="don't run the first tick immediately")
    s.add_argument("--session-limit", type=float, help="for this start only: stop at this %% of session usage")
    s.add_argument("--weekly-limit", type=float, help="for this start only: stop at this %% of weekly usage")
    s.set_defaults(fn=cmd_start)
    s = sub.add_parser("limits", help="show or set how much of your Claude plan the agents may use")
    s.add_argument("--session", type=float, help="session (5-hour) usage limit in %%, e.g. 96")
    s.add_argument("--weekly", type=float, help="weekly usage limit in %%, e.g. 90")
    s.add_argument("--team-share", dest="team_share", type=float, help="max %% of the week the agents may use")
    s.add_argument("--runs-per-day", dest="runs_per_day", type=int, help="most agent runs per day, e.g. 80")
    s.add_argument("--reset", action="store_true", help="back to the kit defaults")
    s.set_defaults(fn=cmd_limits)
    s = sub.add_parser("stop", help="stop starting new runs")
    s.add_argument("--kill", action="store_true", help="also interrupt a run that is in progress")
    s.set_defaults(fn=cmd_stop)
    sub.add_parser("setup-statusline", help="connect Claude Code's status line (shows plan usage)").set_defaults(
        fn=cmd_setup_statusline)
    s = sub.add_parser("dashboard", help="live view of the team in your browser (read-only)")
    s.add_argument("--port", type=int, default=8765)
    s.add_argument("--no-open", action="store_true", help="don't open the browser")
    s.set_defaults(fn=cmd_dashboard)
    s = sub.add_parser("status", help="plan usage, limits, gate state, recent runs")
    s.add_argument("--live", action="store_true", help="check plan usage now (one tiny request, ~$0.001)")
    s.set_defaults(fn=cmd_status)
    sub.add_parser("gate", help="print the gate decision as JSON").set_defaults(fn=cmd_gate)
    sub.add_parser("next", help="show the next unit of work (read-only)").set_defaults(fn=cmd_next)
    sub.add_parser("doctor", help="check prerequisites").set_defaults(fn=cmd_doctor)
    sub.add_parser("selftest", help="run agentops unit tests").set_defaults(fn=cmd_selftest)
    args = p.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
