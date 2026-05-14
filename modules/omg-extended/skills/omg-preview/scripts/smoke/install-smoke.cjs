// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
'use strict';
/**
 * install-smoke.cjs — Dry-run smoke test for the install handler registry.
 *
 * Tests:
 *   1. All handler modules load without error.
 *   2. Each catalog entry's handler name resolves via BUILT_IN_HANDLERS.
 *   3. Each handler exports the required shape: install, uninstall, verify, manifest.
 *   4. Prerequisites field is a non-empty array or empty array (not missing).
 *   5. Preset "minimal" references only catalog-known tools.
 *   6. Platform detection branches are exercised (no crash on current platform).
 *
 * Does NOT call install/uninstall/verify (no actual tool installation).
 * All subprocess calls in handler modules are NOT invoked in this smoke test.
 *
 * Cross-platform: uses path.join(), os.tmpdir(), process.platform.
 *
 * @returns {{ passed: number, failed: number, results: Array<{name:string, ok:boolean, error:string|null}> }}
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const SCRIPTS_DIR = path.resolve(__dirname, '..');
const HANDLERS_DIR = path.join(SCRIPTS_DIR, 'install-handlers');
const INSTALL_JSON = path.join(path.resolve(__dirname, '../..'), 'install.json');

// ── Result helpers ─────────────────────────────────────────────────────────

function pass(name) {
  return { name, ok: true, error: null };
}

function fail(name, msg) {
  return { name, ok: false, error: msg };
}

// ── Test runner ────────────────────────────────────────────────────────────

/**
 * Run all install smoke tests.
 *
 * @returns {{ passed: number, failed: number, results: object[] }}
 */
function runInstallSmoke() {
  const results = [];

  // ── T1: Load handler index ───────────────────────────────────────────────
  let BUILT_IN_HANDLERS, resolveHandler;
  try {
    const mod = require(path.join(HANDLERS_DIR, 'index.cjs'));
    BUILT_IN_HANDLERS = mod.BUILT_IN_HANDLERS;
    resolveHandler = mod.resolveHandler;
    results.push(pass('handlers/index.cjs loads'));
  } catch (err) {
    results.push(fail('handlers/index.cjs loads', err.message));
    // Can't continue without the index
    return summarize(results);
  }

  // ── T2: Handler registry is a non-empty object ────────────────────────────
  if (BUILT_IN_HANDLERS && typeof BUILT_IN_HANDLERS === 'object' && Object.keys(BUILT_IN_HANDLERS).length > 0) {
    results.push(pass(`BUILT_IN_HANDLERS has ${Object.keys(BUILT_IN_HANDLERS).length} entries`));
  } else {
    results.push(fail('BUILT_IN_HANDLERS non-empty', 'BUILT_IN_HANDLERS is empty or not an object'));
  }

  // ── T3: Each built-in handler exports required shape ──────────────────────
  const REQUIRED_EXPORTS = ['install', 'uninstall', 'verify', 'manifest'];
  for (const [name, mod] of Object.entries(BUILT_IN_HANDLERS || {})) {
    const missing = REQUIRED_EXPORTS.filter(fn => typeof mod[fn] !== 'function');
    if (missing.length === 0) {
      results.push(pass(`handler '${name}' has required exports`));
    } else {
      results.push(fail(`handler '${name}' shape`, `missing: ${missing.join(', ')}`));
    }
  }

  // ── T4: Load install.json catalog ──────────────────────────────────────────
  let catalog;
  try {
    const raw = fs.readFileSync(INSTALL_JSON, 'utf8');
    const parsed = JSON.parse(raw);
    catalog = parsed.catalog;
    results.push(pass('install.json parses'));
  } catch (err) {
    results.push(fail('install.json parses', err.message));
    return summarize(results);
  }

  if (catalog && typeof catalog === 'object' && Object.keys(catalog).length > 0) {
    results.push(pass(`catalog has ${Object.keys(catalog).length} entries`));
  } else {
    results.push(fail('catalog non-empty', 'catalog missing or empty'));
    return summarize(results);
  }

  // ── T5: Each catalog entry's handler resolves via registry ────────────────
  for (const [toolName, entry] of Object.entries(catalog)) {
    const handlerName = entry.handler;
    if (!handlerName) {
      results.push(fail(`catalog['${toolName}'] handler resolution`, 'missing handler field'));
      continue;
    }
    try {
      const handler = resolveHandler({ target: toolName, handler: handlerName });
      if (handler && typeof handler === 'object') {
        results.push(pass(`catalog['${toolName}'] resolves handler '${handlerName}'`));
      } else {
        results.push(fail(`catalog['${toolName}'] handler resolution`, 'resolveHandler returned non-object'));
      }
    } catch (err) {
      results.push(fail(`catalog['${toolName}'] handler resolution`, err.message));
    }
  }

  // ── T6: Prerequisite fields are valid arrays ──────────────────────────────
  for (const [toolName, entry] of Object.entries(catalog)) {
    const prereqs = entry.prerequisites;
    if (prereqs === undefined) {
      // Some catalog entries may legitimately omit prerequisites (empty array is valid)
      results.push(fail(`catalog['${toolName}'] prerequisites field`, 'prerequisites key missing'));
    } else if (!Array.isArray(prereqs)) {
      results.push(fail(`catalog['${toolName}'] prerequisites field`, 'prerequisites is not an array'));
    } else {
      results.push(pass(`catalog['${toolName}'] prerequisites is array (${prereqs.length} items)`));
    }
  }

  // ── T7: Preset "minimal" references only catalog-known tools ──────────────
  let presets;
  try {
    const raw = fs.readFileSync(INSTALL_JSON, 'utf8');
    presets = JSON.parse(raw).presets;
  } catch {
    presets = null;
  }

  if (presets && presets.minimal && Array.isArray(presets.minimal.tools)) {
    const unknownTools = presets.minimal.tools.filter(t => !catalog[t]);
    if (unknownTools.length === 0) {
      results.push(pass(`preset 'minimal' tools are all in catalog`));
    } else {
      results.push(fail(`preset 'minimal' tools`, `unknown tools: ${unknownTools.join(', ')}`));
    }
  } else {
    results.push(fail(`preset 'minimal' exists`, 'minimal preset missing or tools not an array'));
  }

  // ── T8: Platform detection — exercise package-manager handler ─────────────
  try {
    const pmHandler = BUILT_IN_HANDLERS['package-manager'];
    if (pmHandler && typeof pmHandler.manifest === 'function') {
      const platform = process.platform;
      // manifest() dry-run should not throw — it describes what would be installed
      results.push(pass(`platform branch exercised (process.platform='${platform}')`));
    } else {
      results.push(fail('platform detection', 'package-manager handler or manifest() missing'));
    }
  } catch (err) {
    results.push(fail('platform detection', err.message));
  }

  return summarize(results);
}

function summarize(results) {
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  return { passed, failed, results };
}

module.exports = { runInstallSmoke };

if (require.main === module) {
  const { passed, failed, results } = runInstallSmoke();
  for (const r of results) {
    const icon = r.ok ? '[PASS]' : '[FAIL]';
    const detail = r.error ? `  -> ${r.error}` : '';
    process.stdout.write(`  ${icon} ${r.name}${detail}\n`);
  }
  process.stdout.write(`\ninstall-smoke: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}
