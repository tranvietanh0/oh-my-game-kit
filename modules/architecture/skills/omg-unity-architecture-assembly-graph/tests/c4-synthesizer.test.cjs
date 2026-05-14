#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

/**
 * c4-synthesizer.test.cjs
 * Tests for lib/c4-synthesizer.cjs
 */

const assert = require('assert');
const { synthesizeC4, getContainerPrefix } = require('../scripts/lib/c4-synthesizer.cjs');

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

console.log('\nc4-synthesizer.test.cjs');

const SAMPLE_NODES = [
  { id: 'Game_Core', name: 'Game.Core', path: '/p', dir: '/p', references: [] },
  { id: 'Game_Systems', name: 'Game.Systems', path: '/p', dir: '/p', references: [] },
  { id: 'Game_UI', name: 'Game.UI', path: '/p', dir: '/p', references: [] }
];
const SAMPLE_EDGES = [
  { from: 'Game.Systems', to: 'Game.Core' },
  { from: 'Game.UI', to: 'Game.Core' }
];

test('getContainerPrefix extracts first segment', () => {
  assert.strictEqual(getContainerPrefix('Game.Core'), 'Game');
  assert.strictEqual(getContainerPrefix('com.unity.entities'), 'com');
  assert.strictEqual(getContainerPrefix('SingleSegment'), 'SingleSegment');
});

test('synthesizeC4 returns graph TB', () => {
  const { mermaid } = synthesizeC4(SAMPLE_NODES, SAMPLE_EDGES);
  assert.ok(mermaid.startsWith('graph TB'), `Expected graph TB: ${mermaid.slice(0, 50)}`);
});

test('synthesizeC4 groups all 3 nodes into "Game" subgraph', () => {
  const { mermaid } = synthesizeC4(SAMPLE_NODES, SAMPLE_EDGES);
  assert.ok(mermaid.includes('subgraph Game'), `Game subgraph missing: ${mermaid}`);
});

test('synthesizeC4 includes edges', () => {
  const { mermaid } = synthesizeC4(SAMPLE_NODES, SAMPLE_EDGES);
  assert.ok(mermaid.includes('-->'), `No edges in C4 output: ${mermaid}`);
});

test('synthesizeC4 handles empty nodes gracefully', () => {
  const { mermaid, warnings } = synthesizeC4([], []);
  assert.ok(mermaid.includes('graph TB'), `Should still produce graph TB`);
  assert.ok(warnings.length > 0, `Should warn on empty nodes`);
});

test('synthesizeC4 handles unresolved GUID edges', () => {
  const nodes = [{ id: 'Game_Core', name: 'Game.Core', path: '/p', dir: '/p' }];
  const edges = [{ from: 'Game.Core', to: '?GUID:abc123' }];
  const { mermaid, warnings } = synthesizeC4(nodes, edges);
  assert.ok(mermaid.includes('unresolved'), `Unresolved GUID edge not shown: ${mermaid}`);
  assert.ok(warnings.length > 0);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
