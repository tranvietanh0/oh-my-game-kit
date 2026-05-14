#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

/**
 * asmdef-parser.cjs
 * Walks Assets/ and Packages/ for .asmdef files, resolves GUID-based references
 * via .asmdef.meta companion files, and builds a directed dependency graph.
 *
 * Exports: parseAsmdefs(projectRoot) -> { nodes, edges, warnings }
 *   nodes: [{ id, name, path, dir, noEngineReferences, autoReferenced, overrideReferences }]
 *   edges: [{ from, to }]  (from depends on to)
 *   warnings: string[]
 */

const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['Library', 'Temp', 'Logs', 'obj', 'bin', 'node_modules', '.git']);
const MAX_DEPTH = 12;

/**
 * Recursively find all .asmdef files under a directory.
 */
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

/**
 * Parse a .asmdef.meta file to extract the GUID.
 * Returns null if not present or unparseable.
 */
function readMetaGuid(asmdefPath) {
  const metaPath = asmdefPath + '.meta';
  try {
    const content = fs.readFileSync(metaPath, 'utf8');
    const match = content.match(/^guid:\s*([a-f0-9]+)/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Build a map of GUID -> asmdef name from all discovered asmdefs.
 */
function buildGuidMap(asmdefPaths) {
  const guidToName = new Map();
  for (const asmdefPath of asmdefPaths) {
    const guid = readMetaGuid(asmdefPath);
    if (!guid) continue;
    try {
      const raw = fs.readFileSync(asmdefPath, 'utf8');
      const data = JSON.parse(raw);
      if (data.name) {
        guidToName.set(guid, data.name);
      }
    } catch {
      // skip malformed
    }
  }
  return guidToName;
}

/**
 * Resolve a reference entry which may be either:
 *   - A plain assembly name: "Game.Core"
 *   - A GUID ref: "GUID:abcdef1234567890abcdef1234567890"
 */
function resolveReference(ref, guidToName, warnings) {
  if (typeof ref !== 'string') return null;
  const guidMatch = ref.match(/^GUID:([a-f0-9]+)$/i);
  if (guidMatch) {
    const guid = guidMatch[1].toLowerCase();
    const name = guidToName.get(guid);
    if (!name) {
      warnings.push(`Unresolved GUID ref: ${ref}`);
      return `?GUID:${guid}`;
    }
    return name;
  }
  return ref;
}

/**
 * Escape an assembly name for use as a Mermaid node ID.
 * Replaces dots and hyphens with underscores.
 */
function escapeMermaidId(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Main entry point.
 * @param {string} projectRoot - absolute path to the Unity project root
 * @returns {{ nodes: object[], edges: object[], warnings: string[], mermaid: string }}
 */
function parseAsmdefs(projectRoot) {
  const warnings = [];
  const searchRoots = ['Assets', 'Packages'].map(d => path.join(projectRoot, d));

  let asmdefPaths = [];
  for (const root of searchRoots) {
    if (fs.existsSync(root)) {
      asmdefPaths = asmdefPaths.concat(findAsmdefs(root));
    }
  }

  // Also search top-level for any asmdefs not under Assets/Packages
  asmdefPaths = asmdefPaths.concat(
    findAsmdefs(projectRoot, 0).filter(p => {
      const rel = path.relative(projectRoot, p);
      return !rel.startsWith('Assets') && !rel.startsWith('Packages');
    })
  );

  if (asmdefPaths.length === 0) {
    return { nodes: [], edges: [], warnings: ['No .asmdef files found'], mermaid: 'graph LR\n  empty["No assemblies found"]' };
  }

  // Build GUID map first pass
  const guidToName = buildGuidMap(asmdefPaths);

  // Parse all asmdefs second pass
  const nodes = [];
  const nodesByName = new Map();
  const edges = [];

  for (const asmdefPath of asmdefPaths) {
    let data;
    try {
      const raw = fs.readFileSync(asmdefPath, 'utf8');
      data = JSON.parse(raw);
    } catch (err) {
      warnings.push(`Skipped malformed .asmdef: ${asmdefPath} (${err.message})`);
      continue;
    }

    const name = data.name || path.basename(asmdefPath, '.asmdef');
    const node = {
      id: escapeMermaidId(name),
      name,
      path: asmdefPath,
      dir: path.dirname(asmdefPath),
      noEngineReferences: !!data.noEngineReferences,
      autoReferenced: data.autoReferenced !== false, // default true
      overrideReferences: !!data.overrideReferences,
      references: data.references || [],
      includePlatforms: data.includePlatforms || [],
      excludePlatforms: data.excludePlatforms || []
    };
    nodes.push(node);
    nodesByName.set(name, node);
  }

  // Build edges
  for (const node of nodes) {
    for (const ref of node.references) {
      const resolved = resolveReference(ref, guidToName, warnings);
      if (resolved) {
        edges.push({ from: node.name, to: resolved });
      }
    }
  }

  // Detect cycles (simple DFS)
  const visited = new Set();
  const inStack = new Set();

  function dfs(name, stack) {
    if (inStack.has(name)) {
      warnings.push(`Cycle detected: ${[...stack, name].join(' -> ')}`);
      return;
    }
    if (visited.has(name)) return;
    visited.add(name);
    inStack.add(name);
    const deps = edges.filter(e => e.from === name).map(e => e.to);
    for (const dep of deps) {
      dfs(dep, [...stack, name]);
    }
    inStack.delete(name);
  }

  for (const node of nodes) {
    if (!visited.has(node.name)) {
      dfs(node.name, []);
    }
  }

  // Generate Mermaid graph LR
  const lines = ['graph LR'];

  // Declare all nodes with tooltip (full name as label if short name differs)
  for (const node of nodes) {
    const shortName = node.name.split('.').pop() || node.name;
    if (shortName !== node.name) {
      lines.push(`  ${node.id}["${shortName}"]`);
    } else {
      lines.push(`  ${node.id}`);
    }
  }

  // Add edges
  for (const edge of edges) {
    const fromNode = nodesByName.get(edge.from);
    const toId = edge.to.startsWith('?GUID:')
      ? `unknown_${edge.to.replace(/[^a-zA-Z0-9]/g, '_')}["${edge.to}"]`
      : escapeMermaidId(edge.to);
    if (fromNode) {
      lines.push(`  ${fromNode.id} --> ${toId}`);
    }
  }

  return {
    nodes,
    edges,
    warnings,
    mermaid: lines.join('\n')
  };
}

module.exports = { parseAsmdefs, escapeMermaidId, findAsmdefs };
