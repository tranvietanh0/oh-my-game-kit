#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

/**
 * packages-extractor.test.cjs
 * Tests for lib/packages-extractor.cjs
 */

const path = require('path');
const assert = require('assert');
const { extractPackages } = require('../scripts/lib/packages-extractor.cjs');

const FIXTURE = path.resolve(__dirname, '../scripts/fixtures/mini-unity-project');

let passed = 0;
let failed = 0;

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

console.log('\npackages-extractor.test.cjs');

test('extractPackages finds manifest.json in fixture', () => {
  const { mermaid, warnings } = extractPackages(FIXTURE);
  assert.ok(!mermaid.includes('not found'), `manifest.json should be found: ${mermaid}`);
});

test('mermaid output contains Project node', () => {
  const { mermaid } = extractPackages(FIXTURE);
  assert.ok(mermaid.includes('Project'), `Project node missing: ${mermaid}`);
});

test('mermaid output contains com.unity.entities', () => {
  const { mermaid } = extractPackages(FIXTURE);
  assert.ok(mermaid.includes('entities'), `com.unity.entities missing: ${mermaid}`);
});

test('local package uses dashed edge', () => {
  const { mermaid } = extractPackages(FIXTURE);
  assert.ok(mermaid.includes('-.->') || mermaid.includes('local'), `local edge not found: ${mermaid}`);
});

test('handles missing manifest gracefully', () => {
  const { mermaid, warnings } = extractPackages('/nonexistent/path/12345');
  assert.ok(mermaid.includes('not found'), `Expected not-found message`);
  assert.ok(warnings.length > 0);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
