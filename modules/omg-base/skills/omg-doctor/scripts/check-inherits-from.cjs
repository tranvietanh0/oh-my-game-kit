#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-inherits-from.cjs — Doctor check #37: inheritsFrom field integrity.
//
// When metadata.json contains an `inheritsFrom` field, this check validates
// that the declared parent path is well-formed: exists, is a directory, ends
// in `.agents`, contains a valid OMG metadata.json, is not a self-reference,
// and does not form a cycle.
//
// Validation rules (all ERROR severity — field is opt-in; if set, enforce strictly):
//   (a) path exists            → else ERROR: parent path missing
//   (b) path is a directory    → else ERROR: not a directory
//   (c) ends in `.agents`      → else ERROR: must end in .agents
//   (d) has metadata.json      → else ERROR: not a OMG install
//   (e) parent is OMG-shape    → else ERROR: not a valid OMG metadata
//   (f) no self-reference      → else ERROR: inheritsFrom points at self
//   (g) no cycle (≤5 hops)     → else ERROR: cycle detected
//
// Usage:
//   node check-inherits-from.cjs [path/to/project-codex-dir]
//
// Exits 0 on SKIP (no field) or PASS.
// Exits 1 on any ERROR.

'use strict';

const fs   = require('node:fs');
const os   = require('node:os');
const path = require('node:path');

// ── OMG metadata shape detection ─────────────────────────────────────────────
// Mirrors isOMGMetadata from telemetry-utils.cjs (independent CJS implementation
// to keep doctor scripts dependency-free from hooks/).

/**
 * @param {object|null|undefined} meta
 * @returns {boolean}
 */
function isOMGMetadata(meta) {
  if (!meta || typeof meta !== 'object') return false;
  if (meta.installedModules && typeof meta.installedModules === 'object') return true;
  if (meta.schemaVersion === 2 && (Array.isArray(meta.modules) || typeof meta.modules === 'object')) return true;
  if (typeof meta.name === 'string' && meta.name.startsWith('oh-my-game-kit-')) return true;
  if (typeof meta.kitName === 'string' && meta.kitName.startsWith('oh-my-game-kit-')) return true;
  return false;
}

/**
 * Read and parse metadata.json from a .agents/ dir.
 * Returns parsed object or null on absence/parse failure.
 * @param {string} codexDir
 * @returns {object|null}
 */
function readMetadata(codexDir) {
  const metaPath = path.join(codexDir, 'metadata.json');
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    return null;
  }
}

// ── Validation helpers ────────────────────────────────────────────────────────

/**
 * Emit an ERROR message to stderr and exit 1.
 * @param {string} message
 * @param {string} [hint]   optional remediation hint
 */
function fail(message, hint) {
  process.stderr.write(`[omg-doctor] inherits-from: ERROR — ${message}\n`);
  if (hint) process.stderr.write(`  fix: ${hint}\n`);
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  const projectCodexDir = process.argv[2] || path.join(process.cwd(), '.agents');

  const meta = readMetadata(projectCodexDir);

  // SKIP if no metadata or no inheritsFrom field
  if (!meta || !Object.prototype.hasOwnProperty.call(meta, 'inheritsFrom')) {
    console.log('[omg-doctor] inherits-from: SKIP — inheritsFrom not set');
    return;
  }

  const inheritsFrom = meta.inheritsFrom;

  // (a) Path must exist
  if (!fs.existsSync(inheritsFrom)) {
    fail(
      `parent path does not exist: ${inheritsFrom}`,
      'remove the inheritsFrom field from .agents/metadata.json OR re-create the parent .agents/',
    );
  }

  // (b) Must be a directory
  if (!fs.statSync(inheritsFrom).isDirectory()) {
    fail(
      `inheritsFrom must point at a directory, not a file: ${inheritsFrom}`,
      'set inheritsFrom to the .agents/ directory path, e.g. /path/to/project/.agents',
    );
  }

  // (c) Must end in `.agents`
  if (path.basename(inheritsFrom) !== '.agents') {
    fail(
      `inheritsFrom should end in \`.agents\`, not \`${path.basename(inheritsFrom)}\``,
      'set inheritsFrom to the .agents/ directory itself, e.g. /path/to/parent/.agents',
    );
  }

  // (d) Parent must have metadata.json
  if (!fs.existsSync(path.join(inheritsFrom, 'metadata.json'))) {
    fail(
      `parent is not a OMG install — no metadata.json in: ${inheritsFrom}`,
      'point inheritsFrom at a directory that contains a valid OMG metadata.json',
    );
  }

  // (e) Parent metadata must be OMG-shape
  const parentMeta = readMetadata(inheritsFrom);
  if (!isOMGMetadata(parentMeta)) {
    fail(
      `parent metadata.json is not OMG-shape (CK stub or unknown format): ${inheritsFrom}`,
      'point inheritsFrom at a directory with a valid OMG metadata.json (schemaVersion 3, installedModules, etc.)',
    );
  }

  // (f) No self-reference
  try {
    const resolvedChild  = fs.realpathSync(projectCodexDir);
    const resolvedParent = fs.realpathSync(inheritsFrom);
    if (resolvedChild === resolvedParent) {
      fail(
        `inheritsFrom points at self: ${inheritsFrom}`,
        'remove the inheritsFrom field — a .agents/ directory cannot inherit from itself',
      );
    }
  } catch {
    // realpathSync failed (race/perms) — skip self-reference check, proceed
  }

  // (g) Cycle guard — follow inheritsFrom chain up to MAX_HOPS
  const MAX_HOPS = 5;
  const visited  = new Set();
  let current    = inheritsFrom;

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    let resolved;
    try {
      resolved = fs.realpathSync(current);
    } catch {
      break; // path gone mid-walk — fine, stop here
    }

    if (visited.has(resolved)) {
      fail(
        `inheritance cycle detected at: ${current}`,
        'remove the inheritsFrom field from one of the entries in the cycle',
      );
    }
    visited.add(resolved);

    const hopMeta = readMetadata(current);
    if (!hopMeta || typeof hopMeta.inheritsFrom !== 'string') break;
    current = hopMeta.inheritsFrom;
  }

  console.log('[omg-doctor] inherits-from: PASS');
}

try {
  run();
} catch (err) {
  process.stderr.write(`[omg-doctor] inherits-from: ERROR — unexpected exception: ${err.message}\n`);
  process.exit(1);
}
