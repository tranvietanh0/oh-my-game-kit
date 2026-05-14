#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

/**
 * asmdef-parser.test.cjs
 * Tests for lib/asmdef-parser.cjs using the mini-unity-project fixture.
 */

const path = require('path');
const assert = require('assert');
const { parseAsmdefs, escapeMermaidId } = require('../scripts/lib/asmdef-parser.cjs');

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

console.log('\nasmdef-parser.test.cjs');

test('parseAsmdefs finds 3 asmdefs in fixture', () => {
  const { nodes } = parseAsmdefs(FIXTURE);
  assert.strictEqual(nodes.length, 3, `Expected 3 nodes, got ${nodes.length}`);
});

test('nodes include Game.Core, Game.Systems, Game.UI', () => {
  const { nodes } = parseAsmdefs(FIXTURE);
  const names = nodes.map(n => n.name).sort();
  assert.deepStrictEqual(names, ['Game.Core', 'Game.Systems', 'Game.UI']);
});

test('Game.Systems has edge to Game.Core (GUID resolved)', () => {
  const { edges } = parseAsmdefs(FIXTURE);
  const edge = edges.find(e => e.from === 'Game.Systems' && e.to === 'Game.Core');
  assert.ok(edge, `Expected edge Game.Systems -> Game.Core, edges: ${JSON.stringify(edges)}`);
});

test('Game.UI has edge to Game.Core (name ref)', () => {
  const { edges } = parseAsmdefs(FIXTURE);
  const edge = edges.find(e => e.from === 'Game.UI' && e.to === 'Game.Core');
  assert.ok(edge, `Expected edge Game.UI -> Game.Core`);
});

test('mermaid output contains graph LR', () => {
  const { mermaid } = parseAsmdefs(FIXTURE);
  assert.ok(mermaid.startsWith('graph LR'), `Expected "graph LR" prefix`);
});

test('mermaid output contains arrow for Game.Systems -> Game.Core', () => {
  const { mermaid } = parseAsmdefs(FIXTURE);
  assert.ok(mermaid.includes('-->'), `Expected --> in mermaid output`);
});

test('no cycles detected in fixture', () => {
  const { warnings } = parseAsmdefs(FIXTURE);
  const cycleWarnings = warnings.filter(w => w.includes('Cycle'));
  assert.strictEqual(cycleWarnings.length, 0, `Unexpected cycle: ${cycleWarnings[0]}`);
});

test('escapeMermaidId replaces dots and hyphens', () => {
  assert.strictEqual(escapeMermaidId('Game.Core'), 'Game_Core');
  assert.strictEqual(escapeMermaidId('my-package'), 'my_package');
});

test('node.dir is a real directory', () => {
  const { nodes } = parseAsmdefs(FIXTURE);
  const coreNode = nodes.find(n => n.name === 'Game.Core');
  assert.ok(coreNode, 'Game.Core node not found');
  const fs = require('fs');
  assert.ok(fs.existsSync(coreNode.dir), `dir does not exist: ${coreNode.dir}`);
});

test('handles nonexistent project root gracefully', () => {
  const { nodes, warnings } = parseAsmdefs('/nonexistent/path/12345');
  assert.strictEqual(nodes.length, 0);
  assert.ok(warnings.length > 0);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
