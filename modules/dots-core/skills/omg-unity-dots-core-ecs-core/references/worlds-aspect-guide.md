---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Worlds, Bootstrap & IAspect Guide — Unity DOTS ECS

## Worlds & Bootstrap

```csharp
// Access default world
World defaultWorld = World.DefaultGameObjectInjectionWorld;
EntityManager em = defaultWorld.EntityManager;

// Custom bootstrap — runs before world creation
[UnityEngine.Scripting.Preserve]
public class MyBootstrap : ICustomBootstrap
{
    public bool Initialize(string defaultWorldName)
    {
        var world = new World(defaultWorldName, WorldFlags.GameClient);
        World.DefaultGameObjectInjectionWorld = world;

        // Add default systems
        var systems = DefaultWorldInitialization.GetAllSystems(
            WorldSystemFilterFlags.Default);
        DefaultWorldInitialization.AddSystemsToRootLevelSystemGroups(
            world, systems);

        // Add custom system
        world.AddSystemManaged(new MyInitSystem());

        ScriptBehaviourUpdateOrder.AppendWorldToCurrentPlayerLoop(world);
        return true;
    }
}

// Access/create a system at runtime
var sys = World.DefaultGameObjectInjectionWorld
    .GetOrCreateSystemManaged<MyManagedSystem>();
```

---

## IAspect (Deprecated)

> Deprecated in Entities 1.4+ (will be removed in a future release). Prefer direct SystemAPI.Query. Documented for legacy migration.

```csharp
// Must be readonly partial struct
public readonly partial struct HealthAspect : IAspect
{
    // Required: entity reference
    public readonly Entity Entity;

    // RefRW/RefRO for IComponentData
    readonly RefRW<Health> _health;

    // EnabledRefRW for IEnableableComponent
    public readonly EnabledRefRW<Stunned> StunnedEnabled;

    // DynamicBuffer
    public readonly DynamicBuffer<DamageEvent> DamageEvents;

    public float CurrentHealth => _health.ValueRO.Current;

    public void TakeDamage(float amount)
    {
        _health.ValueRW.Current -= amount;
        if (_health.ValueRO.Current <= 0)
            StunnedEnabled.ValueRW = false;
    }
}

// Use in system
foreach (var health in SystemAPI.Query<HealthAspect>())
{
    health.TakeDamage(10f);
}
```

---

## Common Gotchas

| Issue | Fix |
|-------|-----|
| IAspect partial struct generates errors | Ensure `partial` keyword; all fields must use allowed types only |
| Bootstrap not running | Class must implement `ICustomBootstrap` and have `[Preserve]` attribute |
| System missing from world | Check `[DisableAutoCreation]` — use `World.GetOrCreateSystem` to add manually |
