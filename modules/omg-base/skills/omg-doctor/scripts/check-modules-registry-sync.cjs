#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-modules-registry-sync.cjs — Doctor check: omg-modules.json `modules`
// field stays in sync with per-module `module.json` sources.
//
// Mirrors oh-my-game-kit-release-action's `validate-modules-registry-sync.cjs` so
// kit developers catch drift locally before pushing. The release-action gate
// is the authoritative source; this is a pre-flight convenience.
//
// Logic:
//   1. Read .agentsomg-modules.json (the rollup).
//   2. Read every .agents/modules/*/module.json (per-module SSOT).
//   3. Build the expected `modules` field by projecting each module.json into
//      the rollup shape: { description, required, dependencies, skills,
//      activationFragment }. `dependencies` is converted from object form
//      ({ name: range }) to an array of names preserving insertion order
//      (matches release-action generator's serialization).
//   4. Compare expected vs actual via canonical JSON. Report drift if differs.
//
// Behaviour:
//   - Non-modular kit (no .agents/modules/ dir): SKIP with friendly message.
//   - Missing .agentsomg-modules.json on a modular kit: WARN (drift).
//   - In-sync: PASS.
//   - Drift: WARN with the list of modules whose projected entry differs.
//
// Level: WARN (fail-open, never crashes the suite). The release-action gate
// is the Error-level enforcer.
//
// Usage:
//   node check-modules-registry-sync.cjs [kit-root]
//   (kit-root defaults to process.cwd())

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CHECK_NAME = 'modules-registry-sync';

function logLine(level, msg) {
  console.log(`[omg-doctor] ${CHECK_NAME}: ${level} — ${msg}`);
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function listModuleDirs(modulesDir) {
  return fs
    .readdirSync(modulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

// MUST mirror release-action/scripts/generate-modules-registry.cjs `buildRegistry`
// projection rule exactly — any drift here causes false-positive doctor failures.
function projectModule(moduleJson, name) {
  const deps = moduleJson.dependencies;
  let dependenciesArr;
  if (Array.isArray(deps)) {
    dependenciesArr = [...deps];
  } else if (deps && typeof deps === 'object') {
    dependenciesArr = Object.keys(deps);
  } else {
    dependenciesArr = [];
  }

  const projected = {
    description: moduleJson.description || '',
    required: Boolean(moduleJson.required),
    dependencies: dependenciesArr,
    skills: Array.isArray(moduleJson.skills) ? [...moduleJson.skills] : [],
  };
  if (Array.isArray(moduleJson.agents) && moduleJson.agents.length > 0) {
    projected.agents = [...moduleJson.agents];
  }
  projected.activationFragment = moduleJson.activationFragment || `omg-activation-${name}.json`;
  if (moduleJson.routingOverlay) {
    projected.routingOverlay = moduleJson.routingOverlay;
  }
  return projected;
}

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
}

function diffModules(expected, actual) {
  const drifted = [];
  const missingInActual = [];
  const extraInActual = [];

  const expectedNames = new Set(Object.keys(expected));
  const actualNames = new Set(Object.keys(actual));

  for (const name of expectedNames) {
    if (!actualNames.has(name)) {
      missingInActual.push(name);
      continue;
    }
    if (canonical(expected[name]) !== canonical(actual[name])) {
      drifted.push(name);
    }
  }
  for (const name of actualNames) {
    if (!expectedNames.has(name)) extraInActual.push(name);
  }

  return { drifted, missingInActual, extraInActual };
}

function run() {
  const kitRoot = process.argv[2] || process.cwd();
  const codexDir = path.join(kitRoot, '.agents');
  const modulesDir = path.join(codexDir, 'modules');
  const rollupPath = path.join(codexDir, 'omg-modules.json');

  if (!fs.existsSync(modulesDir)) {
    logLine('SKIP', 'no .agents/modules/ directory (non-modular kit)');
    return;
  }

  const moduleNames = listModuleDirs(modulesDir);
  if (moduleNames.length === 0) {
    logLine('SKIP', '.agents/modules/ is empty');
    return;
  }

  if (!fs.existsSync(rollupPath)) {
    logLine('WARN', '.agentsomg-modules.json missing on modular kit');
    return;
  }

  const expected = {};
  for (const name of moduleNames) {
    const modJsonPath = path.join(modulesDir, name, 'module.json');
    if (!fs.existsSync(modJsonPath)) continue;
    let modJson;
    try {
      modJson = readJson(modJsonPath);
    } catch (err) {
      logLine('WARN', `failed to parse modules/${name}/module.json: ${err.message}`);
      return;
    }
    expected[name] = projectModule(modJson, name);
  }

  let rollup;
  try {
    rollup = readJson(rollupPath);
  } catch (err) {
    logLine('WARN', `failed to parse omg-modules.json: ${err.message}`);
    return;
  }

  const actualModules = (rollup && rollup.modules) || {};
  const { drifted, missingInActual, extraInActual } = diffModules(expected, actualModules);

  if (drifted.length === 0 && missingInActual.length === 0 && extraInActual.length === 0) {
    logLine('PASS', `${moduleNames.length} module(s) in sync`);
    return;
  }

  const summaryParts = [];
  if (drifted.length > 0) summaryParts.push(`${drifted.length} drifted`);
  if (missingInActual.length > 0) summaryParts.push(`${missingInActual.length} missing`);
  if (extraInActual.length > 0) summaryParts.push(`${extraInActual.length} stale`);
  logLine('WARN', `omg-modules.json out of sync (${summaryParts.join(', ')})`);
  if (drifted.length > 0) {
    console.log(`  drifted: ${drifted.join(', ')}`);
  }
  if (missingInActual.length > 0) {
    console.log(`  missing in omg-modules.json: ${missingInActual.join(', ')}`);
  }
  if (extraInActual.length > 0) {
    console.log(`  extra in omg-modules.json (no module.json): ${extraInActual.join(', ')}`);
  }
  console.log(
    '  fix: run `node oh-my-game-kit-release-action/scripts/generate-modules-registry.cjs .` from the kit root, or push and let CI regenerate',
  );
}

try {
  run();
} catch (err) {
  // Fail-open: doctor checks must never crash the suite.
  logLine('WARN', `check errored: ${err.message}`);
}
