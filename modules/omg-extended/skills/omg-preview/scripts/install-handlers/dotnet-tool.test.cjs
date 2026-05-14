// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * dotnet-tool.test.cjs — Unit tests for dotnet-tool install handler.
 * All subprocess calls are mocked. No real dotnet is invoked.
 * Run: node .agents/skillsomg-preview/scripts/install-handlers/dotnet-tool.test.cjs
 */
'use strict';

const assert = require('assert');
const Module = require('module');
const path = require('path');

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
  const handlerPath = path.resolve(__dirname, 'dotnet-tool.cjs');
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

const TOOL_LIST_EMPTY = '\nPackage Id    Version    Commands\n--------------------------------------\n';
const TOOL_LIST_CS2MM = '\nPackage Id    Version    Commands\n--------------------------------------\ncs2mermaid    0.6.0      cs2mmd\n';

function makeProbeCommand(sdkOutput, toolListOutput) {
  return (cmd, args) => {
    if (args && args.includes('--list-sdks')) return { ok: true, stdout: sdkOutput || '8.0.100 [/usr/share/dotnet]', stderr: '', exitCode: 0 };
    return { ok: true, stdout: toolListOutput || TOOL_LIST_EMPTY, stderr: '', exitCode: 0 };
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\ndotnet-tool handler\n');

testPromises.push(run('check — returns installed=false when tool not in dotnet tool list -g', async () => {
  const mock = { probeCommand: makeProbeCommand(null, TOOL_LIST_EMPTY), runCommand: () => '', commandExists: () => ({ found: true }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.check({ target: 'cs2mermaid', version: '0.6.0' }, {});
    assert.strictEqual(result.installed, false);
  } finally { restore(); }
}));

testPromises.push(run('check — returns installed=true with version from dotnet tool list', async () => {
  const mock = { probeCommand: makeProbeCommand(null, TOOL_LIST_CS2MM), runCommand: () => '', commandExists: () => ({ found: true }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.check({ target: 'cs2mermaid', version: '0.6.0' }, {});
    assert.strictEqual(result.installed, true);
    assert.strictEqual(result.installedVersion, '0.6.0');
  } finally { restore(); }
}));

testPromises.push(run('install — runs dotnet tool install -g with pinned version', async () => {
  const calls = [];
  const mock = { probeCommand: makeProbeCommand(null, TOOL_LIST_EMPTY), runCommand: (cmd, args) => { calls.push(`${cmd} ${args.join(' ')}`); return ''; }, commandExists: () => ({ found: true }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.install({ target: 'cs2mermaid', package: 'Cs2Mermaid', version: '0.6.0' }, { logger: makeMockLogger() });
    assert.strictEqual(result.success, true);
    assert.ok(calls.some(c => c.includes('install') && c.includes('0.6.0')));
  } finally { restore(); }
}));

testPromises.push(run('install — throws when version is missing (BLOCKER 4)', async () => {
  const mock = { probeCommand: makeProbeCommand(), runCommand: () => '', commandExists: () => ({ found: true }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    let threw = false;
    try { await handler.install({ target: 'cs2mermaid' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.ok(/version.*required/i.test(err.message)); }
    assert.ok(threw);
  } finally { restore(); }
}));

testPromises.push(run('install — already at correct version is a no-op', async () => {
  let runCalled = false;
  const mock = { probeCommand: makeProbeCommand(null, TOOL_LIST_CS2MM), runCommand: () => { runCalled = true; return ''; }, commandExists: () => ({ found: true }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.install({ target: 'cs2mermaid', version: '0.6.0' }, { logger: makeMockLogger() });
    assert.ok(result.log.includes('already-installed'));
    assert.strictEqual(runCalled, false);
  } finally { restore(); }
}));

testPromises.push(run('uninstall — no-op when tool not installed', async () => {
  let runCalled = false;
  const mock = { probeCommand: makeProbeCommand(null, TOOL_LIST_EMPTY), runCommand: () => { runCalled = true; return ''; }, commandExists: () => ({ found: true }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.uninstall({ target: 'cs2mermaid' }, { logger: makeMockLogger() });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.log, 'not-installed');
    assert.strictEqual(runCalled, false);
  } finally { restore(); }
}));

testPromises.push(run('install — throws PrerequisiteError when dotnet not on PATH', async () => {
  const mock = { probeCommand: () => ({ ok: false, stdout: '', stderr: '', exitCode: 127 }), runCommand: () => '', commandExists: () => ({ found: false }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    let threw = false;
    try { await handler.install({ target: 'cs2mermaid', version: '0.6.0' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.strictEqual(err.name, 'PrerequisiteError'); }
    assert.ok(threw);
  } finally { restore(); }
}));

testPromises.push(run('verify — returns ok=false on version mismatch', async () => {
  const mock = { probeCommand: makeProbeCommand(null, TOOL_LIST_CS2MM), runCommand: () => '', commandExists: () => ({ found: true }), PrerequisiteError, VerificationError, HandlerExecError };
  const { handler, restore } = loadHandlerWithMocks(mock);
  try {
    const result = await handler.verify({ target: 'cs2mermaid', version: '0.7.0' }, {});
    assert.strictEqual(result.ok, false);
    assert.ok(result.reason.includes('mismatch'));
  } finally { restore(); }
}));

// ── Run ────────────────────────────────────────────────────────────────────

Promise.all(testPromises).then(() => {
  process.stdout.write('\n' + '─'.repeat(50) + '\n');
  process.stdout.write(`dotnet-tool.test.cjs: ${passed} passed, ${failed} failed\n`);
  if (failures.length > 0) for (const f of failures) process.stdout.write(`  - ${f.name}: ${f.error}\n`);
  process.exitCode = failed > 0 ? 1 : 0;
});
