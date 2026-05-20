---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# MCP Assignment Patterns

Optimized MCP tool patterns for scene reference assignment.

## Overview

Phase 4 assigns @property references in ParameterController using MCP tools.
Goal: Minimize MCP calls using batch operations and cached UUIDs from Phase 1.

## Optimized 3-Call Pattern

```bash
# 1. Find ParameterController UUID
mcp: manage_node find "ParameterController"
-> { "uuid": "abc123...", "name": "ParameterController", "path": "Canvas/ParameterController" }

# 2. Batch set ALL properties
mcp: manage_component set_properties_batch {
  "nodeUuid": "abc123...",
  "componentType": "6c3baoxxThE05bwZn+J8Iji",  # ParameterController type hash
  "properties": [
    {"property": "mainCamera", "propertyType": "node", "value": "<camera-uuid>"},
    {"property": "loadingView", "propertyType": "node", "value": "<loading-uuid>"},
    {"property": "winView", "propertyType": "node", "value": "<win-uuid>"},
    {"property": "loseView", "propertyType": "node", "value": "<lose-uuid>"},
    {"property": "logoSprite", "propertyType": "node", "value": "<logo-uuid>"},
    {"property": "ctaButton", "propertyType": "node", "value": "<cta-uuid>"}
  ]
}

# 3. Save scene
mcp: manage_scene save
```

## UUID Sources (from Phase 1 Scan)

UUIDs come from `scannedNodes[]` collected during Phase 1:

```typescript
interface ScannedNode {
  uuid: string;           // Node UUID for MCP assignment
  name: string;           // Node name (e.g., "LoadingView")
  path: string;           // Full hierarchy path
  componentType: string;  // e.g., "cc.Sprite", "cc.Label"
  nodeId: number;         // __id__ in scene JSON
}
```

## Property Matching Algorithm

Match @property names to scanned nodes:

```typescript
function buildAssignmentMap(properties: string[], scannedNodes: ScannedNode[]): Assignment[] {
  return properties.map(prop => {
    // 1. Try exact name match (case-insensitive)
    let target = scannedNodes.find(n =>
      n.name.toLowerCase() === prop.replace(/Sprite|Label|Button|View/, '').toLowerCase()
    );
    // 2. Try component type match
    if (!target && prop.endsWith('Sprite')) {
      target = scannedNodes.find(n => n.componentType === 'cc.Sprite' && n.name.includes(prop.replace('Sprite', '')));
    }
    // 3. Try path pattern match
    if (!target) {
      const pattern = prop.replace(/([A-Z])/g, '*$1').toLowerCase();
      target = scannedNodes.find(n => n.path.toLowerCase().includes(pattern));
    }
    return { property: prop, targetUuid: target?.uuid ?? null };
  });
}
```

## MCP Tool Reference

### manage_node

| Action | Purpose | Response |
|--------|---------|----------|
| `find` | Find node by name pattern | `{ uuid, name, path }` |
| `list` | List child nodes | `[{ uuid, name, path }]` |
| `get` | Get node details | `{ uuid, name, position, ... }` |

### manage_component

| Action | Purpose | Response |
|--------|---------|----------|
| `get_all` | Get component properties | `{ type, properties: {...} }` |
| `set_property` | Set single property | `{ success: true }` |
| `set_properties_batch` | Set multiple properties | `{ success: true, results: [...] }` |

### manage_scene

| Action | Purpose | Response |
|--------|---------|----------|
| `save` | Save current scene | `{ success: true }` |
| `reload` | Reload from disk | `{ success: true }` |
| `get_hierarchy` | Full scene tree with UUIDs | `{ children: [...] }` |

## Fallback: Direct Scene JSON Edit

If MCP tools unavailable, edit scene file directly:
1. Parse `MainScene.scene` JSON array
2. Find ParameterController by type hash
3. Find target node IDs from scannedNodes[]
4. Update null properties: `{ "__id__": targetNodeId }`
5. Check TargetOverrideInfo for existing assignments
6. Save scene file

## Verification After Assignment

Re-read via `manage_component get_all` and verify all new properties are non-null.

## Windows Compatibility (MANDATORY)

- Single-line curl only (no `\` line continuations)
- Never use `/dev/stdin`, `/tmp/`, or pipe through `python`
- Use `$TEMP` for temp files: `echo '...' > "$TEMP/mcp.json" && curl -d @"$TEMP/mcp.json" ...`

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| unknownType error | @property uses component type not Node | Change to `@property(Node)` |
| Property not found | Type hash mismatch | Verify via `get_all` |
| UUID invalid | Node deleted since scan | Re-run Step 1 |
| Save fails | File locked | Close Editor, check perms |
