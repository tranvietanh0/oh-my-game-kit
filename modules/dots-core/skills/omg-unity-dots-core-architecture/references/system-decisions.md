---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# System Design Decisions

## Decision Tree: Create New vs Update Existing?

```
Need new logic?
├─ Does an existing system already handle this domain?
│  ├─ YES → Does adding this logic violate SRP?
│  │  ├─ YES (different concern) → CREATE new system
│  │  └─ NO (same concern, small addition) → UPDATE existing system
│  └─ NO → CREATE new system
└─ Is it a variation of existing behavior?
   ├─ YES → Can it be handled by query filters (tag components)?
   │  ├─ YES → CREATE new system with different query (OCP)
   │  └─ NO → CREATE new system
   └─ NO → CREATE new system
```

## SRP Violation Signals (Split the System)

- System file exceeds **150 lines** → likely doing too much
- System imports **5+ module namespaces** → touching too many concerns
- System has **2+ distinct passes** over different queries → extract passes into systems
- System name contains **"And"** → `DetectionAndAggroSystem` should be `DetectionSystem` + `AggroSystem`
- System **reads buffer AND writes to a different buffer** in same loop → producer/consumer should be separate
- Method has **3+ levels of nesting** inside the main loop → extract inner logic

## System Responsibility Patterns

| Pattern | System Count | Example |
|---------|-------------|---------|
| **Producer** | 1 | `DetectionSystem` → writes `PerceivedEntity` buffer |
| **Consumer** | 1 | `HasEnemyInRangeTask` → reads `PerceivedEntity` buffer |
| **Processor** | 1 | `DamageProcessingSystem` → reads+clears `DamageEvent` buffer |
| **Bridge** | 1 | `AgentNavigationBridgeSystem` → reads RPG data, writes Nav data |
| **Sync** | 1 | `StatSyncSystem` → reads `DerivedStats`, writes `Health.Max` |
| **Tick** | 1 | `AttackTimerSystem` → decrements timer each frame |

**Rule**: Each system fits exactly ONE pattern. If it spans two patterns, split it.

## System Ordering Rules

```
1. [UpdateInGroup(typeof(MySystemGroup))]     — ALWAYS specify group
2. [UpdateBefore/After] only works within SAME group (siblings)
3. OrderFirst/OrderLast override Before/After
4. Cross-group ordering: order the GROUPS, not individual systems
5. Perception → Decision → Execution (3-layer architecture)
```

**Recommended Group Layout:**
```
SimulationSystemGroup
├─ AISystemGroup (OrderFirst)
│  ├─ DetectionSystem
│  ├─ AggroSystem
│  └─ LeashInitSystem
├─ BehaviorSystemGroup
│  └─ BDP / FSM / custom decision systems
├─ NavigationSystemGroup
│  ├─ BridgeSystem (OrderFirst)
│  └─ CCOverrideSystem (OrderLast)
├─ SkillsSystemGroup
├─ CombatSystemGroup
├─ StatsSystemGroup
└─ SpawningSystemGroup (OrderLast)
```

## Performance Decision: Main Thread vs Job?

```
Is the system iterating N entities with M lookups per entity?
├─ N × M < 100 → Main thread SystemAPI.Query is fine
├─ N × M < 10,000 → IJobEntity with ComponentLookup<T>
└─ N × M > 10,000 → IJobEntity + spatial acceleration (SpatialHashGrid)
```

| Access Pattern | Tool |
|---------------|------|
| Iterate all entities with components | `SystemAPI.Query<>` (main thread) or `IJobEntity` |
| Random access by entity | `ComponentLookup<T>` (in job) or `SystemAPI.GetComponent` (main thread) |
| Nearby entities | `SpatialHashGrid` + `ComponentLookup<T>` |
| Structural changes in job | `EntityCommandBuffer.ParallelWriter` with `[ChunkIndexInQuery]` |

## Bridge Pattern (DIP for External Dependencies)

When integrating external packages (navigation, physics, networking):

```
[AI Layer] → writes NavigationTarget (abstraction)
[Bridge System] → reads NavigationTarget, writes AgentBody (concrete)
[Nav Package] → reads AgentBody, does pathfinding
```

**Rules:**
1. AI systems never import the external package namespace
2. Bridge system is the ONLY system that imports both namespaces
3. Bridge system lives in its own module/asmdef
4. Swapping navigation backend = rewrite ONE bridge system

## Common Mistakes

- Putting logic in `OnCreate` that should run every frame → use `OnUpdate`
- Missing `[BurstCompile]` on struct OR methods → must be on both
- Missing `state.RequireForUpdate<T>()` → system runs even when no matching entities exist
- Writing to `DynamicBuffer` from `SystemAPI.Query` → use `SystemAPI.GetBuffer(entity)` for writable access
- Forgetting `[DisableAutoCreation]` on manually-scheduled systems → system runs twice
- Using `SystemAPI.GetComponent` in parallel job → use `ComponentLookup<T>` instead
- `[UpdateBefore]` across different groups → has no effect (silent bug)
