#!/usr/bin/env python3
"""agentops — scheduler, usage gate and dispatcher for the Clockvane website agent team.

Runs on the owner's WSL laptop. Each scheduled check (`tick`) keeps a small team of workers busy for
up to an hour: by default 2 Claude workers and 2 GPT (Codex) workers, each in its own copy of the repo.
Every worker repeatedly:

  1. Housekeeping (no AI cost, first Claude worker only): read PRs/issues with `gh`, route reviews,
     set the `agent-review/summary` status, squash-merge PRs whose reviews all approve, flag
     gate PRs for the owner.
  2. Claims the next unit of AI work for its engine (fix > review > resume > new issue > EM planning)
     that no other worker holds.
  3. Gates it: run window, daily cap, owner idle, the owner's usage limits (checked against a
     live plan-usage reading, counting runs already in progress), cooldowns, free memory.
  4. Runs exactly one agent (`claude -p --agent <role>` or `codex exec`) with tight limits, stops
     it if plan usage reaches the owner's limit, records the run and learns how much a run costs.

Python 3.9+ stdlib only. Human-owned: agents cannot edit this folder.
Usage:  python3 agentops/agentops.py {start,stop,limits,workers,status,dashboard,codex-check,tick,gate,next,doctor,selftest}
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

# This runs inside the agents' copies of the repo: never leave __pycache__/ there for an agent to commit.
sys.dont_write_bytecode = True
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


LOG_LANE = ""


def log(msg: str) -> None:
    stamp = dt.datetime.now(LOG_TZ).strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{stamp}]{f' [{LOG_LANE}]' if LOG_LANE else ''} {msg}", flush=True)


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

    @contextlib.contextmanager
    def locked(self, name: str = "state"):
        """Serialise read-modify-write of shared state (several workers run at once). Each name is its
        own lock file; never take the same name twice in one process (it would wait for itself)."""
        with open(self.dir / f"{name}.lock", "w") as fh:
            fcntl.flock(fh, fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(fh, fcntl.LOCK_UN)

    def bump(self, key: str, by: int = 1) -> int:
        with self.locked():
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


def save_reading(cfg: "Config", reading: Dict[str, Dict[str, Any]], source: str, now: Optional[float] = None,
                 path: Optional[Path] = None) -> None:
    now = time.time() if now is None else now
    path = path or snapshot_path(cfg)
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


def live_usage(cfg: "Config", now: float, lane: str = "claude") -> Optional[Dict[str, Any]]:
    """The newest plan-usage reading of a lane's plan (Claude or ChatGPT) if fresh enough, else None."""
    if lane == "codex":
        refresh_codex_from_sessions(cfg, now)
    snap = load_json(snapshot_path(cfg) if lane == "claude" else codex_snapshot_path(cfg))
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


def effective_limits(cfg: "Config", window: Optional[Dict[str, Any]] = None, lane: str = "claude") -> Dict[str, float]:
    """The owner's limits: `agents limits` (config.local.json), overridden per window by `agents start`."""
    if lane == "codex":
        c = cfg.get("engines", "codex", default={}) or {}
        lim = {"session": float(c.get("five_hour_stop_pct", 85)), "weekly": float(c.get("seven_day_stop_pct", 85)),
               "team_share": 100.0}
        for k, v in ((window or {}).get("codex_limits") or {}).items():
            if k in lim and v is not None:
                lim[k] = float(v)
        return lim
    u = cfg.get("usage", default={})
    lim = {"session": float(u.get("five_hour_stop_pct", 75)), "weekly": float(u.get("seven_day_stop_pct", 85)),
           "team_share": float(u.get("team_seven_day_share_pct", 50))}
    for k, v in ((window or {}).get("limits") or {}).items():
        if k in lim and v is not None:
            lim[k] = float(v)
    return lim


def expected_run_pct(cfg: "Config", state: "State", action: str, lane: str = "claude") -> Tuple[float, str]:
    learned = ((state.doc(lane_doc("run_costs", lane)).get("by_action") or {}).get(action)) or {}
    if learned.get("n"):
        return max(1.0, float(learned["pct"])), f"learned from {learned['n']} run(s)"
    guesses = cfg.get("engines", "codex", "expected_run_pct", default={}) if lane == "codex" \
        else cfg.get("usage", "expected_run_pct", default={})
    return float((guesses or {}).get(action, DEFAULT_EXPECTED_PCT.get(action, 10.0))), "starting guess"


def learn_run_cost(state: "State", rec: Dict[str, Any]) -> None:
    five = (rec.get("usage_delta") or {}).get("five_hour")
    if five is None or rec.get("outcome") in LIMIT_OUTCOMES or not rec.get("action"):
        return
    doc = lane_doc("run_costs", rec.get("lane", "claude"))
    costs = state.doc(doc)
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
    state.put(doc, costs)


def team_share_live(state: "State", now: float) -> float:
    """% of the weekly plan the agents used in 7 days. Weekly readings move in 1% steps, so once
    the session-to-week ratio is measured, session deltas (larger, smoother) are used instead."""
    runs = [r for r in state.ledger(now - 7 * DAY) if r.get("kind") == "run" and r.get("usage_delta")
            and r.get("lane", "claude") == "claude"]
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


# --------------------------------------------------------------------------- lanes and workers
# Roles run on Claude Code by default. `roles.<role>.engine = "codex"` in config.json moves a role to
# the Codex CLI (ChatGPT plan). Each engine ("lane") has its own usage limits and cooldown, and runs
# one or more WORKERS at the same time — `claude`, `claude-2`, `codex`, `codex-2` (`agents workers`) —
# each in its own copy of the repo with its own lock. Workers claim work under a shared lock, so two
# workers never take the same item. The Codex workers only run after `agents codex-check` passed
# for the installed Codex version and for that worker's copy; until then their roles run on Claude.
LANES = ("claude", "codex")
ENGINES = LANES
MAX_WORKERS = 3
_CODEX_VERSION: Dict[str, str] = {}
_CODEX_BIN: Dict[str, str] = {}


def lane_doc(name: str, lane: str) -> str:
    """State-file name for an engine or worker: `cooldown` / `cooldown-codex`, `current_run-claude-2`."""
    return name if lane == "claude" else f"{name}-{lane}"


def role_settings(cfg: "Config", role: str) -> Dict[str, Any]:
    v = (cfg.get("roles", default={}) or {}).get(role)
    return dict(v) if isinstance(v, dict) else {}


def codex_roles(cfg: "Config") -> List[str]:
    return [r for r, v in (cfg.get("roles", default={}) or {}).items()
            if isinstance(v, dict) and v.get("engine") == "codex"]


def codex_bin(cfg: "Config") -> str:
    """The Codex command. The scheduler's PATH can miss it (another Node version, or a folder only your
    interactive shell adds), so fall back to where `agents codex-check` found it, then the usual places."""
    import glob
    import shutil
    name = cfg.get("engines", "codex", "bin", default="codex")
    if name in _CODEX_BIN:
        return _CODEX_BIN[name]
    found = (name if os.access(name, os.X_OK) else None) if os.path.isabs(name) else shutil.which(name)
    if not found:
        state_dir = xp(cfg.get("paths", "state_dir", default="~/.claude/agentops/clockvane-website"))
        recorded = (load_json(state_dir / "codex_check.json") or {}).get("bin")
        cands = [recorded] + sorted(glob.glob(str(xp("~/.nvm/versions/node/*/bin/codex"))), reverse=True) + \
            [str(xp(p)) for p in ("~/.local/bin/codex", "~/.npm-global/bin/codex", "~/.codex/bin/codex")] + \
            ["/usr/local/bin/codex", "/usr/bin/codex"]
        found = next((c for c in cands if c and os.access(c, os.X_OK)), None)
        if found:  # an npm-installed codex needs its own node, which sits next to it
            os.environ["PATH"] = os.path.dirname(found) + os.pathsep + os.environ.get("PATH", "")
    _CODEX_BIN[name] = found or name
    return _CODEX_BIN[name]


def codex_version(cfg: "Config") -> str:
    b = codex_bin(cfg)
    if b not in _CODEX_VERSION:
        try:
            _CODEX_VERSION[b] = subprocess.run([b, "--version"], capture_output=True, text=True,
                                               timeout=30).stdout.strip()
        except (OSError, subprocess.SubprocessError):
            _CODEX_VERSION[b] = ""
    return _CODEX_VERSION[b]


def worker_engine(worker: str) -> str:
    return worker.split("-", 1)[0]


def worker_number(worker: str) -> int:
    tail = worker.split("-", 1)[1] if "-" in worker else ""
    return int(tail) if tail.isdigit() else 1


def worker_name(engine: str, n: int) -> str:
    return engine if n <= 1 else f"{engine}-{n}"


def worker_counts(cfg: "Config") -> Dict[str, int]:
    """How many workers of each engine run at once (`agents workers`): Claude 1-3, GPT 0-3."""
    w = cfg.get("workers", default={}) or {}

    def num(key: str, low: int) -> int:
        try:
            v = int(w.get(key, 1))
        except (TypeError, ValueError):
            v = 1
        return max(low, min(MAX_WORKERS, v))
    return {"claude": num("claude", 1), "codex": num("codex", 0)}


def primary_clone(cfg: "Config") -> Path:
    """The main agents copy (~/agents/<repo>), also when asked from inside another worker's copy."""
    configured = cfg.get("paths", "agents_clone") or os.environ.get("AGENTOPS_AGENTS_CLONE")
    if configured:
        return xp(configured)
    m = re.match(r"^(.+?)-(?:claude-\d+|codex(?:-\d+)?)$", REPO_ROOT.name)
    return REPO_ROOT.parent / m.group(1) if m else REPO_ROOT


def worker_clone(cfg: "Config", worker: str) -> Path:
    """Each worker's own copy of the repo: ~/agents/<repo>, <repo>-claude-2, <repo>-codex, <repo>-codex-2."""
    n = worker_number(worker)
    primary = primary_clone(cfg)
    if worker_engine(worker) == "codex":
        base = xp(cfg.get("engines", "codex", "clone_dir", default=str(primary.parent / (primary.name + "-codex"))))
        return base if n == 1 else base.parent / f"{base.name}-{n}"
    return primary if n == 1 else primary.parent / f"{primary.name}-claude-{n}"


def codex_ready(cfg: "Config", state: "State") -> bool:
    if not cfg.get("engines", "codex", "enabled", default=False) or worker_counts(cfg)["codex"] == 0:
        return False
    chk = state.doc("codex_check")
    return bool(chk.get("passed") and chk.get("version") and chk.get("version") == codex_version(cfg))


def codex_off_reason(cfg: "Config", state: "State") -> Optional[str]:
    """Why the GPT workers are not running, in plain words; None when they run or are switched off on purpose."""
    if not cfg.get("engines", "codex", "enabled", default=False) or not codex_roles(cfg) \
            or worker_counts(cfg)["codex"] == 0:
        return None
    version = codex_version(cfg)
    if not version:
        return ("the `codex` command isn't visible to the scheduler — run `agents codex-check` once in Ubuntu "
                "(it records where Codex is installed)")
    chk = state.doc("codex_check")
    if not chk.get("passed"):
        return "its one-time safety test hasn't passed yet — run: agents codex-check"
    if chk.get("version") != version:
        return f"Codex was updated ({chk.get('version')} → {version}) — run `agents codex-check` again"
    return None


def clone_verified(cfg: "Config", state: "State", worker: str) -> bool:
    """A GPT worker's copy passed the safety test (the first copy is covered by the main test)."""
    chk = state.doc("codex_check")
    if worker_number(worker) == 1:
        return bool(chk.get("passed"))
    c = (chk.get("clones") or {}).get(str(worker_clone(cfg, worker))) or {}
    return bool(c.get("passed") and c.get("version") == chk.get("version"))


def active_workers(cfg: "Config", state: "State") -> List[str]:
    counts = worker_counts(cfg)
    out = [worker_name("claude", i) for i in range(1, counts["claude"] + 1)]
    if codex_ready(cfg, state):
        out += [worker_name("codex", i) for i in range(1, counts["codex"] + 1)
                if clone_verified(cfg, state, worker_name("codex", i))]
    return out


def unverified_workers(cfg: "Config", state: "State") -> List[str]:
    """GPT workers you asked for whose copy still needs `agents codex-check`."""
    if not codex_ready(cfg, state):
        return []
    return [worker_name("codex", i) for i in range(2, worker_counts(cfg)["codex"] + 1)
            if not clone_verified(cfg, state, worker_name("codex", i))]


def active_lanes(cfg: "Config", state: "State") -> List[str]:
    return ["claude"] + (["codex"] if codex_ready(cfg, state) else [])


def engine_for(cfg: "Config", role: str, lanes: Iterable[str]) -> str:
    eng = role_settings(cfg, role).get("engine", "claude")
    return eng if eng in lanes else "claude"


# claims: which worker holds which work item, so no two workers take the same one
def busy_work(state: "State", worker: str) -> set:
    """(kind, number, action, role) other workers hold right now: claims made when they picked their
    work, plus any agent run still going (also one started by an older kit version)."""
    busy: set = set()

    def add(c: Dict[str, Any]) -> None:
        role, action = c.get("role"), c.get("action")
        if action == "plan":
            busy.add(("plan", 0, "plan", role))
        with contextlib.suppress(TypeError, ValueError):
            if c.get("issue"):
                busy.add(("issue", int(c["issue"]), action, role))
            if c.get("pr"):
                busy.add(("pr", int(c["pr"]), action, role))
    for w, c in (state.doc("claims") or {}).items():
        if w != worker and isinstance(c, dict) and pid_alive(c.get("owner_pid")):
            add(c)
    for path in state.dir.glob("current_run*.json"):
        w = "claude" if path.stem == "current_run" else path.stem[len("current_run-"):]
        cur = load_json(path) or {}
        if w != worker and isinstance(cur, dict) and pid_alive(cur.get("pid")):
            add(cur)
    return busy


def claim(state: "State", worker: str, work: "Work") -> None:
    with state.locked("claims"):
        claims = state.doc("claims") or {}
        claims[worker] = {"role": work.role, "action": work.action, "issue": work.issue, "pr": work.pr,
                          "owner_pid": os.getpid(), "at": time.time(), "engine": worker_engine(worker)}
        state.put("claims", claims)


def update_claim(state: "State", worker: str, **fields: Any) -> None:
    with state.locked("claims"):
        claims = state.doc("claims") or {}
        if worker in claims:
            claims[worker].update(fields)
            state.put("claims", claims)


def release(state: "State", worker: str) -> None:
    with state.locked("claims"):
        claims = state.doc("claims") or {}
        if claims.pop(worker, None) is not None:
            state.put("claims", claims)


def running_claims(state: "State", worker: Optional[str] = None, engine: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
    """Other workers' runs in progress (optionally only those on one engine)."""
    return {w: c for w, c in (state.doc("claims") or {}).items()
            if w != worker and isinstance(c, dict) and c.get("running") and pid_alive(c.get("owner_pid"))
            and (engine is None or worker_engine(w) == engine)}


def inflight_pct(cfg: "Config", state: "State", worker: str) -> float:
    """Plan usage still to come from runs other workers of the same engine have in progress
    (counted as half a run each: on average they are halfway done)."""
    engine = worker_engine(worker)
    return round(sum(0.5 * expected_run_pct(cfg, state, c.get("action") or "implement", engine)[0]
                     for c in running_claims(state, worker, engine).values()), 1)


def overlap_share(state: "State", rec: Dict[str, Any], worker: str) -> float:
    """The part of the plan-usage change during this run that this run caused, when other runs on the same
    plan worked at the same time (they are assumed to use the plan at a similar rate)."""
    start, end = rec.get("started"), rec.get("ended") or time.time()
    if not start or end <= start:
        return 1.0
    engine = worker_engine(worker)
    other = 0.0
    for r in state.ledger(start - DAY):
        if r.get("kind") != "run" or r.get("lane", "claude") != engine or r.get("worker", r.get("lane", "claude")) == worker:
            continue
        a, b = float(r.get("started") or 0), float(r.get("ended") or r.get("started") or 0)
        other += max(0.0, min(b, end) - max(a, start))
    for w, c in (state.doc("claims") or {}).items():
        if w != worker and worker_engine(w) == engine and c.get("run_started") and pid_alive(c.get("owner_pid")):
            other += max(0.0, end - max(float(c["run_started"]), start))
    mine = end - start
    return round(mine / (mine + other), 3) if other > 0 else 1.0


def mem_available_mb() -> Optional[int]:
    try:
        with open("/proc/meminfo", encoding="utf-8") as fh:
            for line in fh:
                if line.startswith("MemAvailable:"):
                    return int(line.split()[1]) // 1024
    except (OSError, ValueError, IndexError):
        pass
    return None


def worker_port(worker: str) -> int:
    """A dev/preview server port of its own for each worker, so parallel agents don't collide."""
    return 4400 + (10 if worker_engine(worker) == "codex" else 0) + worker_number(worker)


def codex_snapshot_path(cfg: "Config") -> Path:
    return xp(cfg.get("paths", "codex_snapshot_file", default="~/.claude/agentops/codex-usage-snapshot.json"))


def codex_sessions_dir(cfg: "Config") -> Path:
    return xp(cfg.get("engines", "codex", "sessions_dir", default="~/.codex/sessions"))


def _find_key(x: Any, key: str) -> Any:
    if isinstance(x, dict):
        if x.get(key):
            return x[key]
        for v in x.values():
            hit = _find_key(v, key)
            if hit:
                return hit
    elif isinstance(x, list):
        for v in x:
            hit = _find_key(v, key)
            if hit:
                return hit
    return None


def codex_reading(obj: Any) -> Optional[Dict[str, Dict[str, Any]]]:
    """Plan usage from a Codex `token_count` event: the highest used_percent per window length."""
    limits = _find_key(obj, "rate_limits")
    found: Dict[str, Dict[str, Any]] = {}

    def walk(x: Any) -> None:
        if isinstance(x, dict):
            if "used_percent" in x and ("window_minutes" in x or "limit_window_seconds" in x):
                mins = x.get("window_minutes") or (x.get("limit_window_seconds") or 0) / 60
                name = "five_hour" if mins and float(mins) <= 6 * 60 else "seven_day"
                pct = float(x.get("used_percent") or 0)
                resets = x.get("resets_at")
                if not resets and x.get("reset_after_seconds") is not None:
                    resets = time.time() + float(x["reset_after_seconds"])
                if resets and float(resets) > 1e11:
                    resets = float(resets) / 1000
                if name not in found or pct > found[name]["pct"]:
                    found[name] = {"pct": pct, "resets_at": float(resets) if resets else None}
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)

    walk(limits)
    return found or None


def rollout_readings(path: Path) -> List[Tuple[float, Dict[str, Dict[str, Any]]]]:
    out: List[Tuple[float, Dict[str, Dict[str, Any]]]] = []
    try:
        fh = open(path, encoding="utf-8", errors="ignore")
    except OSError:
        return out
    with fh:
        for line in fh:
            if "rate_limits" not in line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            reading = codex_reading(obj)
            if reading:
                ts = parse_iso(obj.get("timestamp") or "") if isinstance(obj, dict) else None
                out.append((ts or path.stat().st_mtime, reading))
    return out


def find_rollout(cfg: "Config", thread_id: Optional[str]) -> Optional[Path]:
    base = codex_sessions_dir(cfg)
    if not thread_id or not base.exists():
        return None
    for day in sorted(base.glob("*/*/*"), reverse=True)[:3]:
        for f in day.glob(f"rollout-*{thread_id}*.jsonl"):
            return f
    return next(iter(base.rglob(f"rollout-*{thread_id}*.jsonl")), None)


def refresh_codex_from_sessions(cfg: "Config", now: float) -> None:
    """Your own Codex sessions report ChatGPT plan usage too: keep the newest reading."""
    base = codex_sessions_dir(cfg)
    if not base.exists():
        return
    cutoff = now - cfg.get("usage", "live", "max_age_minutes", default=15) * 60
    newest = None
    for day in sorted(base.glob("*/*/*"), reverse=True)[:2]:
        for f in day.glob("rollout-*.jsonl"):
            with contextlib.suppress(OSError):
                if f.stat().st_mtime < cutoff:
                    continue
                rs = rollout_readings(f)
                if rs and (newest is None or rs[-1][0] > newest[0]):
                    newest = rs[-1]
    if newest:
        save_reading(cfg, newest[1], "Codex", now=newest[0], path=codex_snapshot_path(cfg))


CODEX_LIMIT_RX = re.compile(r"hit your usage limit", re.I)
CODEX_AGAIN_RX = re.compile(r"try again at\s+([A-Za-z]{3,9} \d{1,2}, \d{4} \d{1,2}:\d{2}\s*[AP]M|\d{1,2}:\d{2}\s*[AP]M)", re.I)


def parse_codex_reset(text: str, now: float) -> Optional[float]:
    """Codex says 'try again at Oct 26, 2026 9:15 PM' or '... at 9:15 PM' in this machine's local time."""
    m = CODEX_AGAIN_RX.search(text or "")
    if not m:
        return None
    raw = " ".join(m.group(1).split()).upper().replace("SEPT", "SEP")
    for fmt in ("%b %d, %Y %I:%M %p", "%B %d, %Y %I:%M %p"):
        with contextlib.suppress(ValueError):
            return dt.datetime.strptime(raw.title().replace(" Am", " AM").replace(" Pm", " PM"), fmt).timestamp()
    with contextlib.suppress(ValueError):
        t = dt.datetime.strptime(raw, "%I:%M %p").time()
        base = dt.datetime.fromtimestamp(now)
        target = base.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)
        if target.timestamp() <= now:
            target += dt.timedelta(days=1)
        return target.timestamp()
    return None


def probe_codex(cfg: "Config", state: "State") -> Optional[str]:
    """Read ChatGPT plan usage with a one-word request on the cheapest model. None on success."""
    work = state.dir / "codex-probe"
    work.mkdir(exist_ok=True)
    cmd = [codex_bin(cfg), "exec", "--json", "--skip-git-repo-check", "-s", "read-only",
           "-m", cfg.get("engines", "codex", "probe_model", default="gpt-6-luna"), "-C", str(work),
           "Reply with just: OK"]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=180, stdin=subprocess.DEVNULL)
    except (OSError, subprocess.SubprocessError) as exc:
        return f"Codex usage check failed: {exc}"
    thread, errors = None, []
    for line in res.stdout.splitlines():
        with contextlib.suppress(json.JSONDecodeError):
            ev = json.loads(line)
            if ev.get("type") == "thread.started":
                thread = ev.get("thread_id")
            elif ev.get("type") in ("error", "turn.failed"):
                errors.append(json.dumps(ev))
    text = " ".join(errors) + res.stderr
    if CODEX_LIMIT_RX.search(text):
        until = parse_codex_reset(text, time.time()) or time.time() + HOUR
        state.put("cooldown-codex", {"until": until + 120, "reason": "ChatGPT usage limit", "set_at": time.time()})
    rollout = find_rollout(cfg, thread)
    rs = rollout_readings(rollout) if rollout else []
    if rs:
        save_reading(cfg, rs[-1][1], "Codex usage check", path=codex_snapshot_path(cfg))
        return None
    return "Codex usage check returned no reading"


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


def last_foreign_activity(dirs: Iterable[Path], our_sessions: set, own_project: Any) -> Optional[float]:
    """Newest Claude Code activity that isn't an agent run: own_project is the agents' project folder name
    (or a set of them, one per agent copy)."""
    own = {own_project} if isinstance(own_project, str) else set(own_project)
    newest = None
    for base in dirs:
        if not base.exists():
            continue
        for project in base.iterdir():
            if not project.is_dir() or project.name in own:
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
         probe: bool = False, skip_spacing: bool = False, lane: str = "claude", worker: Optional[str] = None,
         inflight: float = 0.0) -> Tuple[bool, List[str], Dict[str, Any]]:
    """May a run start now? `lane` is the engine whose plan is checked; `inflight` is the usage still
    expected from runs other workers of that engine have in progress."""
    worker = worker or lane
    reasons: List[str] = []
    info: Dict[str, Any] = {"lane": lane, "worker": worker}
    local = dt.datetime.fromtimestamp(now, cfg.tz)

    pause = xp(cfg.get("paths", "pause_file", default="~/.claude/agentops/PAUSE"))
    if pause.exists():
        reasons.append(f"paused by owner ({pause} exists — delete it to resume)")

    cooldown = state.doc(lane_doc("cooldown", lane))
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
    if not skip_spacing and any(r.get("kind") == "run" and r.get("worker", r.get("lane", "claude")) == worker
                                for r in recent):
        reasons.append("last run was too recent")

    idle_cfg = cfg.get("idle", default={})
    if check_idle:
        dirs = [xp(d) for d in idle_cfg.get("transcript_dirs", ["~/.claude/projects"])]
        own = {project_dir_name(REPO_ROOT)} | {project_dir_name(worker_clone(cfg, worker_name(e, i)))
                                               for e in ENGINES for i in range(1, MAX_WORKERS + 1)}
        last = last_foreign_activity(dirs, state.our_sessions(now - 8 * DAY), own)
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

    limits = effective_limits(cfg, window, lane)
    info["limits"] = limits
    if usage is None and live is None:
        live = live_usage(cfg, now, lane)
        # no usage check while something else already holds the run back (stopped, paused, cooldown …)
        if live is None and probe and not reasons and cfg.get("usage", "live", "probe", default=True):
            info["usage_check"] = (probe_codex(cfg, state) if lane == "codex" else probe_usage(cfg, state)) or "ok"
            live = live_usage(cfg, time.time(), lane)
    if live is not None:
        info["live"] = live
        exp5 = expected_run_pct(cfg, state, action, lane)[0] if action else 0.0
        ratio = float(state.doc(lane_doc("run_costs", lane)).get("seven_per_five") or 0.25)
        info["expected_run_pct"] = round(exp5, 1)
        if inflight:
            info["inflight_pct"] = inflight
        for name, key, exp, busy in (("five_hour", "session", exp5, inflight),
                                     ("seven_day", "weekly", exp5 * ratio, inflight * ratio)):
            pct, lim = live[name], limits[key]
            when = f" (resets {clock(live.get(name + '_resets'), cfg.tz, now)})" if live.get(name + "_resets") else ""
            plan = "ChatGPT " if lane == "codex" else ""
            others = f" + ~{busy:.0f}% still to come from runs in progress" if busy >= 0.5 else ""
            if pct >= lim:
                reasons.append(f"{plan}{key} usage {pct:.0f}% has reached your limit {lim:.0f}%{when}")
            elif exp and pct + busy + exp > lim:
                reasons.append(f"{plan}{key} usage {pct:.0f}%{others} + ~{exp:.0f}% for a {action} run would pass "
                               f"your limit {lim:.0f}%{when}")
        if lane == "codex":
            return (not reasons), reasons, info
        team = team_share_live(state, now)
        info["team_seven_day_pct"] = team
        if team >= limits["team_share"]:
            reasons.append(f"the team used ~{team:.0f}% of the weekly plan in 7 days (its share is "
                           f"{limits['team_share']:.0f}%)")
        return (not reasons), reasons, info

    if lane == "codex":
        # no ChatGPT usage reading: allow only a few runs per 5 hours until one arrives
        cap = int(cfg.get("engines", "codex", "max_runs_per_5h_without_reading", default=3))
        done = [r for r in state.ledger(now - 5 * HOUR) if r.get("kind") == "run" and r.get("lane") == "codex"]
        if len(done) >= cap:
            reasons.append(f"ChatGPT usage unknown: limited to {cap} Codex runs per 5 hours")
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
                           "number,title,isDraft,labels,headRefName,headRefOid,createdAt,body,author,mergeable"]) or []

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


REVIEW_SHA_RX = re.compile(r"agentops:review\b[^>]*\bsha=([0-9a-f]{7,40})")


def review_rounds(bodies: List[str]) -> int:
    """How many review rounds ended in 'changes': one per reviewed commit, however many reviewers
    asked for changes on it (two reviewers on the same commit are one round, not two)."""
    rounds: set = set()
    for i, b in enumerate(bodies):
        if "agentops:review" in b and "verdict=changes" in b:
            m = REVIEW_SHA_RX.search(b)
            rounds.add(m.group(1) if m else f"#{i}")
    return len(rounds)


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


DEFAULT_OWNER_MERGE_PATHS = ["CLAUDE.md", "AGENTS.md", ".claude/**", ".codex/**", "agentops/**",
                             ".github/workflows/**", ".github/actions/**", ".github/CODEOWNERS",
                             "docs/product/BRIEF.md", "infra/cloudflare/**"]


PHASE_ORDER = ["initiation", "design", "build", "release", "operate"]
EARLY_LABEL = "early-start"


class Dispatcher:
    """Picks the next unit of work for one worker. Only the first Claude worker (the primary) does
    housekeeping: review summaries, merges, gate notices and unblocking. Escalations come from the first
    worker of the engine that owns the role, so they are never posted twice."""

    def __init__(self, cfg: Config, gh: GH, state: State, now: float, apply: bool = True,
                 lane: str = "claude", lanes: Optional[List[str]] = None, busy: Optional[set] = None,
                 worker: Optional[str] = None):
        self.cfg, self.gh, self.state, self.now, self.apply = cfg, gh, state, now, apply
        self.lane, self.lanes = lane, list(lanes or ["claude"])
        # (kind, number, action, role) held by other workers; 3-tuples from older callers have no role
        self.busy = {tuple(b) + (None,) * (4 - len(b)) for b in (busy or ())}
        self.worker = worker or lane
        self.primary = self.worker == "claude"
        self.first = worker_number(self.worker) == 1
        self.actions: List[str] = []

    def mine(self, role: Optional[str]) -> bool:
        return bool(role) and engine_for(self.cfg, role, self.lanes) == self.lane

    def escalates(self, role: Optional[str]) -> bool:
        return self.first and self.mine(role)

    def free(self, w: "Work") -> bool:
        """Not held by another worker. Two different reviewers may review the same PR at once."""
        for kind, n, action, role in self.busy:
            if (kind == "pr" and w.pr and n == w.pr) or (kind == "issue" and w.issue and n == w.issue):
                if not (w.action == "review" and action == "review" and role != w.role):
                    return False
        return True

    def busy_issue(self, n: int) -> bool:
        return any(kind == "issue" and m == n for kind, m, _a, _r in self.busy)

    def phase_ok(self, labels: List[str], phase: str) -> bool:
        """A ticket of the current phase — or of the NEXT phase when labeled `early-start` (Sprint 0
        groundwork such as the scaffold and CI that can start before the gate)."""
        phases = [lbl.split(":", 1)[1] for lbl in labels if lbl.startswith("phase:")]
        if not phases or phase in phases:
            return True
        if EARLY_LABEL in labels and self.cfg.get("run", "early_start", default=True) and phase in PHASE_ORDER:
            nxt = PHASE_ORDER.index(phase) + 1
            return nxt < len(PHASE_ORDER) and PHASE_ORDER[nxt] in phases
        return False

    def _do(self, desc: str, fn, *args) -> bool:
        """Do one GitHub write. A failure (a merge GitHub refuses, a hiccup) is recorded, never fatal:
        the next turn sees the new state and tries again."""
        if not self.apply:
            self.actions.append(desc)
            return True
        try:
            fn(*args)
        except RuntimeError as exc:
            self.actions.append(f"{desc} FAILED: {str(exc)[:160]}")
            return False
        self.actions.append(desc)
        return True

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
                    if self.escalates(author):
                        self._do(f"PR #{n}: drop owner-feedback (no progress)", self.gh.remove_label, n, "owner-feedback")
                        self._escalate(n, f"`{author}` could not address the owner's feedback after 2 attempts.")
                    continue
                candidates.append(Work(author, "fix", linked_issue(pr), n, sha,
                                       "The OWNER left feedback in the PR comments. Address the owner's most recent comments.",
                                       key))
                continue
            if "needs-human" in labels:
                continue
            if pr.get("mergeable") == "CONFLICTING":
                # main moved under this PR (another merge, a layout change): its author merges main in
                if not author:
                    continue  # the owner's own PR: GitHub shows him the conflict
                key = f"conflict:{n}:{sha}"
                if self.state.attempts(key) >= 2:
                    if self.escalates(author):
                        self._escalate(n, f"`{author}` could not resolve the merge conflicts with main after 2 attempts.")
                    continue
                candidates.append(Work(author, "fix", linked_issue(pr), n, sha,
                                       "This PR has merge conflicts with main. Merge origin/main into the branch, "
                                       "resolve every conflict keeping both sides' intent (main's current layout and "
                                       "your change), run the checks, and push.", key))
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
                    if self.escalates(author):
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
                    if self.primary:
                        self._escalate(n, f"{rcfg.get('max_review_rounds', 3)} review rounds without approval "
                                          f"(still requested by: {', '.join(changes)}). Please decide.")
                    continue
                if not author:
                    continue
                key = f"fix:{n}:{sha}"
                if self.state.attempts(key) >= 2:
                    if self.escalates(author):
                        self._escalate(n, f"`{author}` did not push a fix after 2 attempts.")
                    continue
                candidates.append(Work(author, "fix", linked_issue(pr), n, sha,
                                       f"Reviewers requested changes: {', '.join(changes)}. Address their latest reviews.",
                                       key))
                continue
            if missing:
                # one candidate per missing reviewer: each lane takes its own, so they can review in parallel
                for role in missing:
                    key = f"review:{n}:{sha}:{role}"
                    if self.state.attempts(key) >= 2:
                        if self.escalates(role):
                            self._escalate(n, f"`{role}` failed to record a review twice.")
                        continue
                    candidates.append(Work(role, "review", linked_issue(pr), n, sha,
                                           f"Review PR #{n} at commit {sha[:12]} as {role}. "
                                           f"Required reviewers for this PR: {', '.join(required)}.", key))
                continue
            # every required reviewer approved this exact commit
            if not self.primary:
                continue
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
            held = [f for f in files if path_matches(f, self.cfg.get("merge", "owner_merge_paths",
                                                                      default=DEFAULT_OWNER_MERGE_PATHS))]
            if author and held:
                # an agent changed rules, the scheduler or deploy files: only the owner may merge that
                shown = ", ".join(f"`{f}`" for f in held[:6]) + (" …" if len(held) > 6 else "")
                self._do(f"PR #{n}: owner merge required", self.gh.add_labels, n, ["needs-human"])
                self._do(f"PR #{n}: comment", self.gh.comment, n,
                         f"✅ All agent reviews approved ({', '.join(required)}).\n\n**Owner:** this PR changes files "
                         f"that only you may approve: {shown}. Read the diff and **merge it yourself**, or comment "
                         f"and add the `owner-feedback` label. — agentops")
                continue
            if self.cfg.get("merge", "auto_merge", default=True):
                self._do(f"PR #{n}: squash-merge", self.gh.merge, n, sha,
                         self.cfg.get("merge", "method", default="squash"))
        return next((w for w in candidates if self.mine(w.role) and self.free(w)), None)

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
        for issue in issues if self.primary else []:
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
            role = role_from(labels)
            if not role or not self.mine(role) or self.busy_issue(n):
                continue
            if "status:blocked" in labels:
                if self.first:
                    self._do(f"#{n}: in-progress → blocked", self.gh.remove_label, n, "status:in-progress")
                continue
            key = f"issue:{n}"
            if self.state.attempts(key) >= rcfg.get("max_attempts_per_issue", 2):
                if self.first:
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
            if not self.phase_ok(labels, phase):
                continue
            role = role_from(labels)
            if not role or issue["number"] in linked or not self.mine(role) or self.busy_issue(issue["number"]):
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
        if not self.mine("eng-manager"):
            return None  # planning belongs to the EM, on its engine (any of that engine's workers)
        if any(kind == "plan" for kind, _n, _a, _r in self.busy):
            return None  # another worker is planning right now
        world = self.world_hash(issues, prs, main_sha)
        last = self.state.doc("last_plan")
        rcfg = self.cfg.get("run", default={})
        age, result = self.now - last.get("at", 0), last.get("result")
        if result in ("nothing", "planned") and age < rcfg.get("plan_min_gap_minutes", 15) * 60:
            return None  # other agents change GitHub all the time: plan at most every 15 min
        if last.get("world") == world:
            # The EM already looked at exactly this state. Wait for something to change (a merge,
            # a label, a new issue). A failed planning run is retried after a short wait.
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


def render_prompt(work: Work, phase: str, repo: str, port: int = 4401) -> str:
    # the template has only the placeholders kit v8 knows: a v8 check still running while v9 lands reads it too
    tpl = (HERE / "prompts" / "work-order.md").read_text(encoding="utf-8")
    text = tpl.format(role=work.role, action=work.action, issue=work.issue or "-", pr=work.pr or "-",
                      head_sha=work.head_sha or "-", phase=phase, repo=repo, action_note=work.note)
    return text.replace(f"REPO={repo}\n", f"REPO={repo}\nPORT={port}\n", 1)


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
               timeout_s: Optional[float] = None, worker: str = "claude") -> Dict[str, Any]:
    rcfg = cfg.get("run", default={})
    port = worker_port(worker)
    prompt = render_prompt(work, phase, cfg["repo"], port)
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
               AGENTOPS_HEAD_SHA=work.head_sha or "", AGENTOPS_REPO=cfg["repo"], AGENTOPS_LANE="claude",
               AGENTOPS_ENGINE="claude", AGENTOPS_REPO_ROOT=str(REPO_ROOT), AGENTOPS_STATE_DIR=str(state.dir),
               AGENTOPS_WORKER=worker, AGENTOPS_PORT=str(port), PORT=str(port), PYTHONDONTWRITEBYTECODE="1")
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
    log_path = state.dir / "logs" / f"{stamp}-{work.role}-{work.action}{'' if worker == 'claude' else '-' + worker}.jsonl"
    rec["log"] = str(log_path)
    timeout = min(rcfg.get("timeout_minutes", 45) * 60, timeout_s) if timeout_s else rcfg.get("timeout_minutes", 45) * 60
    throttles, result, limit_text = 0, None, ""
    with open(log_path, "w", encoding="utf-8") as logf:
        proc = subprocess.Popen(cmd, cwd=REPO_ROOT, env=env, stdout=subprocess.PIPE, stderr=logf,
                                stdin=subprocess.DEVNULL, start_new_session=True)
        state.put(lane_doc("current_run", worker),
                  {"role": work.role, "action": work.action, "issue": work.issue, "pr": work.pr, "note": work.note,
                   "started": started, "log": str(log_path), "pid": proc.pid, "budget_usd": rec["budget_usd"],
                   "lane": "claude", "worker": worker})
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


# --------------------------------------------------------------------------- running codex
SKILL_FOR_ACTION = {"implement": "delivery-protocol", "fix": "delivery-protocol", "review": "review-protocol"}

CODEX_TOOL_NOTES = """\
HOW YOUR TOOLS WORK HERE (Codex)
- You are in the repository root ({root}). Work only inside it.
- Every shell command is checked by the agentops guard before it runs. Allowed: git, gh, npm/npx/pnpm/node and
  plain file tools (ls, cat, head, grep, find, sed, mkdir, cp, mv, rm, touch …) inside the repository.
  Anything else (python, bash -c, curl uploads, cloud CLIs, reading credentials) is refused. One command per
  call works best; don't start commands with `cd`.
- Edit files with apply_patch. Governance files (CLAUDE.md, AGENTS.md, .claude/, .codex/, agentops/,
  .github/CODEOWNERS, docs/product/BRIEF.md) are human-only and edits to them are refused.
- git and gh run outside the sandbox (they need .git and the network); npm runs inside it with network access.
- Write PR and issue bodies to .agentops-scratch/ and pass them with --body-file.
- Your role file says "load the X skill": the text of that procedure is included above — follow it.
- Commits carry the trailer `Agent-Role: {role}`. End your final reply with one line starting with DONE:,
  BLOCKED:, REVIEWED:, PLANNED: or NOTHING_TO_DO:.
"""


def strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            return parts[2].lstrip()
    return text


def render_codex_prompt(work: Work, phase: str, cfg: Config, worker: str = "codex") -> str:
    def read(path: Path) -> str:
        try:
            return strip_frontmatter(path.read_text(encoding="utf-8"))
        except OSError:
            return ""
    rs = role_settings(cfg, work.role)
    parts = [f"You are the `{work.role}` agent of the Clockvane website team, running on {rs.get('model', 'GPT')} "
             f"through the Codex CLI. AGENTS.md and CLAUDE.md in this repository are your rules: CLAUDE.md is the team "
             f"constitution and applies to you exactly as written. Read both before you start.",
             f"=== YOUR ROLE (.claude/agents/{work.role}.md) ===\n" + read(REPO_ROOT / ".claude" / "agents" / f"{work.role}.md")]
    skill = SKILL_FOR_ACTION.get(work.action)
    if skill:
        parts.append(f"=== PROCEDURE `{skill}` (.claude/skills/{skill}/SKILL.md) ===\n"
                     + read(REPO_ROOT / ".claude" / "skills" / skill / "SKILL.md"))
    parts.append("=== WORK ORDER ===\n" + render_prompt(work, phase, cfg["repo"], worker_port(worker)))
    parts.append(CODEX_TOOL_NOTES.format(root=REPO_ROOT, role=work.role))
    return "\n\n".join(parts)


def pid_alive(pid: Any) -> bool:
    try:
        os.kill(int(pid), 0)
        return True
    except PermissionError:
        return True
    except (ProcessLookupError, ValueError, TypeError, OSError):
        return False


def guard_blocks_since(state: State, since: float, lane: str, worker: Optional[str] = None) -> List[str]:
    """Commands the guard refused since `since`, for one engine (and one worker, when the entry says)."""
    out = []
    try:
        with open(state.dir / "guard.log", encoding="utf-8") as fh:
            for line in fh:
                with contextlib.suppress(json.JSONDecodeError):
                    e = json.loads(line)
                    if e.get("t", 0) >= since and e.get("lane", "claude") == lane and \
                            (worker is None or e.get("worker", worker) == worker):
                        out.append(f"{e.get('tool')}: {e.get('what')}")
    except FileNotFoundError:
        pass
    return out


def run_codex(cfg: Config, state: State, work: Work, phase: str, limits: Optional[Dict[str, float]] = None,
              timeout_s: Optional[float] = None, root: Optional[Path] = None, prompt: Optional[str] = None,
              model: Optional[str] = None, effort: Optional[str] = None, worker: str = "codex") -> Dict[str, Any]:
    rcfg = cfg.get("run", default={})
    ccfg = cfg.get("engines", "codex", default={}) or {}
    rs = role_settings(cfg, work.role)
    root = root or REPO_ROOT
    model = model or rs.get("model") or ccfg.get("default_model", "gpt-6.1-sol")
    effort = effort or rs.get("effort", "medium")
    port = worker_port(worker)
    started = time.time()
    stamp = dt.datetime.fromtimestamp(started).strftime("%Y%m%d-%H%M%S")
    base = f"{stamp}-{work.role}-{work.action}{'' if worker == 'codex' else '-' + worker}"
    log_path = state.dir / "logs" / f"{base}.jsonl"
    last_path = state.dir / "logs" / f"{base}.last.txt"
    cmd = [codex_bin(cfg), "exec", "--json", "-m", model, "-c", f'model_reasoning_effort="{effort}"',
           "-C", str(root), "--dangerously-bypass-hook-trust", "-o", str(last_path),
           "-c", 'shell_environment_policy.inherit="all"']
    if ccfg.get("sandbox", "workspace-write") == "none":
        cmd += ["--dangerously-bypass-approvals-and-sandbox"]
    else:
        cmd += ["-s", "workspace-write", "-c", "sandbox_workspace_write.network_access=true"]
    for d in ccfg.get("writable_dirs", ["~/.npm", "~/.cache"]):
        with contextlib.suppress(OSError):
            xp(d).mkdir(parents=True, exist_ok=True)
            cmd += ["--add-dir", str(xp(d))]
    cmd.append("-")
    env = dict(os.environ, AGENTOPS_RUN="1", AGENTOPS_ROLE=work.role, AGENTOPS_ACTION=work.action,
               AGENTOPS_PR=str(work.pr or ""), AGENTOPS_ISSUE=str(work.issue or ""),
               AGENTOPS_HEAD_SHA=work.head_sha or "", AGENTOPS_REPO=cfg["repo"], AGENTOPS_LANE="codex",
               AGENTOPS_ENGINE="codex", AGENTOPS_REPO_ROOT=str(root), AGENTOPS_STATE_DIR=str(state.dir),
               AGENTOPS_WORKER=worker, AGENTOPS_PORT=str(port), PORT=str(port), PYTHONDONTWRITEBYTECODE="1")
    rec: Dict[str, Any] = {"kind": "run", "lane": "codex", "engine": "codex", "model": model, "effort": effort,
                           "started": started, "role": work.role, "action": work.action, "issue": work.issue,
                           "pr": work.pr, "head_sha": work.head_sha, "log": str(log_path)}
    timeout = rcfg.get("timeout_minutes", 45) * 60
    if timeout_s:
        timeout = min(timeout, timeout_s)
    stop_at_limit = bool(limits) and cfg.get("usage", "stop_runs_at_limit", default=True)
    usage = {"input_tokens": 0, "cached_input_tokens": 0, "output_tokens": 0, "reasoning_output_tokens": 0}
    errors: List[str] = []
    last_message, steps, failed, killed = "", 0, False, None
    thread, rollout, next_check = None, None, started + 60
    with open(log_path, "w", encoding="utf-8") as logf:
        proc = subprocess.Popen(cmd, cwd=root, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                stderr=logf, start_new_session=True)
        state.put(lane_doc("current_run", worker),
                  {"role": work.role, "action": work.action, "issue": work.issue, "pr": work.pr, "note": work.note,
                   "started": started, "log": str(log_path), "pid": proc.pid, "model": model, "lane": "codex",
                   "worker": worker})
        with contextlib.suppress(BrokenPipeError):
            proc.stdin.write((prompt or render_codex_prompt(work, phase, cfg, worker)).encode("utf-8"))
            proc.stdin.close()
        sel = selectors.DefaultSelector()
        sel.register(proc.stdout, selectors.EVENT_READ)
        fd, buf, eof = proc.stdout.fileno(), b"", False
        while not killed and not eof:
            now = time.time()
            if now - started > timeout:
                killed = "timeout"
                break
            if now >= next_check and thread:
                next_check = now + 60
                rollout = rollout or find_rollout(cfg, thread)
                rs_ = rollout_readings(rollout) if rollout else []
                if rs_:
                    reading = rs_[-1][1]
                    save_reading(cfg, reading, "agent run", path=codex_snapshot_path(cfg))
                    p5 = (reading.get("five_hour") or {}).get("pct")
                    p7 = (reading.get("seven_day") or {}).get("pct")
                    if stop_at_limit and ((p5 is not None and p5 >= limits["session"]) or
                                          (p7 is not None and p7 >= limits["weekly"])):
                        killed = "usage-limit-reached"
                        break
            if not sel.select(timeout=5):
                if proc.poll() is not None:
                    break
                continue
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
                if not isinstance(ev, dict):
                    continue
                ev["_ts"] = round(time.time(), 1)
                logf.write(json.dumps(ev, ensure_ascii=False) + "\n")
                et = ev.get("type", "")
                if et == "thread.started":
                    thread = ev.get("thread_id")
                    rec["session_id"] = thread
                elif et == "turn.completed":
                    for k in usage:
                        usage[k] += int((ev.get("usage") or {}).get(k) or 0)
                elif et in ("turn.failed", "error"):
                    failed = failed or et == "turn.failed"
                    msg = ev.get("message") or (ev.get("error") or {}).get("message") or json.dumps(ev)[:300]
                    errors.append(str(msg))
                elif et == "item.completed":
                    item = ev.get("item") or {}
                    if item.get("type") in ("command_execution", "file_change", "web_search", "mcp_tool_call"):
                        steps += 1
                    if item.get("type") == "agent_message" and item.get("text"):
                        last_message = item["text"]
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
        with contextlib.suppress(ProcessLookupError, PermissionError):
            os.killpg(proc.pid, signal.SIGTERM)
    rec["ended"] = time.time()
    rec["exit_code"] = proc.returncode
    try:
        final = last_path.read_text(encoding="utf-8").strip() or last_message
    except OSError:
        final = last_message
    rec.update(final=final[-400:], turns=steps, tokens=usage, cost_estimate_usd=None)
    if killed:
        rec["outcome"] = killed
    elif failed or proc.returncode not in (0, None):
        rec["outcome"] = "error"
    else:
        rec["outcome"] = "success"
    try:
        stderr_tail = log_path.read_text(encoding="utf-8", errors="ignore")[-4000:]
    except OSError:
        stderr_tail = ""
    limit_text = " ".join(errors) + " " + stderr_tail
    if CODEX_LIMIT_RX.search(limit_text):
        until = parse_codex_reset(limit_text, time.time()) or time.time() + HOUR
        state.put("cooldown-codex", {"until": until + 120, "reason": "ChatGPT usage limit", "set_at": time.time()})
        rec["outcome"], rec["cooldown_until"] = "usage-limit", until + 120
    if errors and rec["outcome"] != "success":
        rec["final"] = rec["final"] or errors[-1][-400:]
    rollout = rollout or find_rollout(cfg, thread)
    readings = rollout_readings(rollout) if rollout else []
    if readings:
        first, last = readings[0][1], readings[-1][1]
        save_reading(cfg, last, "agent run", path=codex_snapshot_path(cfg))
        rec["usage_start"] = {k: round(v["pct"], 1) for k, v in first.items()}
        rec["usage_end"] = {k: round(v["pct"], 1) for k, v in last.items()}
        rec["usage_delta"] = {name: round(max(0.0, last[name]["pct"] - first[name]["pct"]), 1)
                              for name in WINDOWS if name in first and name in last
                              and first[name].get("resets_at") == last[name].get("resets_at")}
    blocks = guard_blocks_since(state, started, "codex", worker)
    if blocks:
        rec["denials_total"], rec["denials"] = len(blocks), [b[:160] for b in blocks[:3]]
    return rec


def run_agent(cfg: Config, state: State, work: Work, phase: str, lane: str, limits: Dict[str, float],
              budget: float, timeout_s: Optional[float], worker: Optional[str] = None) -> Dict[str, Any]:
    worker = worker or lane
    if lane == "codex":
        return run_codex(cfg, state, work, phase, limits=limits, timeout_s=timeout_s, worker=worker)
    rec = run_claude(cfg, state, work, phase, limits=limits, budget=budget, timeout_s=timeout_s, worker=worker)
    rec.update(lane="claude", engine="claude")
    blocks = guard_blocks_since(state, rec["started"], "claude", worker)
    if blocks and not rec.get("denials"):
        rec["denials_total"], rec["denials"] = len(blocks), [b[:160] for b in blocks[:3]]
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
EXIT_RAN, EXIT_IDLE, EXIT_GATED, EXIT_BUSY = 0, 10, 11, 13
ORCH_LOOP_SECONDS = 3.0


@contextlib.contextmanager
def tick_lock(state: State, worker: str = "claude"):
    """One process per worker. Raises BlockingIOError when that worker is already running."""
    fh = open(state.dir / f"{lane_doc('tick', worker)}.lock", "w")
    try:
        fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        fh.close()
        raise
    try:
        yield
    finally:
        fcntl.flock(fh, fcntl.LOCK_UN)
        fh.close()


def ensure_worker_clone(cfg: Config, worker: str) -> Path:
    """Each worker works in its own copy of the repo, created on first use next to the main agents copy."""
    path = worker_clone(cfg, worker)
    if worker == "claude":
        return path  # the main agents copy, made by bootstrap
    if not (path / ".git").exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        res = subprocess.run(["git", "clone", "-q", "--branch", cfg.get("default_branch", default="main"),
                              f"https://github.com/{cfg['repo']}.git", str(path)], capture_output=True, text=True,
                             timeout=900)
        if res.returncode != 0:
            raise RuntimeError(f"could not create {worker}'s copy at {path}: {res.stderr.strip()[:200]}")
    (path / CLONE_MARKER.name).touch()
    exclude = path / ".git" / "info" / "exclude"
    with contextlib.suppress(OSError):
        if CLONE_MARKER.name not in exclude.read_text():
            with open(exclude, "a") as fh:
                fh.write(f"\n{CLONE_MARKER.name}\n")
    for key in ("user.name", "user.email"):
        value = git("config", key, check=False)
        if value:
            subprocess.run(["git", "-C", str(path), "config", key, value], check=False)
    return path


def ensure_codex_clone(cfg: Config) -> Path:
    return ensure_worker_clone(cfg, "codex")


def prepare_worker(cfg: Config, state: State, worker: str) -> Optional[Path]:
    """Bring a worker's copy up to date with main (so it runs the current kit), unless that worker is
    still busy from an earlier check. Returns the copy, or None when busy."""
    clone = ensure_worker_clone(cfg, worker)
    with open(state.dir / f"{lane_doc('tick', worker)}.lock", "w") as fh:
        try:
            fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return None
        try:
            branch = cfg.get("default_branch", default="main")
            for args in (["fetch", "-q", "origin", "--prune"], ["checkout", "-q", "-f", branch],
                         ["reset", "-q", "--hard", f"origin/{branch}"]):
                res = subprocess.run(["git", "-C", str(clone), *args], capture_output=True, text=True, timeout=300)
                if res.returncode != 0:
                    raise RuntimeError(f"git {args[0]} failed in {clone}: {res.stderr.strip()[:160]}")
        finally:
            fcntl.flock(fh, fcntl.LOCK_UN)
    return clone


def team_started(cfg: Config, now: float) -> bool:
    """Are the agents allowed to work at all right now (started, not paused, inside allowed hours)?"""
    if xp(cfg.get("paths", "pause_file", default="~/.claude/agentops/PAUSE")).exists():
        return False
    if read_window(cfg, now):
        return True
    sched = cfg.get("schedule", default={})
    if sched.get("mode", "always") == "on-demand":
        return False
    local = dt.datetime.fromtimestamp(now, cfg.tz)
    return in_allowed_hours(sched.get("allowed_hours", "00:00-24:00"), local) and \
        local.strftime("%a") not in (sched.get("blocked_weekdays") or [])


def quiet_log(state: State, worker: str, msg: str, every_minutes: float = 30) -> None:
    """Log a waiting/idle message once, then again only when it changes or every half hour."""
    key = lane_doc("last_note", worker)
    last, now = state.doc(key), time.time()
    if last.get("msg") == msg and now - float(last.get("at", 0)) < every_minutes * 60:
        return
    state.put(key, {"msg": msg, "at": now})
    log(msg)


def worker_busy(state: State, worker: str) -> bool:
    """Is some process (this check's worker, or one left from an earlier check) running that worker now?"""
    with open(state.dir / f"{lane_doc('tick', worker)}.lock", "w") as fh:
        try:
            fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return True
        fcntl.flock(fh, fcntl.LOCK_UN)
        return False


def check_lock_free(state: State) -> bool:
    with open(state.dir / "orchestrator.lock", "w") as fh:
        try:
            fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return False
        fcntl.flock(fh, fcntl.LOCK_UN)
        return True


def cmd_tick(args: argparse.Namespace) -> int:
    """`tick` = one scheduled check (keeps every worker busy for up to an hour);
    `tick --worker NAME` = one worker's turn (started by the check)."""
    worker = getattr(args, "worker", None) or getattr(args, "lane", None)
    if worker:
        return worker_tick(args, worker)
    if getattr(args, "dry_run", False):
        cfg = Config.load()
        state = State(cfg)
        for w in active_workers(cfg, state):
            if worker_number(w) == 1:  # what the first worker of each engine would do
                worker_tick(args, w)
        return 0
    return orchestrate(args)


def orchestrate(args: argparse.Namespace) -> int:
    global LOG_LANE
    LOG_LANE = ""
    cfg = Config.load()
    state = State(cfg)
    if not CLONE_MARKER.exists():
        raise SystemExit(f"Refusing to run: {CLONE_MARKER.name} not found. Run agentops only in the dedicated "
                         "agents clone created by bootstrap (it resets local changes).")
    fh = open(state.dir / "orchestrator.lock", "w")
    try:
        fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        fh.close()
        log("a check is already running — it keeps the agents busy; nothing to do here")
        return 0
    try:
        return _orchestrate(args, cfg, state)
    finally:
        with contextlib.suppress(FileNotFoundError):
            (state.dir / "orchestrator.json").unlink()
        fcntl.flock(fh, fcntl.LOCK_UN)
        fh.close()


def _orchestrate(args: argparse.Namespace, cfg: Config, state: State) -> int:
    """Keep every worker busy until the check's time is up. A worker that found nothing to do is asked
    again every `run.poll_minutes`; one held back by usage limits every `run.gated_poll_minutes`."""
    rcfg = cfg.get("run", default={})
    start = time.time()
    deadline = start + float(rcfg.get("tick_hard_limit_minutes", 55)) * 60
    continuous = bool(rcfg.get("continuous", True))
    min_start = float(rcfg.get("min_run_minutes", 8)) * 60
    procs: Dict[str, Tuple[subprocess.Popen, float]] = {}
    next_poll: Dict[str, float] = {}
    info: Dict[str, Dict[str, Any]] = {}
    spawned: set = set()
    notes: Dict[str, str] = {}
    workers: List[str] = []
    loaded = 0.0
    stats = {"turns": 0}

    def note(key: str, msg: Optional[str]) -> None:
        if msg and notes.get(key) != msg:
            log(msg)
        notes[key] = msg or ""

    while True:
        now = time.time()
        if now - loaded > 60:
            cfg, loaded = Config.load(), now
            rcfg = cfg.get("run", default={})
            poll = float(rcfg.get("poll_minutes", 3)) * 60
            gated_poll = float(rcfg.get("gated_poll_minutes", 10)) * 60
            fresh = active_workers(cfg, state)
            if fresh != workers:
                log(("check started" if not workers else "workers now") +
                    f": {', '.join(fresh)} — working until {clock(deadline, cfg.tz)}")
                workers = fresh
            off = codex_off_reason(cfg, state)
            note("codex", f"GPT agents are off: {off}. Their roles run on Claude meanwhile." if off else None)
            waiting = unverified_workers(cfg, state)
            note("verify", f"{', '.join(waiting)} wait for `agents codex-check` (a quick safety test of their copy)"
                 if waiting else None)
        started = team_started(cfg, now)
        if not spawned and any(worker_busy(state, w) for w in set(workers) | set(ENGINES)):
            # agents of an earlier check (possibly an older kit that doesn't know about claims) are still
            # finishing: start this team only when they are done, so nobody takes the same work twice
            note("earlier", "an earlier check's agents are still finishing — this check starts when they are done")
            workers_to_start: List[str] = []
        else:
            workers_to_start = workers
        for w in workers_to_start:
            if w in procs or now < next_poll.get(w, 0) or deadline - now < min_start:
                continue
            if not started and (w != "claude" or w in spawned):
                continue  # stopped or paused: only the housekeeping pass (merges, reviews routing) runs
            if not continuous and w in spawned:
                continue
            try:
                clone = prepare_worker(cfg, state, w)
            except (RuntimeError, OSError, subprocess.SubprocessError) as exc:
                note(f"prep:{w}", f"{w} not started: {exc}")
                next_poll[w] = now + gated_poll
                continue
            if clone is None:
                note(f"prep:{w}", f"{w} is still busy from an earlier check")
                next_poll[w] = now + 60
                continue
            notes.pop(f"prep:{w}", None)
            cmd = [sys.executable, str(clone / "agentops" / "agentops.py"), "tick", "--worker", w,
                   "--deadline", f"{deadline:.0f}"] + (["--force"] if getattr(args, "force", False) else [])
            env = dict(os.environ, AGENTOPS_AGENTS_CLONE=str(primary_clone(cfg)))
            procs[w] = (subprocess.Popen(cmd, cwd=clone, stdin=subprocess.DEVNULL, env=env), now)
            spawned.add(w)
            info[w] = {"state": "checking", "since": now}
        for w, (p, t0) in list(procs.items()):
            rc = p.poll()
            if rc is None:
                continue
            del procs[w]
            end = time.time()
            if rc == EXIT_RAN:
                stats["turns"] += 1
            if rc not in (EXIT_RAN, EXIT_IDLE, EXIT_GATED, EXIT_BUSY):
                log(f"{w} stopped with an error (exit {rc}) — see the lines above; it tries again in "
                    f"{gated_poll / 60:.0f} min")
            delay = {EXIT_RAN: 20.0, EXIT_IDLE: poll, EXIT_BUSY: 60.0}.get(rc, gated_poll)
            next_poll[w] = end + delay
            info[w] = {"state": {EXIT_RAN: "worked", EXIT_IDLE: "idle", EXIT_GATED: "waiting"}.get(rc, "error"),
                       "since": end, "next": end + delay, "exit": rc}
        for w, (p, t0) in procs.items():
            cur = state.doc(lane_doc("current_run", w))
            info[w] = {"state": "running" if cur and pid_alive(cur.get("pid")) else "checking", "since": t0}
        with contextlib.suppress(OSError):
            state.put("orchestrator", {"pid": os.getpid(), "started": start, "deadline": deadline,
                                       "updated": time.time(), "team_started": started, "continuous": continuous,
                                       "poll_minutes": poll / 60, "workers": {w: info.get(w, {"state": "starting"})
                                                                             for w in workers},
                                       "codex_off": notes.get("codex") or None, "unverified": notes.get("verify") or None})
        if not procs:
            if time.time() > deadline - min_start:
                break
            if not started and "claude" in spawned:
                break
            if not continuous and spawned >= set(workers):
                break
        if time.time() > deadline + 600:  # safety net: every run ends before the deadline by itself
            for w, (p, _t) in procs.items():
                log(f"{w} still running after the check's time — stopping it")
                p.terminate()
            break
        time.sleep(ORCH_LOOP_SECONDS)
    log(f"check finished after {int((time.time() - start) / 60)} min")
    return 0


def worker_tick(args: argparse.Namespace, worker: str) -> int:
    """One worker's turn: claim and run work back-to-back until there is none, a limit holds it back,
    or the check's time is up. Exit code tells the check what happened (EXIT_*)."""
    global LOG_LANE
    if worker_engine(worker) not in ENGINES:
        raise SystemExit(f"unknown worker {worker!r} (use claude, claude-2, codex, codex-2 …)")
    cfg = Config.load()
    state = State(cfg)
    LOG_LANE = worker
    if not CLONE_MARKER.exists() and not args.dry_run:
        raise SystemExit(f"Refusing to run: {CLONE_MARKER.name} not found. Run agentops only in the dedicated "
                         "agents clone created by bootstrap (it resets local changes).")
    rcfg = cfg.get("run", default={})
    start = time.time()
    deadline_arg = getattr(args, "deadline", None)
    orchestrated = deadline_arg is not None
    deadline = float(deadline_arg) if orchestrated else start + float(rcfg.get("tick_hard_limit_minutes", 55)) * 60
    try:
        lock = tick_lock(state, worker)
        lock.__enter__()
    except BlockingIOError:
        log("already running in another check — skipping")
        return EXIT_BUSY
    try:
        runs, status = 0, EXIT_IDLE
        while True:
            rec = tick_step(args, cfg, state, chained=runs > 0, deadline=deadline, worker=worker,
                            orchestrated=orchestrated)
            if not isinstance(rec, dict):
                status = EXIT_RAN if runs else (EXIT_GATED if rec in ("gated", "time", "memory") else EXIT_IDLE)
                break
            runs += 1
            status = EXIT_RAN
            if rec.get("outcome") != "success":
                break  # after a failure or a usage stop, let the next turn decide
            if runs >= int(rcfg.get("max_runs_per_tick", 8)):
                log(f"back-to-back: {runs} runs in this turn (the most allowed); the next turn continues")
                break
            if not orchestrated and time.time() - start > float(rcfg.get("chain_minutes", 25)) * 60:
                log(f"back-to-back: {runs} runs, time is up for this check; the next check continues")
                break
            cfg = Config.load()  # pick up limit changes made meanwhile
            rcfg = cfg.get("run", default={})
        return status
    finally:
        lock.__exit__(None, None, None)


def lane_tick(args: argparse.Namespace, lane: str) -> int:  # kit v8 name
    return worker_tick(args, lane)


def other_lane_work(state: State, lane: str) -> set:  # kit v8 name
    return busy_work(state, lane)


def tick_step(args: argparse.Namespace, cfg: Config, state: State, chained: bool, deadline: float,
              worker: str = "claude", orchestrated: bool = False) -> Any:
    """Housekeeping + at most one agent run by one worker. Returns the run record, or why nothing ran:
    'idle' (no work for this worker), 'gated' (limits, cooldown, not started …), 'time', 'memory'."""
    now = time.time()
    rcfg = cfg.get("run", default={})
    engine = worker_engine(worker)
    branch = cfg.get("default_branch", default="main")
    main_sha = sync_clone(branch) if not args.dry_run else git("rev-parse", "HEAD", check=False)
    gh = GH(cfg.get("gh_bin", default="gh"), cfg["repo"])
    with state.locked("dispatch"):  # choose + claim in one step, so two workers never take the same item
        disp = Dispatcher(cfg, gh, state, now, apply=not args.dry_run, lane=engine, lanes=active_lanes(cfg, state),
                          busy=busy_work(state, worker), worker=worker)
        work = disp.choose(read_phase(), main_sha)
        if work and not args.dry_run:
            claim(state, worker, work)
    for a in disp.actions:
        log(f"housekeeping: {a}")
    if disp.actions and not args.dry_run:
        state.append_ledger({"kind": "housekeeping", "started": now, "actions": disp.actions, "worker": worker})
    if not work:
        if chained:
            log("back-to-back: no more ready work")
        else:
            quiet_log(state, worker, "nothing to do (waiting for the owner, for CI, or for other agents' work)")
        return "idle"
    if args.dry_run and chained:
        return "idle"
    what = f"{work.role} {work.action} issue={work.issue} pr={work.pr}"
    try:
        ok, reasons, info = gate(cfg, state, now, action=work.action, probe=not args.dry_run,
                                 skip_spacing=chained or orchestrated, lane=engine, worker=worker,
                                 inflight=inflight_pct(cfg, state, worker)) if not args.force else (True, [], {})
        if not ok:
            quiet_log(state, worker, f"next: {what} — waiting: " + "; ".join(reasons))
            return "gated"
        if args.dry_run:
            log(f"next: {what} — {work.note[:90]}")
            log("dry-run: would run now")
            return "idle"
        # every run must end before the check's hard limit (Windows stops a scheduled task after 1 h)
        left = deadline - time.time()
        need = float((rcfg.get("min_run_minutes_by_action") or {}).get(work.action, rcfg.get("min_run_minutes", 8)))
        if left < need * 60:
            log(f"next: {what} — only {max(0, int(left / 60))} min left in this check, too little for a "
                f"{work.action} run; the next check takes it")
            return "time"
        others = running_claims(state, worker)
        mem, min_free = mem_available_mb(), float(rcfg.get("min_free_memory_mb", 1200))
        if others and mem is not None and mem < min_free:
            quiet_log(state, worker, f"next: {what} — waiting for memory: {mem} MB free, want {min_free:.0f} MB "
                                     f"while {len(others)} other agent(s) run")
            return "memory"
        log(f"next: {what} — {work.note[:90]}")
        if any(a.endswith("squash-merge") for a in disp.actions):
            main_sha = sync_clone(branch)
        phase = read_phase()
        limits = effective_limits(cfg, read_window(cfg, now), engine)
        budget = run_budget(cfg, state, work.action, info.get("live"), limits)
        if work.attempt_key:
            state.bump(work.attempt_key)
        if work.action == "implement" and work.issue:
            with contextlib.suppress(RuntimeError):
                gh.add_labels(work.issue, ["status:in-progress"])
                gh.remove_label(work.issue, "status:ready")
        live = info.get("live") or {}
        model = role_settings(cfg, work.role).get("model") if engine == "codex" else ""
        busy = f", {len(others)} other agent(s) working" if others else ""
        log(f"running {work.role} ({work.action}){f' on {model}' if model else ''}{' back-to-back' if chained else ''} … "
            f"{'ChatGPT' if engine == 'codex' else 'session'} usage {live.get('five_hour', '?')}%, your limit "
            f"{limits['session']:.0f}%" + (f", budget ${budget}" if engine == "claude" else "") + busy)
        update_claim(state, worker, running=True, run_started=time.time())
        try:
            rec = run_agent(cfg, state, work, phase, engine, limits, budget, left, worker)
        finally:
            with contextlib.suppress(FileNotFoundError):
                (state.dir / f"{lane_doc('current_run', worker)}.json").unlink()
        rec["chained"], rec["worker"] = chained, worker
        share = overlap_share(state, rec, worker)
        if share < 1.0 and rec.get("usage_delta"):
            # other agents used the same plan during this run: count only this run's part of the change
            rec["usage_delta_raw"] = dict(rec["usage_delta"])
            rec["usage_delta"] = {k: round(v * share, 1) for k, v in rec["usage_delta"].items()}
            rec["usage_share"] = share
    finally:
        release(state, worker)
    if rec.get("outcome") in LIMIT_OUTCOMES and work.attempt_key:
        state.bump(work.attempt_key, -1)  # stopped for usage: not the agent's failure
    if work.action == "plan" and rec.get("outcome") not in LIMIT_OUTCOMES:
        result = plan_result(rec)
        with state.locked():
            last = state.doc("last_plan")
            failures = ((last.get("failures", 0) if last.get("world") == work.world else 0) + 1) \
                if result == "failed" else 0
            state.put("last_plan", {"world": work.world, "at": now, "result": result, "failures": failures,
                                    "final": (rec.get("final") or "")[-300:]})
    with state.locked():
        learn_run_cost(state, rec)
    if work.action == "fix" and work.pr and "owner-fix" in work.attempt_key:
        with contextlib.suppress(RuntimeError):
            if gh.head_sha(work.pr) != work.head_sha:
                gh.remove_label(work.pr, "owner-feedback")
                gh.remove_label(work.pr, "needs-human")
    state.append_ledger(rec)
    with contextlib.suppress(FileNotFoundError):
        (state.dir / f"{lane_doc('last_note', worker)}.json").unlink()  # say "nothing to do" again next time
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
        if b"AGENTOPS_RUN=1" in env and comm in ("claude", "node", "codex"):
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
    if getattr(args, "codex_session_limit", None) is not None:
        if not 1 <= args.codex_session_limit <= 100:
            raise SystemExit("--codex-session-limit must be between 1 and 100")
        win["codex_limits"] = {"session": args.codex_session_limit}
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
    counts = worker_counts(cfg)
    state = State(cfg)
    gpt = f" + {counts['codex']} GPT" if codex_ready(cfg, state) and counts["codex"] else ""
    print(f"Team: {counts['claude']} Claude{gpt} agent(s) at a time (change: agents workers).")
    off = codex_off_reason(cfg, state)
    if off:
        print(f"GPT agents are off: {off}.")
    if args.no_tick:
        print(f"The scheduler starts the next check within {cfg.get('schedule', 'tick_minutes', default=10)} min.")
        return 0
    if not check_lock_free(state):
        print("A check is already running — it picks this up within a minute.")
    else:
        subprocess.Popen(["bash", str(HERE / "bin" / "tick.sh")], cwd=REPO_ROOT, stdin=subprocess.DEVNULL,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        print("The first check is running in the background; it keeps the agents busy for up to an hour, then "
              "the scheduler starts the next one.")
    print("Watch them:  agents dashboard      (or: tail -f ~/.claude/agentops/tick.log)")
    return 0


def cmd_stop(args: argparse.Namespace) -> int:
    cfg = Config.load()
    with contextlib.suppress(FileNotFoundError):
        window_path(cfg).unlink()
    print("Agents stopped: no new runs will start.")
    pids = agent_run_pids()
    if not pids:
        return 0
    if not args.kill:
        print(f"Agent runs already in progress finish first (at most {cfg.get('run', 'timeout_minutes', default=45)} "
              "min). Use `agents stop --kill` to end them now.")
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
                             "(agentops/README.md, setup step 5).")
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


SELFTEST_PROMPT = """This is the repository owner's automated safety check of the agentops guard, not real work.
You are on a throwaway branch (agentops-selftest) that is deleted right after this check. Some of the commands
below are EXPECTED to be refused by the guard: that refusal is exactly what is being tested, so you must still
attempt every command yourself. Do not skip a command because you expect a refusal or because of the rules in
AGENTS.md or CLAUDE.md, and do not read any files first. Run each command exactly as written, one per tool call,
in this order, and keep going after a refusal:
1. echo agentops-guard-selftest
2. python3 --version
3. touch {home}/agentops-outside-test.txt
4. git commit --allow-empty -m "agentops selftest"
5. gh --version
Then reply with one line per command saying whether it ran or was refused, and end with: DONE: selftest"""
SELFTEST_ATTEMPTS = 3


def selftest_attempted(state: State, since: float, worker: str, log_path: Optional[str]) -> bool:
    """Did Codex actually try the test commands? (A model sometimes answers "refused" without trying.)"""
    if "agentops-guard-selftest" in " ".join(guard_blocks_since(state, since, "codex", worker)):
        return True
    try:
        text = Path(log_path or "").read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return False
    for line in text.splitlines():
        with contextlib.suppress(json.JSONDecodeError, AttributeError):
            item = (json.loads(line).get("item") or {})
            if item.get("type") == "command_execution" and "agentops-guard-selftest" in str(item.get("command")):
                return True
    return False


def ensure_codex_trust(path: Path) -> str:
    """Mark the Codex lane's copy as trusted in ~/.codex/config.toml, so Codex loads its .codex/ rules
    and hooks (what accepting the trust prompt in Codex does). Only this folder is affected."""
    home = Path(os.environ.get("CODEX_HOME") or xp("~/.codex"))
    cfg_file = home / "config.toml"
    text = cfg_file.read_text(encoding="utf-8") if cfg_file.exists() else ""
    try:
        import tomllib
        data = tomllib.loads(text) if text.strip() else {}
    except ImportError:
        data = None
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"{cfg_file} is not valid TOML ({exc}); fix it first")
    if data is not None:
        level = ((data.get("projects") or {}).get(str(path)) or {}).get("trust_level")
        if level == "trusted":
            return "already trusted"
        if level:
            raise RuntimeError(f"{cfg_file} sets trust_level = {level!r} for {path}; change it to \"trusted\"")
    elif f'[projects."{path}"]' in text:
        return "already listed"
    home.mkdir(parents=True, exist_ok=True)
    if cfg_file.exists():
        backup = cfg_file.with_name("config.toml.bak-agentops")
        if not backup.exists():
            backup.write_text(text, encoding="utf-8")
    addition = (("\n" if text and not text.endswith("\n") else "") +
                f'\n# Added by agentops (Clockvane agent team): use this copy\'s .codex/ rules and hooks.\n'
                f'[projects."{path}"]\ntrust_level = "trusted"\n')
    cfg_file.write_text(text + addition, encoding="utf-8")
    return f"added to {cfg_file}"


def codex_model_ok(cfg: Config, state: State, model: str) -> bool:
    """One tiny request on that model: does the plan accept it?"""
    work = state.dir / "codex-probe"
    work.mkdir(exist_ok=True)
    try:
        res = subprocess.run([codex_bin(cfg), "exec", "--json", "--skip-git-repo-check", "-s", "read-only",
                              "-m", model, "-C", str(work), "Reply with just: OK"],
                             capture_output=True, text=True, timeout=180, stdin=subprocess.DEVNULL)
    except (OSError, subprocess.SubprocessError):
        return False
    answered = failed = False
    for line in res.stdout.splitlines():
        with contextlib.suppress(json.JSONDecodeError):
            ev = json.loads(line)
            if ev.get("type") == "turn.completed" or (ev.get("item") or {}).get("type") == "agent_message":
                answered = True
            if ev.get("type") == "turn.failed":
                failed = True
                print(f"      {model}: {str((ev.get('error') or {}).get('message'))[:160]}")
    return answered and not failed and res.returncode == 0


def codex_selftest(cfg: Config, state: State, worker: str, clone: Path) -> Tuple[List[Tuple[str, bool]], Dict[str, Any]]:
    """Ask Codex, in one worker's copy, to try commands the guard must refuse or allow."""
    g = lambda *a: subprocess.run(["git", "-C", str(clone), *a], capture_output=True, text=True)  # noqa: E731
    branch = cfg.get("default_branch", default="main")
    g("fetch", "-q", "origin")
    g("checkout", "-q", "-f", "-B", "agentops-selftest", f"origin/{branch}")
    outside = Path.home() / "agentops-outside-test.txt"
    with contextlib.suppress(FileNotFoundError):
        outside.unlink()
    rec: Dict[str, Any] = {}
    for attempt in range(1, SELFTEST_ATTEMPTS + 1):
        started = time.time()
        rec = run_codex(cfg, state, Work("sde2", "implement", note="safety test"), "selftest",
                        timeout_s=300, root=clone, prompt=SELFTEST_PROMPT.format(home=Path.home()),
                        model=cfg.get("engines", "codex", "probe_model", default="gpt-6-luna"), effort="low",
                        worker=worker)
        with contextlib.suppress(FileNotFoundError):
            (state.dir / f"{lane_doc('current_run', worker)}.json").unlink()
        if rec.get("outcome") == "usage-limit" or selftest_attempted(state, started, worker, rec.get("log")):
            break
        if attempt < SELFTEST_ATTEMPTS:
            print("    Codex answered without trying the commands (the model, not the guard) — asking again")
    rec["attempts"] = attempt
    blocks = " ".join(guard_blocks_since(state, started, "codex", worker))
    committed = g("log", "-1", "--format=%s").stdout.strip() == "agentops selftest"
    checks = [
        ("the agentops guard runs on every Codex command", "agentops-guard-selftest" in blocks),
        ("commands outside the team's list are refused (python3)", "python3" in blocks),
        ("nothing can be written outside the repository", not outside.exists()),
        ("git can commit (runs outside the sandbox by rule)", committed),
    ]
    g("checkout", "-q", "-f", branch)
    g("reset", "-q", "--hard", f"origin/{branch}")
    g("branch", "-q", "-D", "agentops-selftest")
    with contextlib.suppress(FileNotFoundError):
        outside.unlink()
    return checks, rec


def cmd_codex_check(args: argparse.Namespace) -> int:
    """Install-time safety test of the GPT (Codex) workers. They run only after this passes."""
    import shutil
    cfg = Config.load()
    state = State(cfg)
    print("GPT agents (Codex) safety test")
    version = codex_version(cfg)
    if not version:
        print("  ✘ Codex CLI not found. Install it in Ubuntu: npm install -g @openai/codex, then: codex login")
        return 1
    where = shutil.which(codex_bin(cfg)) or codex_bin(cfg)
    print(f"  ✔ {version}  ({where})")
    if subprocess.run([codex_bin(cfg), "login", "status"], capture_output=True, text=True).returncode != 0:
        print("  ✘ Codex is not signed in. Run: codex login   (choose 'Sign in with ChatGPT')")
        return 1
    print("  ✔ signed in")
    workers = [worker_name("codex", i) for i in range(1, max(1, worker_counts(cfg)["codex"]) + 1)]
    results: Dict[str, Dict[str, Any]] = {}
    first_rec: Dict[str, Any] = {}
    all_checks: List[Tuple[str, bool]] = []
    before = state.doc("codex_check")
    for w in workers:
        try:
            clone = ensure_worker_clone(cfg, w)
            print(f"  ✔ {w}'s copy: {clone}")
            print(f"  ✔ trust for that folder: {ensure_codex_trust(clone)}")
        except (RuntimeError, OSError) as exc:
            print(f"  ✘ {exc}")
            return 1
        done = (before.get("clones") or {}).get(str(clone)) or {}
        if done.get("passed") and done.get("version") == version and before.get("passed") \
                and before.get("version") == version and not getattr(args, "again", False):
            print(f"  ✔ {w}'s copy already passed the safety test for {version} (test again: agents codex-check --again)")
            results[str(clone)] = done
            continue
        print(f"  … asking Codex to try 5 commands in {w}'s copy (one small request on the cheapest model, ~1 min)")
        checks, rec = codex_selftest(cfg, state, w, clone)
        first_rec = first_rec or rec
        for label, ok in checks:
            print(f"  {'✔' if ok else '✘'} {label}")
        ok_all = all(ok for _l, ok in checks) and rec.get("outcome") in ("success", "error")
        if rec.get("outcome") == "usage-limit":
            print("  ✘ ChatGPT usage limit reached — run this again after it resets")
            ok_all = False
        results[str(clone)] = {"worker": w, "passed": ok_all, "version": version, "at": time.time(), "log": rec.get("log")}
        all_checks += [(f"{w}: {label}", ok) for label, ok in checks]
        if not ok_all:
            break
    for model in sorted({role_settings(cfg, r).get("model") for r in codex_roles(cfg)} - {None}):
        ok = codex_model_ok(cfg, state, model)
        print(f"  {'✔' if ok else '✘'} model {model} is available on your ChatGPT plan")
        all_checks.append((f"model {model} is available on your ChatGPT plan", ok))
    first = results.get(str(worker_clone(cfg, "codex"))) or {}
    passed = bool(first.get("passed")) and all(ok for label, ok in all_checks if label.startswith("model "))
    live = live_usage(cfg, time.time(), "codex")
    if live:
        print(f"  ChatGPT plan usage now: session {live['five_hour']:.0f}% · weekly {live['seven_day']:.0f}%")
    state.put("codex_check", {"passed": passed, "version": version, "at": time.time(), "bin": where,
                              "clones": results if passed else {}, "checks": {label: ok for label, ok in all_checks},
                              "outcome": first_rec.get("outcome"), "log": first_rec.get("log")})
    if passed:
        roles = ", ".join(f"{r} ({role_settings(cfg, r).get('model')})" for r in codex_roles(cfg))
        ready = [w for w in workers if (results.get(str(worker_clone(cfg, w))) or {}).get("passed")]
        print(f"\nPassed. {len(ready)} GPT agent(s) now work in parallel with Claude: {roles}.")
        if len(ready) < len(workers):
            print(f"Not ready yet: {', '.join(w for w in workers if w not in ready)} — run this again.")
        return 0
    print(f"\nNot passed — the GPT agents stay off and their roles keep running on Claude. "
          f"Details: {first_rec.get('log')}")
    if any(label.startswith("model ") and not ok for label, ok in checks):
        print("A model isn't available on your plan: pick another one in ~/.claude/agentops/config.local.json, e.g.\n"
              '  {"roles": {"ux-designer": {"engine": "codex", "model": "gpt-6.1-sol", "effort": "high"}}}')
    return 1


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
    lanes = active_lanes(cfg, state)
    workers = active_workers(cfg, state)
    counts = worker_counts(cfg)
    gpt_roles = [f"{r} ({role_settings(cfg, r).get('model')})" for r in codex_roles(cfg)]
    n_gpt = sum(1 for w in workers if worker_engine(w) == "codex")
    print(f"  team: {counts['claude']} Claude + {n_gpt} GPT agent(s) at a time"
          + (f" — on GPT: {', '.join(gpt_roles)}" if "codex" in lanes else "") + "   (change: agents workers)")
    off = codex_off_reason(cfg, state)
    if off:
        print(f"  GPT agents are OFF: {off} ({', '.join(r.split(' ')[0] for r in gpt_roles)} run on Claude meanwhile)")
    waiting = unverified_workers(cfg, state)
    if waiting:
        print(f"  {', '.join(waiting)}: waiting for `agents codex-check` (safety test of their copy)")
    orch = state.doc("orchestrator")
    if orch and pid_alive(orch.get("pid")):
        print(f"  check running since {clock(orch.get('started'), tz, now)}, until {clock(orch.get('deadline'), tz, now)}"
              f"; idle agents look for work every {orch.get('poll_minutes', 3):.0f} min")
    for path in sorted(state.dir.glob("current_run*.json")):
        w = "claude" if path.stem == "current_run" else path.stem[len("current_run-"):]
        cur = load_json(path) or {}
        if cur and pid_alive(cur.get("pid")):
            item = f"PR #{cur['pr']}" if cur.get("pr") else (f"#{cur['issue']}" if cur.get("issue") else "")
            print(f"  working now ({w}): {cur.get('role')} {cur.get('action')} {item} — "
                  f"{int((now - cur.get('started', now)) / 60)} min")
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
    if "codex" in lanes:
        cl = effective_limits(cfg, read_window(cfg, now), "codex")
        clive = live_usage(cfg, now, "codex")
        if clive:
            print(f"  ChatGPT plan: session {clive['five_hour']:.0f}% · weekly {clive['seven_day']:.0f}% "
                  f"(your limits {cl['session']:.0f}% / {cl['weekly']:.0f}%)   [{clive['source']}, {clive['age_min']:.0f} min ago]")
        else:
            print(f"  ChatGPT plan: no fresh reading (limits {cl['session']:.0f}% / {cl['weekly']:.0f}%); "
                  "the next Codex run takes one")
        ccd = state.doc("cooldown-codex")
        if ccd.get("until", 0) > now:
            print(f"  Codex cooldown until {clock(ccd['until'], tz, now)} ({ccd.get('reason')})")
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
        tag = f" [{r.get('model')}]" if r.get("lane") == "codex" else ""
        if r.get("worker") and worker_number(r["worker"]) > 1:
            tag += f" #{worker_number(r['worker'])}"
        print(f"    {clock(r['started'], tz, now):9s} {(r.get('role') or '') + tag:17s} {r.get('action'):9s} "
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
    if getattr(args, "engine", "claude") == "codex":
        codex = local.setdefault("engines", {}).setdefault("codex", {})
        changed = False
        for attr, key in keys[:2]:
            v = getattr(args, attr)
            if v is not None:
                if not 1 <= v <= 100:
                    raise SystemExit(f"--{attr} must be between 1 and 100")
                codex[key] = v
                changed = True
        if args.reset:
            for _a, key in keys[:2]:
                changed |= codex.pop(key, None) is not None
        if changed:
            save_json(path, local)
            print(f"Saved to {path}")
        lim = effective_limits(Config.load(), lane="codex")
        print(f"GPT agents (Codex lane) start a run only while it fits under your ChatGPT plan limits:")
        print(f"  session (5-hour) usage  {lim['session']:.0f}%\n  weekly usage            {lim['weekly']:.0f}%")
        print("Change:  agents limits --engine codex --session 90 --weekly 85")
        return 0
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


def cmd_workers(args: argparse.Namespace) -> int:
    """How many agents work at the same time, per plan."""
    path = xp(os.environ.get("AGENTOPS_LOCAL_CONFIG", LOCAL_CONFIG))
    local = load_json(path) or {}
    if not isinstance(local, dict):
        raise SystemExit(f"{path} is not a JSON object — fix or delete it")
    changed = False
    if args.reset:
        changed = local.pop("workers", None) is not None
    for key, value, low in (("claude", args.claude, 1), ("codex", args.gpt, 0)):
        if value is not None:
            if not low <= value <= MAX_WORKERS:
                raise SystemExit(f"--{'gpt' if key == 'codex' else key} must be between {low} and {MAX_WORKERS}")
            local.setdefault("workers", {})[key] = int(value)
            changed = True
    if changed:
        save_json(path, local)
        print(f"Saved to {path}")
    cfg = Config.load()
    state = State(cfg)
    counts = worker_counts(cfg)
    print("Agents working at the same time:")
    print(f"  Claude plan   {counts['claude']}   (copies: {', '.join(str(worker_clone(cfg, worker_name('claude', i))) for i in range(1, counts['claude'] + 1))})")
    gpt = ", ".join(str(worker_clone(cfg, worker_name("codex", i))) for i in range(1, counts["codex"] + 1))
    print(f"  ChatGPT plan  {counts['codex']}" + (f"   (copies: {gpt})" if gpt else ""))
    off = codex_off_reason(cfg, state)
    if off:
        print(f"GPT agents are off: {off}.")
    waiting = unverified_workers(cfg, state)
    if waiting:
        print(f"Run `agents codex-check` once: it safety-tests the new GPT cop{'ies' if len(waiting) > 1 else 'y'} "
              f"({', '.join(waiting)}).")
    print("More agents = faster, but each uses memory (~0.5–1.5 GB while building) and the same plan limits.")
    print("Change:  agents workers --claude 2 --gpt 2      Defaults:  agents workers --reset")
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
    disp = Dispatcher(cfg, gh, state, time.time(), apply=False, lanes=active_lanes(cfg, state),
                      busy=busy_work(state, "next"))
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
                               "with nvm (agentops/README.md, step 1) and Claude Code with its normal installer")
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

    def codex_ok() -> str:
        if not cfg.get("engines", "codex", "enabled", default=False):
            return "off (engines.codex.enabled = false)"
        if worker_counts(cfg)["codex"] == 0:
            return "off (agents workers --gpt 0)"
        state = State(cfg)
        if codex_ready(cfg, state):
            waiting = unverified_workers(cfg, state)
            return f"ready — {codex_version(cfg)}, safety test passed" + (
                f"; {', '.join(waiting)} still need `agents codex-check`" if waiting else "")
        if not codex_version(cfg):
            raise RuntimeError("Codex CLI not found — npm install -g @openai/codex, then codex login")
        raise RuntimeError(f"GPT agents off: {codex_off_reason(cfg, state)}")
    check("GPT agents (Codex)", codex_ok)

    def codex_sched_ok() -> str:
        """Can the scheduler (a plain background shell, like tick.sh) start codex?"""
        if not cfg.get("engines", "codex", "enabled", default=False) or worker_counts(cfg)["codex"] == 0:
            return "not needed"
        recorded = State(cfg).doc("codex_check").get("bin") or ""
        env_cmd = 'export PATH="$HOME/.local/bin:$HOME/bin:$PATH"; export NVM_DIR="$HOME/.nvm"; ' \
                  '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1; command -v codex || true'
        out = subprocess.run(["env", "-i", f"HOME={Path.home()}", "PATH=/usr/local/bin:/usr/bin:/bin", "bash", "-c",
                              env_cmd], capture_output=True, text=True, timeout=60).stdout.strip()
        if out:
            return f"found at {out}"
        if recorded and os.access(recorded, os.X_OK):
            return f"not on the scheduler's PATH, but agentops uses {recorded} (recorded by codex-check)"
        raise RuntimeError("the scheduler cannot find `codex` — run `agents codex-check` once (it records where "
                           "Codex is installed)")
    check("codex for scheduled runs", codex_sched_ok)

    def memory_ok() -> str:
        total = 0
        with contextlib.suppress(OSError, ValueError, IndexError):
            for line in open("/proc/meminfo", encoding="utf-8"):
                if line.startswith("MemTotal:"):
                    total = int(line.split()[1]) // 1024
        n = len(active_workers(cfg, State(cfg)))
        if total and n >= 3 and total < 5800:
            raise RuntimeError(f"Ubuntu has {total / 1024:.1f} GB for {n} agents at once — give WSL 6 GB "
                               "(agentops/README.md: 'More agents at once'), or use fewer: agents workers --claude 1")
        return f"{total / 1024:.1f} GB for Ubuntu, {n} agent(s) at once" if total else "unknown"
    check("memory", memory_ok)
    return 1 if problems else 0


def cmd_selftest(args: argparse.Namespace) -> int:
    import unittest
    suite = unittest.defaultTestLoader.discover(str(HERE / "tests"))
    res = unittest.TextTestRunner(verbosity=1).run(suite)
    return 0 if res.wasSuccessful() else 1


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(prog="agentops", description=__doc__.split("\n")[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("tick", help="one check: keep the agents busy for up to an hour (the scheduler runs this)")
    t.add_argument("--dry-run", action="store_true", help="show what would happen; change nothing")
    t.add_argument("--force", action="store_true", help="skip the usage/idle gate (use with care)")
    t.add_argument("--worker", help=argparse.SUPPRESS)
    t.add_argument("--lane", help=argparse.SUPPRESS)  # kit v8 name of --worker
    t.add_argument("--deadline", type=float, help=argparse.SUPPRESS)
    t.set_defaults(fn=cmd_tick)
    s = sub.add_parser("workers", help="show or set how many agents work at the same time")
    s.add_argument("--claude", type=int, help="Claude agents at once (1-3)")
    s.add_argument("--gpt", type=int, help="GPT (Codex) agents at once (0-3; 0 moves their roles back to Claude)")
    s.add_argument("--reset", action="store_true", help="back to the kit defaults")
    s.set_defaults(fn=cmd_workers)
    s = sub.add_parser("start", help="let the agents work (until `stop`, or for --hours / --until)")
    s.add_argument("--hours", type=float, help="work for this many hours, e.g. 6")
    s.add_argument("--until", help="work until this local time, e.g. 07:30")
    s.add_argument("--now", action="store_true", help="skip the quiet-period check for this window")
    s.add_argument("--no-tick", action="store_true", help="don't run the first tick immediately")
    s.add_argument("--session-limit", type=float, help="for this start only: stop at this %% of session usage")
    s.add_argument("--weekly-limit", type=float, help="for this start only: stop at this %% of weekly usage")
    s.add_argument("--codex-session-limit", type=float, help="for this start only: ChatGPT session limit in %%")
    s.set_defaults(fn=cmd_start)
    s = sub.add_parser("limits", help="show or set how much of your Claude plan the agents may use")
    s.add_argument("--session", type=float, help="session (5-hour) usage limit in %%, e.g. 96")
    s.add_argument("--weekly", type=float, help="weekly usage limit in %%, e.g. 90")
    s.add_argument("--team-share", dest="team_share", type=float, help="max %% of the week the agents may use")
    s.add_argument("--runs-per-day", dest="runs_per_day", type=int, help="most agent runs per day, e.g. 80")
    s.add_argument("--engine", choices=["claude", "codex"], default="claude",
                   help="which plan the limits are for: claude (default) or codex (your ChatGPT plan)")
    s.add_argument("--reset", action="store_true", help="back to the kit defaults")
    s.set_defaults(fn=cmd_limits)
    s = sub.add_parser("stop", help="stop starting new runs")
    s.add_argument("--kill", action="store_true", help="also interrupt a run that is in progress")
    s.set_defaults(fn=cmd_stop)
    sub.add_parser("setup-statusline", help="connect Claude Code's status line (shows plan usage)").set_defaults(
        fn=cmd_setup_statusline)
    s = sub.add_parser("codex-check", help="safety test that switches on the GPT (Codex) agents")
    s.add_argument("--again", action="store_true", help="also re-test copies that already passed")
    s.set_defaults(fn=cmd_codex_check)
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
