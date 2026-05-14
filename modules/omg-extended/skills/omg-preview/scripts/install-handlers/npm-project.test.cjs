// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * npm-project.test.cjs — Unit tests for npm-project install handler.
 * Run: node .agents/skillsomg-preview/scripts/install-handlers/npm-project.test.cjs
 */
'use strict';

const assert = require('assert');
const Module = require('module');
const path = require('path');
const os = require('os');

// ── Test harness ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];
const testPromises = [];

function run(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(() => { passed++; process.stdout.write(`  PASS  ${name}\n`); })
        .catch(err => { failed++; failures.push({ name, error: err.message }); process.stdout.write(`  FAIL  ${name}\n    ${err.message.split('\n').join('\n    ')}\n`); });
    }
    passed++;
    process.stdout.write(`  PASS  ${name}\n`);
    return Promise.resolve();
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    process.stdout.write(`  FAIL  ${name}\n    ${err.message.split('\n').join('\n    ')}\n`);
    return Promise.resolve();
  }
}

function makeMockLogger() {
  const logs = [];
  return { info: (msg) => logs.push({ level: 'info', msg }), warn: (msg) => logs.push({ level: 'warn', msg }), logs };
}

class PrerequisiteError extends Error { constructor(p) { super(p); this.name = 'PrerequisiteError'; } }
class VerificationError extends Error { constructor(p) { super(p); this.name = 'VerificationError'; } }
class HandlerExecError extends Error { constructor(c, a, e, s) { super(`Command failed (exit ${e}): ${c} ${a.join(' ')}\n${s}`); this.exitCode = e; } }

function loadHandlerWithMocks(subprocessMock) {
  const handlerPath = path.resolve(__dirname, 'npm-project.cjs');
  delete require.cache[handlerPath];
  const origLoad = Module._load.bind(Module);
  Module._load = function (request, parent, isMain) {
    if (parent && parent.filename === handlerPath && request === './subprocess-utils.cjs') return subprocessMock;
    return origLoad(request, parent, isMain);
  };
  const handler = require(handlerPath);
  Module._load = origLoad;
  return { handler, restore: () => { delete require.cache[handlerPath]; Module._load = origLoad; } };
}

const baseMock = {
  probeCommand: () => ({ ok: false, stdout: '', stderr: '', exitCode: 1 }),
  runCommand: () => '',
  commandExists: () => ({ found: true, version: 'v20.0.0' }),
  PrerequisiteError, VerificationError, HandlerExecError,
};

// ── Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\nnpm-project handler\n');

testPromises.push(run('check — returns installed=false when node_modules/<pkg> absent', async () => {
  const { handler, restore } = loadHandlerWithMocks(baseMock);
  try {
    const result = await handler.check({ target: '__omg_ghost_npm__', version: '1.0.0' }, { cwd: os.tmpdir() });
    assert.strictEqual(result.installed, false);
  } finally { restore(); }
}));

testPromises.push(run('install — default mode records per-project hint without running npm', async () => {
  let runCalled = false;
  const mock = { ...baseMock, runCommand: () => { runCalled = true; return ''; } };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.install({ target: 'ts-morph', version: '21.0.0' }, { logger: makeMockLogger(), cwd: os.tmpdir() });
    assert.strictEqual(result.success, true);
    assert.ok(result.log.includes('per-project-install-required'));
    assert.strictEqual(runCalled, false);
  } finally { restore(); }
}));

testPromises.push(run('install — throws when version is missing', async () => {
  const { handler, restore } = loadHandlerWithMocks(baseMock);
  try {
    let threw = false;
    try { await handler.install({ target: 'ts-morph' }, { logger: makeMockLogger(), cwd: os.tmpdir() }); }
    catch (err) { threw = true; assert.ok(/version.*required/i.test(err.message)); }
    assert.ok(threw);
  } finally { restore(); }
}));

testPromises.push(run('install — throws PrerequisiteError when node not on PATH', async () => {
  const mock = { ...baseMock, commandExists: () => ({ found: false }) };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    let threw = false;
    try { await handler.install({ target: 'ts-morph', version: '21.0.0' }, { logger: makeMockLogger(), cwd: os.tmpdir() }); }
    catch (err) { threw = true; assert.strictEqual(err.name, 'PrerequisiteError'); }
    assert.ok(threw);
  } finally { restore(); }
}));

testPromises.push(run('uninstall — no-op when package not in node_modules (no runCommand call)', async () => {
  let runCalled = false;
  const mock = { ...baseMock, runCommand: () => { runCalled = true; return ''; } };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.uninstall({ target: '__ghost__' }, { logger: makeMockLogger(), cwd: os.tmpdir() });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.log, 'not-installed');
    assert.strictEqual(runCalled, false);
  } finally { restore(); }
}));

testPromises.push(run('verify — returns ok=false when package absent from node_modules', async () => {
  const { handler, restore } = loadHandlerWithMocks(baseMock);
  try {
    const result = await handler.verify({ target: '__ghost__', version: '1.0.0' }, { logger: makeMockLogger(), cwd: os.tmpdir() });
    assert.strictEqual(result.ok, false);
  } finally { restore(); }
}));

testPromises.push(run('listPrerequisites — declares Node.js >= 18 and npm', () => {
  const handlerPath = path.resolve(__dirname, 'npm-project.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const prereqs = handler.listPrerequisites();
  assert.ok(prereqs.some(p => /node/i.test(p.name)));
  assert.ok(prereqs.some(p => /npm/i.test(p.name)));
}));

// ── Run ────────────────────────────────────────────────────────────────────

Promise.all(testPromises).then(() => {
  process.stdout.write('\n' + '─'.repeat(50) + '\n');
  process.stdout.write(`npm-project.test.cjs: ${passed} passed, ${failed} failed\n`);
  if (failures.length > 0) for (const f of failures) process.stdout.write(`  - ${f.name}: ${f.error}\n`);
  process.exitCode = failed > 0 ? 1 : 0;
});
