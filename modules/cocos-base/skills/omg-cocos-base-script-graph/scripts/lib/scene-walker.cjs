#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=base | protected=false
'use strict';

// scene-walker.cjs
// Custom JSON walker for Cocos Creator 3.x .scene / .prefab files.
// Zero external runtime deps — pure Node stdlib only.
// Walks `_objects` / `_children` / `__type__` / `_components` to produce a
// Mermaid flowchart TD describing the node hierarchy and component attachments.
// UUID references in component properties are emitted as dashed edges.

const DEFAULT_OPTS = { maxNodes: 500, label: null };

// Escape a string so it is safe inside a Mermaid node id (alphanumeric + underscore).
function escapeId(s) {
  return String(s).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40) || 'node';
}

// Escape a label for a Mermaid node: keep human-readable text, strip [, ], newlines, pipes.
function escapeLabel(s) {
  return String(s).replace(/[\[\]\|\n\r"`]/g, ' ').trim() || 'unnamed';
}

// Walk an object tree and yield (parentId, node, depth) triples.
// Cocos 3.x objects have `_name`, optional `__type__`, `_children` (array of refs or nested),
// and `_components` (array of refs or nested).
function walk(root, opts = {}) {
  const o = Object.assign({}, DEFAULT_OPTS, opts);
  const lines = ['flowchart TD'];
  if (o.label) lines.push(`  %% ${o.label}`);
  let nextId = 0;
  let nodeCount = 0;
  const uuidEdges = [];

  // Cocos 3.x scene/prefab files are an array of objects under `_objects` OR a single root.
  // We normalize: if root is an array, pick the first cc.Scene/cc.Node; else assume single root.
  const roots = Array.isArray(root)
    ? root.filter(x => x && typeof x === 'object')
    : [root];

  function nodeLabel(n) {
    const name = n && (n._name || n.name) || '(anon)';
    const type = n && (n.__type__ || n.type) || '?';
    return `${escapeLabel(name)}\\n<<${escapeLabel(type)}>>`;
  }

  function visit(n, parentId, depth) {
    if (!n || typeof n !== 'object') return;
    if (nodeCount >= o.maxNodes) return;
    const id = 'n' + (nextId++);
    nodeCount++;
    lines.push(`  ${id}["${nodeLabel(n)}"]`);
    if (parentId) lines.push(`  ${parentId} --> ${id}`);

    // Component attachments: emit as child boxes with component-shape edges.
    const comps = Array.isArray(n._components) ? n._components : [];
    for (const c of comps) {
      if (!c || typeof c !== 'object') continue;
      if (nodeCount >= o.maxNodes) break;
      const cid = 'c' + (nextId++);
      nodeCount++;
      const ctype = escapeLabel(c.__type__ || c.ctor || 'Component');
      lines.push(`  ${cid}(("${ctype}"))`);
      lines.push(`  ${id} -.-> ${cid}`);
      // Scan component properties for UUID refs.
      const props = c.properties || c._properties || {};
      for (const [key, val] of Object.entries(props || {})) {
        if (val && typeof val === 'object' && typeof val.__uuid__ === 'string') {
          uuidEdges.push({ from: cid, key, uuid: val.__uuid__ });
        }
      }
    }

    const kids = Array.isArray(n._children) ? n._children : [];
    for (const k of kids) visit(k, id, depth + 1);
  }

  for (const r of roots) visit(r, null, 0);

  // Emit UUID reference edges as dashed links with the first 8 chars of the UUID as a label.
  for (const e of uuidEdges) {
    const tgt = 'u_' + escapeId(e.uuid.slice(0, 8));
    lines.push(`  ${tgt}[["uuid:${e.uuid.slice(0, 8)}"]]`);
    lines.push(`  ${e.from} -. "${escapeLabel(e.key)}" .-> ${tgt}`);
  }

  return { mermaid: lines.join('\n'), nodeCount, truncated: nodeCount >= o.maxNodes };
}

module.exports = { walk, escapeId, escapeLabel };
