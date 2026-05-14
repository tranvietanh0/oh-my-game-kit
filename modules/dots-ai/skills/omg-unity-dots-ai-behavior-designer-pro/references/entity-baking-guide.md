---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# Entity Baking — Behavior Designer Pro

> **Prerequisites:** `dots-ecs-core` (Baker, IComponentData, ISystem)

## What Is Entity Baking?

Pre-processing authoring data into runtime ECS data. The `BehaviorTree` component has a built-in Baker that automatically bakes behavior tree data when:
- Component is enabled
- Behavior tree starts when enabled

## Automatic Baking

No manual steps needed for SubScene workflows — just add `BehaviorTree` component to a GameObject in a SubScene. The Baker handles conversion automatically.

## Manual Spawning Workflow

For spawning multiple behavior tree entities at runtime (e.g., 100 AI agents):

### Step 1: Spawn Data Component

```csharp
public struct SpawnData : IComponentData
{
    [Tooltip("The entity prefab that should be spawned.")]
    public Entity Prefab;
}
```

### Step 2: Authoring + Baker

```csharp
using UnityEngine;
using Unity.Entities;

public class EntitySpawner : MonoBehaviour
{
    [Tooltip("A reference to the behavior tree prefab.")]
    [SerializeField] protected GameObject m_SpawnPrefab;

    private class Baker : Baker<EntitySpawner>
    {
        public override void Bake(EntitySpawner authoring)
        {
            if (authoring.m_SpawnPrefab == null)
                return;

            var entity = GetEntity(TransformUsageFlags.Dynamic);
            var entityPrefab = GetEntity(authoring.m_SpawnPrefab, TransformUsageFlags.Dynamic);
            AddComponentObject(entity, new SpawnData { Prefab = entityPrefab });
        }
    }
}
```

### Step 3: Spawner System

```csharp
using Unity.Collections;
using Unity.Entities;

public partial struct EntitySpawnerSystem : ISystem
{
    private void OnCreate(ref SystemState state)
    {
        state.RequireForUpdate<SpawnData>();
    }

    private void OnUpdate(ref SystemState state)
    {
        // Run once
        state.Enabled = false;

        var spawner = SystemAPI.ManagedAPI.GetSingleton<SpawnData>();
        var entities = state.EntityManager.Instantiate(spawner.Prefab, 100, Allocator.Temp);

        // Custom setup: add components, enable flags, set data, etc.

        // BDP 3: No explicit bootstrap call needed — auto-bootstrapped on world creation
    }
}
```

## BDP 3 Auto-Bootstrap

**BDP 3 auto-bootstraps the baked-tree system on world creation.** No explicit API call is needed after instantiating baked entities.

The old `BehaviorTree.EnableBakedBehaviorTreeSystem(World world)` call is **deprecated** in BDP 3 — it is a no-op and emits a deprecation warning. Remove it from any spawner or bootstrap system. If your project's bootstrap file's only surviving line was this deprecated call, delete the file.

> **Migrating from BDP 2?** See [migration-2-to-3-guide.md](migration-2-to-3-guide.md) for the full deprecation recipe.

## Debugging Limitation

Spawned baked entities **cannot** be debugged in the visual editor currently.

**Workaround:** Place Entity in a SubScene with `BehaviorTree` component attached for visual debugging.

## Workflow Summary

```
1. Create prefab with BehaviorTree component + behavior tree asset
2. Create SpawnData component + Baker to reference prefab
3. Create spawner system that:
   a. Instantiates prefab entities
   b. Performs custom setup
   (BDP 3: no explicit bootstrap call — auto-bootstrapped on world creation)
4. Place EntitySpawner MonoBehaviour in SubScene
```
