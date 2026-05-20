#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=base | protected=false
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { walk, escapeId, escapeLabel } = require('../scripts/lib/scene-walker.cjs');

const FIXTURE_SCENE = path.resolve(__dirname, 'fixtures/sample.scene.json');
const FIXTURE_PREFAB = path.resolve(__dirname, 'fixtures/sample.prefab.json');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (err) { console.error(`  ✗ ${name}\n    ${err.message}`); failed++; }
}

console.log('\nscene-walker.test.cjs');

test('walk returns a flowchart TD for a scene fixture', () => {
  const data = JSON.parse(fs.readFileSync(FIXTURE_SCENE, 'utf8'));
  const { mermaid } = walk(data, { label: 'scene' });
  assert.ok(mermaid.startsWith('flowchart TD'), 'expected flowchart TD header');
});

test('scene walker produces a node for Canvas', () => {
  const data = JSON.parse(fs.readFileSync(FIXTURE_SCENE, 'utf8'));
  const { mermaid } = walk(data);
  assert.ok(mermaid.includes('Canvas'), 'Canvas node missing');
});

test('scene walker produces a node for nested Player', () => {
  const data = JSON.parse(fs.readFileSync(FIXTURE_SCENE, 'utf8'));
  const { mermaid } = walk(data);
  assert.ok(mermaid.includes('Player'), 'Player node missing');
});

test('scene walker emits component attachments', () => {
  const data = JSON.parse(fs.readFileSync(FIXTURE_SCENE, 'utf8'));
  const { mermaid } = walk(data);
  assert.ok(mermaid.includes('MyUIController'), 'MyUIController component missing');
  assert.ok(mermaid.includes('-.->'), 'expected dashed component edge');
});

test('scene walker emits UUID reference nodes', () => {
  const data = JSON.parse(fs.readFileSync(FIXTURE_SCENE, 'utf8'));
  const { mermaid } = walk(data);
  assert.ok(mermaid.includes('uuid:a1b2c3d4'), 'startButtonPrefab UUID missing');
  assert.ok(mermaid.includes('uuid:11223344'), 'weapon UUID missing');
});

test('prefab walker handles the prefab fixture', () => {
  const data = JSON.parse(fs.readFileSync(FIXTURE_PREFAB, 'utf8'));
  const { mermaid } = walk(data);
  assert.ok(mermaid.includes('Bullet'), 'Bullet node missing');
  assert.ok(mermaid.includes('Collider2D'), 'Collider2D component missing');
});

test('walker truncates at maxNodes', () => {
  const data = { __type__: 'cc.Node', _name: 'root', _children: Array.from({ length: 20 }, (_, i) => ({ __type__: 'cc.Node', _name: 'n' + i })) };
  const { mermaid, nodeCount, truncated } = walk(data, { maxNodes: 5 });
  assert.strictEqual(truncated, true, 'expected truncated=true');
  assert.ok(nodeCount <= 5, `nodeCount ${nodeCount} exceeds cap 5`);
  assert.ok(mermaid.length > 0);
});

test('escapeId strips non-alphanumerics', () => {
  assert.strictEqual(escapeId('abc-def'), 'abc_def');
  assert.strictEqual(escapeId('a.b.c'), 'a_b_c');
  assert.ok(escapeId('').length > 0, 'fallback id');
});

test('escapeLabel drops disallowed chars', () => {
  assert.strictEqual(escapeLabel('Hello|World'), 'Hello World');
  assert.strictEqual(escapeLabel('foo[bar]'), 'foo bar');
});

test('walker accepts an array root', () => {
  const data = [ { __type__: 'cc.Scene', _name: 'S', _children: [] } ];
  const { mermaid } = walk(data);
  assert.ok(mermaid.includes('S'));
});

test('walker handles null or non-object input', () => {
  const { mermaid: m1 } = walk(null);
  assert.ok(m1.startsWith('flowchart TD'), 'null input still emits header');
  const { mermaid: m2 } = walk({});
  assert.ok(m2.startsWith('flowchart TD'));
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
