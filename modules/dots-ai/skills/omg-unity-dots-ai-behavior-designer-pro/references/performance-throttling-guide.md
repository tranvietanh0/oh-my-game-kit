---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# Performance & EvaluateFlag Throttling — Behavior Designer Pro

> **Prerequisites:** `dots-ecs-core` (IEnableableComponent) · `dots-performance` (AIUpdateTier)

## EvaluateFlag Mechanism

`EvaluateFlag` is BDP's built-in `IEnableableComponent` that acts as a **master switch** for per-entity tree evaluation:

```csharp
// BDP source: Opsive.BehaviorDesigner.Runtime.Components
public struct EvaluateFlag : IComponentData, IEnableableComponent { }
```

### Lifecycle (per frame)

1. **EvaluationCleanupSystem** (OrderLast in BehaviorTreeSystemGroup) re-enables `EvaluateFlag` for all entities with `EnabledFlag` enabled. Uses `IgnoreComponentEnabledState` to access ALL entities regardless of current EvaluateFlag state.

2. **Next frame**: All BDP systems (traversal, task execution, reevaluation, interrupts) query `.WithAll<EvaluateFlag>()` — entities with disabled `EvaluateFlag` are completely skipped.

3. **CleanupSystem** re-enables again at end of frame. Repeat.

### Throttle Insertion Point

To skip entities on specific frames, disable `EvaluateFlag` **before** BDP systems run:

```
[AISystemGroup] → [BDPEvaluateFlagThrottleSystem] → [BehaviorTreeSystemGroup] → [CleanupSystem re-enables]
```

## BDPEvaluateFlagThrottleSystem

**File**: `Packages/com.the1studio.dots-bdp/Runtime/AI/BehaviorTrees/BDPEvaluateFlagThrottleSystem.cs`

### How It Works

- Runs in `SimulationSystemGroup`, after `AISystemGroup` (which updates tiers), before `BehaviorTreeSystemGroup`
- Reads `AIUpdateTier` component to determine skip behavior per entity
- Disables `EvaluateFlag` on Tier 1/2 entities on their skip frames using `IJobChunk` (parallel, Burst-compiled)
- Uses `ChunkEntityEnumerator` to respect enableable mask
- Zero archetype change — only flips enableable bits

### Tier Skip Logic (from AIUpdateTierHelper)

| Tier | Update Frequency | Trigger |
|------|-----------------|---------|
| 0 (High) | Every frame | Entity near enemy or has CombatTarget |
| 1 (Medium) | Every 2 frames | Entity mid-range |
| 2 (Low) | Every 4 frames | Entity far from combat |

Phase offset via `(frameCounter + entity.Index) % interval` prevents all Tier N entities from updating on the same frame.

### What Gets Skipped

When `EvaluateFlag` is disabled, BDP skips **everything** for that entity:
- Tree traversal (EvaluationSystem)
- All task systems (conditional checks, action execution)
- Conditional abort reevaluation
- Interrupt processing

The entity's tree state is **frozen** — it resumes exactly where it left off when EvaluateFlag is re-enabled.

## Expected Impact

At 2000 units with typical tier distribution (30% Tier 0, 40% Tier 1, 30% Tier 2):

| Without Throttling | With Throttling | Savings |
|-------------------|-----------------|---------|
| 2000 entities/frame | ~1200 entities/frame avg | ~40% |
| ~15-20ms BDP cost | ~9-12ms BDP cost | ~6-8ms |

Actual savings depend on tree complexity and tier distribution.

## AIUpdateTier Integration

`AIUpdateTierSystem` classifies entities based on proximity to nearest enemy:

```csharp
// AIUpdateTier.Tier values:
// 0 = CombatTarget active OR enemy within 30 units
// 1 = Enemy within 60 units
// 2 = Enemy beyond 60 units (or no enemies perceived)
```

Re-evaluation staggered every 8 frames per entity to avoid tier calculation cost.

## Alternative Performance Strategies

### 1. BehaviorManager Update Mode (GameObject trees only)

Not applicable to baked entity trees. Documented for completeness:
- `EveryFrame` (default), `SpecifySeconds`, `Manual`

### 2. Tree Design Optimization

- Use early-exit selectors (most common branch first)
- Minimize conditional task count per tree
- Use `WaitDuration` as idle fallback to reduce re-traversal rate
- All 3 demo tree archetypes already follow these patterns

### 3. Shared Target Caching

Pre-compute expensive perception results once per frame, let tasks read cached values:
- `DetectionSystem` already writes `PerceivedEntity` buffer
- `AggroSystem` already writes `AggroEntry` buffer
- Task systems read these buffers (no redundant computation)

### 4. Disabling Trees Entirely

For entities that should stop AI completely (dead, stunned, cinematic):
```csharp
// Disable tree permanently (CleanupSystem won't re-enable)
SystemAPI.SetComponentEnabled<EnabledFlag>(entity, false);
```

To resume:
```csharp
SystemAPI.SetComponentEnabled<EnabledFlag>(entity, true);
// EvaluateFlag will be re-enabled by CleanupSystem next frame
```

## Gotchas

| Issue | Fix |
|-------|-----|
| **EvaluateFlag re-enabled every frame** | CleanupSystem uses `IgnoreComponentEnabledState` — throttle must run every frame before BDP |
| **Frozen tree resumes mid-branch** | This is correct behavior — tree state persists. Tasks with `Running` status continue from where they stopped |
| **Dead entities still throttled** | AIUpdateTierSystem has `[WithNone(typeof(DeadTag))]` — dead entities don't get tier updates. Consider disabling `EnabledFlag` on death instead |
| **Tier 0 entities still pay full BDP cost** | By design — combat-active entities need responsive AI. Optimize tree complexity instead |
