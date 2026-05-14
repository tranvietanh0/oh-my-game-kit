---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
---

# BDP Tactical Pack — DOTS Integration Pattern

Tactical Pack tasks use **MonoBehaviour-based NavMesh movement** by default. For DOTS entity mode, wrap each task in the standard ECS task pattern from `behavior-designer-pro` skill:

## File Structure

```
TacticalAttack/
├── TacticalAttackTask.cs         (ECSActionTask<TacticalAttackSystem, TacticalAttackComponent, TacticalAttackFlag>)
├── TacticalAttackComponent.cs    (IBufferElementData — task state)
├── TacticalAttackFlag.cs         (IEnableableComponent — active signal)
├── TacticalAttackSystem.cs       (ISystem + [BurstCompile])
└── TacticalAttackJob.cs          (IJobEntity)
```

> **BDP 3 wrapper form:** `ECSActionTask<TSystem, TBufferElement, TComponentFlag>` — 3 type params (added `TComponentFlag` in BDP 3). The BDP 2 form `ECSActionTask<TSystem, TBuffer>` is no longer valid.

## Data Flow for Group Attack (DOTS Mode)

```
BDP triggers TacticalAttackFlag
    → TacticalAttackSystem reads: CombatTarget, LocalTransform, FormationGroupData
    → Writes: NavigationTarget (move into attack range)
    → When in range: writes DamageEvent to target entity buffer
    → AgentNavigationBridgeSystem consumes NavigationTarget → moves unit
    → DamageProcessingSystem consumes DamageEvent → reduces Health
```

## Group Membership via ECS Component

```csharp
public struct FormationGroupData : IComponentData
{
    public int GroupID;
    public bool IsLeader;
}
```
