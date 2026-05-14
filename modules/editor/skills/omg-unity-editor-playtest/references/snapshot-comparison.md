---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Snapshot Comparison Reference

## validation_snapshot MCP Tool

Reduces 15-20 individual MCP calls to 3-4 for before/after comparison.

### Actions

**capture** — Aggregated snapshot of current game state:
```
validation_snapshot(action: "capture", label: "before_change")
```
Returns: entity counts, rendering stats, console errors, position samples, HP samples.

**compare** — Diff two captured snapshots:
```
validation_snapshot(action: "compare", label_a: "before_change", label_b: "after_change")
```
Returns: delta table (what changed, by how much).

### --compare Workflow

```
1. Enter Play mode
2. validation_snapshot(action: "capture", label: "baseline")
3. Apply code change (hot reload or re-enter play)
4. validation_snapshot(action: "capture", label: "after")
5. validation_snapshot(action: "compare", label_a: "baseline", label_b: "after")
6. Inspect deltas
```

### What Snapshots Capture

| Field | Source |
|-------|--------|
| entity_count | GameEntityTag query |
| draw_calls | rendering_stats |
| batches | rendering_stats |
| fps | rendering_stats |
| console_errors | read_console(Error) |
| position_samples | 5 random entity positions |
| hp_samples | 5 random entity HP values |
| timestamp | System.DateTime.Now |

### Interpreting Compare Output

- `entity_count: -10` → entities dying (expected in combat)
- `draw_calls: +200` → batching regression (investigate)
- `console_errors: +3` → new runtime errors (STOP and fix)
- `fps: -15` → performance regression (profile before shipping)
- `position_samples: delta > 0` → movement confirmed

### Source Location

```
Packages/com.coplaydev.unity-mcp/MCPForUnity/Editor/Tools/ValidationSnapshot.cs
Packages/com.coplaydev.unity-mcp/Server/src/services/tools/validation_snapshot.py
```
Editor-only: wrapped in `#if UNITY_ENTITIES`.
