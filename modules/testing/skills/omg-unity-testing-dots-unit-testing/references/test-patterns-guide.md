---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: testing
protected: false
---
# Test Patterns Guide

## ISystem Testing Pattern

ISystem structs need manual `SystemHandle` creation + explicit update:

```csharp
public class MySystemTests : DOTSTestBase
{
    private SystemHandle _systemHandle;

    public override void SetUp()
    {
        base.SetUp();
        // Register system in correct group (if not already in base)
        _systemHandle = m_World.CreateSystem<MySystem>();
        var group = m_World.GetExistingSystemManaged<CombatSystemGroup>();
        group.AddSystemToUpdateList(_systemHandle);
    }

    [Test]
    public void MySystem_DoesExpectedThing()
    {
        // Arrange: create entity with required components
        var entity = m_Manager.CreateEntity(
            typeof(Health), typeof(DamageEvent), typeof(DerivedCombatStats),
            typeof(LastAttacker));
        m_Manager.SetComponentData(entity, new Health { Current = 100, Max = 100 });

        // Add buffer data
        var buffer = m_Manager.GetBuffer<DamageEvent>(entity);
        buffer.Add(DamageEvent.Create(Entity.Null, 50f, DamageType.Physical, float3.zero, -1));

        // Act: update the single system
        _systemHandle.Update(m_World.Unmanaged);

        // Assert: verify component state
        var health = m_Manager.GetComponentData<Health>(entity);
        Assert.AreEqual(75f, health.Current, 0.01f);
    }
}
```

**CRITICAL**: `SystemAPI.GetComponentLookup<T>()` inside `OnUpdate` only works through the source-generated update path. Always call `handle.Update(world.Unmanaged)` — never invoke `OnUpdate` directly.

## ECB Flush Pattern

Systems using `EndSimulationEntityCommandBufferSystem` need TWO updates:

```csharp
[Test]
public void SystemWithECB_AddsComponent()
{
    // Arrange
    var entity = CreateEntity(typeof(Health), typeof(DeadTag));
    // ... setup ...

    // Act: run system (queues ECB commands)
    _systemHandle.Update(m_World.Unmanaged);

    // CRITICAL: flush ECB to apply structural changes
    m_World.GetExistingSystemManaged<EndSimulationEntityCommandBufferSystem>().Update();

    // Assert: now the structural change is visible
    Assert.IsTrue(m_Manager.HasComponent<RewardGrantedTag>(entity));
}
```

Systems that use ECB: any system performing structural changes (e.g., reward granting, spawning, cleanup, death processing, homing projectiles).

## EnableableComponent Testing

`DeadTag` and `InvulnerableTag` are `IEnableableComponent`:

```csharp
// Add but disabled (default for combat entities)
m_Manager.AddComponentData(entity, new DeadTag());
m_Manager.SetComponentEnabled<DeadTag>(entity, false);

// Enable when needed
m_Manager.SetComponentEnabled<DeadTag>(entity, true);

// Check state
bool isDead = m_Manager.IsComponentEnabled<DeadTag>(entity);
```

**Gotcha**: `[WithNone(typeof(DeadTag))]` on IJobEntity skips entities where DeadTag is ENABLED. Disabled DeadTag entities still match the query.

## DynamicBuffer Testing

```csharp
// Add buffer to entity
m_Manager.AddBuffer<DamageEvent>(entity);

// Populate buffer
var buffer = m_Manager.GetBuffer<DamageEvent>(entity);
buffer.Add(DamageEvent.Create(source, 100f, DamageType.Physical, float3.zero, -1));

// After system update, verify buffer state
var postBuffer = m_Manager.GetBuffer<DamageEvent>(entity);
Assert.AreEqual(0, postBuffer.Length); // DamageProcessingSystem clears buffer
```

## Float Comparison

Always use tolerance for float assertions:
```csharp
Assert.AreEqual(expected, actual, 0.01f);  // 1% tolerance
```

Defense formula: `finalDmg = rawDmg * (DefenseScale / (DefenseScale + defense))` where DefenseScale = 100f
