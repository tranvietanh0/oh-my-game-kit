// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * npm-global.test.cjs — Unit tests for npm-global install handler.
 * All subprocess calls are mocked. No real npm is invoked.
 * Run: node .agents/skillsomg-preview/scripts/install-handlers/npm-global.test.cjs
 */
'use strict';

const assert = require('assert');
const Module = require('module');
const path = require('path');

// ── Test harness (matches existing test style) ────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];
const testPromises = [];

function run(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(() => {
        passed++;
        process.stdout.write(`  PASS  ${name}\n`);
      }).catch(err => {
        failed++;
        failures.push({ name, error: err.message });
        process.stdout.write(`  FAIL  ${name}\n    ${err.message.split('\n').join('\n    ')}\n`);
      });
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

// ── Helpers ────────────────────────────────────────────────────────────────

function makeMockLogger() {
  const logs = [];
  return { info: (msg) => logs.push({ level: 'info', msg }), warn: (msg) => logs.push({ level: 'warn', msg }), logs };
}

class BaseMockError extends Error { constructor(msg) { super(msg); this.name = this.constructor.name; } }
class PrerequisiteError extends BaseMockError {}
class VerificationError extends BaseMockError {}
class HandlerExecError extends BaseMockError {
  constructor(cmd, args, exitCode, stderr) { super(`Command failed (exit ${exitCode}): ${cmd} ${args.join(' ')}\n${stderr}`); this.exitCode = exitCode; this.stderr = stderr; }
}

function loadHandlerWithMocks(subprocessMock) {
  const handlerPath = path.resolve(__dirname, 'npm-global.cjs');
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

function makeNpmLsMock(deps) {
  return () => ({ ok: true, stdout: JSON.stringify({ dependencies: deps || {} }), stderr: '', exitCode: 0 });
}

// ── Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\nnpm-global handler\n');

testPromises.push(run('check — returns installed=false when package absent from npm ls -g', async () => {
  const mock = { probeCommand: makeNpmLsMock({}), runCommand: () => '', commandExists: () => ({ found: true, version: 'v20.0.0' }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.check({ target: 'some-pkg', version: '1.0.0' }, {});
    assert.strictEqual(result.installed, false);
  } finally { restore(); }
}));

testPromises.push(run('check — returns installed=true with version when package present', async () => {
  const mock = { probeCommand: makeNpmLsMock({ 'mmdc': { version: '10.2.0' } }), runCommand: () => '', commandExists: () => ({ found: true, version: 'v20.0.0' }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.check({ target: 'mmdc', package: 'mmdc', version: '10.2.0' }, {});
    assert.strictEqual(result.installed, true);
    assert.strictEqual(result.installedVersion, '10.2.0');
  } finally { restore(); }
}));

testPromises.push(run('install — happy path calls npm install -g', async () => {
  const installed = {};
  const mock = { probeCommand: makeNpmLsMock({}), runCommand: (cmd, args) => { installed[`${cmd}|${args.join('|')}`] = true; return ''; }, commandExists: () => ({ found: true, version: 'v20.0.0' }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.install({ target: 'mmdc', package: '@mermaid-js/mermaid-cli', version: '10.2.0' }, { logger: makeMockLogger() });
    assert.strictEqual(result.success, true);
    assert.ok(Object.keys(installed).some(k => k.includes('install') && k.includes('-g')));
  } finally { restore(); }
}));

testPromises.push(run('install — already at correct version is a no-op (no runCommand call)', async () => {
  let runCalled = false;
  const mock = { probeCommand: makeNpmLsMock({ '@mermaid-js/mermaid-cli': { version: '10.2.0' } }), runCommand: () => { runCalled = true; return ''; }, commandExists: () => ({ found: true, version: 'v20.0.0' }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.install({ target: 'mmdc', package: '@mermaid-js/mermaid-cli', version: '10.2.0' }, { logger: makeMockLogger() });
    assert.ok(result.log.includes('already-installed'));
    assert.strictEqual(runCalled, false);
  } finally { restore(); }
}));

testPromises.push(run('install — throws with context on npm failure', async () => {
  const mock = { probeCommand: makeNpmLsMock({}), runCommand: () => { throw new HandlerExecError('npm', ['install', '-g', 'bad@1.0.0'], 1, 'E404 not found'); }, commandExists: () => ({ found: true, version: 'v20.0.0' }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    let threw = false;
    try { await handler.install({ target: 'bad-pkg', version: '1.0.0' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.ok(/E404|Command failed/i.test(err.message), `unexpected error: ${err.message}`); }
    assert.ok(threw, 'Expected install to throw');
  } finally { restore(); }
}));

testPromises.push(run('uninstall — no-op when package not in npm ls -g (no runCommand call)', async () => {
  let runCalled = false;
  const mock = { probeCommand: makeNpmLsMock({}), runCommand: () => { runCalled = true; return ''; }, commandExists: () => ({ found: true, version: 'v20.0.0' }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.uninstall({ target: 'non-existent-pkg' }, { logger: makeMockLogger() });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.log, 'not-installed');
    assert.strictEqual(runCalled, false);
  } finally { restore(); }
}));

testPromises.push(run('install — throws PrerequisiteError when node not found on PATH', async () => {
  const mock = { probeCommand: () => ({ ok: true, stdout: '{}', stderr: '', exitCode: 0 }), runCommand: () => '', commandExists: () => ({ found: false }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    let threw = false;
    try { await handler.install({ target: 'mmdc', version: '10.0.0' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.strictEqual(err.name, 'PrerequisiteError', `Expected PrerequisiteError, got ${err.name}: ${err.message}`); }
    assert.ok(threw, 'Expected PrerequisiteError to be thrown');
  } finally { restore(); }
}));

testPromises.push(run('install — throws when version field is missing', async () => {
  const mock = { probeCommand: makeNpmLsMock({}), runCommand: () => '', commandExists: () => ({ found: true, version: 'v20.0.0' }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    let threw = false;
    try { await handler.install({ target: 'mmdc' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.ok(/version.*required/i.test(err.message), `unexpected error: ${err.message}`); }
    assert.ok(threw, 'Expected missing version error');
  } finally { restore(); }
}));

testPromises.push(run('verify — returns ok=true when package in npm ls -g at correct version', async () => {
  const mock = { probeCommand: makeNpmLsMock({ 'mmdc': { version: '10.2.0' } }), runCommand: () => '', commandExists: () => ({ found: true, version: 'v20.0.0' }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.verify({ target: 'mmdc', package: 'mmdc', version: '10.2.0' }, {});
    assert.strictEqual(result.ok, true);
  } finally { restore(); }
}));

// ── Run all tests ─────────────────────────────────────────────────────────

Promise.all(testPromises).then(() => {
  process.stdout.write('\n' + '─'.repeat(50) + '\n');
  process.stdout.write(`npm-global.test.cjs: ${passed} passed, ${failed} failed\n`);
  if (failures.length > 0) {
    for (const f of failures) process.stdout.write(`  - ${f.name}: ${f.error}\n`);
  }
  process.exitCode = failed > 0 ? 1 : 0;
});
