#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
'use strict';
/**
 * Doctor check #41 — module-detect-coverage
 *
 * Scans `.agents/modules/<name>/module.json` and warns when a non-base module
 * lacks an active `detect:` block (or has `_disabled: true`, which counts
 * as "needs activation"). Kit-base modules (`required: true`) and the
 * frozen `CORE_REQUIRED` set are skipped.
 *
 * Ratchet date comes from `.agentsomg-modules.json.ratchetDates.module-detect-coverage`
 * (ISO date). Once today >= ratchet, the check ERRORS instead of warning.
 * Env bypass: `OMG_BYPASS_DETECT_RATCHET=1` forces WARN level regardless.
 */

const fs = require('fs');
const path = require('path');

const CORE_REQUIRED = new Set(['omg-base', 'omg-extended', 'omg-maintainer']);

function loadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function resolveProjectRoot(argvDir) {
  if (argvDir) return path.resolve(argvDir);
  return process.cwd();
}

function collectModules(root) {
  const modulesDir = path.join(root, '.agents', 'modules');
  if (!fs.existsSync(modulesDir)) return [];
  const out = [];
  for (const name of fs.readdirSync(modulesDir)) {
    const mj = path.join(modulesDir, name, 'module.json');
    if (!fs.existsSync(mj)) continue;
    const parsed = loadJson(mj);
    if (!parsed) continue;
    out.push({ name, detect: parsed.detect, required: parsed.required === true });
  }
  return out;
}

function classifyCoverage(modules) {
  const missing = [];
  const covered = [];
  const optedOut = [];
  for (const m of modules) {
    if (CORE_REQUIRED.has(m.name)) {
      optedOut.push(m.name);
      continue;
    }
    if (!m.detect) {
      if (m.required) {
        optedOut.push(m.name);
        continue;
      }
      missing.push(m.name);
      continue;
    }
    if (m.detect._optOut === true) {
      optedOut.push(m.name);
      continue;
    }
    if (m.detect._disabled === true) {
      missing.push(`${m.name} (stub)`);
      continue;
    }
    covered.push(m.name);
  }
  return { missing, covered, optedOut };
}

function resolveLevel(root) {
  if (process.env.OMG_BYPASS_DETECT_RATCHET === '1') return 'WARN';
  const registry = loadJson(path.join(root, '.agents', 'omg-modules.json'));
  const ratchetIso = registry && registry.ratchetDates
    ? registry.ratchetDates['module-detect-coverage']
    : null;
  if (!ratchetIso) return 'WARN';
  const ratchet = Date.parse(ratchetIso);
  if (Number.isNaN(ratchet)) return 'WARN';
  return Date.now() >= ratchet ? 'ERROR' : 'WARN';
}

function emit(level, message) {
  process.stdout.write(`${level} [check #41] module-detect-coverage: ${message}\n`);
}

function run() {
  const root = resolveProjectRoot(process.argv[2]);
  const modules = collectModules(root);
  if (modules.length === 0) {
    emit('SKIP', 'no .agents/modules/ on disk');
    process.exit(0);
  }
  const { missing, covered, optedOut } = classifyCoverage(modules);
  if (missing.length === 0) {
    emit('PASS', `${covered.length} modules covered, ${optedOut.length} opted out`);
    process.exit(0);
  }
  const level = resolveLevel(root);
  emit(
    level,
    `${missing.length} module(s) missing active detect: block — ${missing.join(', ')}`,
  );
  process.stdout.write('       fix: invoke `omg-modules create <module-name>` per missing module (AI-assisted detect-block authoring)\n');
  process.stdout.write('       bypass: set OMG_BYPASS_DETECT_RATCHET=1 to force WARN\n');
  process.exit(level === 'ERROR' ? 1 : 0);
}

try {
  run();
} catch (err) {
  emit('SKIP', `unexpected error: ${err.message}`);
  process.exit(0);
}
