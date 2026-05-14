---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Collision & Trigger Events Guide — Unity DOTS Physics

## Event Job Interfaces (from Unity Physics API)

```csharp
// Both are scheduled against SimulationSingleton
public interface ICollisionEventsJob { void Execute(CollisionEvent collisionEvent); }
public interface ITriggerEventsJob  { void Execute(TriggerEvent triggerEvent); }
```

**Scheduling:** `.Schedule(SystemAPI.GetSingleton<SimulationSingleton>(), state.Dependency)`

**System ordering:** `[UpdateAfter(typeof(PhysicsSimulationGroup))]` — events from current frame. `[UpdateBefore(typeof(PhysicsSimulationGroup))]` — events from previous frame.

---

## Collision Events

Collision events fire for colliders with **Collision Response = Raise Collision Events** (or **Collide and Raise Events**).

```csharp
[BurstCompile]
[UpdateInGroup(typeof(PhysicsSystemGroup))]
[UpdateAfter(typeof(PhysicsSimulationGroup))]
public partial struct CollisionEventSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        state.Dependency = new HandleCollisionEventsJob
        {
            Velocities = SystemAPI.GetComponentLookup<PhysicsVelocity>()
        }.Schedule(SystemAPI.GetSingleton<SimulationSingleton>(), state.Dependency);
    }

    [BurstCompile]
    struct HandleCollisionEventsJob : ICollisionEventsJob
    {
        public ComponentLookup<PhysicsVelocity> Velocities;

        public void Execute(CollisionEvent evt)
        {
            // evt.EntityA, evt.EntityB
            // evt.BodyIndexA, evt.BodyIndexB
            // evt.Normal (contact normal)
            // evt.CalculateDetails(...) — contact points, estimated impulse
            var details = evt.CalculateDetails(ref /* PhysicsWorld */);
            // details.EstimatedImpulse, details.AverageContactPointPosition
        }
    }
}
```

## Trigger Events

Trigger events fire for colliders with **Collision Response = Raise Trigger Events**. Triggers do not produce contact details.

```csharp
[BurstCompile]
[UpdateInGroup(typeof(PhysicsSystemGroup))]
[UpdateAfter(typeof(PhysicsSimulationGroup))]
public partial struct TriggerEventSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        state.Dependency = new HandleTriggerEventsJob
        {
            HealthLookup = SystemAPI.GetComponentLookup<HealthComponent>()
        }.Schedule(SystemAPI.GetSingleton<SimulationSingleton>(), state.Dependency);
    }

    [BurstCompile]
    struct HandleTriggerEventsJob : ITriggerEventsJob
    {
        public ComponentLookup<HealthComponent> HealthLookup;

        public void Execute(TriggerEvent evt)
        {
            // evt.EntityA, evt.EntityB (order not guaranteed)
            // No contact details — triggers do not collide
            if (HealthLookup.HasComponent(evt.EntityA))
            {
                var h = HealthLookup[evt.EntityA];
                h.Value -= 10;
                HealthLookup[evt.EntityA] = h;
            }
        }
    }
}
```

## Stateful Trigger Events (Enter / Stay / Exit)

To get enter/stay/exit semantics, use a `DynamicBuffer` pattern (from Unity Physics Samples).

### Step 1 — Define State Enum and Buffer Element

```csharp
public enum EventOverlapState { Enter, Stay, Exit }

public struct StatefulTriggerEvent : IBufferElementData, IComparable<StatefulTriggerEvent>
{
    public Entity EntityA;
    public Entity EntityB;
    public EventOverlapState State;

    public int CompareTo(StatefulTriggerEvent other)
    {
        int cmp = EntityA.Index.CompareTo(other.EntityA.Index);
        return cmp != 0 ? cmp : EntityB.Index.CompareTo(other.EntityB.Index);
    }
}
```

### Step 2 — Collect and Diff Events Each Frame

Add `DynamicBuffer<StatefulTriggerEvent>` to entities that need it (via authoring), then run a system that converts raw trigger events into stateful buffer entries.

```csharp
[BurstCompile]
[UpdateInGroup(typeof(PhysicsSystemGroup))]
[UpdateAfter(typeof(PhysicsSimulationGroup))]
public partial struct StatefulTriggerSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        // Collect current-frame events, diff against previous-frame buffer, assign state.
        // See EntityComponentSystemSamples/PhysicsSamples for full implementation.
    }
}
```

-> See [queries-advanced-guide.md](queries-advanced-guide.md) for Step 3 TriggerReactionSystem pattern and physics simulation pipeline stages + gotchas.
