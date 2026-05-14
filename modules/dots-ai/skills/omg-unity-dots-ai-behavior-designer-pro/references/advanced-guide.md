---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# Advanced Features — Behavior Designer Pro (DOTS Entity)

> **Prerequisites:** `behavior-designer-pro` (core concepts, entity task patterns)

## Conditional Aborts (ECS)

Selectively reevaluate conditional tasks without traversing the entire tree each frame.

### Abort Types

| Type | Scope | Reevaluated When |
|------|-------|------------------|
| **None** | No reevaluation | Never (default) |
| **Self** | Same parent composite | Any task within current branch is active |
| **Lower Priority** | Right-side branches | Any task to the right of current branch is active |
| **Both** | Self + Lower Priority | Any task in either scope is active |

### Rules
- Only reevaluate **conditional** tasks (never action tasks)
- Trigger on **status transitions** only (not continuous checks)
- Set abort type on the **composite** parent's conditional child

### ECS Reevaluation Pattern

Implement `IReevaluateResponder` on the authoring task:

```csharp
// BDP 3 — 3rd generic replaces the Flag property override
public class MyCondition : ECSConditionalTask<MySystem, MyComponent, MyFlag>, IReevaluateResponder
{
    // Flag property REMOVED — base class implements it via TComponentFlag (BDP 3)
    public ComponentType ReevaluateFlag => typeof(MyReevaluateFlag);
    public System.Type ReevaluateSystemType => typeof(MyReevaluateSystem);
    public override MyComponent GetBufferElement() => new() { Index = RuntimeIndex };
}
```

Reevaluate system differs from main system:
- Uses `ReevaluateFlag` instead of main `Flag`
- Checks `task.Reevaluate` instead of `task.Status`
- Only updates on status **change**
- No branch manipulation

```csharp
[DisableAutoCreation]
[BurstCompile]
public partial struct MyReevaluateSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        foreach (var (tasks, comps) in
            SystemAPI.Query<DynamicBuffer<TaskComponent>, DynamicBuffer<MyComponent>>()
                .WithAll<MyReevaluateFlag, EvaluateFlag>())
        {
            for (int i = 0; i < comps.Length; ++i)
            {
                var task = tasks[comps[i].Index];
                if (!task.Reevaluate) continue;
                var newStatus = EvaluateCondition(comps[i]);
                if (newStatus != task.Status)
                {
                    task.Status = newStatus;
                    tasks[comps[i].Index] = task;
                }
            }
        }
    }
}
```

---

## EvaluateFlag Control

### Disabling Trees Temporarily (Throttling)

`BDPEvaluateFlagThrottleSystem` disables `EvaluateFlag` on skip frames per `AIUpdateTier`. See [performance-throttling-guide.md](performance-throttling-guide.md).

### Disabling Trees Permanently

For dead/stunned/cinematic entities:
```csharp
// Disable permanently (CleanupSystem won't re-enable)
SystemAPI.SetComponentEnabled<EnabledFlag>(entity, false);

// Resume later
SystemAPI.SetComponentEnabled<EnabledFlag>(entity, true);
```

---

## BehaviorTree API (Bootstrap Only)

In DOTS entity workflow, most API is used only during bootstrap.

**BDP 3:** The baked-tree system is auto-bootstrapped on world creation. The old explicit call is deprecated:

```csharp
// BDP 2 pattern — DEPRECATED in BDP 3 (no-op with warning; remove it)
BehaviorTree.EnableBakedBehaviorTreeSystem(World.DefaultGameObjectInjectionWorld);
```

In BDP 3, spawner systems do not need to call anything after `EntityManager.Instantiate()`. The system starts automatically.

### Programmatic Tree Creation (Editor-time)

```csharp
bt.TreeLogicNodes = nodes;
bt.EventNodes = new IEventNode[] { new Start { ConnectedIndex = 0 } };
bt.StartWhenEnabled = true;
bt.Serialize();
```

See [tree-creation-guide.md](tree-creation-guide.md) for the full TreeBuilder API.

---

## System Group Ordering

BDP systems run in `BehaviorTreeSystemGroup` (child of `SimulationSystemGroup`). Custom ordering via bridge systems:

```csharp
// Force: AISystemGroup → BDP → NavigationSystemGroup
[UpdateInGroup(typeof(SimulationSystemGroup))]
[UpdateAfter(typeof(AISystemGroup))]
[UpdateBefore(typeof(BehaviorTreeSystemGroup))]
public partial struct BDPAfterPerceptionBridge : ISystem { }

[UpdateInGroup(typeof(SimulationSystemGroup))]
[UpdateAfter(typeof(BehaviorTreeSystemGroup))]
[UpdateBefore(typeof(NavigationSystemGroup))]
public partial struct BDPBeforeNavigationBridge : ISystem { }
```

Without bridges, BDP may read stale perception data → units stand still.

---

## Subtrees (Editor Feature)

ScriptableObjects storing reusable behavior tree data for modular reuse:
- **Subtree Reference Task** — loads subtrees at graph initialization
- **Dynamic Selection** — subclass `SubtreeReference`, override `EvaluateSubtrees()`
- **Pooling** — `Object.Instantiate()` + `Deserialize()` + `Pooled = true`

Note: Subtrees are primarily an editor authoring feature. For programmatic trees (our approach), use `TreeBuilder` directly.
