#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=base | protected=false
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const SCRIPTS = path.resolve(__dirname, '../scripts');
const LIST = path.join(SCRIPTS, 'list-capabilities.cjs');
const REQS = path.join(SCRIPTS, 'requirements.cjs');
const GEN = path.join(SCRIPTS, 'generate.cjs');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (err) { console.error(`  ✗ ${name}\n    ${err.message}`); failed++; }
}

function runNode(script, args, cwd) {
  return execFileSync('node', [script, ...(args || [])], {
    cwd: cwd || process.cwd(),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });
}

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'omg-cocos-gen-'));
}

console.log('\ncapabilities.test.cjs');

test('list-capabilities returns exactly [classes, modules, scenes, prefabs]', () => {
  const out = runNode(LIST).trim();
  const arr = JSON.parse(out);
  assert.deepStrictEqual(arr, ['classes', 'modules', 'scenes', 'prefabs']);
});

test('requirements.cjs reports mermaid-cli global + per-project hints', () => {
  const out = runNode(REQS).trim();
  const reqs = JSON.parse(out);
  const names = reqs.map(r => r.tool);
  assert.ok(names.includes('mermaid-cli'), 'mermaid-cli missing');
  assert.ok(names.includes('ts-morph'), 'ts-morph missing');
  assert.ok(names.includes('dependency-cruiser'), 'dependency-cruiser missing');
  const tsMorph = reqs.find(r => r.tool === 'ts-morph');
  assert.strictEqual(tsMorph.scope, 'per-project', 'ts-morph should be per-project');
});

test('generate --type scenes writes scenes.md with stub fixtures', () => {
  const cwd = mkTmp();
  const assets = path.join(cwd, 'assets');
  fs.mkdirSync(assets, { recursive: true });
  // Use the sample fixture so we get non-empty output.
  const sampleScene = fs.readFileSync(path.resolve(__dirname, 'fixtures/sample.scene.json'), 'utf8');
  fs.writeFileSync(path.join(assets, 'main.scene'), sampleScene, 'utf8');
  const outDir = path.join(cwd, 'out');
  const raw = runNode(GEN, ['--type', 'scenes', '--out-dir', outDir], cwd).trim();
  const result = JSON.parse(raw);
  assert.strictEqual(result.file, 'scenes.md');
  assert.strictEqual(result.capabilities_skipped.length, 0);
  const content = fs.readFileSync(path.join(outDir, 'scenes.md'), 'utf8');
  assert.ok(content.includes('flowchart TD'), 'flowchart missing');
  assert.ok(content.includes('Canvas'), 'Canvas missing');
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('generate --type prefabs writes prefabs.md', () => {
  const cwd = mkTmp();
  const assets = path.join(cwd, 'assets');
  fs.mkdirSync(assets, { recursive: true });
  const samplePrefab = fs.readFileSync(path.resolve(__dirname, 'fixtures/sample.prefab.json'), 'utf8');
  fs.writeFileSync(path.join(assets, 'bullet.prefab'), samplePrefab, 'utf8');
  const outDir = path.join(cwd, 'out');
  const raw = runNode(GEN, ['--type', 'prefabs', '--out-dir', outDir], cwd).trim();
  const result = JSON.parse(raw);
  assert.strictEqual(result.file, 'prefabs.md');
  const content = fs.readFileSync(path.join(outDir, 'prefabs.md'), 'utf8');
  assert.ok(content.includes('Bullet'), 'Bullet missing');
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('generate --type classes emits stub with capabilities_skipped=["classes"]', () => {
  const cwd = mkTmp();
  const outDir = path.join(cwd, 'out');
  const raw = runNode(GEN, ['--type', 'classes', '--out-dir', outDir], cwd).trim();
  const result = JSON.parse(raw);
  assert.deepStrictEqual(result.capabilities_skipped, ['classes']);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('generate --type modules emits stub with capabilities_skipped=["modules"]', () => {
  const cwd = mkTmp();
  const outDir = path.join(cwd, 'out');
  const raw = runNode(GEN, ['--type', 'modules', '--out-dir', outDir], cwd).trim();
  const result = JSON.parse(raw);
  assert.deepStrictEqual(result.capabilities_skipped, ['modules']);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('generate rejects unknown --type', () => {
  const cwd = mkTmp();
  try {
    runNode(GEN, ['--type', 'bogus', '--out-dir', path.join(cwd, 'out')], cwd);
    assert.fail('expected exit 1');
  } catch (err) {
    assert.strictEqual(err.status, 1);
  }
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('generate rejects relative --out-dir', () => {
  try {
    runNode(GEN, ['--type', 'scenes', '--out-dir', 'relative/path']);
    assert.fail('expected exit 1');
  } catch (err) {
    assert.strictEqual(err.status, 1);
  }
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
