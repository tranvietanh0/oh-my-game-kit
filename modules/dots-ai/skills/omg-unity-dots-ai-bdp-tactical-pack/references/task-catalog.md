---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# BDP Tactical Pack — Task Catalog

All 9 tasks in `Opsive.BehaviorDesigner.AddOns.TacticalPack.Runtime.Tasks` (BDP 3.0.2).

> **BDP 3.0.2:** Hold, Marching Fire, Request Reinforcements, and Reinforcements Response are NOT included in this install. The task count is 9.

---

## Offensive Tasks (7)

### Attack
Engage enemies in direct combat. Units move to `MaxAttackDistance`, call `IAttackAgent.Attack()` when target is within `AttackAngleThreshold`. Returns `Running` until target is dead or unreachable.

### Charge
Rush forward at full speed toward a target. Ignores formation spacing during approach — speed multiplied by `OutOfRangeSpeedMultiplier`. Returns `Success` on arrival, then transitions to Attack behavior.

### Flank
Move to attack target from the side (90° arc). Pathfinds to a flanking position offset from the target's facing direction, then executes Attack. `FormationGroupID` required — one sub-group flanks while another engages frontally.

### Ambush
Hold concealed position until target enters trigger range, then launch simultaneous group attack. Units remain stationary (`StopOnTaskEnd` has no effect during wait phase). `AttackDelay = GroupArrival` recommended for synchronized ambush.

### Shoot and Scoot
Fire at target then immediately relocate to a new position. Cycle: Attack → Reposition → Attack. Repositions within `OutOfRangeDistanceDelta` of original position. Effective for ranged units avoiding melee.

### Leapfrog
Alternating advance with covering fire. Group splits into two sub-groups: one advances while the other provides suppressing fire, then roles swap. Requires even-numbered group size for optimal split; odd size assigns extra unit to covering group.

### Surround
Encircle and contain targets. Group members spread to equidistant positions around target(s), forming a perimeter. Attack begins when perimeter is established (`AttackDelay = GroupArrival` applied per position, not per unit).

---

## Defensive Tasks (1)

### Defend
Protect a location or ally. Units patrol within `InRangeDistanceDelta` of the defend point. Engages enemies that enter `MaxAttackDistance`. Returns `Running` indefinitely (never succeeds on its own — use a decorator for timeout/condition).

---

## Withdrawal Tasks (1)

### Retreat
Withdraw from combat. Units pathfind away from `Targets` — direction is inverse of target position relative to unit. Speed multiplied by `OutOfRangeSpeedMultiplier`. Returns `Success` when unit reaches `OutOfRangeDistanceDelta` away from all targets.

---

## TaskStatus Summary

| Task | Returns Success When | Returns Failure When |
|------|---------------------|---------------------|
| Attack | Target dead | Target unreachable |
| Charge | Arrived at target | Path blocked |
| Flank | Target dead from flank | Path to flank blocked |
| Ambush | All targets dead | Trigger never fires |
| Shoot and Scoot | Target dead | Target unreachable |
| Leapfrog | Target dead | Path blocked |
| Surround | All targets dead | Can't form perimeter |
| Defend | Never (use decorator) | Never (use decorator) |
| Retreat | Reached safe distance | Path fully blocked |
