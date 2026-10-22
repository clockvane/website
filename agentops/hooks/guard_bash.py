#!/usr/bin/env python3
"""PreToolUse hook for Bash during agent runs. Only active when AGENTOPS_RUN=1.

1. BLOCK (exit 2, reason shown to the agent): commands that bypass the SDLC (merging, pushing
   to main, force-pushing, faking review statuses), touch cloud accounts or secrets, write to
   governance files or outside the repository, or write anything during a review.
2. APPROVE (permissionDecision "allow"): commands built only from programs the team may use.
   Claude Code refuses some harmless compound commands in dontAsk mode (for example
   `cd repo; cat a | head; gh issue list`), which stalled whole runs. The deny rules in
   claude-run-settings.json are still applied by Claude Code after this approval.
3. Anything else falls through to the normal permission rules (in dontAsk mode: refused).
"""
import json
import os
import re
import shlex
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from protect_paths import GOVERNANCE, REVIEW_WRITABLE  # noqa: E402

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

# Programs an agent may run. Mirrors the allow list in claude-run-settings.json (a few
# harmless text tools added); per-program limits are applied in _check_words().
ALLOWED = {
    "git", "gh", "npm", "npx", "pnpm", "yarn", "node", "corepack",
    "cd", "ls", "pwd", "cat", "head", "tail", "wc", "basename", "dirname", "realpath", "stat", "file",
    "ps", "pgrep", "lsof", "true", "false", "exit", "grep", "egrep", "fgrep", "rg", "find", "tree", "diff",
    "sort", "uniq", "cut", "tr", "jq", "sed", "awk", "echo", "printf", "test", "[", "which", "date", "du",
    "mkdir", "rmdir", "cp", "mv", "touch", "rm", "chmod", "tee", "comm", "nl", "column", "paste",
    "curl", "kill", "sleep", "actionlint", "shellcheck", "hadolint", "docker", "terraform",
    "agentops/bin/post-review", "./agentops/bin/post-review",
}
WRAPPERS = {"timeout", "time", "nice", "nohup", "builtin", "stdbuf", "env", "command"}
WRITERS = {"rm", "rmdir", "mv", "cp", "touch", "mkdir", "chmod", "tee"}
SEPARATORS = {";", "&&", "||", "|", "&", "|&", ";;"}
OUT_REDIRECTS = {">", ">>", ">|", "&>", "&>>"}
IN_REDIRECTS = {"<", "<<", "<<<"}
FIND_ACTIONS = {"-exec", "-execdir", "-ok", "-okdir", "-delete", "-fprint", "-fprint0", "-fprintf",
                "-fls", "-files0-from"}
CURL_SENDS = ("-d", "--data", "-F", "--form", "-T", "--upload-file", "-X", "--request", "-o", "-O",
              "--output", "--remote-name", "-K", "--config")
DATA_HEREDOC = {"cat", "tee", "gh", "git", "agentops/bin/post-review", "./agentops/bin/post-review"}
HEREDOC_RX = re.compile(r"(?<!<)<<(-?)\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\2")
SUBST_HEREDOC_RX = re.compile(r"\$\(\s*cat\s+<<-?\s*(['\"]?)[A-Za-z_][A-Za-z0-9_]*\1\s*\)")


class Blocked(Exception):
    pass


class Complex(Exception):
    """Too complex to approve here; leave the decision to Claude Code's own rules."""


def _heredoc_program(prefix: str) -> str:
    seg = re.split(r"[;&|(]", prefix)[-1].strip().split()
    while seg and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", seg[0]):
        seg = seg[1:]
    return seg[0] if seg else ""


def strip_heredocs(command: str) -> str:
    """Drop the bodies of heredocs that only feed text to cat/tee/gh/git (PR bodies, commit
    messages). Bodies fed to anything else (node, bash …) are kept, so they stay visible."""
    lines = command.split("\n")
    out, i = [], 0
    while i < len(lines):
        line = lines[i]
        out.append(line)
        i += 1
        for m in HEREDOC_RX.finditer(line):
            dash, word = m.group(1), m.group(3)
            keep = _heredoc_program(line[:m.start()]) not in DATA_HEREDOC
            while i < len(lines):
                body = lines[i]
                i += 1
                if (body.lstrip("\t") if dash else body) == word:
                    if keep:
                        out.append(body)
                    break
                if keep:
                    out.append(body)
    return "\n".join(out)


def check(command: str):
    """Return a block message if a hard rule matches, else None."""
    code = strip_heredocs(command)
    for rx, msg in COMPILED:
        if rx.search(code):
            return msg
    return None


def _flatten(code: str) -> str:
    """Unquoted newlines become ';', comments and line continuations are dropped."""
    out, i, quote = [], 0, None
    while i < len(code):
        c = code[i]
        if quote == "'":
            out.append(c)
            quote = None if c == "'" else quote
        elif quote == '"':
            out.append(c)
            if c == "\\" and i + 1 < len(code):
                out.append(code[i + 1])
                i += 1
            elif c == '"':
                quote = None
        elif c == "\\" and i + 1 < len(code) and code[i + 1] == "\n":
            i += 1
        elif c == "\\" and i + 1 < len(code):
            out.append(code[i:i + 2])
            i += 1
        elif c in "'\"":
            quote = c
            out.append(c)
        elif c == "\n":
            out.append(" ; ")
        elif c == "#" and (not out or out[-1][-1:] in (" ", "\t", ";", "|", "&")):
            while i + 1 < len(code) and code[i + 1] != "\n":
                i += 1
        else:
            out.append(c)
        i += 1
    if quote:
        raise Complex("unbalanced quotes")
    return "".join(out)


def split_commands(command: str):
    code = SUBST_HEREDOC_RX.sub("HEREDOC_TEXT", strip_heredocs(command))
    if "`" in code or re.search(r"\$\(|<\(|>\(", code):
        raise Complex("command substitution")
    lex = shlex.shlex(_flatten(code), posix=True, punctuation_chars=True)
    lex.whitespace_split = True
    lex.commenters = ""
    try:
        tokens = list(lex)
    except ValueError as exc:
        raise Complex(str(exc))
    cmds, cur = [], []
    for tok in tokens:
        if tok in SEPARATORS:
            if cur:
                cmds.append(cur)
            cur = []
        else:
            cur.append(tok)
    if cur:
        cmds.append(cur)
    return cmds


class Ctx:
    def __init__(self, root: str, cwd: str, action: str):
        self.root = os.path.realpath(root)
        self.cwd = os.path.realpath(cwd or root)
        self.action = action

    def resolve(self, path: str) -> str:
        path = os.path.expanduser(os.path.expandvars(path))
        if not os.path.isabs(path):
            path = os.path.join(self.cwd, path)
        return os.path.normpath(path)

    def inside(self, full: str) -> bool:
        return full == self.root or full.startswith(self.root + os.sep)

    def check_write(self, path: str, destructive: bool = False) -> None:
        if path in ("/dev/null", "/dev/stdout", "/dev/stderr", "-"):
            return
        full = self.resolve(path)
        if not self.inside(full):
            if full == "/tmp" or full.startswith("/tmp/"):
                return
            raise Blocked(f"Writing outside the repository is not allowed: {full}")
        rel = os.path.relpath(full, self.root).replace(os.sep, "/")
        for g in GOVERNANCE:
            # deleting or moving a folder that contains governance files counts too
            parent = destructive and (rel == "." or g.startswith(rel + "/"))
            if rel == g.rstrip("/") or (g.endswith("/") and rel.startswith(g)) or parent:
                what = f"{rel} contains governance files ({g})" if parent else f"{rel} is governance"
                raise Blocked(f"{what} and is human-only. Open an issue labeled "
                              "`governance` + `needs-human` to propose a change.")
        if self.action == "review" and not rel.startswith(REVIEW_WRITABLE):
            raise Blocked("Reviews are read-only. Record your verdict with agentops/bin/post-review.")


def _strip_prefix(words):
    """Remove leading VAR=value assignments and wrappers like `timeout 60`."""
    while words:
        w = words[0]
        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", w):
            words = words[1:]
        elif w in WRAPPERS:
            if w == "command" and len(words) > 1 and words[1] in ("-v", "-V"):
                return ["true"]
            words = words[1:]
            while words and (words[0].startswith("-") or (w == "timeout" and re.match(r"^\d", words[0]))):
                opt = words.pop(0)
                if w == "nice" and opt == "-n" and words:
                    words.pop(0)
            while w == "env" and words and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", words[0]):
                words = words[1:]
        else:
            break
    return words


def _paths(args):
    out, opts_done = [], False
    for a in args:
        if a == "--" and not opts_done:
            opts_done = True
        elif a.startswith("-") and not opts_done:
            continue
        else:
            out.append(a)
    return out


def _check_words(words, ctx: Ctx) -> None:
    words = _strip_prefix(words)
    if not words:
        return
    prog, args = words[0], words[1:]
    if prog == "xargs":
        rest = list(args)
        while rest and rest[0].startswith("-"):
            opt = rest.pop(0)
            if opt in ("-I", "-L", "-n", "-P", "-d", "-E", "-s", "-a") and rest:
                rest.pop(0)
        return _check_words(rest, ctx) if rest else None
    if prog not in ALLOWED:
        raise Complex(f"program {prog!r} is not on the team's list")
    if prog == "cd":
        target = ctx.resolve(args[0]) if args else ctx.root
        if not ctx.inside(target):
            raise Complex("cd outside the repository")
        ctx.cwd = target
    elif prog == "find" and FIND_ACTIONS & set(args):
        raise Complex("find with an action")
    elif prog == "chmod" and (not args or args[0] not in ("+x", "u+x", "a+x")):
        raise Complex("chmod other than +x")
    elif prog == "curl":
        if any(a == s or (a.startswith(s) and not s.startswith("--")) or a.startswith(s + "=")
               for a in args for s in CURL_SENDS):
            raise Blocked("curl may only read (no uploads, form data, custom methods or output files).")
        if not args or not (args[0].startswith("-s") or args[0] in ("-I", "--head")):
            raise Complex("curl without -s/-I")
    elif prog == "docker":
        sub = args[:2]
        if not sub or not (sub[0] in ("build", "run", "images", "ps", "stop", "rm", "rmi") or sub == ["image", "prune"]):
            raise Complex("docker subcommand")
    elif prog == "terraform":
        if not args or not (args[0] in ("fmt", "validate") or (args[0] == "init" and "-backend=false" in args)):
            raise Complex("terraform subcommand")
    elif prog == "git":
        sub = [a for a in args if not a.startswith("-")][:1]
        if "-C" in args:
            raise Complex("git -C")
        if ctx.action == "review" and sub and sub[0] in ("push", "commit", "merge", "rebase", "cherry-pick"):
            raise Blocked("Reviews are read-only: no commits or pushes. Record your verdict with "
                          "agentops/bin/post-review.")
    elif prog == "sed" and any(a == "-i" or a.startswith("-i") or a.startswith("--in-place") for a in args):
        for p in _paths(args)[1:]:
            ctx.check_write(p)
    if prog in WRITERS:
        targets = _paths(args)
        if prog == "cp":
            targets = targets[-1:]
        if prog == "chmod":
            targets = targets[1:] if targets and targets[0] in ("+x", "u+x", "a+x") else targets
        for p in targets:
            ctx.check_write(p, destructive=prog in ("rm", "rmdir", "mv"))


def analyze(command: str, root: str, cwd: str = "", action: str = ""):
    """('block', msg) | ('allow', why) | ('pass', why)."""
    msg = check(command)
    if msg:
        return "block", msg
    ctx = Ctx(root, cwd or root, action)
    try:
        for cmd in split_commands(command):
            words, i = [], 0
            while i < len(cmd):
                tok = cmd[i]
                nxt = cmd[i + 1] if i + 1 < len(cmd) else None
                if re.fullmatch(r"\d+", tok) and nxt in OUT_REDIRECTS | IN_REDIRECTS | {">&", "<&"}:
                    i += 1
                    continue
                if tok in OUT_REDIRECTS:
                    if nxt is None:
                        raise Complex("redirect without target")
                    ctx.check_write(nxt)
                    i += 2
                    continue
                if tok in IN_REDIRECTS or tok in (">&", "<&"):
                    i += 2
                    continue
                if tok in ("(", ")") or (tok and set(tok) <= set("();<>|&")):
                    raise Complex(f"shell syntax {tok!r}")
                words.append(tok)
                i += 1
            if words and words[0] in ("if", "then", "else", "elif", "fi", "for", "while", "until", "do",
                                      "done", "case", "esac", "function", "{", "}", "[["):
                raise Complex("shell control flow")
            _check_words(words, ctx)
    except Blocked as exc:
        return "block", str(exc)
    except Complex as exc:
        return "pass", str(exc)
    return "allow", "agentops: every part of this command is on the team's list"


def main() -> int:
    if os.environ.get("AGENTOPS_RUN") != "1":
        return 0
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    command = (data.get("tool_input") or {}).get("command") or ""
    root = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()
    verdict, why = analyze(command, root, data.get("cwd") or root, os.environ.get("AGENTOPS_ACTION", ""))
    if verdict == "block":
        print(f"Blocked by agentops guard: {why}", file=sys.stderr)
        return 2
    if verdict == "allow":
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse",
                                                 "permissionDecision": "allow",
                                                 "permissionDecisionReason": why}}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
