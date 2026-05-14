---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
---

> **BDP 2→3 migration note:** The `Opsive.BehaviorDesigner.Runtime.Components` namespace is STABLE across versions. `EvaluateFlag`, `TaskComponent`, `BranchComponent`, `EnabledFlag`, and all per-task flag types required no changes during the BDP 2.1.12 → 3.0.2 migration.

# BDP ECS Components per Entity

## Component Table

| Component | Type | Size | Purpose |
|-----------|------|------|---------|
| `TaskComponent` | `IBufferElementData` | ~14B x tasks | Task state (index, parent, sibling, status, reevaluate) |
| `BranchComponent` | `IBufferElementData` | ~12B x branches | Branch state (active/next index, can execute, interrupt) |
| `EvaluationComponent32/64` | `IComponentData` | 40-80B | Evaluation bitmask |
| `EvaluateFlag` | `IEnableableComponent` | 0B (bit) | **Master switch** — disabled = skip ALL BDP processing |
| `EnabledFlag` | `IEnableableComponent` | 0B (bit) | Tree lifecycle (CleanupSystem re-enables EvaluateFlag when this is on) |
| Per-task flags | `IEnableableComponent` | 0B (bit) | Active task indicator |

**Total overhead**: ~600-800 bytes per entity at 30 tasks.

## EvaluateFlag — The Master Throttle

`EvaluateFlag` (`IEnableableComponent`) is BDP's built-in per-entity on/off switch:

- **ALL** BDP systems query `.WithAll<EvaluateFlag>()` — disabled entities are completely skipped
- `EvaluationCleanupSystem` (OrderLast) re-enables it each frame for entities with `EnabledFlag`
- **Throttle pattern**: Disable `EvaluateFlag` before BDP runs -> entity skips entire tick -> CleanupSystem re-enables -> throttle re-applies next frame

See [performance-throttling-guide.md](performance-throttling-guide.md) for the `BDPEvaluateFlagThrottleSystem` implementation.

## Task Status Flow

```
Queued -> Running -> Success/Failure
              |
              +-- returns Running = continue next tick
```
