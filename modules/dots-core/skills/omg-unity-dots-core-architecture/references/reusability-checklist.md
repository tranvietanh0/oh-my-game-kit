---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Reusability Checklist for DOTS Packages

## Pre-Flight: Before Creating Any Component or System

- [ ] Search existing codebase for similar functionality first
- [ ] Check if an existing component can be extended instead
- [ ] Verify the new code belongs in the reusable package, not in demo/game code
- [ ] Confirm no game-specific tuning values are hardcoded

## Component Reusability Checklist

### Data Design
- [ ] Component has 1-8 fields, all serving one concern
- [ ] All fields are unmanaged (no string, class, List<T>)
- [ ] Config fields separated from runtime state fields
- [ ] `InternalBufferCapacity` set for all `IBufferElementData`
- [ ] Tag components used instead of enum dispatch for behavior variants

### Naming & Location
- [ ] Name describes domain concept, not game-specific role
- [ ] Component in correct module (Core, Combat, AI, Stats, etc.)
- [ ] No game-specific class names (avoid `WarriorData`, prefer `MeleeAttackTag`)

### Flexibility
- [ ] Tuning values in component fields, not `GameplayConstants`
- [ ] Boolean behaviors use `IEnableableComponent` for runtime toggle
- [ ] Optional features are separate components (not bool flags in fat component)

## System Reusability Checklist

### Responsibility
- [ ] System does exactly ONE transformation
- [ ] System < 150 lines
- [ ] System imports < 5 module namespaces
- [ ] No enum/byte branching for behavior dispatch

### Performance
- [ ] Nested loops use `ComponentLookup<T>`, not `SystemAPI.Get*`
- [ ] Spatial queries use `SpatialHashGrid`, not O(N*M) brute-force
- [ ] Fixed-capacity buffers prioritize important entries
- [ ] `[BurstCompile]` on struct AND all methods

### Dependencies
- [ ] External packages only accessed via bridge systems
- [ ] System in correct `UpdateInGroup`
- [ ] `RequireForUpdate<T>` set for required singletons/components
- [ ] No circular module dependencies

### Ordering
- [ ] `[UpdateBefore/After]` only used within same group
- [ ] Cross-group ordering handled by group attributes, not system attributes
- [ ] Producer systems run before consumer systems

## Module/Package Reusability Checklist

### Assembly Structure
- [ ] Each module has its own `.asmdef`
- [ ] Dependencies are explicit and minimal
- [ ] No circular references between asmdefs
- [ ] External package deps isolated to bridge module

### Constants
- [ ] Only universal constants in shared `GameplayConstants` (epsilons, sentinels, formula constants)
- [ ] Game-specific tuning in per-entity config components
- [ ] Sentinel values documented (e.g., `NoTeam = 255`)

### Demo vs Library Separation

| Belongs in Library | Belongs in Demo/Game |
|-------------------|---------------------|
| `Health`, `DamageEvent`, `TeamId` | `BattleState`, `TeamAliveCount` |
| `DetectionRange`, `PerceivedEntity` | Specific behavior tree compositions |
| `NavigationTarget` (abstraction) | Arrow speed, mage AoE radius values |
| `StatFormulaConfig` (configurable) | Specific formula multiplier values |
| `DamageProcessingSystem` | `BattleStateSystem` (team deathmatch) |
| `SpatialHashGrid` (utility) | `BDPTreeBuilder` (editor script) |
| Tag components (`DeadTag`) | Unit class constants (`UnitClassMage=3`) |

### Singleton Management
- [ ] Singletons are opt-in (`RequireForUpdate<T>` guards)
- [ ] Systems that need singletons don't run when singleton absent
- [ ] Demo-specific singletons not in reusable package

## Red Flags (Immediate Action Required)

| Red Flag | Action |
|----------|--------|
| `GameplayConstants.ArrowSpeed` used in system | Move to `ProjectileConfig` component |
| `if (unitClass == UnitClassMage)` in system | Replace with `MageAttackTag` query filter |
| System > 200 lines | Split into 2+ focused systems |
| System imports `ProjectDawn.Navigation` + `DOTSRPG.AI` | Create bridge system in its own asmdef |
| Buffer fills without priority ordering | Add priority logic (enemies > allies) |
| `SystemAPI.GetComponent` inside nested foreach | Convert to `ComponentLookup<T>` in job |
| Same 5-line pattern in 3+ systems | Accept if ECS boilerplate, document pattern |

## Cross-Project Portability Checklist

### Dependency Audit
- [ ] Component imports ONLY from own module or DOTSRPG.Core
- [ ] System imports ≤4 module namespaces
- [ ] No reference to demo-specific types
- [ ] Shared enums (DamageType, StatusEffectType) live in DOTSRPG.Core

### Module Boundary Rules
- [ ] Module depends on ≤2 sibling modules (excluding Core)
- [ ] Cross-module communication via bridge components in Core
- [ ] No module depends on ALL other modules (god orchestrator)
- [ ] External package deps isolated to one bridge module

### Portability Verification
- [ ] Component can be used without importing unrelated modules
- [ ] System can be disabled without breaking other systems
- [ ] Module asmdef can be added to new project independently
- [ ] No hardcoded layer indices (use configurable filter fields)

## Post-Implementation Verification

After creating/updating any DOTS code:

1. **Compile check** — Run Unity compilation, fix errors
2. **Skill update** — Update relevant `.agents/skills/` reference if pattern/gotcha discovered
3. **Constants audit** — Verify no new magic numbers added
4. **Module boundary** — Verify no new cross-module imports that shouldn't exist
5. **Buffer capacity** — Verify any new buffers have `InternalBufferCapacity`
