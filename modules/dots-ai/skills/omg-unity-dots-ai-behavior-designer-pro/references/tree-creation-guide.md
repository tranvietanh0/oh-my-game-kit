---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# Programmatic Tree Creation — Behavior Designer Pro

> **Prerequisites:** `behavior-designer-pro` (core concepts) · `advanced-guide.md` (BehaviorTree API)

## Key API

| API | Description |
|-----|-------------|
| `bt.TreeLogicNodes` (get/set) | Public property for flat `ITreeLogicNode[]` array |
| `ITreeLogicNode.Index` | Node index in the array |
| `ITreeLogicNode.ParentIndex` | Parent's index (`ushort.MaxValue` = root) |
| `ITreeLogicNode.SiblingIndex` | Next sibling's index (`ushort.MaxValue` = last child) |
| `ITreeLogicNode.RuntimeIndex` | Set to `ushort.MaxValue` (assigned at runtime) |

**IMPORTANT:** `BehaviorTree.Data` is **private**. Use `bt.TreeLogicNodes` to get/set the node array.

## CRITICAL: Serialization & Event Nodes for Baking

Setting `bt.TreeLogicNodes` alone is NOT enough for baking. The baker reads serialized `m_Data`:

1. **Set EventNodes** — `InitializeTree()` requires `m_Data.EventNodes != null`. Without a `Start` event node, baker produces **zero** `TaskComponent`/`BranchComponent` buffers.
2. **Set StartWhenEnabled** — Baker guard checks `behaviorTree.StartWhenEnabled`. Must be `true`.
3. **Call `bt.Serialize()`** — Persists both properties to serialized `m_Data`.

```csharp
public void Apply(BehaviorTree bt)
{
    bt.TreeLogicNodes = _nodes.ToArray();
    bt.EventNodes = new IEventNode[] { new Start { ConnectedIndex = 0 } };
    bt.StartWhenEnabled = true;
    bt.Serialize();
}
```

**Without these 3 steps:** Trees appear baked but never execute. No errors logged.

## Node Storage: Depth-First Pre-Order

Nodes stored as flat array. Relationships encoded via indices:

```
Array:  [Selector(0), Sequence(1), HasEnemy(2), Chase(3), Patrol(4)]
Parent:   Max            0             1           1          0
Sibling:  Max            4             3          Max        Max
```

- First child of composite N is at index `N + 1`
- Siblings linked via `SiblingIndex`; last sibling uses `ushort.MaxValue`

## Fluent Builder Pattern (BattleDemo)

```csharp
#if UNITY_EDITOR
var builder = new TreeBuilder();
builder.Decorator<Repeater>(r => r.RepeatForever = true, root =>
{
    root.Composite<Selector>(sel =>
    {
        sel.Composite<Sequence>(flee =>
        {
            flee.Conditional<IsHealthBelow>(t => t.Threshold = 0.2f);
            flee.Action<Flee>(t => t.FleeDistance = 15f);
        });
        sel.Composite<Sequence>(combat =>
        {
            combat.Conditional<HasEnemyInRange>();
            combat.Action<SelectHighestThreat>();
            combat.Action<SetNavigationToTarget>();
        });
    });
});
builder.Apply(bt);
#endif
```

## Builder Implementation

`TreeBuilder` stores `List<ITreeLogicNode>`, assigns `Index`/`ParentIndex`/`SiblingIndex`/`RuntimeIndex` on `Add()`, and calls `Apply()` to set `TreeLogicNodes`, `EventNodes`, `StartWhenEnabled`, then `Serialize()`. `ChildBuilder` wraps `TreeBuilder` to track child indices per composite and link siblings.

## Critical Gotchas

1. **Repeater(RepeatForever=true) is MANDATORY** for baked entity trees. Without it, trees permanently die when all branches fail. `new Repeater()` does NOT call `Reset()` — `m_RepeatForever` defaults to `false`. Set it explicitly.
2. **Start event node is required.** Without it, `InitializeTree()` returns false and no buffers are created.
3. **SetNavigationToTarget must return Running** when within engage range (not Success), to avoid rapid tree cycling.

## Task Type Constraints

| Builder Method | Generic Constraint | BDP Base Types |
|----------------|-------------------|----------------|
| `Composite<T>` | `ITreeLogicNode, IParentNode, new()` | `Selector`, `Sequence`, `Parallel` |
| `Decorator<T>` | `ITreeLogicNode, IParentNode, new()` | `Inverter`, `Repeater`, `Cooldown` |
| `Conditional<T>` | `ITreeLogicNode, new()` | `ECSConditionalTask<S,C,F>` subtypes (BDP 3) |
| `Action<T>` | `ITreeLogicNode, new()` | `ECSActionTask<S,C,F>` subtypes (BDP 3) |

## Configurable Task Fields

| Task | Field | Type | Default |
|------|-------|------|---------|
| `IsHealthBelow` | `Threshold` | float | 0.5 |
| `HasEnemyInRange` | `OverrideRange` | float | — |
| `WaitDuration` | `Duration` | float | 1 |
| `Flee` | `FleeDistance` | float | 10 |
| `HasReachedDestination` | `ArrivalDistanceSq` | float | 1 |
| `HasAllyNearby` | `Range` | float | 10 |

## Menu Item Integration

```csharp
[MenuItem("Tools/BattleDemo/Build Behavior Trees")]
public static void BuildAll()
{
    BuildTree("RedMelee", MeleeTree);
    AssetDatabase.SaveAssets();
}

static void BuildTree(string prefabName, Action<TreeBuilder> define)
{
    var contents = PrefabUtility.LoadPrefabContents(path);
    var bt = contents.GetComponent<BehaviorTree>() ?? contents.AddComponent<BehaviorTree>();
    var builder = new TreeBuilder();
    define(builder);
    builder.Apply(bt);
    PrefabUtility.SaveAsPrefabAsset(contents, path);
    PrefabUtility.UnloadPrefabContents(contents);
}
```

## BattleDemo Tree Archetypes

| Archetype | Structure (all wrapped in Repeater) |
|-----------|---------------------------------------|
| **Melee** | Selector(Flee → Combat → Patrol → Idle) |
| **Ranger** | Selector(Flee → Leash → Combat → Patrol → Idle) |
| **Mage** | Selector(Flee → **Summon** → Combat → Patrol → Idle) |
| **Boss** | Selector(Leash → **Summon** → Combat → Patrol → Idle, no flee) |

**Mage summon sequence**: `IsSummonReady` conditional → `EnableSummonRequest` action. Fires before combat so mages always summon when off cooldown.

**Boss summon sequence**: Same pattern — `IsSummonReady` → `EnableSummonRequest`. Boss leashes first, then attempts summon, then combat.

## Extending the Editor

- **Control Types** — custom inspector controls for task fields
- **Node Views** — custom visual representations in graph editor
- Register via **Tools -> Opsive -> Unit Options**
