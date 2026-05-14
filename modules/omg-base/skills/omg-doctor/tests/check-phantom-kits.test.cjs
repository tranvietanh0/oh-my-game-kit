#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * check-phantom-kits.test.cjs — Snapshot tests for doctor check #40.
 *
 * Fixtures:
 *   - phantom-fixture.json   — two phantoms (unity has files:[], web has files:undefined) + one real kit (core)
 *
 * Asserts:
 *   1. Phantom fixture → WARN line printed, both phantom names listed, remediation snippet included.
 *   2. Clean fixture   → PASS line printed.
 *   3. Missing metadata → SKIP line printed.
 *
 * Exit 0 when all assertions hold; exit 1 otherwise.
 *
 * Run: node .agents/skillsomg-doctor/tests/check-phantom-kits.test.cjs
 */

'use strict';

const fs            = require('node:fs');
const os            = require('node:os');
const path          = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT  = path.resolve(__dirname, '..', 'scripts', 'check-phantom-kits.cjs');
const FIXTURE = path.resolve(__dirname, 'phantom-fixture.json');

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, label) {
  if (cond) {
    passed++;
    process.stdout.write(`  PASS  ${label}\n`);
  } else {
    failed++;
    failures.push(label);
    process.stdout.write(`  FAIL  ${label}\n`);
  }
}

function runCheck(codexDir) {
  return spawnSync(process.execPath, [SCRIPT, codexDir], {
    encoding: 'utf8',
  });
}

function mkTempCodexDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-doctor-phantom-'));
  return dir;
}

// ── Test 1: phantom fixture → WARN ───────────────────────────────────────────
{
  const codexDir = mkTempCodexDir();
  fs.copyFileSync(FIXTURE, path.join(codexDir, 'metadata.json'));

  const result = runCheck(codexDir);
  const output = (result.stdout || '') + (result.stderr || '');

  assert(result.status === 0, 'phantom fixture: exit code 0 (WARN does not block)');
  assert(/check #40 WARN/.test(output), 'phantom fixture: WARN line emitted');
  assert(/2 phantom kit entry/.test(output), 'phantom fixture: reports count=2');
  assert(/kits\.unity/.test(output), 'phantom fixture: unity listed');
  assert(/kits\.web/.test(output), 'phantom fixture: web listed');
  assert(!/kits\.core/.test(output), 'phantom fixture: core (real kit) NOT listed');
  assert(/jq 'del\(\.kits\.unity\)'/.test(output), 'phantom fixture: jq remediation snippet present');
  assert(/omg init --kit unity --yes/.test(output), 'phantom fixture: omg init remediation snippet present');

  fs.rmSync(codexDir, { recursive: true, force: true });
}

// ── Test 2: clean fixture (all kits have populated files) → PASS ─────────────
{
  const codexDir = mkTempCodexDir();
  const cleanMeta = {
    schemaVersion: 3,
    name: 'clean-fixture',
    kits: {
      core: { version: '1.0.0', installedAt: '2026-04-18T00:00:00Z', files: ['.agents/rules/security.md'] },
    },
  };
  fs.writeFileSync(path.join(codexDir, 'metadata.json'), JSON.stringify(cleanMeta, null, 2));

  const result = runCheck(codexDir);
  const output = (result.stdout || '') + (result.stderr || '');

  assert(result.status === 0, 'clean fixture: exit code 0');
  assert(/check #40 PASS/.test(output), 'clean fixture: PASS line emitted');
  assert(!/WARN/.test(output), 'clean fixture: no WARN line');

  fs.rmSync(codexDir, { recursive: true, force: true });
}

// ── Test 3: missing metadata.json → SKIP ─────────────────────────────────────
{
  const codexDir = mkTempCodexDir();
  // do NOT write metadata.json

  const result = runCheck(codexDir);
  const output = (result.stdout || '') + (result.stderr || '');

  assert(result.status === 0, 'missing metadata: exit code 0');
  assert(/check #40 SKIP/.test(output), 'missing metadata: SKIP line emitted');

  fs.rmSync(codexDir, { recursive: true, force: true });
}

// ── Summary ──────────────────────────────────────────────────────────────────
process.stdout.write(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.stdout.write(`\nFailures:\n${failures.map((f) => `  - ${f}`).join('\n')}\n`);
  process.exit(1);
}
process.exit(0);
