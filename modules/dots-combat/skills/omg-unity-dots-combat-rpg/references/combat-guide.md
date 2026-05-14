---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Combat — DOTSRPG.Combat

> **Prerequisites:** `dots-ecs-core` (IBufferElementData, IEnableableComponent, ECB, SystemAPI) · `dots-jobs-burst` (Burst, math)

## Components

| Component | Fields | Notes |
|-----------|--------|-------|
| `AttackTimer` | `float Cooldown, Elapsed` | Managed by `AttackTimerSystem` |
| `AttackConfig` | `float AttackRange` | Attack range configuration |
| `CCState` | `CCType ActiveCC`, `float SlowFactor` | `IEnableableComponent`; synced by `StatusEffectTickSystem` |
| `CombatDistances` | `float EngageDistance, ChaseDistance` | AI engagement distances |
| `CombatTarget` | `Entity Target` | Set by BDP SelectHighestThreat action task |
| `DeadTag` | — | `IEnableableComponent`; enabled by `DeathSystem` when `Health.Current <= 0` |
| `DeathAnimation` | `float Remaining, Duration, OriginalScale` | Added by `DeathAnimationSystem` on death; drives scale-shrink then destroy |
| `Health` | `float Current, Max` | Max synced from `DerivedStats.MaxHealth` |
| `InvulnerableTag` | — | `IEnableableComponent`; skips non-True damage |
| `KillReward` | `float XP`, `int Gold` | Granted to killer by `KillRewardSystem` |
| `KnockbackState` | `float3 Velocity`, `float TimeRemaining, TotalDuration` | `IEnableableComponent`; overrides movement |
| `LastAttacker` | `Entity Entity` | Tracks lethal blow source for kill reward |
| `Mana` | `float Current, Max` | Max synced from `DerivedStats.MaxMana` |
| `Shield` | `float Current, Max, Regen` | Absorbs damage after defense reduction |

## Buffers

| Buffer | Fields | Capacity | Notes |
|--------|--------|----------|-------|
| `DamageEvent` | `Entity Source`, `float Amount`, `DamageType Type`, `bool IsCrit`, `float3 HitDirection`, `int SkillId` | 4 inline | Use `DamageEvent.Create(...)` factory |
| `HealEvent` | `Entity Source`, `float Amount` | 2 inline | |
| `KnockbackEvent` | `float3 Direction`, `float Force, Duration` | 2 inline | |
| `StatusEffect` | `StatusEffectType EffectType`, `float Duration, Elapsed, TickInterval, TickTimer, Value`, `Entity Source`, `int SkillId`, `byte StackCount, MaxStacks`, `bool RefreshOnReapply` | 4 inline | `StackCount=0` = newly added |
| `TeamArrowPrefab` | `byte TeamId`, `Entity ArrowPrefab` | 4 inline | On `ArrowRegistryTag` entity |
| `TeamAliveCount` | `byte TeamId`, `int Alive` | varies | On `BattleState` singleton entity |

## Enums

**DamageType**: `Physical`, `Magical`, `True`
**StatusEffectType** (10): `Poison, Burn, Bleed` (DoT), `Stun, Slow, Silence, Freeze, Weaken, Curse, Root` (CC)
**CCType** (flags byte): `None=0`, `Stun=1`, `Root=2`, `Silence=4`, `Slow=8`, `Freeze=16`

**CCMasks** (always use — never inline bitmasks): `AttackBlock` = Stun|Freeze, `CastBlock` = Stun|Silence|Freeze, `MoveBlock` = Stun|Root|Freeze

## Singletons

| Singleton | Fields | Notes |
|-----------|--------|-------|
| `ArrowRegistryTag` | — (tag) | Marker for `DynamicBuffer<TeamArrowPrefab>` entity |
| `BattleState` | `byte WinnerTeam`, `bool BattleOver, HasStarted` | Also holds `DynamicBuffer<TeamAliveCount>` |

## CombatFormulas (Burst-compatible static utility — always use, never duplicate)

```csharp
// Target validation (replaces duplicated 4-line pattern in attack systems)
bool valid = CombatFormulas.IsTargetValid(targetEntity, deadTagLookup); // Entity.Null check + DeadTag enabled check

// Pre-attack validation (shared by Auto/Ranged/Mage attack systems)
bool blocked = CombatFormulas.IsAttackBlocked(ccState.ActiveCC); // checks CCMasks.AttackBlock
bool inRange = CombatFormulas.IsInAttackRange(attackerPos, targetPos, range); // distancesq <= range*range

// Damage/cooldown/RNG
CombatFormulas.ComputeAutoAttackDamage(physAtk, critRate, critDmg, rngSeed, out float damage, out bool isCrit);
float cd = CombatFormulas.EffectiveCooldown(baseCooldown, atkSpeed); // = base / max(atk, MinAtkSpeed)
uint seed = CombatFormulas.FrameRngSeed(entityIndex, elapsedTime, domainSalt); // 0xAA=auto, 0xBB=ranged
```

## Systems (CombatSystemGroup order)

1. **RegenSystem** (`OrderFirst`) — HP/MP/Shield passive regen
2. **AttackTimerSystem** — ticks `Elapsed`; parallel job (NOT OrderFirst — was removed to fix conflict with RegenSystem)
3. **StatusEffectTickSystem** (`after AttackTimerSystem`, `before DamageProcessingSystem`) — 2 passes: merge stacks, tick/expire; writes DamageEvent for DoT effects
4. **CCStateSyncSystem** (`after StatusEffectTickSystem`, `before DamageProcessingSystem`) — syncs `CCState` (ActiveCC + SlowFactor) from active CC status effects; enables/disables `CCState` component
5. **HitFlashTriggerSystem** (`before DamageProcessingSystem`) — sets `HitFlashTimer` when DamageEvent buffer non-empty
6. **AutoAttackSystem** (`after AttackTimerSystem`) — writes DamageEvent; skips entities with RangedAttackTag or MageAttackTag
7. **MageAttackSystem** (`after AutoAttackSystem`) — spawns AreaEffect with radial knockback; optional `AoEVisualPrefab` singleton
8. **DamageProcessingSystem** (`after AutoAttackSystem`) — processes+clears DamageEvent buffer
9. **HealProcessingSystem** — processes HealEvent buffer
10. **KnockbackSystem** (`after DamageProcessingSystem`, `before DeathSystem`) — converts KnockbackEvent to KnockbackState; strongest knockback wins
11. **DeathSystem** (`after DamageProcessingSystem`, `after HealProcessingSystem`) — enables DeadTag when Health.Current <= 0
12. **DeathAnimationSystem** (`after DeathSystem`, `before BattleStateSystem`) — shrinks scale to 0 then destroys
13. **BattleStateSystem** (`after DeathSystem`) — rebuilds TeamAliveCount; sets BattleOver
14. **StatusEffectTintSystem** (`OrderLast`, before KillReward) — picks highest-priority active StatusEffect from buffer; blends `OriginalSpriteColor` toward tint → writes to `SpriteColor`. Restores original when no effects. Priority: Stun(yellow) > Freeze(blue) > Root(brown) > Burn(orange) > Poison(green) > Bleed(red) > Slow(lightblue) > Weaken > Curse > Silence. Blend factor 0.6. Parallel `IJobEntity`.
15. **KillRewardSystem** (`OrderLast`) — grants XP; adds RewardGrantedTag
16. **StatSyncSystem** (StatsSystemGroup) — syncs Health.Max, Mana.Max, MoveSpeed.Value

## Damage Formula

```
defense = PhysDef (Physical) | MagDef (Magical) | 0 (Pure/True)
reduction = DefenseScale / (DefenseScale + clampedDef)   // = 100/(100+def)
finalDamage = rawAmount * reduction → shield absorption → health deduction
```

- `InvulnerableTag` skips all damage except `DamageType.True`
- `Pure` bypasses armor (`reduction = 1.0`)

## Usage Examples

```csharp
// Deal damage (always use factory)
var buf = SystemAPI.GetBuffer<DamageEvent>(target);
buf.Add(DamageEvent.Create(source, 150f, DamageType.Physical, hitDir, GameplayConstants.AutoAttackSkillId));

// Apply status effect (StackCount=0 = newly added, merged in pass 1)
SystemAPI.GetBuffer<StatusEffect>(target).Add(new StatusEffect {
    EffectType = StatusEffectType.Poison, Duration = 8f, TickInterval = 1f,
    Value = 25f, Source = caster, MaxStacks = 3, RefreshOnReapply = true });

// Check CC (always use CCMasks)
if ((SystemAPI.GetComponent<CCState>(entity).ActiveCC & CCMasks.AttackBlock) != 0) continue;

// Auto-attack damage (always use CombatFormulas)
uint seed = CombatFormulas.FrameRngSeed(entity.Index, SystemAPI.Time.ElapsedTime, 0xAA);
CombatFormulas.ComputeAutoAttackDamage(derived.PhysAtk, derived.CritRate, derived.CritDmg, seed, out float dmg, out bool isCrit);
```

## Gotchas

- `DamageEvent` buffer cleared at end of `DamageProcessingSystem` — read before it runs
- `StatusEffect.StackCount = 0` is newly-added sentinel; merged in pass 1
- Shield absorbs **after** defense reduction, not before
- `CCType` is `[Flags]` — always use `CCMasks` constants, never inline bitmask expressions
- `RewardGrantedTag` prevents double XP grant
- `DeathAnimation` added via ECB — appears next frame, not immediately
- `BattleStateSystem` needs `BattleState` singleton entity (`RequireForUpdate`)
- `StatusEffectTickSystem` clamps slow `fx.Value` to `[0,1]` before computing `SlowFactor`
- **AttackTimerSystem is NOT OrderFirst** — only `RegenSystem` uses `OrderFirst` in `CombatSystemGroup`. Multiple `OrderFirst` systems in the same group causes nondeterministic ordering
- **Always use CombatFormulas.IsTargetValid()** — replaces the duplicated `entity == Entity.Null || deadTagLookup.IsComponentEnabled(entity)` 4-line pattern. Never inline this check across attack systems
- **DamageProcessingSystem requires only Health+DamageEvent+LastAttacker** — `DerivedCombatStats` is optional (via ComponentLookup). Structures without stats pipeline get zero defense. Any new combat system processing damage must NOT require stat components in Execute params — use lookups for optional components so structures are not silently skipped
