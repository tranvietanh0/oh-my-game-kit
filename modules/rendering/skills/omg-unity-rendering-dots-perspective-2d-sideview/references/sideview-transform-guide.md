---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Side-View Transform Guide

## The Z-Position Feedback Loop Problem

Without save/restore, the visual Z transform feeds back into simulation:

```
Frame 1: Z = 10.0 → TransformSystem: Z *= 0.1 → Z = 1.0
Frame 2: Z = 1.0  → TransformSystem: Z *= 0.1 → Z = 0.1
Frame 3: Z = 0.1  → TransformSystem: Z *= 0.1 → Z = 0.01
```

All units collapse to Z=0 within seconds. Navigation breaks, AI breaks, everything breaks.

## Solution: SideViewRestoreSystem + SideViewTransformSystem

### SideViewRestoreSystem (SimulationSystemGroup, OrderFirst)

Runs before any simulation. Restores canonical positions.

```csharp
[BurstCompile]
[UpdateInGroup(typeof(SimulationSystemGroup), OrderFirst = true)]
public partial struct SideViewRestoreSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        if (!SystemAPI.HasSingleton<SideViewConfig>()) return;

        // Add SideViewGameZ to new entities (projectiles, AoE, etc.)
        var ecb = new EntityCommandBuffer(state.WorldUnmanaged.UpdateAllocator.ToAllocator);
        foreach (var (transform, entity) in
            SystemAPI.Query<RefRO<LocalTransform>>()
                .WithNone<SideViewGameZ>()
                .WithEntityAccess())
        {
            ecb.AddComponent(entity, new SideViewGameZ { Value = transform.ValueRO.Position.z });
        }
        ecb.Playback(state.EntityManager);

        // Restore canonical Z, reset Y to ground
        new RestoreJob().ScheduleParallel();
    }

    [BurstCompile]
    partial struct RestoreJob : IJobEntity
    {
        void Execute(ref LocalTransform transform, in SideViewGameZ gameZ)
        {
            transform.Position.z = gameZ.Value;
            transform.Position.y = 0f;
        }
    }
}
```

### SideViewTransformSystem (PresentationSystemGroup)

Runs after all simulation, before rendering.

```csharp
[BurstCompile]
[UpdateInGroup(typeof(PresentationSystemGroup))]
[RequireMatchingQueriesForUpdate]
public partial struct SideViewTransformSystem : ISystem
{
    public void OnCreate(ref SystemState state)
    {
        state.RequireForUpdate<SideViewConfig>();
    }

    public void OnUpdate(ref SystemState state)
    {
        var config = SystemAPI.GetSingleton<SideViewConfig>();
        new SideViewJob {
            DepthScale = config.DepthScale,
            BaseY = config.BaseY,
            DepthSpread = config.DepthSpread,
        }.ScheduleParallel();
    }

    [BurstCompile]
    partial struct SideViewJob : IJobEntity
    {
        public float DepthScale, BaseY, DepthSpread;

        void Execute(ref LocalTransform transform, ref SideViewGameZ gameZ)
        {
            gameZ.Value = transform.Position.z;                    // Save
            transform.Position.y = BaseY + transform.Position.z * DepthScale;  // Remap
            transform.Position.z *= DepthSpread;                   // Spread
        }
    }
}
```

## SideViewConfig Values

| Parameter | Typical Value | Purpose |
|-----------|--------------|---------|
| DepthScale | 0.3 | Z=10 maps to Y=3. Controls vertical spread |
| BaseY | 0.0 | Ground line offset |
| DepthSpread | 0.1 | Z values scaled to prevent depth-buffer fighting |

## SideViewGameZ Initialization

The RestoreSystem adds `SideViewGameZ` to ALL entities with `LocalTransform` but without `SideViewGameZ`. This covers:
- Newly spawned units (via FormationSpawner)
- Projectiles (spawned by RangedAttackSystem)
- AoE effects (spawned by MageAttackSystem)
- Any other dynamically created entities

Without this, projectiles and AoE would not get Z-to-Y remapping and would be invisible (rendered at Z=0 behind the camera).

## Authoring Setup

Add a `SideViewAuthoring` MonoBehaviour to a GameObject in the SubScene:

```csharp
public class SideViewAuthoring : MonoBehaviour {
    public float DepthScale = 0.3f;
    public float BaseY = 0f;
    public float DepthSpread = 0.1f;
}
// Baker creates SideViewConfig singleton
```

## System Ordering Summary

```
SimulationSystemGroup:
  SideViewRestoreSystem (OrderFirst) → restore Z, reset Y
  ... all simulation systems (nav, physics, AI, combat) ...

PresentationSystemGroup:
  SideViewTransformSystem → save Z, remap Y, spread Z
  ... rendering ...
```
