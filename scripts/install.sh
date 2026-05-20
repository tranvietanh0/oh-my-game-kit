#!/usr/bin/env sh
set -eu

REPO="${OMG_REPO:-tranvietanh0/oh-my-game-kit}"
REF="${OMG_REF:-release}"
TARGET="${TARGET:-global}"
PRESET="${OMG_PRESET:-${PRESET:-}}"
ENGINE="${OMG_ENGINE:-${ENGINE:-}}"
FRESH="${OMG_FRESH:-1}"
FORCE="${OMG_FORCE:-0}"
NO_AGENTS="${OMG_NO_AGENTS:-0}"

preset_for_engine() {
  case "$1" in
    unity) echo "unity-production" ;;
    cocos) echo "cocos-playable" ;;
    all) echo "full" ;;
    *)
      echo "Unknown OMG_ENGINE '$1'. Use unity, cocos, or all." >&2
      exit 1
      ;;
  esac
}

if [ -z "$PRESET" ]; then
  if [ -z "$ENGINE" ]; then
    if [ ! -r /dev/tty ]; then
      echo "Set OMG_ENGINE=unity, OMG_ENGINE=cocos, or OMG_ENGINE=all for non-interactive installs." >&2
      exit 1
    fi
    {
      echo "Choose Oh My Game Kit engine:"
      echo "  1) Unity"
      echo "  2) Cocos"
      echo "  3) Both"
      printf "Engine [1-3]: "
    } >/dev/tty
    IFS= read -r CHOICE </dev/tty
    case "$CHOICE" in
      1) ENGINE="unity" ;;
      2) ENGINE="cocos" ;;
      3) ENGINE="all" ;;
      *)
        echo "Invalid engine choice '$CHOICE'. Use 1, 2, or 3." >&2
        exit 1
        ;;
    esac
  fi
  PRESET="$(preset_for_engine "$ENGINE")"
fi

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
