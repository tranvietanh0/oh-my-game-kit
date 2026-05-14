---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Stats — DOTSRPG.Stats

> **Prerequisites:** `dots-ecs-core` (IComponentData, IBufferElementData, SystemAPI.Query)

## Components

| Component | Fields | Notes |
|-----------|--------|-------|
| `BaseStats` | `float Strength, Dexterity, Intelligence, Vitality, Luck` | Raw attributes; never modified at runtime |
| `DerivedStats` | `float MaxHealth, MaxMana, PhysAtk, MagAtk, PhysDef, MagDef, CritRate, CritDmg, MoveSpeed, AtkSpeed, HealthRegen, ManaRegen` | Recalculated by `DerivedStatsJob` when `StatsDirtyTag` enabled |
| `StatsDirtyTag` | — | `IEnableableComponent` in Core; enabled by StatModifierTickSystem/EquipmentSystem when modifiers change; DerivedStatsSystem disables after recalc |
| `Experience` | `float Current, ToNextLevel, BaseXP, Exponent` | XP curve: `ToNextLevel = BaseXP * pow(level, Exponent)` |
| `Level` | `int CurrentLevel, MaxLevel` | `IEnableableComponent`; enabled means leveling active |
| `StatFormulaConfig` | `float HealthPerVit, HealthPerLevel, ManaPerInt, ManaPerLevel, PhysAtkPerStr, MagAtkPerInt, PhysDefPerVit, MagDefPerInt, CritRatePerDex, CritDmgPerLuck, MoveSpeedBase, AtkSpeedPerDex, HealthRegenPerVit, ManaRegenPerInt` | Per-entity formula weights |

## Buffers

| Buffer | Fields | Capacity |
|--------|--------|----------|
| `StatModifier` | `float Value`, `StatType Stat`, `ModifierType Type`, `float Duration`, `float Elapsed` | 8 inline |

- `Duration <= 0` = permanent (equipment uses `GameplayConstants.PermanentModifierDuration = -1f`)
- `Elapsed` tracks time for timed modifiers

## Enums

**StatType** (17 values):
`Strength, Dexterity, Intelligence, Vitality, Luck` (base 0-4)
`MaxHealth, MaxMana, PhysAtk, MagAtk, PhysDef, MagDef, CritRate, CritDmg, MoveSpeed, AtkSpeed, HealthRegen, ManaRegen` (derived 5-16)

**ModifierType** (3 values): `Flat`, `PercentAdd`, `PercentMult`

## Systems (StatsSystemGroup order)

1. **StatModifierTickSystem** (`OrderFirst`) — ticks `Elapsed` on timed modifiers; removes expired ones via `RemoveAtSwapBack`. Skips `Duration <= 0` (permanent).
2. **LevelUpSystem** (`[UpdateBefore(typeof(DerivedStatsSystem))]`) — while-loop level-up; recalculates `ToNextLevel = BaseXP * pow(currentLevel, Exponent)`. Runs BEFORE DerivedStatsSystem so level-up stat changes are reflected in the same frame.
3. **DerivedStatsSystem** (`after StatModifierTickSystem`) — parallel `DerivedStatsJob`; recalculates all 12 derived stats from base + formula, applies modifiers, then **clamps** each stat to valid range (see Post-Modifier Clamping). Only runs on entities with `StatsDirtyTag` enabled — skips unchanged entities for performance. Disables `StatsDirtyTag` after recalc.
4. **StatSyncSystem** (in `StatsSystemGroup`, after DerivedStatsSystem) — syncs `Health.Max`, `Mana.Max`, `MoveSpeed.Value` from derived stats.

## Modifier Stacking Formula

Applied per derived stat index (5..16), in order:

```
finalVal = (baseVal + flatSum) * (1 + percentAddSum) * percentMultProduct
```

- `Flat` → additive sum
- `PercentAdd` → additive percent sum: `(1 + 0.1 + 0.2) = 1.3x`
- `PercentMult` → multiplicative: `(1.1) * (1.2) = 1.32x`

### Post-Modifier Clamping (DerivedStatsSystem)

After modifier stacking, each stat is clamped to prevent negative/invalid values:

| Stat | Min | Max | Rationale |
|------|-----|-----|-----------|
| `MaxHealth` | `1f` | — | Entity always has at least 1 HP |
| `MaxMana` | `0f` | — | Allow manaless builds |
| `PhysAtk` | `0f` | — | Prevent negative damage |
| `MagAtk` | `0f` | — | Prevent negative damage |
| `PhysDef` | `0f` | — | Prevent defense inversion |
| `MagDef` | `0f` | — | Prevent defense inversion |
| `CritRate` | `0f` | `1f` | Probability [0%–100%] |
| `CritDmg` | `0f` | — | No negative crit multiplier |
| `MoveSpeed` | `0f` | — | No backward movement |
| `AtkSpeed` | `MinAtkSpeed` | — | Prevents div-by-zero in cooldown calc |
| `HealthRegen` | — | — | Unclamped (allow health drain) |
| `ManaRegen` | — | — | Unclamped (allow mana drain) |

## Authoring (StatsAuthoring / StatsBaker)

Baker adds to entity: `BaseStats`, `DerivedStats` (empty), `StatModifier` buffer, `Level`, `Experience`, `StatFormulaConfig`.

Default inspector values: `Str/Dex/Int/Vit=10, Luck=5, StartLevel=1, MaxLevel=100, BaseXP=100, XPExponent=1.5`.

## Usage Examples

**Add a timed flat modifier (+50 PhysAtk for 10s):**
```csharp
var modifiers = SystemAPI.GetBuffer<StatModifier>(entity);
modifiers.Add(new StatModifier
{
    Value = 50f,
    Stat = StatType.PhysAtk,
    Type = ModifierType.Flat,
    Duration = 10f,
    Elapsed = 0f
});
```

**Add a permanent equipment modifier:**
```csharp
modifiers.Add(new StatModifier
{
    Value = 0.15f,
    Stat = StatType.CritRate,
    Type = ModifierType.PercentAdd,
    Duration = GameplayConstants.PermanentModifierDuration, // -1f
    Elapsed = 0f
});
```

**Read derived stats in a system:**
```csharp
foreach (var derived in SystemAPI.Query<RefRO<DerivedStats>>())
{
    float atk = derived.ValueRO.PhysAtk;
    float speed = derived.ValueRO.AtkSpeed;
}
```

## Gotchas

- `DerivedStats` is recalculated every frame with post-modifier clamping — never write to it from outside `DerivedStatsSystem`.
- Permanent modifiers (`Duration <= 0`) are never removed by `StatModifierTickSystem`. `EquipmentSystem` removes them by matching `Duration == PermanentModifierDuration`.
- `StatType` indices 5-16 match derived stat order exactly — the switch in `DerivedStatsJob` depends on this ordering.
- `LevelUpSystem` uses a while-loop to handle multi-level XP gain in one frame. It runs BEFORE `DerivedStatsSystem` (`[UpdateBefore]`) so that any stat base changes from leveling are included in that frame's derived-stat recalculation.
- `PercentMult` modifiers cannot make stats negative — post-modifier clamping prevents it (e.g., MaxHealth always >= 1).
- `AtkSpeed` is clamped to `GameplayConstants.MinAtkSpeed` to prevent div-by-zero in `CombatFormulas.EffectiveCooldown()`.
