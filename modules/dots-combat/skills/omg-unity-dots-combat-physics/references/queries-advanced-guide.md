---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Queries & Raycasting Advanced Guide — Pipeline Stages & Gotchas

## Simulation Pipeline Stages

```
1. Physics World Building  → builds CollisionWorld + DynamicsWorld from entity components
2. Broadphase Detection    → bounding volume checks for potential pairs
3. Narrowphase Detection   → actual collision + contact point calculation
4. Constraint Solver       → resolves collisions and joints, updates velocities
5. Integration             → moves bodies forward by timestep
6. Export                  → writes updated positions/orientations back to entities
```

**System ordering:** Read broadphase BEFORE `PhysicsSystemGroup` (uses previous frame). Handle events AFTER `PhysicsSimulationGroup`.

---

## Gotchas

| Issue | Fix |
|-------|-----|
| `GetSingleton<PhysicsWorldSingleton>` fails | Call in `OnUpdate`, not `OnCreate` |
| Queries return stale data | Use `[UpdateBefore(typeof(PhysicsSystemGroup))]` to read previous-frame broadphase |
| Angular velocity in wrong space | `PhysicsVelocity.Angular` is in **local** body space |
| CollisionFilter too broad | Narrow `CollidesWith` to required layers only — reduces broadphase cost |
| SphereCast collider not disposed | `SphereCollider.Create` returns BlobAssetReference — must call `.Dispose()` |
