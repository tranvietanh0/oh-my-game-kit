// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * binary-download.test.cjs — Unit tests for binary-download install handler.
 * Mocks https.get and subprocess-utils. No real downloads.
 * Run: node .agents/skillsomg-preview/scripts/install-handlers/binary-download.test.cjs
 */
'use strict';

const assert = require('assert');
const Module = require('module');
const path = require('path');
const crypto = require('crypto');
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
        stream.end(content || Buffer.from('fake binary'));
      });
      return { on: () => {} };
    },
  };
}

function loadHandlerWithHttpsMock(httpsMock) {
  const handlerPath = path.resolve(__dirname, 'binary-download.cjs');
  delete require.cache[handlerPath];
  const origLoad = Module._load.bind(Module);
  Module._load = function (request, parent, isMain) {
    if (parent && parent.filename === handlerPath && request === 'https') return httpsMock;
    return origLoad(request, parent, isMain);
  };
  const handler = require(handlerPath);
  Module._load = origLoad;
  return { handler, restore: () => { delete require.cache[handlerPath]; Module._load = origLoad; } };
}

// ── Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\nbinary-download handler\n');

testPromises.push(run('check — returns installed=false when binary not present', async () => {
  const handlerPath = path.resolve(__dirname, 'binary-download.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const result = await handler.check({ target: '__omg_nonexistent_binary__', version: '1.0.0' }, {});
  assert.strictEqual(result.installed, false);
  assert.strictEqual(result.installedVersion, null);
}));

testPromises.push(run('install — throws on SHA-256 mismatch (never proceeds with corrupt binary)', async () => {
  const fakeContent = Buffer.from('fake binary content');
  const wrongSha = 'deadbeef'.repeat(8); // 64 hex chars, always wrong

  const { handler, restore } = loadHandlerWithHttpsMock(makeFakeHttps(fakeContent));
  try {
    let threw = false;
    try { await handler.install({ target: 'd2', url: 'https://example.com/d2', sha256: wrongSha, version: '0.6.5' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.ok(/SHA-256 mismatch|corrupt/i.test(err.message)); }
    assert.ok(threw, 'Expected SHA-256 mismatch to throw');
  } finally { restore(); }
}));

testPromises.push(run('uninstall — no-op when binary file not present', async () => {
  const handlerPath = path.resolve(__dirname, 'binary-download.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const result = await handler.uninstall({ target: '__omg_ghost_tool__' }, { logger: makeMockLogger() });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.log, 'not-present');
}));

testPromises.push(run('verify — returns ok=false when binary not present', async () => {
  const handlerPath = path.resolve(__dirname, 'binary-download.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const result = await handler.verify({ target: '__omg_ghost_verify__', version: '1.0.0' }, { logger: makeMockLogger() });
  assert.strictEqual(result.ok, false);
  assert.ok(result.reason.includes('not found'));
}));

testPromises.push(run('listPrerequisites — returns empty array (self-contained handler)', () => {
  const handlerPath = path.resolve(__dirname, 'binary-download.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const prereqs = handler.listPrerequisites();
  assert.ok(Array.isArray(prereqs));
  assert.strictEqual(prereqs.length, 0);
}));

testPromises.push(run('manifest — returns { handler: "binary-download", version }', () => {
  const handlerPath = path.resolve(__dirname, 'binary-download.cjs');
  delete require.cache[handlerPath];
  const handler = require(handlerPath);
  const m = handler.manifest();
  assert.strictEqual(m.handler, 'binary-download');
  assert.ok(typeof m.version === 'string');
}));

testPromises.push(run('install — throws when no URL provided for platform', async () => {
  const { handler, restore } = loadHandlerWithHttpsMock(makeFakeHttps());
  try {
    let threw = false;
    // step has no url, urlWindows, urlMacos
    try { await handler.install({ target: 'mystery', version: '1.0.0' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.ok(/no URL provided/i.test(err.message), `unexpected: ${err.message}`); }
    assert.ok(threw);
  } finally { restore(); }
}));

testPromises.push(run('install — HTTP error status throws descriptive error', async () => {
  const { handler, restore } = loadHandlerWithHttpsMock(makeFakeHttps(null, 404));
  try {
    let threw = false;
    try { await handler.install({ target: 'd2', url: 'https://example.com/d2', version: '0.6.5' }, { logger: makeMockLogger() }); }
    catch (err) { threw = true; assert.ok(/HTTP 404|Download failed/i.test(err.message)); }
    assert.ok(threw);
  } finally { restore(); }
}));

// ── Run ────────────────────────────────────────────────────────────────────

Promise.all(testPromises).then(() => {
  process.stdout.write('\n' + '─'.repeat(50) + '\n');
  process.stdout.write(`binary-download.test.cjs: ${passed} passed, ${failed} failed\n`);
  if (failures.length > 0) for (const f of failures) process.stdout.write(`  - ${f.name}: ${f.error}\n`);
  process.exitCode = failed > 0 ? 1 : 0;
});
