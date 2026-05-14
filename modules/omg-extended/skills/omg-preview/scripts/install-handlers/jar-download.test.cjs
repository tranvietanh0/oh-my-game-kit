// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * jar-download.test.cjs — Unit tests for jar-download install handler.
 * All subprocess and network calls are mocked.
 * Run: node .agents/skillsomg-preview/scripts/install-handlers/jar-download.test.cjs
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

function makeFakeHttps(content, statusCode) {
  const { PassThrough } = require('stream');
  return {
    get: (url, cb) => {
      const stream = new PassThrough();
      process.nextTick(() => {
        const mockRes = Object.assign(stream, { statusCode: statusCode || 200, headers: {} });
        cb(mockRes);
        stream.end(content || Buffer.from('PK-fake-jar'));
      });
      return { on: () => {} };
    },
  };
}

function loadHandlerWithMocks(httpsMock, subprocessMock) {
  const handlerPath = path.resolve(__dirname, 'jar-download.cjs');
  delete require.cache[handlerPath];
  const origLoad = Module._load.bind(Module);
  Module._load = function (request, parent, isMain) {
    if (parent && parent.filename === handlerPath) {
      if (request === 'https' && httpsMock) return httpsMock;
      if (request === './subprocess-utils.cjs' && subprocessMock) return subprocessMock;
    }
    return origLoad(request, parent, isMain);
  };
  const handler = require(handlerPath);
  Module._load = origLoad;
  return { handler, restore: () => { delete require.cache[handlerPath]; Module._load = origLoad; } };
}

class PrerequisiteError extends Error { constructor(p) { super(p); this.name = 'PrerequisiteError'; } }
class VerificationError extends Error {}
class HandlerExecError extends Error {}

const javaFoundMock = {
  probeCommand: () => ({ ok: true, stdout: '', stderr: 'openjdk version "17.0.0"', exitCode: 0 }),
  runCommand: () => '',
  commandExists: () => ({ found: true }),
  PrerequisiteError, VerificationError, HandlerExecError,
};

const javaNotFoundMock = {
  probeCommand: () => ({ ok: false, stdout: '', stderr: '', exitCode: 127 }),
  runCommand: () => '',
  commandExists: () => ({ found: false }),
  PrerequisiteError, VerificationError, HandlerExecError,
};

// ── Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\njar-download handler\n');

testPromises.push(run('check — returns installed=false when jar not present', async () => {
  const handlerPath = path.resolve(__dirname, 'jar-download.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const result = await handler.check({ target: '__omg_ghost_jar__', version: '1.0.0' }, {});
  assert.strictEqual(result.installed, false);
}));

testPromises.push(run('install — aborts on SHA-256 mismatch, does not proceed', async () => {
  const wrongSha = 'abcd1234'.repeat(8);
  const { handler, restore } = loadHandlerWithMocks(makeFakeHttps(), javaFoundMock);
  try {
    let threw = false;
    try { await handler.install({ target: 'plantuml', url: 'https://ex.com/plantuml.jar', sha256: wrongSha, version: '1.2024.1' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.ok(/SHA-256 mismatch|corrupt/i.test(err.message)); }
    assert.ok(threw);
  } finally { restore(); }
}));

testPromises.push(run('uninstall — no-op when jar not present', async () => {
  const handlerPath = path.resolve(__dirname, 'jar-download.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const result = await handler.uninstall({ target: '__omg_ghost_jar2__' }, { logger: makeMockLogger() });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.log, 'not-present');
}));

testPromises.push(run('install — throws PrerequisiteError when java not on PATH', async () => {
  const { handler, restore } = loadHandlerWithMocks(makeFakeHttps(), javaNotFoundMock);
  try {
    let threw = false;
    try { await handler.install({ target: 'plantuml', url: 'https://ex.com/plantuml.jar', version: '1.2024.1' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.strictEqual(err.name, 'PrerequisiteError'); }
    assert.ok(threw);
  } finally { restore(); }
}));

testPromises.push(run('install — throws if url field is missing', async () => {
  const { handler, restore } = loadHandlerWithMocks(null, javaFoundMock);
  try {
    let threw = false;
    try { await handler.install({ target: 'plantuml', version: '1.0.0' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.ok(/url.*required/i.test(err.message)); }
    assert.ok(threw);
  } finally { restore(); }
}));

testPromises.push(run('listPrerequisites — declares Java JRE >= 11', () => {
  const handlerPath = path.resolve(__dirname, 'jar-download.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const prereqs = handler.listPrerequisites();
  assert.ok(prereqs.some(p => /java/i.test(p.name)));
}));

testPromises.push(run('verify — returns ok=false when jar not present', async () => {
  const handlerPath = path.resolve(__dirname, 'jar-download.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const result = await handler.verify({ target: '__ghost_verify_jar__' }, { logger: makeMockLogger() });
  assert.strictEqual(result.ok, false);
}));

testPromises.push(run('manifest — returns { handler: "jar-download", version }', () => {
  const handlerPath = path.resolve(__dirname, 'jar-download.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const m = handler.manifest();
  assert.strictEqual(m.handler, 'jar-download');
  assert.ok(m.version);
}));

// ── Run ────────────────────────────────────────────────────────────────────

Promise.all(testPromises).then(() => {
  process.stdout.write('\n' + '─'.repeat(50) + '\n');
  process.stdout.write(`jar-download.test.cjs: ${passed} passed, ${failed} failed\n`);
  if (failures.length > 0) for (const f of failures) process.stdout.write(`  - ${f.name}: ${f.error}\n`);
  process.exitCode = failed > 0 ? 1 : 0;
});
