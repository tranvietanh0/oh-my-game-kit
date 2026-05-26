#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

/**
 * integration.test.cjs
 * End-to-end integration test: runs detect, list-capabilities, requirements, and
 * all 4 generate types against the mini-unity-project fixture.
 *
 * The 'classes' capability is skipped with a clear reason if cs2mmd is not installed.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');
const assert = require('assert');
const { execFileSync, spawnSync } = require('child_process');

const SKILL_DIR = path.resolve(__dirname, '..');
const FIXTURE = path.resolve(__dirname, '../scripts/fixtures/mini-unity-project');

let passed = 0;
let failed = 0;
let skipped = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function testSkip(name, reason) {
  console.log(`  - ${name} [SKIPPED: ${reason}]`);
  skipped++;
}

function run(script, args, cwd) {
  return execFileSync('node', [path.join(SKILL_DIR, 'scripts', script), ...(args || [])], {
    cwd: cwd || FIXTURE,
    windowsHide: true,
    timeout: 30_000,
    stdio: ['pipe', 'pipe', 'ignore']
  }).toString().trim();
}

function isCs2mmdAvailable() {
  const r = spawnSync('cs2mmd', ['--version'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  return r.status === 0;
}

console.log('\nintegration.test.cjs');

test('detect.cjs exits 0 for mini-unity-project', () => {
  const result = spawnSync('node', [path.join(SKILL_DIR, 'scripts', 'detect.cjs')], {
    cwd: FIXTURE,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  assert.strictEqual(result.status, 0, `detect.cjs should exit 0 for Unity project`);
});

test('detect.cjs exits 1 for empty non-Unity directory', () => {
  const nonUnityDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-non-unity-'));
  try {
    const result = spawnSync('node', [path.join(SKILL_DIR, 'scripts', 'detect.cjs')], {
      cwd: nonUnityDir,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    assert.strictEqual(result.status, 1, `detect.cjs should exit 1 for non-Unity directory`);
  } finally {
    fs.rmSync(nonUnityDir, { recursive: true, force: true });
  }
});

test('list-capabilities.cjs returns JSON array with 4 capabilities', () => {
  const output = run('list-capabilities.cjs');
  const caps = JSON.parse(output);
  assert.deepStrictEqual(caps.sort(), ['c4', 'classes', 'modules', 'packages']);
});

test('requirements.cjs returns JSON array', () => {
  const output = run('requirements.cjs');
  const reqs = JSON.parse(output);
  assert.ok(Array.isArray(reqs), 'requirements should be array');
  assert.ok(reqs.length >= 2, `Expected at least 2 requirements, got ${reqs.length}`);
  const tools = reqs.map(r => r.tool);
  assert.ok(tools.includes('mermaid-cli'), 'mermaid-cli missing from requirements');
  assert.ok(tools.includes('cs2mermaid'), 'cs2mermaid missing from requirements');
});

test('generate --type modules produces Assembly Graph', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-int-modules-'));
  try {
    const json = execFileSync('node', [path.join(SKILL_DIR, 'scripts', 'generate.cjs'), '--type', 'modules', '--out-dir', outDir], {
      cwd: FIXTURE,
      windowsHide: true,
      timeout: 30_000,
      stdio: ['pipe', 'pipe', 'ignore']
    }).toString().trim();
    const result = JSON.parse(json);
    assert.strictEqual(result.file, 'modules.md');
    const content = fs.readFileSync(path.join(outDir, 'modules.md'), 'utf8');
    assert.ok(content.includes('Game_Systems') || content.includes('Game.Systems'), 'Assembly name missing');
    assert.ok(content.includes('-->'), 'No edges in assembly graph');
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test('generate --type packages produces UPM graph with entities', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-int-packages-'));
  try {
    const json = execFileSync('node', [path.join(SKILL_DIR, 'scripts', 'generate.cjs'), '--type', 'packages', '--out-dir', outDir], {
      cwd: FIXTURE,
      windowsHide: true,
      timeout: 30_000,
      stdio: ['pipe', 'pipe', 'ignore']
    }).toString().trim();
    const result = JSON.parse(json);
    assert.strictEqual(result.file, 'packages.md');
    const content = fs.readFileSync(path.join(outDir, 'packages.md'), 'utf8');
    assert.ok(content.includes('entities'), 'com.unity.entities missing');
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test('generate --type c4 produces C4 architecture view', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-int-c4-'));
  try {
    const json = execFileSync('node', [path.join(SKILL_DIR, 'scripts', 'generate.cjs'), '--type', 'c4', '--out-dir', outDir], {
      cwd: FIXTURE,
      windowsHide: true,
      timeout: 30_000,
      stdio: ['pipe', 'pipe', 'ignore']
    }).toString().trim();
    const result = JSON.parse(json);
    assert.strictEqual(result.file, 'architecture.md');
    const content = fs.readFileSync(path.join(outDir, 'architecture.md'), 'utf8');
    assert.ok(content.includes('graph TB'), 'C4 view missing graph TB');
    assert.ok(content.includes('subgraph'), 'C4 view missing container subgraphs');
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

if (isCs2mmdAvailable()) {
  test('generate --type classes produces classes.md index + per-asmdef files', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-int-classes-'));
    try {
      const json = execFileSync('node', [path.join(SKILL_DIR, 'scripts', 'generate.cjs'), '--type', 'classes', '--out-dir', outDir], {
        cwd: FIXTURE,
        windowsHide: true,
        timeout: 120_000,
        stdio: ['pipe', 'pipe', 'ignore']
      }).toString().trim();
      const result = JSON.parse(json);
      assert.strictEqual(result.file, 'classes.md');
      const content = fs.readFileSync(path.join(outDir, 'classes.md'), 'utf8');
      assert.ok(content.includes('Game.Core') || content.includes('Game_Core'), 'Game.Core missing from index');
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });
} else {
  testSkip('generate --type classes (cs2mmd not installed)', 'cs2mmd not found on PATH — install via: dotnet tool install -g Cs2Mermaid --version 0.6.0');
  // Verify graceful degradation
  test('generate --type classes without cs2mmd produces skip notice', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-int-classes-skip-'));
    try {
      const json = execFileSync('node', [path.join(SKILL_DIR, 'scripts', 'generate.cjs'), '--type', 'classes', '--out-dir', outDir], {
        cwd: FIXTURE,
        windowsHide: true,
        timeout: 30_000,
        stdio: ['pipe', 'pipe', 'ignore']
      }).toString().trim();
      const result = JSON.parse(json);
      assert.strictEqual(result.file, 'classes.md');
      // Either skip notice in file or in capabilities_skipped
      const content = fs.readFileSync(path.join(outDir, 'classes.md'), 'utf8');
      const hasSkipInfo = content.includes('Not available') || result.capabilities_skipped.includes('classes');
      assert.ok(hasSkipInfo, `Expected skip notice: capabilities_skipped=${JSON.stringify(result.capabilities_skipped)}`);
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });
}

console.log(`\n  ${passed} passed, ${failed} failed, ${skipped} skipped\n`);
if (failed > 0) process.exit(1);
