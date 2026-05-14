---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Skills — DOTSRPG.Skills

> **Prerequisites:** `dots-ecs-core` (IComponentData, ECB, SystemAPI) · `dots-jobs-burst` (Burst, math) · `dots-physics` (CollisionWorld, raycasting — for ProjectileCollisionSystem)

## Components

| Component | Fields | Notes |
|-----------|--------|-------|
| `RangedAttackConfig` | `float ProjectileSpeed, MaxRange, Lifetime, ArcHeight, MinFlightDuration` | Per-entity config for ranged auto-attacks; added to entities with `RangedAttackTag` |
| `MageAttackConfig` | `float AoERadius, AoEDuration, AoELifetime, KnockbackForce, KnockbackDuration` | Per-entity config for mage AOE auto-attacks; added to entities with `MageAttackTag` |
| `ActiveCastState` | `int SkillId, SkillSlotIndex`, `float CastTime, CastElapsed`, `Entity Target`, `float3 TargetPos` | `IEnableableComponent`; enabled while casting |
| `AreaEffect` | `Entity Owner`, `byte OwnerTeamId`, `float Radius, TickInterval, TickTimer, Damage, KnockbackForce, KnockbackDuration`, `DamageType DamageType`, `int SkillId` | Lives on a dedicated AoE entity; knockback parameters for radial impulse. Lifetime controlled by `Lifetime` component — `Duration`/`Elapsed` fields deleted |
| `HomingTarget` | `Entity Target`, `float TurnRate` | Steers projectile toward `Target` |
| `ParabolicArc` | `float3 StartPos, TargetPos`, `float FlightDuration, Elapsed, ArcHeight` | On arrow entities; overrides linear movement |
| `ProjectileData` | `Entity Owner`, `float Speed, Damage, MaxRange, Traveled`, `DamageType DamageType`, `bool IsCrit`, `int SkillId`, `float AoERadius, AoEKnockbackForce, AoEKnockbackDuration`, `float4 AoEVisualColor` | On projectile entity. When `AoERadius > 0`, `ProjectileCollisionSystem` spawns an `AreaEffect` entity at impact position with AoE visual prefab; set `AoEVisualColor` for per-entity tint (white base + SpriteColor override) |
| `AoEPrefabTag` | (empty) | Singleton tag on entity holding `AoEVisualPrefab` |
| `AoEVisualPrefab` | `Entity Prefab` | Singleton; stores prefab entity for AOE blast visual. Optional — MageAttackSystem falls back to invisible entity if missing |

## Buffers

| Buffer | Fields | Capacity |
|--------|--------|----------|
| `SkillSlot` | `int SkillId`, `float Cooldown, CooldownRemaining, ManaCost, CastTime, Power`, `DamageType DamageType`, `float Range`, `SkillBehaviorType SkillBehavior`, `Entity ProjectilePrefab`, `float AoERadius, ProjectileSpeed, HomingTurnRate, AoEDuration, AoETickInterval, AoEKnockbackForce, AoEKnockbackDuration` | 6 inline (17 fields) |

## Enum: SkillBehaviorType

`Melee=0`, `Projectile=1`, `AoE=2`, `Self=3`

## Systems

### SkillsSystemGroup order

1. **SkillCooldownSystem** (`OrderFirst`) — ticks `CooldownRemaining` down; clamps to 0.
2. **SkillCastingSystem** (`after Cooldown`) — advances `CastElapsed`; on cast complete: deducts mana, starts cooldown, routes to behavior.
3. **LinearProjectileSystem** (`after Casting`) — parallel job with `[WithNone(typeof(ParabolicArc))]`; tracks `Traveled`; destroys at `MaxRange`. Skips parabolic arrows.
4. **ParabolicArcSystem** (`after Projectile`) — updates `Elapsed`, interpolates position along parabolic arc from `StartPos` to `TargetPos` with `ArcHeight`; destroys when `Elapsed >= FlightDuration`.
5. **HomingSystem** (`after ParabolicArc`) — steers `MoveDirection` toward `HomingTarget.Target`; destroys projectile if target gone.
6. **ProjectileCollisionSystem** (`after Homing`, `before AoE`) — proximity check vs `HitRadiusSq`; reads projectile's own `TeamId` for friendly-fire prevention; writes `DamageEvent`; destroys on hit (single-hit).
7. **AreaEffectSystem** (`OrderLast`) — ticks `TickTimer`; on each interval, deals damage to all enemies in `Radius`; if `KnockbackForce > 0`, computes radial direction from AOE center and applies knockback impulse to each target; entity destroyed via `Lifetime`.

### CombatSystemGroup (auto-attack variants)
8. **RangedAttackSystem** (`after AttackTimerSystem`) — spawns parabolic arrows for `RangedAttackTag` entities. Reads `RangedAttackConfig`. Requires `ArrowRegistryTag` singleton. Domain salt `0xBB`.
9. **MageAttackSystem** (`after AutoAttackSystem`) — spawns one-shot AreaEffect at target for `MageAttackTag` entities. Uses `MagAtk`, domain salt `MageDomainSalt(0xCC)`. Falls back to invisible entity if no `AoEVisualPrefab` singleton. Sets `SpriteColor` on spawned AoE visual to `GameplayConstants.MageAoEColor` (magenta).

## Authoring

| Authoring | Bakes | Notes |
|-----------|-------|-------|
| `RangedAttackAuthoring` | `RangedAttackTag` + `RangedAttackConfig` | Add to ranger unit prefabs; default values match BattleDemo |
| `MageAttackAuthoring` | `MageAttackTag` + `MageAttackConfig` | Add to mage unit prefabs; default values match BattleDemo |
| `AoEPrefabAuthoring` | `AoEPrefabTag` + `AoEVisualPrefab` | Singleton for AOE blast visual |
| `SkillsAuthoring` | `SkillSlot` buffer + `ActiveCastState` | Add to units with skills |

**Key pattern**: Tags+configs baked into prefabs via authoring — NOT added at spawn time. Keeps spawner generic; tuning in Inspector.

## Behavior Routing (SkillCastingSystem)

```
Melee:
  → DamageEvent.Create(entity, skill.Power, skill.DamageType, hitDir, slotIdx)
    added to CombatTarget's DamageEvent buffer

Projectile:
  → ecb.Instantiate(skill.ProjectilePrefab)
  → AddComponent: ProjectileData, MoveDirection, MoveSpeed, TeamId
  → if Target != Null: AddComponent HomingTarget { TurnRate = HomingTurnRate }

AoE:
  → ecb.CreateEntity()
  → AddComponent: LocalTransform (at TargetPos), AreaEffect, Lifetime (= AoEDuration)

Self:
  → HealEvent { Source = entity, Amount = skill.Power }
    added to caster's HealEvent buffer
```

**CC cancels cast:** `CCMasks.CastBlock` (`Stun | Silence | Freeze`) disables `ActiveCastState` mid-cast.

## Usage Examples

**Initiate a skill cast (from game code / input system):**
```csharp
int slotIndex = 0; // first skill slot
var slots = SystemAPI.GetBuffer<SkillSlot>(casterEntity);
var slot = slots[slotIndex];
if (slot.CooldownRemaining > 0f) return; // on cooldown

// Enable ActiveCastState to start casting
SystemAPI.SetComponent(casterEntity, new ActiveCastState
{
    SkillId = slot.SkillId,
    SkillSlotIndex = slotIndex,
    CastTime = slot.CastTime,
    CastElapsed = 0f,
    Target = targetEntity,
    TargetPos = targetPos
});
SystemAPI.SetComponentEnabled<ActiveCastState>(casterEntity, true);
```

**Define a projectile skill slot:**
```csharp
var slots = SystemAPI.GetBuffer<SkillSlot>(entity);
slots.Add(new SkillSlot
{
    SkillId = 101,
    Cooldown = 3f, CooldownRemaining = 0f,
    ManaCost = 25f,
    CastTime = 0.5f,
    Power = 120f,
    DamageType = DamageType.Magical,
    Range = 20f,
    SkillBehavior = SkillBehaviorType.Projectile,
    ProjectilePrefab = myProjectilePrefab,
    ProjectileSpeed = 15f,
    HomingTurnRate = 3f  // 0 = no homing
});
```

**Add an AoE skill:**
```csharp
slots.Add(new SkillSlot
{
    SkillId = 202,
    Cooldown = 8f, CooldownRemaining = 0f,
    ManaCost = 50f,
    CastTime = 1f,
    Power = 30f, // per tick
    DamageType = DamageType.Magical,
    Range = 30f,
    SkillBehavior = SkillBehaviorType.AoE,
    AoERadius = 5f,
    AoEDuration = 4f,
    AoETickInterval = 0.5f,
    AoEKnockbackForce = 12f,      // radial knockback impulse (0 = none)
    AoEKnockbackDuration = 0.3f    // duration of knockback effect
});
```

## Gotchas

- **`AreaEffect.TickInterval <= 0` guard is mandatory** — `AreaEffectSystem` checks `if (aoe.TickInterval <= 0f) continue;` before tick-timer logic. Without it, damage runs uncapped every frame. Always set `TickInterval > 0` in authoring
- **`AreaEffect.Duration`/`Elapsed` deleted** — lifetime is now controlled entirely by the `Lifetime` component. Do not add `Duration`/`Elapsed` fields to `AreaEffect`
- `ProjectilePrefab` must be a valid baked entity prefab — `Entity.Null` skips projectile spawn silently.
- `HomingTurnRate = 0` falls back to `DefaultHomingTurnRate = 5f` in `SkillCastingSystem`.
- `AoEDuration = 0` falls back to `DefaultAoeDuration = 3f`; `AoETickInterval = 0` falls back to `0.5f`.
- `Self` behavior uses `skill.Power` as heal amount (renamed from `Damage` for clarity).
- `ProjectileCollisionSystem` is **single-hit** — first valid enemy in proximity destroys the projectile. Uses projectile's own `TeamId` (not owner's) for friendly-fire prevention.
- `AreaEffect.OwnerTeamId` is stored at spawn time (from `TeamId` component) — the `Owner` entity doesn't need to exist during AoE ticking.
- **`RangedAttackConfig.IsFlat` MUST be set for 2D** — Without `IsFlat=true`, quad rotates edge-on → invisible. Set in `RangedAttackAuthoring`.
