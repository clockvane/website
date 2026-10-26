#!/usr/bin/env bash
# Entry point for the Windows scheduler. Background shells don't read the parts of ~/.bashrc
# that set up nvm and ~/.local/bin, so load them here, then run one agentops tick.
export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
export PYTHONDONTWRITEBYTECODE=1   # no __pycache__/ in the agents' copies of the repo
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
cd "$(dirname "$0")/../.." || exit 1
mkdir -p "$HOME/.claude/agentops"
exec python3 agentops/agentops.py tick >> "$HOME/.claude/agentops/tick.log" 2>&1
