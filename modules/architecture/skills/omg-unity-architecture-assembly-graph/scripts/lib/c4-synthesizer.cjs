#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

/**
 * c4-synthesizer.cjs
 *
 * Infers a C4 architecture view from the asmdef structure:
 *   - System (top level) = the project itself
 *   - Container = top-level prefix group (e.g., "Game", "Unity", "The1Studio")
 *   - Component = individual assemblies
 *
 * Produces a Mermaid graph TB with subgraphs representing containers.
 * Uses C4 naming conventions in comments for compatibility with Mermaid C4 diagrams.
 *
 * Exports:
 *   synthesizeC4(nodes, edges) -> { mermaid: string, warnings: string[] }
 */

const IGNORE_PREFIXES = new Set(['Unity', 'UnityEditor', 'UnityEngine', 'Newtonsoft', 'System', 'mscorlib']);

/**
 * Extract the top-level prefix from an assembly name.
 * e.g., "Game.Core.Combat" -> "Game"
 *       "com.the1studio.utils" -> "com"
 */
function getContainerPrefix(name) {
  const parts = name.split('.');
  return parts[0] || name;
}

/**
 * Sanitize for Mermaid subgraph IDs.
 */
function mermaidId(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Generate C4-style Mermaid diagram from parsed asmdef nodes and edges.
 *
 * @param {object[]} nodes - from asmdef-parser
 * @param {object[]} edges - from asmdef-parser
 * @returns {{ mermaid: string, warnings: string[] }}
 */
function synthesizeC4(nodes, edges) {
  const warnings = [];

  if (nodes.length === 0) {
    return {
      mermaid: 'graph TB\n  empty["No assemblies found"]',
      warnings: ['No assembly nodes to synthesize C4 from']
    };
  }

  // Group nodes into containers by prefix
  const containers = new Map(); // prefix -> nodes[]
  for (const node of nodes) {
    const prefix = getContainerPrefix(node.name);
    if (!containers.has(prefix)) containers.set(prefix, []);
    containers.get(prefix).push(node);
  }

  const lines = [
    'graph TB',
    '  %% C4 Architecture View — inferred from .asmdef structure',
    '  %% System: Project | Containers: Top-level prefix groups | Components: individual assemblies'
  ];

  // Render containers as subgraphs
  for (const [prefix, containerNodes] of containers) {
    const subId = mermaidId(prefix);
    lines.push(`  subgraph ${subId}["${prefix}"]`);
    for (const node of containerNodes) {
      const shortName = node.name.split('.').slice(1).join('.') || node.name;
      lines.push(`    ${node.id}["${shortName || node.name}"]`);
    }
    lines.push('  end');
  }

  // Add edges between components
  for (const edge of edges) {
    // Find node IDs
    const fromNode = nodes.find(n => n.name === edge.from);
    const toNode = nodes.find(n => n.name === edge.to);
    if (fromNode && toNode) {
      lines.push(`  ${fromNode.id} --> ${toNode.id}`);
    } else if (fromNode && edge.to.startsWith('?GUID:')) {
      const unknownId = mermaidId(edge.to);
      lines.push(`  ${fromNode.id} -->|unresolved| ${unknownId}["${edge.to}"]`);
      warnings.push(`Unresolved GUID reference from ${edge.from}: ${edge.to}`);
    }
  }

  return { mermaid: lines.join('\n'), warnings };
}

module.exports = { synthesizeC4, getContainerPrefix };
