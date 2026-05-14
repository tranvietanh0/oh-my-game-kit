---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Constants Reference

**Location**: `Packages/com.the1studio.dots-core/Runtime/Core/Utilities/`

All magic numbers defined as public constants — never hardcode values inline. As of the Phase 6 refactor, constants are split into 5 domain-specific classes plus the universal `GameplayConstants`.

All classes are in `namespace DOTSRPG.Core` — no additional `using` directives needed when already in that namespace.

## GameplayConstants (universal)

**File**: `GameplayConstants.cs`

| Constant | Value | Purpose |
|----------|-------|---------|
| **DirectionEpsilon** | 0.0001f | Epsilon for float3 zero-vector checks |
| **OverlapEpsilon** | 0.01f | Proximity check epsilon (LOS, dist checks) |
| **NoTeam** | 255 | Sentinel team ID (no team affiliation) |
| **AutoAttackSkillId** | -1 | Sentinel skill ID for auto-attacks |
| **DefaultInventoryCapacity** | 20 | Standard max inventory slots |
| **DefaultAoETickInterval** | 0.5f | AOE damage tick rate authoring default |
| **DefaultAoEVisualLifetime** | 0.5f | Lifetime for AoE visual entity spawned at projectile impact |
| **MageAoEColor** | `float4(1,0,1,1)` | Default magenta tint for mage AoE visual entities |
| **TowerAoEColor** | `float4(1,0.5,0,1)` | Default orange tint for tower AoE visual entities |

## CombatConstants

**File**: `CombatConstants.cs`

| Constant | Value | Purpose |
|----------|-------|---------|
| **MinAtkSpeed** | 0.1f | Min attack speed (prevent div-by-zero in cooldown) |
| **PermanentModifierDuration** | -1f | Permanent stat modifier sentinel |
| **DefenseScale** | 100f | Armor formula divisor |
| **HitRadiusSq** | 1f | Projectile hit squared distance |
| **MeleeDomainSalt** | 0xAA | RNG domain differentiator for melee |
| **RangedDomainSalt** | 0xBB | RNG domain differentiator for ranged |
| **MageDomainSalt** | 0xCC | RNG domain differentiator for mage |
| **SummonDomainSalt** | 0xDD | RNG domain differentiator for summon |

## VisualConstants

**File**: `VisualConstants.cs`

| Constant | Value | Purpose |
|----------|-------|---------|
| **HitFlashDuration** | 0.15f | Damage flash duration (seconds) |
| **HitFlashScaleAmount** | 0.15f | Flash scale multiplier (0–1) |
| **DeathAnimationDuration** | 0.5f | Death shrink animation duration |

## StatusEffectVisualConstants

**File**: `StatusEffectVisualConstants.cs`

| Constant | Value | Purpose |
|----------|-------|---------|
| **TintBlendFactor** | 0.5f | Lerp weight when blending status-effect tint onto base color |

## TrajectoryConstants

**File**: `TrajectoryConstants.cs`

| Constant | Value | Purpose |
|----------|-------|---------|
| **ParabolicArcScalar** | 4f | 4*t*(1-t) parabola scalar |
| **ArcTangentStep** | 0.01f | Timestep for arc tangent approximation |
| **CapsulePitchOffsetRad** | π/2 | +90° X pitch to align capsule Y with flight dir |

## AIConstants

**File**: `AIConstants.cs`

| Constant | Value | Purpose |
|----------|-------|---------|
| **MaxPerceivedEntities** | 32 | Max entities in PerceivedEntity buffer |
| **DefaultFleeDistance** | 10f | Default flee distance (units) |
| **WaypointArrivalSq** | 1f | Waypoint arrival squared distance |

## PhysicsLayerConfig

**File**: `PhysicsLayerConfig.cs`

WARNING: Layer indices are project-specific (set in TagManager.asset). Verify these match the target project when reusing the library.

| Constant | Value | Purpose |
|----------|-------|---------|
| **TerrainLayer** | 6 | Unity layer index for terrain colliders |
| **ObstacleLayer** | 7 | Unity layer index for obstacle colliders |
| **TerrainBit** | 1u<<6 | Collision filter bit for terrain |
| **ObstacleBit** | 1u<<7 | Collision filter bit for obstacles |
| **EnvironmentMask** | 192u | Combined environment raycast mask |

## Usage

```csharp
// Always use constants — never hardcode
if (distSq < AIConstants.WaypointArrivalSq) { /* arrived */ }
if (teamId == GameplayConstants.NoTeam) { /* no team */ }
float cd = CombatFormulas.EffectiveCooldown(timer.Cooldown, derived.AtkSpeed);

// Physics layer checks
terrainGO.layer = PhysicsLayerConfig.TerrainLayer;
filter.CollidesWith = PhysicsLayerConfig.EnvironmentMask;

// RNG domain salts
uint seed = CombatFormulas.FrameRngSeed(entity.Index, time, CombatConstants.MeleeDomainSalt);
```

> **Removed (moved to per-entity configs):** Arrow/Mage tuning values → `RangedAttackConfig`, `MageAttackConfig`. Unit class enums → `UnitClassType`.
