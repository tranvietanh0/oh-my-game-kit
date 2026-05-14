---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Material Overrides Guide

## Per-Entity Material Property Overrides

`IComponentData` structs tagged with `[MaterialProperty]` are GPU-uploaded per-entity,
bypassing material instancing overhead.

### Step 1: Declare Override Components

```csharp
// Namespace: DOTSAI.Rendering
using Unity.Entities;
using Unity.Mathematics;
using Unity.Rendering;

// Matches shader property "_BaseColor" (float4 / Color)
[MaterialProperty("_BaseColor")]
public struct EntityBaseColor : IComponentData
{
    public float4 Value;
}

// Matches "_Metallic" (float scalar)
[MaterialProperty("_Metallic")]
public struct EntityMetallic : IComponentData
{
    public float Value;
}

// Matches "_EmissionColor" (float4 / HDR Color)
[MaterialProperty("_EmissionColor")]
public struct EntityEmission : IComponentData
{
    public float4 Value;
}
```

### Step 2: Register on Entity (Baking or Runtime)

```csharp
em.AddComponentData(entity, new EntityBaseColor { Value = new float4(1, 0, 0, 1) });
em.AddComponentData(entity, new EntityMetallic { Value = 0.8f });
```

### Step 3: Animate in a System

```csharp
using Unity.Entities;

[BurstCompile]
[UpdateInGroup(typeof(SimulationSystemGroup))]
public partial struct ColorAnimationSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float t = (float)SystemAPI.Time.ElapsedTime;
        foreach (var color in SystemAPI.Query<RefRW<EntityBaseColor>>())
        {
            color.ValueRW.Value = new float4(
                math.sin(t) * 0.5f + 0.5f,
                math.cos(t) * 0.5f + 0.5f,
                0.5f, 1f);
        }
    }
}
```

## Critical Naming Rules

- For URP Lit shader: `_BaseColor`, `_Metallic`, `_Smoothness`, `_EmissionColor`
- For ShaderGraph: use the **Reference** name (not Display Name) — set in the node's properties panel
- Type must match exactly: `float4` for Color/Vector, `float` for Float, `float2` for Vector2

## Debugging Material Overrides

| Symptom | Cause | Fix |
|---------|-------|-----|
| Material override not working | Property name mismatch | Check shader Reference name in ShaderGraph (not Display Name) |
| All entities same color | Component not added to entity | `em.AddComponentData(e, new EntityBaseColor{...})` |

## Pattern: Color Flashing (Health Damage)

```csharp
[MaterialProperty("_BaseColor")]
public struct FlashColor : IComponentData { public float4 Value; }

public struct FlashTimer : IComponentData { public float Remaining; }

[BurstCompile]
[UpdateInGroup(typeof(SimulationSystemGroup))]
public partial struct FlashSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float dt = SystemAPI.Time.DeltaTime;
        foreach (var (flash, color) in
            SystemAPI.Query<RefRW<FlashTimer>, RefRW<FlashColor>>())
        {
            flash.ValueRW.Remaining -= dt;
            float t = flash.ValueRO.Remaining / 0.3f; // 0.3s flash
            color.ValueRW.Value = math.lerp(
                new float4(1, 1, 1, 1),   // white flash
                new float4(1, 0, 0, 1),   // red tint
                math.saturate(t));
        }
    }
}
```
