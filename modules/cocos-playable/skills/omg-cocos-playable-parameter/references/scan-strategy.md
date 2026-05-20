---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Scan Strategy — Thorough Canvas UI Discovery

## Problem (v3 and earlier)

Previous versions filtered nodes by NAME before checking components, missing many parameterizable UI nodes. Deep mode must check ALL Canvas descendants.

## Deep Mode Scanning (v4)

### Phase 1: Get Hierarchy + Build Node List

```bash
curl -s -X POST http://127.0.0.1:3000/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"manage_scene","arguments":{"action":"get_hierarchy","includeComponents":true}}}'
```

Walk the hierarchy recursively. Collect ALL nodes under `Canvas` (and `BGCanvas` if exists) into a flat list with uuid + path.

### Phase 2: Batch Component Discovery

For EVERY Canvas descendant node, check its components via MCP:
```bash
curl -s -X POST http://127.0.0.1:3000/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"manage_component","arguments":{"action":"get_all","nodeUuid":"<NODE_UUID>"}}}'
```

**Optimization:** Use a Node.js script to batch-process sequentially (~50ms per node, 100 nodes ≈ 5s). Do NOT parallelize — avoid overwhelming MCP.

### Phase 3: Filter Parameterizable

Include node if it has ANY of:
- `cc.Sprite` — SpriteParameter candidate
- `cc.Label` — LabelParameter candidate
- `cc.Button` — ButtonParameter candidate (also has Sprite)
- `cc.Camera` — CameraParameter candidate
- `cc.ProgressBar` — ProgressBar composite candidate
- `cc.UIOpacity` — UIOpacity parameter candidate
- `cc.RichText` — RichTextParameter candidate
- `cc.Slider`, `cc.Toggle` — Interactive UI candidates
- Any non-`cc.*` type hash — Custom script with possible @property fields

Exclude node ONLY if ALL its components are:
- `cc.UITransform` only (structural)
- `cc.Widget` only (layout)
- `cc.Layout` only (layout)
- `cc.Canvas` (root canvas)
- `cc.SkeletalAnimation`, `cc.Skeleton`, `cc.Animation` (animation only)
- `cc.ParticleSystem`, `cc.ParticleSystem2D` (VFX)
- `cc.RigidBody*`, `cc.Collider*` (physics)
- `cc.MeshRenderer` (3D mesh without UI)
- Node name starts with `_` (private convention)

### Phase 4: Read Actual Values

For each parameterizable node, the `get_all` response already contains property values. Extract:

| Component | Properties to Read |
|-----------|-------------------|
| cc.Sprite | color (r,g,b,a), spriteFrame uuid, contentSize |
| cc.Label | string, color, fontSize, lineHeight, isBold, isItalic, isUnderline, overflow, enableOutline, outlineColor, outlineWidth, enableShadow, shadowColor, shadowOffset |
| cc.Button | transition, normalColor, hoverColor, pressedColor |
| cc.Camera | fov, clearColor, orthoHeight |
| cc.ProgressBar | progress, totalLength, barSprite |

Also read from the Node itself:
- position (x, y, z), rotation (x, y, z), scale (x, y, z)
- UITransform.contentSize (width, height)

These become the **default values** in PlayableConfig.ts.

## Standard Mode Scanning

Same as deep but ONLY checks nodes that are:
1. Direct children of known View nodes (GameView, Win, Lose, Loading)
2. Nodes with suggestive names (Label, Button, Sprite, Timer, HP, Score, etc.)

## 3D Scene Nodes

Also scan for parameterizable 3D nodes outside Canvas:
- Camera nodes (`cc.Camera`) — CameraParameter
- DirectionalLight nodes — can expose intensity/color
- Custom script nodes that are game controllers — expose @property fields

## Output

Build `scannedNodes[]` array:
```typescript
interface ScannedNode {
    name: string;
    uuid: string;
    path: string;           // Full scene path
    components: string[];   // Component types
    primaryType: string;    // Main parameterizable type
    actualValues: Record<string, any>; // Read from scene
    source: 'scene' | 'prefab';
}
```
