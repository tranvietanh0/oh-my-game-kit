// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * index.test.cjs — Unit tests for the handler registry (index.cjs).
 * Tests: BUILT_IN_HANDLERS, resolveHandler, kit-shipped handler loading.
 * Run: node .agents/skillsomg-preview/scripts/install-handlers/index.test.cjs
 */
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { BUILT_IN_HANDLERS, resolveHandler } = require('./index.cjs');

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

// ── Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\nhandler registry (index.cjs)\n');

testPromises.push(run('BUILT_IN_HANDLERS contains all 6 core handlers', () => {
  const expected = ['npm-global', 'npm-project', 'dotnet-tool', 'binary-download', 'jar-download', 'package-manager'];
  for (const name of expected) {
    assert.ok(BUILT_IN_HANDLERS[name], `Missing handler: ${name}`);
  }
  assert.strictEqual(Object.keys(BUILT_IN_HANDLERS).length, expected.length);
}));

testPromises.push(run('all built-in handlers export install, uninstall, verify, manifest', () => {
  for (const [name, handler] of Object.entries(BUILT_IN_HANDLERS)) {
    assert.strictEqual(typeof handler.install, 'function', `${name}: missing install`);
    assert.strictEqual(typeof handler.uninstall, 'function', `${name}: missing uninstall`);
    assert.strictEqual(typeof handler.verify, 'function', `${name}: missing verify`);
    assert.strictEqual(typeof handler.manifest, 'function', `${name}: missing manifest`);
  }
}));

testPromises.push(run('manifest() on each handler returns matching handler name', () => {
  for (const [name, handler] of Object.entries(BUILT_IN_HANDLERS)) {
    const m = handler.manifest();
    assert.strictEqual(m.handler, name, `${name}: manifest().handler mismatch`);
    assert.ok(typeof m.version === 'string', `${name}: manifest().version must be a string`);
  }
}));

testPromises.push(run('resolveHandler resolves built-in npm-global by step.handler', () => {
  const step = { target: 'mmdc', handler: 'npm-global', version: '10.0.0' };
  const handler = resolveHandler(step);
  assert.ok(handler === BUILT_IN_HANDLERS['npm-global']);
}));

testPromises.push(run('resolveHandler throws on unknown step.handler name', () => {
  const step = { target: 'godepgraph', handler: 'go-install', version: '1.0.0' };
  assert.throws(() => resolveHandler(step), /unknown built-in handler/i);
}));

testPromises.push(run('resolveHandler loads kit-shipped handler from handlerPath', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-test-handler-'));
  const handlerFile = path.join(tmpDir, 'go-install.cjs');
  fs.writeFileSync(handlerFile, `'use strict'; module.exports = { async install(){}, async uninstall(){}, async verify(){ return { ok: true }; }, manifest(){ return { handler: 'go-install', version: '1.0.0' }; } };`, 'utf8');
  try {
    const step = { target: 'godepgraph', handlerPath: 'go-install.cjs', version: '1.0.0' };
    const handler = resolveHandler(step, tmpDir);
    assert.strictEqual(typeof handler.install, 'function');
    assert.strictEqual(handler.manifest().handler, 'go-install');
  } finally {
    try { fs.unlinkSync(handlerFile); fs.rmdirSync(tmpDir); } catch { /* cleanup best-effort */ }
  }
}));

testPromises.push(run('resolveHandler throws when handlerPath used without kitSkillDir', () => {
  const step = { target: 'godepgraph', handlerPath: 'go-install.cjs', version: '1.0.0' };
  assert.throws(() => resolveHandler(step, undefined), /kitSkillDir/i);
}));

testPromises.push(run('resolveHandler rejects path traversal in handlerPath', () => {
  const step = { target: 'evil', handlerPath: '../../some-other-dir/evil.cjs', version: '1.0.0' };
  assert.throws(() => resolveHandler(step, '/some/skill/dir'), /path traversal/i);
}));

testPromises.push(run('resolveHandler throws when kit handler file does not exist', () => {
  const step = { target: 'missing', handlerPath: 'nonexistent-handler.cjs', version: '1.0.0' };
  assert.throws(() => resolveHandler(step, os.tmpdir()), /not found/i);
}));

testPromises.push(run('resolveHandler throws when kit handler is missing required export (verify)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-bad-handler-'));
  const handlerFile = path.join(tmpDir, 'bad.cjs');
  fs.writeFileSync(handlerFile, `'use strict'; module.exports = { async install(){}, async uninstall(){}, manifest(){ return {}; } };`, 'utf8');
  try {
    const step = { target: 'bad', handlerPath: 'bad.cjs', version: '1.0.0' };
    assert.throws(() => resolveHandler(step, tmpDir), /missing required export.*verify/i);
  } finally {
    try { fs.unlinkSync(handlerFile); fs.rmdirSync(tmpDir); } catch { /* cleanup */ }
  }
}));

testPromises.push(run('resolveHandler throws when neither handler nor handlerPath is set', () => {
  const step = { target: 'orphan', version: '1.0.0' };
  assert.throws(() => resolveHandler(step), /references no handler/i);
}));

// ── Run ────────────────────────────────────────────────────────────────────

Promise.all(testPromises).then(() => {
  process.stdout.write('\n' + '─'.repeat(50) + '\n');
  process.stdout.write(`index.test.cjs: ${passed} passed, ${failed} failed\n`);
  if (failures.length > 0) for (const f of failures) process.stdout.write(`  - ${f.name}: ${f.error}\n`);
  process.exitCode = failed > 0 ? 1 : 0;
});
