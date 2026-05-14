#!/usr/bin/env sh
set -eu

REPO="${OMG_REPO:-tranvietanh0/oh-my-game-kit}"
REF="${OMG_REF:-release}"
TARGET="${TARGET:-global}"
PRESET="${OMG_PRESET:-${PRESET:-full}}"
FRESH="${OMG_FRESH:-1}"
FORCE="${OMG_FORCE:-0}"
NO_AGENTS="${OMG_NO_AGENTS:-0}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ is required. Install Node.js, then run this installer again." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Install Node.js with npm, then run this installer again." >&2
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node.js 20+ is required. Current version: $(node -p "process.versions.node")" >&2
  exit 1
fi

ARGS="install --target $TARGET --preset $PRESET"
if [ "$FRESH" = "1" ]; then
  ARGS="$ARGS --fresh"
fi
if [ "$FORCE" = "1" ]; then
  ARGS="$ARGS --force"
fi
if [ "$NO_AGENTS" = "1" ]; then
  ARGS="$ARGS --no-agents"
fi

echo "Installing oh-my-game-kit from github:$REPO#$REF"
npx --yes "github:$REPO#$REF" $ARGS
