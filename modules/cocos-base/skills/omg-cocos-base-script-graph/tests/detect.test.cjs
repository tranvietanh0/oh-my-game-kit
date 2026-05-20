#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=base | protected=false
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const DETECT = path.resolve(__dirname, '../scripts/detect.cjs');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (err) { console.error(`  ✗ ${name}\n    ${err.message}`); failed++; }
}

function runDetect(cwd) {
  try {
    execFileSync('node', [DETECT], { cwd, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    return 0;
  } catch (err) {
    return err.status || 1;
  }
}

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'omg-cocos-detect-'));
}

function rmTmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
}

console.log('\ndetect.test.cjs');

test('exit 1 for empty directory', () => {
  const tmp = mkTmp();
  try {
    assert.strictEqual(runDetect(tmp), 1);
  } finally { rmTmp(tmp); }
});

test('exit 0 when package.json has cc dep', () => {
  const tmp = mkTmp();
  try {
    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ dependencies: { cc: '*' } }), 'utf8');
    assert.strictEqual(runDetect(tmp), 0);
  } finally { rmTmp(tmp); }
});

test('exit 0 when package.json has @cocos/* dep', () => {
  const tmp = mkTmp();
  try {
    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ devDependencies: { '@cocos/creator': '*' } }), 'utf8');
    assert.strictEqual(runDetect(tmp), 0);
  } finally { rmTmp(tmp); }
});

test('exit 0 when assets/ has a .scene file', () => {
  const tmp = mkTmp();
  try {
    const assets = path.join(tmp, 'assets');
    fs.mkdirSync(assets, { recursive: true });
    fs.writeFileSync(path.join(assets, 'main.scene'), '{}', 'utf8');
    assert.strictEqual(runDetect(tmp), 0);
  } finally { rmTmp(tmp); }
});

test('exit 0 when nested assets/*/foo.prefab exists', () => {
  const tmp = mkTmp();
  try {
    const deep = path.join(tmp, 'assets', 'ui', 'hud');
    fs.mkdirSync(deep, { recursive: true });
    fs.writeFileSync(path.join(deep, 'bar.prefab'), '{}', 'utf8');
    assert.strictEqual(runDetect(tmp), 0);
  } finally { rmTmp(tmp); }
});

test('skips node_modules when scanning assets', () => {
  const tmp = mkTmp();
  try {
    const nm = path.join(tmp, 'node_modules', 'assets');
    fs.mkdirSync(nm, { recursive: true });
    fs.writeFileSync(path.join(nm, 'junk.scene'), '{}', 'utf8');
    // no top-level assets/ and no cocos dep → must NOT match
    assert.strictEqual(runDetect(tmp), 1);
  } finally { rmTmp(tmp); }
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
