---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# Entity Tasks (ECS) — Behavior Designer Pro

> **Prerequisites:** `dots-ecs-core` (ISystem, IBufferElementData, EntityQuery) · `dots-jobs-burst` (IJobEntity, BurstCompile)

## When to Use

Use Entity tasks when you have 100+ behavior trees or tasks are computationally heavy. Burst-compiled and job-parallel.

## Architecture (6 Components per Task)

| Component | Required | Purpose |
|-----------|----------|---------|
| **Authoring Object** | Yes | Added to graph, no runtime logic |
| **Component Struct** (`IBufferElementData`) | Yes | Runtime data with mandatory `Index` field |
| **Flag** (`IComponentData, IEnableableComponent`) | Yes | Indicates task is active |
| **System** (`ISystem`, `[DisableAutoCreation]`) | Yes | Executes task logic |
| **Job** (`IJobEntity`) | Optional | Parallel execution |
| **Reevaluation System + Flag** | Optional | For conditional abort reevaluation |

## Base Classes (BDP 3)

| Task Type | Base Class | Note |
|-----------|------------|------|
| Action | `ECSActionTask<TSystem, TComponent, TComponentFlag>` | 3rd generic = XxxFlag struct |
| Conditional | `ECSConditionalTask<TSystem, TComponent, TComponentFlag>` | 3rd generic = XxxFlag struct |
| Composite | `ECSCompositeTask<TSystem, TComponent, TComponentFlag>` | New in BDP 3 |
| Decorator | `ECSDecoratorTask<TSystem, TComponent, TComponentFlag>` | New in BDP 3 |

The 3rd generic `TComponentFlag` is the per-task `XxxFlag : IComponentData, IEnableableComponent` struct. The base class implements `Flag => typeof(TComponentFlag)` directly — do NOT add a `Flag` property override, or you will get a CS0108 warning.

## Authoring Pattern (BDP 3)

```csharp
[Opsive.Shared.Utility.Category("ECS Example")]
public class WithinDistance : ECSConditionalTask<WithinDistanceTaskSystem, WithinDistanceComponent, WithinDistanceFlag>, IReevaluateResponder
{
    // Flag property REMOVED — base class implements it via TComponentFlag (BDP 3)
    public ComponentType ReevaluateFlag => typeof(WithinDistanceReevaluateFlag);
    public System.Type ReevaluateSystemType => typeof(WithinDistanceReevaluateTaskSystem);
    public override WithinDistanceComponent GetBufferElement() => new() { Index = RuntimeIndex };
}
```

## Component & Flags

```csharp
public struct WithinDistanceComponent : IBufferElementData
{
    public ushort Index;    // Mandatory — maps to TaskComponent buffer
    public float3 Origin;
    public float3 Target;
    public float Distance;
}

public struct WithinDistanceFlag : IComponentData, IEnableableComponent { }
public struct WithinDistanceReevaluateFlag : IComponentData, IEnableableComponent { }
```

## System Pattern

```csharp
[DisableAutoCreation]
public partial struct WithinDistanceTaskSystem : ISystem
{
    private EntityQuery m_Query;

    [BurstCompile]
    private void OnCreate(ref SystemState state)
    {
        m_Query = new EntityQueryBuilder(Allocator.Temp)
            .WithAllRW<TaskComponent>()
            .WithAll<BranchComponent, WithinDistanceComponent, WithinDistanceFlag, EvaluateFlag>()
            .Build(ref state);
    }

    [BurstCompile]
    private void OnUpdate(ref SystemState state)
    {
        state.Dependency = new WithinDistanceJob().ScheduleParallel(m_Query, state.Dependency);
    }
}
```

## Job Pattern

```csharp
[BurstCompile]
private partial struct WithinDistanceJob : IJobEntity
{
    [BurstCompile]
    public void Execute(
        ref DynamicBuffer<BranchComponent> branches,
        ref DynamicBuffer<TaskComponent> tasks,
        ref DynamicBuffer<WithinDistanceComponent> comps)
    {
        for (int i = 0; i < comps.Length; ++i)
        {
            var comp = comps[i];
            var task = tasks[comp.Index];
            var branch = branches[task.BranchIndex];
            if (!branch.CanExecute || (task.Status != TaskStatus.Queued && task.Status != TaskStatus.Running))
                continue;
            task.Status = math.distance(comp.Origin, comp.Target) < comp.Distance
                ? TaskStatus.Success : TaskStatus.Failure;
            tasks[comp.Index] = task;
        }
    }
}
```

## Reevaluation System (Conditional Tasks Only)

Differences from main system: uses `ReevaluateFlag`, checks `task.Reevaluate` instead of status, only updates on status **change**, no branch manipulation.

```csharp
[DisableAutoCreation]
public partial struct WithinDistanceReevaluateTaskSystem : ISystem
{
    [BurstCompile]
    private void OnUpdate(ref SystemState state)
    {
        foreach (var (tasks, comps) in
            SystemAPI.Query<DynamicBuffer<TaskComponent>, DynamicBuffer<WithinDistanceComponent>>()
                .WithAll<WithinDistanceReevaluateFlag, EvaluateFlag>())
        {
            for (int i = 0; i < comps.Length; ++i)
            {
                var comp = comps[i];
                var task = tasks[comp.Index];
                if (!task.Reevaluate) continue;
                var status = math.distance(comp.Origin, comp.Target) < comp.Distance
                    ? TaskStatus.Success : TaskStatus.Failure;
                if (status != task.Status) { task.Status = status; tasks[task.Index] = task; }
            }
        }
    }
}
```

## Critical Rules

1. **`[DisableAutoCreation]`** on all task systems — BDP manages lifecycle
2. **`[BurstCompile]`** on systems and jobs
3. **`EvaluateFlag`** in query — skips disabled behavior trees
4. **Query must match Execute()** — include ALL component types from `Execute()` params (DynamicBuffers, RefRO/RefRW, `in` params). Missing types cause `InvalidOperationException`
5. **Parallel `ComponentLookup` writes** — use `[NativeDisableParallelForRestriction]` (from `Unity.Collections.LowLevel.Unsafe`) when each entity only writes to itself
6. **`Index` field** mandatory in component — maps to `TaskComponent`
7. **Entity tasks are independent** — cannot be stacked like GameObject actions
8. **BDP 3: No `Flag` property override** — base class supplies it via the 3rd generic. Adding one causes CS0108. Remove all `public override ComponentType Flag => typeof(XxxFlag);` lines when migrating from BDP 2
