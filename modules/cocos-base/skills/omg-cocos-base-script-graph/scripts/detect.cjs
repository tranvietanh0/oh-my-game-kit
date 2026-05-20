#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=base | protected=false
'use strict';

// Detect if the current project is a Cocos Creator 3.x project.
// Returns exit 0 (match) when either of the following is true:
//   1) `package.json` lists a Cocos-related dependency (e.g. `cc` or `@cocos/...`)
//   2) An `assets/` directory exists AND contains at least one `.scene` or `.prefab` file
// Returns exit 1 otherwise.

const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', 'build', 'temp', 'library', 'local', '.git']);
const MAX_DEPTH = 8;

function hasCocosDependency(projectRoot) {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    return false;
  }
  const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
  for (const name of Object.keys(allDeps)) {
    if (name === 'cc') return true;
    if (name.startsWith('@cocos/')) return true;
    if (name === 'cocos-creator') return true;
  }
  // Cocos projects often have creator metadata
  if (pkg.creator && typeof pkg.creator === 'object') return true;
  return false;
}

function findSceneOrPrefab(dir, depth) {
  if (depth > MAX_DEPTH) return false;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name.toLowerCase())) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (findSceneOrPrefab(full, depth + 1)) return true;
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.scene') || entry.name.endsWith('.prefab')) return true;
    }
  }
  return false;
}

function hasAssetsWithSceneOrPrefab(projectRoot) {
  const assets = path.join(projectRoot, 'assets');
  if (!fs.existsSync(assets)) return false;
  return findSceneOrPrefab(assets, 0);
}

const projectRoot = process.cwd();
const match = hasCocosDependency(projectRoot) || hasAssetsWithSceneOrPrefab(projectRoot);
process.exit(match ? 0 : 1);
