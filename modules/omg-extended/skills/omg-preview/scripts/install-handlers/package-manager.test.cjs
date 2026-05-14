// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * package-manager.test.cjs — Unit tests for package-manager install handler.
 * Platform detection and all subprocess calls are mocked.
 * Run: node .agents/skillsomg-preview/scripts/install-handlers/package-manager.test.cjs
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
class VerificationError extends Error {}
class HandlerExecError extends Error { constructor(c) { super(`failed: ${c}`); } }

function loadHandlerWithMocks(platform, subprocessMock) {
  const handlerPath = path.resolve(__dirname, 'package-manager.cjs');
  delete require.cache[handlerPath];

  const origPlatformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });

  const origLoad = Module._load.bind(Module);
  Module._load = function (request, parent, isMain) {
    if (parent && parent.filename === handlerPath && request === './subprocess-utils.cjs') return subprocessMock;
    return origLoad(request, parent, isMain);
  };
  const handler = require(handlerPath);
  Module._load = origLoad;

  return {
    handler,
    restore: () => {
      delete require.cache[handlerPath];
      Module._load = origLoad;
      if (origPlatformDescriptor) Object.defineProperty(process, 'platform', origPlatformDescriptor);
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\npackage-manager handler\n');

testPromises.push(run('macOS: install — uses brew when available', async () => {
  const calls = [];
  const mock = {
    probeCommand: (cmd) => {
      if (cmd === 'brew') return { ok: true, stdout: 'Homebrew 4.0', stderr: '', exitCode: 0 };
      if (cmd === 'which') return { ok: false, stdout: '', stderr: '', exitCode: 1 };
      return { ok: false, stdout: '', stderr: '', exitCode: 127 };
    },
    runCommand: (cmd, args) => { calls.push(`${cmd} ${args.join(' ')}`); return ''; },
    commandExists: () => ({ found: false }),
    PrerequisiteError, VerificationError, HandlerExecError,
  };
  const { handler, restore } = loadHandlerWithMocks('darwin', mock);
  try {
    const result = await handler.install({ target: 'graphviz', package: 'graphviz' }, { logger: makeMockLogger() });
    assert.strictEqual(result.success, true);
    assert.ok(result.log.includes('brew'));
    assert.ok(calls.some(c => c.includes('brew') && c.includes('graphviz')));
  } finally { restore(); }
}));

testPromises.push(run('Windows: non-elevated choco falls through to winget', async () => {
  const calls = [];
  const mock = {
    probeCommand: (cmd, args) => {
      if (cmd === 'choco') return { ok: true, stdout: 'Chocolatey v1.4.0', stderr: '', exitCode: 0 };
      if (cmd === 'winget') return { ok: true, stdout: 'winget 1.6', stderr: '', exitCode: 0 };
      if (cmd === 'net' && args && args[0] === 'session') return { ok: false, stdout: '', stderr: 'Access denied', exitCode: 5 };
      if (cmd === 'where') return { ok: false, stdout: '', stderr: '', exitCode: 1 };
      return { ok: false, stdout: '', stderr: '', exitCode: 127 };
    },
    runCommand: (cmd, args) => { calls.push(`${cmd} ${args.join(' ')}`); return ''; },
    commandExists: () => ({ found: false }),
    PrerequisiteError, VerificationError, HandlerExecError,
  };
  const { handler, restore } = loadHandlerWithMocks('win32', mock);
  try {
    const logger = makeMockLogger();
    const result = await handler.install({ target: 'graphviz', package: 'Graphviz.Graphviz' }, { logger });
    assert.ok(result.log.includes('winget') || result.success === true);
    const warning = logger.logs.find(l => l.level === 'warn' && /Administrator|elevation/i.test(l.msg));
    assert.ok(warning, 'Expected elevation warning');
  } finally { restore(); }
}));

testPromises.push(run('no package manager → returns success=false with manual hint', async () => {
  const mock = {
    probeCommand: () => ({ ok: false, stdout: '', stderr: '', exitCode: 127 }),
    runCommand: () => '',
    commandExists: () => ({ found: false }),
    PrerequisiteError, VerificationError, HandlerExecError,
  };
  const { handler, restore } = loadHandlerWithMocks('linux', mock);
  try {
    const result = await handler.install({ target: 'graphviz', package: 'graphviz', installHintUrl: 'https://graphviz.org/download/' }, { logger: makeMockLogger() });
    assert.strictEqual(result.success, false);
    assert.ok(result.log.includes('no-package-manager') || result.log.includes('manual'));
  } finally { restore(); }
}));

testPromises.push(run('uninstall — logs warning and returns success=false when all managers fail', async () => {
  const mock = {
    probeCommand: (cmd) => {
      if (cmd === 'apt-get') return { ok: true, stdout: 'apt 2.4', stderr: '', exitCode: 0 };
      if (cmd === 'which') return { ok: false, stdout: '', stderr: '', exitCode: 1 };
      return { ok: false, exitCode: 127, stdout: '', stderr: '' };
    },
    runCommand: (cmd) => { throw new HandlerExecError(cmd); },
    commandExists: () => ({ found: false }),
    PrerequisiteError, VerificationError, HandlerExecError,
  };
  const { handler, restore } = loadHandlerWithMocks('linux', mock);
  try {
    const logger = makeMockLogger();
    const result = await handler.uninstall({ target: 'graphviz', package: 'graphviz' }, { logger });
    assert.strictEqual(result.success, false);
    const warning = logger.logs.find(l => l.level === 'warn');
    assert.ok(warning, 'Expected a warning log on uninstall failure');
  } finally { restore(); }
}));

testPromises.push(run('verify — returns ok=false when binary not on PATH', async () => {
  const mock = {
    probeCommand: () => ({ ok: false, stdout: '', stderr: '', exitCode: 1 }),
    runCommand: () => '',
    commandExists: () => ({ found: false }),
    PrerequisiteError, VerificationError, HandlerExecError,
  };
  const { handler, restore } = loadHandlerWithMocks('linux', mock);
  try {
    const result = await handler.verify({ target: 'dot' }, { logger: makeMockLogger() });
    assert.strictEqual(result.ok, false);
  } finally { restore(); }
}));

testPromises.push(run('listPrerequisites — returns detected platform manager list', () => {
  const mock = {
    probeCommand: (cmd) => {
      if (cmd === 'brew') return { ok: true, stdout: 'Homebrew 4.0', stderr: '', exitCode: 0 };
      return { ok: false, exitCode: 127, stdout: '', stderr: '' };
    },
    runCommand: () => '',
    commandExists: () => ({ found: false }),
    PrerequisiteError, VerificationError, HandlerExecError,
  };
  const { handler, restore } = loadHandlerWithMocks('darwin', mock);
  try {
    const prereqs = handler.listPrerequisites();
    assert.ok(Array.isArray(prereqs));
  } finally { restore(); }
}));

testPromises.push(run('manifest — returns { handler: "package-manager", version }', () => {
  const handlerPath = path.resolve(__dirname, 'package-manager.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const m = handler.manifest();
  assert.strictEqual(m.handler, 'package-manager');
  assert.ok(m.version);
}));

// ── Run ────────────────────────────────────────────────────────────────────

Promise.all(testPromises).then(() => {
  process.stdout.write('\n' + '─'.repeat(50) + '\n');
  process.stdout.write(`package-manager.test.cjs: ${passed} passed, ${failed} failed\n`);
  if (failures.length > 0) for (const f of failures) process.stdout.write(`  - ${f.name}: ${f.error}\n`);
  process.exitCode = failed > 0 ? 1 : 0;
});
