#!/usr/bin/env sh
set -eu

TARGET="${TARGET:-global}"
PRESET="${PRESET:-unity-minimal}"

node src/cli.js install --target "$TARGET" --preset "$PRESET" --fresh
