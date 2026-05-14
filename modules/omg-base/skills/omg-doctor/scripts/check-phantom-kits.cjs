#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-phantom-kits.cjs — Doctor check #40: phantom kit entries in metadata.kits.
//
// A phantom entry is a `kits.<name>` object where `files` is undefined or an
// empty array — written by `omg init` when the process was interrupted before
// any files were extracted to disk (e.g. SIGINT, network failure).
//
// Phantoms cause:
//   - project-detector.cjs to misidentify the project framework (Issue #38)
//   - `omg update --yes` to spawn a `omg init` loop that always fails
//
// WARN level — does not block CI.
//
// Usage:
//   node check-phantom-kits.cjs [path/to/.agents]
//
// Exit 0 always. Prints one-line PASS or WARN status.

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const codexDir = process.argv[2] || path.join(process.cwd(), '.agents');
const metadataPath = path.join(codexDir, 'metadata.json');

// Install-lock path — see .agents/hooks/libomg-update-spawn.cjs::lockDir()
// We inline the path here (instead of require()-ing the helper) so this script
// stays self-contained and runnable from the flattened consumer layout where
// the hooks tree may not be on disk relative to the skill.
const os = require('node:os');
const INSTALL_LOCK_DIR = path.join(os.homedir(), '.omg', 'locks', 'kit-install.lock.lock');
const STALE_LOCK_MS = 10 * 60 * 1000; // 10 minutes — matches isInstallLockHeld default

function isInstallLockHeld() {
  let stat;
  try {
    stat = fs.statSync(INSTALL_LOCK_DIR);
  } catch {
    return false;
  }
  if (!stat.isDirectory()) return false;
  const ageMs = Date.now() - stat.mtimeMs;
  return ageMs >= 0 && ageMs < STALE_LOCK_MS;
}

function main() {
  // Risk #4: skip during install to avoid flagging transient empty states.
  if (isInstallLockHeld()) {
    console.log('[omg-doctor] check #40 SKIP — kit-install lock is held (install in progress)');
    process.exit(0);
  }

  // No metadata → not a OMG project, silently pass
  if (!fs.existsSync(metadataPath)) {
    console.log('[omg-doctor] check #40 SKIP — no metadata.json found');
    process.exit(0);
  }

  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch (err) {
    console.log(`[omg-doctor] check #40 SKIP — could not parse metadata.json: ${err.message}`);
    process.exit(0);
  }

  const kits = metadata.kits;
  if (!kits || typeof kits !== 'object' || Object.keys(kits).length === 0) {
    console.log('[omg-doctor] check #40 PASS — no kits key in metadata (flat schema or clean)');
    process.exit(0);
  }

  const phantoms = [];
  for (const [kitName, kitData] of Object.entries(kits)) {
    if (!kitData || typeof kitData !== 'object') continue;
    const files = kitData.files;
    const isPhantom = files === undefined || (Array.isArray(files) && files.length === 0);
    if (isPhantom) {
      phantoms.push({
        name: kitName,
        version: kitData.version || 'unknown',
        installedAt: kitData.installedAt || 'unknown',
        filesValue: files === undefined ? 'undefined' : '[]',
      });
    }
  }

  if (phantoms.length === 0) {
    const total = Object.keys(kits).length;
    console.log(`[omg-doctor] check #40 PASS — all ${total} kit(s) have tracked files`);
    process.exit(0);
  }

  // WARN: phantom entries found
  console.log(`[omg-doctor] check #40 WARN — ${phantoms.length} phantom kit entry(ies) found in metadata.kits:`);
  for (const p of phantoms) {
    console.log(
      `  - kits.${p.name}: version=${p.version}, installedAt=${p.installedAt}, files=${p.filesValue}`,
    );
    console.log(`    Cause: \`omg init --kit ${p.name}\` was interrupted before file extraction completed.`);
    console.log(`    Fix:   Remove phantom with jq then re-install:`);
    console.log(`           jq 'del(.kits.${p.name})' .agents/metadata.json > /tmp/meta.json && mv /tmp/meta.json .agents/metadata.json`);
    console.log(`           omg init --kit ${p.name} --yes`);
    console.log(`    Or:    Wait for \`omg update --cli-only\` (>=3.x) which auto-prunes phantoms.`);
  }
  console.log('');
  console.log('[omg-doctor] check #40 WARN level — no action required, but phantom entries cause misdetection.');

  // Exit 0 — WARN level does not block CI
  process.exit(0);
}

main();
