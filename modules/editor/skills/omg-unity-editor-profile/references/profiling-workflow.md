---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Profiling Workflow Reference

## Step-by-Step Protocol

### Step 1 — Enter Play Mode
```
manage_editor(action: "set_play_mode", play_mode: true)
```
Wait for `editor_state.isPlaying == true` before measuring.

### Step 2 — Stabilize (5 seconds)
Allow units to spawn and combat to begin. Avoid measuring during initial load spike.

### Step 3 — Rendering Stats Capture
```
rendering_stats()
```
Record: `draw_calls`, `batches`, `triangles`, `fps`, `memory_mb`.

### Step 4 — DOTS Performance Snapshot
```
manage_dots(action: "performance_snapshot")
```
Record: chunk utilization per archetype, system timing (ms/frame), job thread usage.

### Step 5 — Analyze vs Targets
Compare against thresholds in `references/optimization-targets.md`.
Flag any metric exceeding its threshold as a finding.

### Step 6 — Recommendations
For each failing metric, map to fix category:

| Metric Fails | Investigate |
|---|---|
| draw_calls too high | Material batching, GPU instancing, LOD/impostor |
| batches too low | SRP Batcher disabled, mixed shader variants |
| FPS too low | Heavy system (check system timing), GC alloc |
| chunk_util < 75% | Over-fragmented archetypes, InternalBufferCapacity tuning |
| system > 2ms | Job parallelization, Burst missing, query too broad |

### Step 7 — Exit Play Mode
```
manage_editor(action: "set_play_mode", play_mode: false)
```

## Profiling Report Format

```
## Profile Results — {Demo} — {Date}

### Rendering
- Draw Calls: X (target: <Y) [PASS/FAIL]
- Batches: X (target: >Y) [PASS/FAIL]
- FPS: X (target: >Y) [PASS/FAIL]

### DOTS
- Chunk Utilization: X% (target: >75%) [PASS/FAIL]
- Heaviest System: {Name} at Xms/frame

### Findings
1. [Finding + recommended fix]
```
