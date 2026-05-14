#!/usr/bin/env bash
# omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
# omg-contract render helper.
# Usage: render.sh <file.md>
#
# Generates paired <file>.html, <file>.docx, <file>.pdf next to the source.
# Uses sibling contract-style.css if present; falls back to the bundled
# template at $SKILL_REF_DIR/contract-style.css.
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <file.md>" >&2
  exit 2
fi

src="$1"
if [[ ! -f "$src" ]]; then
  echo "render.sh: not a file: $src" >&2
  exit 1
fi

dir="$(cd "$(dirname "$src")" && pwd)"
base="$(basename "$src" .md)"

# CSS resolution: sibling first, then bundled
css="$dir/contract-style.css"
if [[ ! -f "$css" ]]; then
  bundled="$(dirname "$0")/../references/contract-style.css"
  if [[ -f "$bundled" ]]; then
    cp "$bundled" "$css"
    echo "render.sh: copied bundled CSS to $css"
  else
    echo "render.sh: no contract-style.css found and no bundled fallback" >&2
    exit 1
  fi
fi

# Title resolution: first H1 in the markdown
title="$(grep -m1 '^# ' "$src" | sed 's/^# //')"
if [[ -z "$title" ]]; then
  title="$base"
fi

# Tool checks
for tool in pandoc google-chrome-stable; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    if [[ "$tool" == google-chrome-stable ]] && command -v google-chrome >/dev/null 2>&1; then
      continue
    fi
    echo "render.sh: missing required tool: $tool" >&2
    exit 1
  fi
done

chrome_bin="$(command -v google-chrome-stable || command -v google-chrome)"

# 1. HTML — pagetitle (NOT title) avoids duplicate H1 header block
pandoc -s --css=contract-style.css \
  --metadata pagetitle="$title" \
  "$src" -o "$dir/$base.html"

# 2. DOCX — direct from markdown
pandoc "$src" -o "$dir/$base.docx"

# 3. PDF — Chrome headless on the rendered HTML
"$chrome_bin" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$dir/$base.pdf" \
  "file://$dir/$base.html" 2>&1 | grep -E "bytes written|error" || true

echo "render.sh: ✓ generated $base.{html,docx,pdf}"
