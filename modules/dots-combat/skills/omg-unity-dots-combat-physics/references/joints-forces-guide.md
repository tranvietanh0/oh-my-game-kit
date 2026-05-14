---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Joints, Motors & Forces Guide — Unity DOTS Physics

## Joint Factory Methods

| Method | Behavior |
|--------|---------|
| `PhysicsJoint.CreateBallAndSocket(anchorA, anchorB)` | Free rotation |
| `PhysicsJoint.CreateFixed(bodyAFrame, bodyBFrame)` | Full lock |
| `PhysicsJoint.CreateHinge(bodyAFrame, bodyBFrame)` | Single-axis rotation |
| `PhysicsJoint.CreateLimitedHinge(bodyAFrame, bodyBFrame, range)` | Hinge with limits |
| `PhysicsJoint.CreatePrismatic(bodyAFrame, bodyBFrame, distRange)` | Slide on axis |
| `PhysicsJoint.CreateRagdoll(...)` | Cone + twist (2 joints out) |
| `PhysicsJoint.CreateAngularVelocityMotor(...)` | Spin at target velocity |
| `PhysicsJoint.CreateLinearVelocityMotor(...)` | Drive at target velocity |
| `PhysicsJoint.CreatePositionMotor(...)` | Drive to target position |
| `PhysicsJoint.CreateRotationalMotor(...)` | Drive to target angle |

## Hinge Joint

```csharp
// Joints require an entity with PhysicsJoint + PhysicsConstrainedBodyPair.
// At least one body must have PhysicsVelocity.
public static Entity CreateHingeJoint(EntityManager em, Entity bodyA, Entity bodyB,
    float3 pivotA, float3 pivotB, float3 axisA, float3 axisB)
{
    var frameA = new BodyFrame { Axis = axisA, Position = pivotA };
    var frameB = new BodyFrame { Axis = axisB, Position = pivotB };

    var joint = PhysicsJoint.CreateHinge(frameA, frameB);
    joint.SetImpulseEventThresholdAllConstraints(50f, 0.1f); // optional break threshold

    var jointEntity = em.CreateEntity(
        typeof(PhysicsJoint),
        typeof(PhysicsConstrainedBodyPair));

    em.SetComponentData(jointEntity, joint);
    em.SetComponentData(jointEntity, new PhysicsConstrainedBodyPair(bodyA, bodyB,
        enableCollision: false)); // set true if bodies should also collide

    return jointEntity;
}
```

## Limited Hinge Joint (Door With Angle Limits)

```csharp
public static Entity CreateDoorJoint(EntityManager em, Entity door, Entity wall)
{
    var frameA = new BodyFrame
    {
        Axis              = math.up(),
        PerpendicularAxis = math.forward(),
        Position          = new float3(0.5f, 0, 0)
    };
    var frameB = new BodyFrame
    {
        Axis              = math.up(),
        PerpendicularAxis = math.forward(),
        Position          = new float3(-0.5f, 0, 0)
    };
    var joint = PhysicsJoint.CreateLimitedHinge(frameA, frameB,
        new FloatRange(-math.PI / 2f, math.PI / 2f)); // ±90°

    var e = em.CreateEntity(typeof(PhysicsJoint), typeof(PhysicsConstrainedBodyPair));
    em.SetComponentData(e, joint);
    em.SetComponentData(e, new PhysicsConstrainedBodyPair(door, wall, false));
    return e;
}
```

## Angular Velocity Motor

```csharp
public static Entity CreateRotaryMotor(EntityManager em, Entity rotor, Entity anchor)
{
    var frameA = new BodyFrame { Axis = math.up(), Position = float3.zero };
    var frameB = new BodyFrame { Axis = math.up(), Position = float3.zero };

    var joint = PhysicsJoint.CreateAngularVelocityMotor(
        frameA, frameB,
        targetVelocity: 2f * math.PI,  // 1 rev/s
        maxImpulseOfMotor: 100f,
        springFrequency: 0f, springDamping: 0f);

    var e = em.CreateEntity(typeof(PhysicsJoint), typeof(PhysicsConstrainedBodyPair));
    em.SetComponentData(e, joint);
    em.SetComponentData(e, new PhysicsConstrainedBodyPair(rotor, anchor, false));
    return e;
}
```

## Apply Forces & Impulses

```csharp
[BurstCompile]
public partial struct ApplyImpulseSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        foreach (var (vel, mass, transform, impulse) in
            SystemAPI.Query<RefRW<PhysicsVelocity>, RefRO<PhysicsMass>,
                           RefRO<LocalTransform>, RefRO<ImpulseRequest>>())
        {
            // Linear impulse (world space)
            vel.ValueRW.Linear += impulse.ValueRO.Force / mass.ValueRO.InverseMass;

            // Impulse helpers
            vel.ValueRW.ApplyLinearImpulse(mass.ValueRO, impulse.ValueRO.Force);
            vel.ValueRW.ApplyAngularImpulse(mass.ValueRO, impulse.ValueRO.Torque);
        }
    }
}

// Freeze body
vel.ValueRW = PhysicsVelocity.Zero;

// Immovable dynamic body (kinematic-style)
em.SetComponentData(entity, PhysicsMass.CreateKinematic(massProps));
```

## PhysicsCustomTags — Per-Collider Material Data

Custom tags are 8-bit user data stored per collider, useful for material identification (ice, bouncy, etc.).

```csharp
var material = new Unity.Physics.Material
{
    Friction          = 0.5f,
    Restitution       = 0.3f,
    CustomTags        = 0b00000001,  // bit 0 = ice
    CollisionResponse = CollisionResponsePolicy.Collide
};
var collider = BoxCollider.Create(geo, filter, material);

// To read tags in a collision event job, access via PhysicsCollider component lookup:
// collider.Value.Value.GetLeaf(out _, out var mat) then mat.CustomTags
```

## Gotchas

| Issue | Fix |
|-------|-----|
| Joint has no effect | At least one body must have `PhysicsVelocity` |
| Static body moves unexpectedly | Do not add `PhysicsVelocity` to static bodies |
