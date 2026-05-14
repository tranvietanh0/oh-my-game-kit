---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Authoring, Baking & Config Guide — Unity DOTS Physics

## Baking Workflow

Custom `PhysicsBodyAuthoring`/`PhysicsShapeAuthoring` MonoBehaviours are deprecated since 1.0.
To use the built-in workflow, place a **Rigidbody + Collider** (BoxCollider, etc.) in a SubScene — they auto-bake.

To get fine-grained control, write a custom baker:

```csharp
public class PhysicsBallAuthoring : MonoBehaviour
{
    public float Radius = 0.5f;
    public float Mass = 1f;
    public bool IsKinematic;
}

public class PhysicsBallBaker : Baker<PhysicsBallAuthoring>
{
    public override void Bake(PhysicsBallAuthoring authoring)
    {
        var entity = GetEntity(TransformUsageFlags.Dynamic);

        var geo = new SphereGeometry { Center = float3.zero, Radius = authoring.Radius };
        var collider = SphereCollider.Create(geo, CollisionFilter.Default);
        AddComponent(entity, new PhysicsCollider { Value = collider });
        AddSharedComponentManaged(entity, new PhysicsWorldIndex { Value = 0 });

        if (!authoring.IsKinematic)
        {
            unsafe
            {
                var ptr = (Collider*)collider.GetUnsafePtr();
                AddComponent(entity, PhysicsMass.CreateDynamic(ptr->MassProperties, authoring.Mass));
            }
            AddComponent(entity, new PhysicsVelocity());
            AddComponent(entity, new PhysicsDamping { Linear = 0.01f, Angular = 0.05f });
            AddComponent(entity, new PhysicsGravityFactor { Value = 1f });
        }
    }
}
```

## PhysicsStep — Global Physics Settings

Add the `Physics Step` authoring component to a SubScene entity, or configure at runtime:

```csharp
[BurstCompile]
[UpdateInGroup(typeof(InitializationSystemGroup))]
public partial struct ConfigurePhysicsSystem : ISystem
{
    [BurstCompile]
    public void OnCreate(ref SystemState state)
    {
        state.RequireForUpdate<PhysicsStep>();
    }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var step = SystemAPI.GetSingletonRW<PhysicsStep>();
        ref var s = ref step.ValueRW;

        s.Gravity              = new float3(0, -15f, 0); // stronger gravity
        s.SolverIterationCount = 4;                       // default 4; more = stable
        s.SubstepCount         = 2;                       // substeps for fast objects
        s.MultiThreaded        = 1;

        state.Enabled = false; // run once
    }
}
```

## System Update Order

```
FixedStepSimulationSystemGroup
  └── PhysicsSystemGroup
        ├── PhysicsInitializeGroup    (broadphase, build collision world)
        ├── PhysicsSimulationGroup    (narrowphase, solve, integrate)
        └── ExportPhysicsWorld        (write back to ECS components)
```

To read physics data **before** simulation advances, use:

```csharp
[UpdateInGroup(typeof(FixedStepSimulationSystemGroup))]
[UpdateBefore(typeof(PhysicsSystemGroup))]
```

To react to simulation results, use:

```csharp
[UpdateInGroup(typeof(PhysicsSystemGroup))]
[UpdateAfter(typeof(PhysicsSimulationGroup))]
```

## Gotchas

| Issue | Fix |
|-------|-----|
| Custom `PhysicsBodyAuthoring` missing | It's a Package Sample — import "Custom Physics Authoring" from Package Manager |
| `GetSingleton<PhysicsWorldSingleton>` fails | Call in `OnUpdate`, not `OnCreate` |

## Sources

- [Unity Physics 1.4 Docs](https://docs.unity3d.com/Packages/com.unity.physics@1.4/manual/index.html)
- [Physics Collider Components](https://docs.unity3d.com/Packages/com.unity.physics@1.4/manual/physics-collider-components.html)
- [Collision Queries 1.4](https://docs.unity3d.com/Packages/com.unity.physics@1.4/manual/collision-queries.html)
- [Simulation Results / Events](https://docs.unity3d.com/Packages/com.unity.physics@1.0/manual/simulation-results.html)
- [Physics Singletons](https://docs.unity3d.com/Packages/com.unity.physics@1.0/manual/physics-singletons.html)
- [PhysicsJoint API](https://docs.unity3d.com/Packages/com.unity.physics@1.0/api/Unity.Physics.PhysicsJoint.html)
- [PhysicsStep API](https://docs.unity.cn/Packages/com.unity.physics@1.4/api/Unity.Physics.PhysicsStep.html)
- [EntityComponentSystemSamples — Physics](https://github.com/Unity-Technologies/EntityComponentSystemSamples)
