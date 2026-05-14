#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Directories to skip during search
const SKIP_DIRS = new Set(['Library', 'Temp', 'Logs', 'obj', 'bin', 'node_modules', '.git']);
const MAX_DEPTH = 12;

function findAsmdefs(dir, depth = 0) {
  if (depth > MAX_DEPTH) return [];
  let results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.isDirectory()) {
      results = results.concat(findAsmdefs(path.join(dir, entry.name), depth + 1));
    } else if (entry.isFile() && entry.name.endsWith('.asmdef')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

const cwd = process.cwd();
const asmdefs = findAsmdefs(cwd);
process.exit(asmdefs.length > 0 ? 0 : 1);
