#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

/**
 * unity-stereotype-postprocessor.test.cjs
 * Tests for lib/unity-stereotype-postprocessor.cjs
 */

const path = require('path');
const assert = require('assert');
const { postprocess, scanCsFiles } = require('../scripts/lib/unity-stereotype-postprocessor.cjs');

const FIXTURE_CORE = path.resolve(__dirname, '../scripts/fixtures/mini-unity-project/Assets/Scripts/Game.Core');
const FIXTURE_SYSTEMS = path.resolve(__dirname, '../scripts/fixtures/mini-unity-project/Assets/Scripts/Game.Systems');

const fs = require('fs');

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

console.log('\nunity-stereotype-postprocessor.test.cjs');

// Helper: get .cs files from a fixture dir
function getCsFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.cs'))
    .map(f => path.join(dir, f));
}

test('scanCsFiles detects MonoBehaviour in PlayerController.cs', () => {
  const files = getCsFiles(FIXTURE_CORE);
  const { stereotypes } = scanCsFiles(files);
  const classes = [...stereotypes.keys()];
  assert.ok(classes.includes('PlayerController'), `PlayerController not in stereotypes: ${classes}`);
  assert.ok(stereotypes.get('PlayerController').includes('MonoBehaviour'),
    `MonoBehaviour not in stereotypes for PlayerController: ${stereotypes.get('PlayerController')}`);
});

test('scanCsFiles detects ScriptableObject in GameConfig.cs', () => {
  const files = getCsFiles(FIXTURE_CORE);
  const { stereotypes } = scanCsFiles(files);
  assert.ok(stereotypes.has('GameConfig'), 'GameConfig not found');
  assert.ok(stereotypes.get('GameConfig').includes('ScriptableObject'),
    `ScriptableObject not detected for GameConfig: ${stereotypes.get('GameConfig')}`);
});

test('scanCsFiles detects [CreateAssetMenu] on GameConfig', () => {
  const files = getCsFiles(FIXTURE_CORE);
  const { assetMenuClasses } = scanCsFiles(files);
  assert.ok(assetMenuClasses.has('GameConfig'), `GameConfig not in assetMenuClasses: ${[...assetMenuClasses]}`);
});

test('scanCsFiles detects [RequireComponent(typeof(Rigidbody))] on PlayerController', () => {
  const files = getCsFiles(FIXTURE_CORE);
  const { requireComponents } = scanCsFiles(files);
  const req = requireComponents.find(r => r.host === 'PlayerController' && r.required === 'Rigidbody');
  assert.ok(req, `RequireComponent(Rigidbody) not found: ${JSON.stringify(requireComponents)}`);
});

test('scanCsFiles detects ISystem on MovementSystem', () => {
  const files = getCsFiles(FIXTURE_SYSTEMS);
  const { stereotypes } = scanCsFiles(files);
  assert.ok(stereotypes.has('MovementSystem'), 'MovementSystem not found');
  assert.ok(stereotypes.get('MovementSystem').includes('ISystem'),
    `ISystem not detected: ${stereotypes.get('MovementSystem')}`);
});

test('scanCsFiles detects IComponentData on HealthComponent', () => {
  const files = getCsFiles(FIXTURE_SYSTEMS);
  const { stereotypes } = scanCsFiles(files);
  assert.ok(stereotypes.has('HealthComponent'), 'HealthComponent not found');
  assert.ok(stereotypes.get('HealthComponent').includes('IComponentData'),
    `IComponentData not detected: ${stereotypes.get('HealthComponent')}`);
});

test('postprocess injects <<MonoBehaviour>> into classDiagram', () => {
  const mermaidIn = 'classDiagram\n  class PlayerController {\n    +moveSpeed : float\n  }\n';
  const csFiles = getCsFiles(FIXTURE_CORE);
  const { mermaid } = postprocess(mermaidIn, csFiles);
  assert.ok(mermaid.includes('<<MonoBehaviour>>'), `<<MonoBehaviour>> not in output:\n${mermaid}`);
});

test('postprocess adds RequireComponent edge', () => {
  const mermaidIn = 'classDiagram\n  class PlayerController {\n  }\n  class Rigidbody {\n  }\n';
  const csFiles = getCsFiles(FIXTURE_CORE);
  const { mermaid } = postprocess(mermaidIn, csFiles);
  assert.ok(mermaid.includes('..>'), `RequireComponent edge not added:\n${mermaid}`);
});

test('postprocess handles empty mermaid gracefully', () => {
  const { mermaid, warnings } = postprocess('', []);
  assert.strictEqual(mermaid, '');
  assert.ok(warnings.length > 0);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
