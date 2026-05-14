---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# ECS Atomicity Guide

Prescriptive rules for atomic components and systems in the DOTS RPG library. Use this as the audit authority before creating or reviewing any component or system.

---

## 1. Definitions

### Atomic Component

An atomic component is an **indivisible data unit of exactly ONE concern**.

**MUST:**
- ≤8 fields (HARD LIMIT)
- All fields serve one concern (identity OR timing OR stacking — never mixed)
- Zero game-specific imports from sibling modules (only own module or DOTSRPG.Core)
- One type per file (no bundled structs)
- Config fields (write-once) separate from runtime state (write-often)

**MUST NOT:**
- Define static factory methods on data structs (exception: buffer elements with 5+ callers)
- Be defined inside a system file — components ALWAYS live in `Components/` folder

### Atomic System

An atomic system is a **single-transformation processor**.

**MUST:**
- One transformation per system (no multi-pass unless same data pipeline)
- ≤150 lines (split at natural boundaries)
- Write to ≤2 component types

**MUST NOT:**
- Use switch/if-else dispatch on enum type → use tag components + separate systems (exception: ≤2 cases, <15 lines each, no config component exists)
- Import ≥5 module namespaces (hard limit: ≤4)
- Reset state across module boundaries (each module owns its own cleanup)

---

## 2. Pass/Fail Audit Checklist

### Component Atomicity

- [ ] ≤8 fields
- [ ] 1 concern per component
- [ ] 1 type per file
- [ ] No imports from non-Core sibling modules (except own module)
- [ ] No factory methods on struct (exception: buffer elements with 5+ callers)
- [ ] Config separate from runtime state
- [ ] Not defined inside a system file

### System Atomicity

- [ ] 1 transformation
- [ ] ≤150 lines
- [ ] No switch/enum dispatch (exception: ≤2 cases, <15 lines each, no config component)
- [ ] Writes ≤2 component types
- [ ] Imports ≤4 module namespaces
- [ ] No cross-module state resets

### Module Boundary

- [ ] ≤2 sibling module dependencies (excluding Core)
- [ ] Shared enums/types live in Core
- [ ] Bridge components used for cross-module reads
- [ ] No god orchestrator (a module that depends on everything)

---

## 3. Accepted Exception Patterns

### Exception 1 — Denormalized Cache

**Example:** `PerceivedEntity` stores `HealthPct`, `ThreatValue`

**WHY:** BDP tasks run per-frame; `ComponentLookup` random access is too expensive when iterated in behavior tree evaluation.

**RULE:**
- Document as `// perf cache` comment on each denormalized field
- Consumers MUST treat these fields as read-only
- Cache is invalidated each frame by the producing system

---

### Exception 2 — Combined Timer + State

**Example:** `MovementImpulse` has `Velocity` + `TimeRemaining` + `TotalDuration`

**WHY:** These fields are always read and written together. Splitting them adds query complexity (two components in every query) with zero architectural gain.

**RULE:** Only acceptable when ALL fields change at the same frequency (every write touches every field).

---

### Exception 3 — `DamageEvent.Create()` Static Factory

**Example:** `DamageEvent.Create(attacker, target, amount, type)` on a buffer element

**WHY:** 5+ construction sites across the codebase. Prevents inconsistent construction (missing fields, wrong defaults).

**RULE:**
- Only for `IBufferElementData` with 5+ construction sites
- Factory method must be pure (no side effects, no `SystemAPI` calls)
- Must produce a fully initialized value with no unset fields

---

### Exception 4 — `SkillCastingSystem` Enum Dispatch

**Example:** `switch (skill.Behavior) { case Melee: ... case Self: ... }`

**WHY:** `Melee` and `Self` skill behaviors have ZERO unique config fields. Creating `MeleeSkillTag` + `SelfSkillTag` would require `IComponentData` but there is no data to attach. Tag dispatch is appropriate only when tags carry no config — these cases truly have no config.

**RULE:** Enum dispatch is acceptable ONLY when:
1. ≤2 cases
2. Each case is <15 lines
3. No config component exists or is needed for either case

**NOTE:** `Projectile` and `AoE` use component-based dispatch (`ProjectileSkillConfig`, `AoESkillConfig`) because they have unique config fields — they are NOT exceptions.

---

### Exception 5 — Buffer Elements >8 Fields

**Examples:** `StatusEffect` (11 fields), `SkillSlot` (17 fields)

**WHY:** Buffer elements are per-slot, not per-entity. Splitting `SkillSlot` into `IComponentData` was proven wrong — a per-entity component cannot carry per-slot data (e.g., slot 0 vs slot 1 cooldown state).

**RULE:**
- Buffer elements (`IBufferElementData`) are exempt from the ≤8 field rule
- All fields must be accessed in the same processing pass
- Splitting via `IComponentData` is disallowed when the data is inherently per-slot

---

## 4. Violation Examples from Current Codebase

| Location | Violation | Status |
|----------|-----------|--------|
| `DerivedStats` | 12 fields mixing combat + resource + locomotion — 3 concerns in one component | FAIL — split to `CombatDerivedStats`, `ResourceDerivedStats`, `LocomotionDerivedStats` |
| `SkillCastingSystem` | `switch(SkillBehaviorType)` with 4 cases | PARTIAL FAIL — `Projectile`/`AoE` use component dispatch (correct); `Melee`/`Self` exempt (see Exception 4) |
| `RespawnSystem` | Resets state across 5 modules (health, skills, status, AI, navigation) | FAIL — use per-module cleanup tags triggered by shared `RespawnRequestTag` |
| `RewardGrantedTag` | Defined inside `KillRewardSystem.cs` | FAIL — move to own file `RewardGrantedTag.cs` in Components/ |
| `DamageType` enum | Defined in `DOTSRPG.Combat`, used by `DOTSRPG.Skills` | FAIL — move to `DOTSRPG.Core` |
| `DeadTag` | Defined in `DOTSRPG.Combat`, used by 6 other modules | FAIL — move to `DOTSRPG.Core` |

---

-> See [atomicity-advanced-guide.md](atomicity-advanced-guide.md) for the refactoring decision flow and See Also links.
