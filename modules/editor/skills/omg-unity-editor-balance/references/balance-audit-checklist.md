---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Balance Audit Checklist

## DPS Analysis

For each unit type, calculate:
```
DPS = AttackDamage / AttackCooldown
```

| Unit | AttackDamage | Cooldown (s) | DPS |
|------|-------------|--------------|-----|
| Melee | ? | ? | ? |
| Ranger | ? | ? | ? |
| Mage | ? | ? | ? |
| Boss | ? | ? | ? |

Flag: any unit type with DPS > 3× the lowest DPS → likely dominant, crowding out other unit types.

## EHP Analysis

```
EHP = MaxHP / (1 - DamageReduction)
```
For units without DR: `EHP = MaxHP`

Flag: EHP range should be within 5× between squishiest and tankiest unit (otherwise tanks are unkillable or paper).

## DPS-to-EHP Ratio (Time-to-Kill)

```
TTK = EHP_target / DPS_attacker
```

Healthy TTK ranges:
- Melee vs Melee: 5–15s (sustained skirmish)
- Ranged vs Melee: 8–20s (ranged kiting window)
- Boss vs anything: 30–60s (boss should feel dangerous)

Flag: TTK < 2s → one-shot territory, feels unfair. TTK > 60s → combat feels slow.

## Stat Formula Consistency

Verify `DerivedCombatStats` values match formula in `StatFormulaConfig`:
- `Attack = BaseStrength * StrengthMultiplier + BaseAttack`
- `MaxHP = BaseVitality * VitalityMultiplier + BaseHP`

Check: instantiate a unit, inspect `DerivedCombatStats` at runtime, compare to hand-calculation.
Missing any of the 7 required components → stats stay at 0 (see AGENTS.md gotcha).

## Item Stat Budgets (BackpackCrawler)

- Common item: total stat budget ≤ 10
- Rare item: total stat budget ≤ 25
- Epic item: total stat budget ≤ 50
- No single stat should exceed 60% of item budget

## Difficulty Curve (Level Scaling)

Verify enemy HP/damage scales smoothly per floor:
- HP scale: `BaseHP * (1 + FloorIndex * 0.15)` (15% per floor)
- Damage scale: `BaseDamage * (1 + FloorIndex * 0.10)` (10% per floor)
- Player power curve must keep pace: check synergy unlock schedule

## Cooldown Balance

For cooldown-based systems (BackpackCrawler real-time):
- Active ability cooldown: 4–10s (too short = ability spam, too long = feels passive)
- Passive proc rate: ≤ 30% chance per hit (higher = procs dominate all other stats)
- AoE cooldown: ≥ 6s (prevent AoE-only win condition)

## Two-Team Battle Balance

In BattleDemo variants, confirm neither team wins > 60% of simulated battles.
Run 5 play sessions, record winner. Flag if one team wins 4+/5.
Common fix: adjust spawn counts, DetectionRadius, or army composition ratio.
