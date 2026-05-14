---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# BDP 2 → BDP 3 Migration Guide

> Captured during a workspace migration of BDP 2.1.12 → BDP 3.0.2.
> Institutional memory for any future BDP version migration.

---

## Summary at a Glance

Only two API patterns broke across the entire BDP 2.1.12 → 3.0.2 upgrade: adding a 3rd generic to ECS task base classes (~23 wrapper files in the dots-bdp library), and removing an explicit bootstrap call that became a deprecated no-op (1 file, deleted). All other surface area — Components namespace, TaskStatus enum, ITreeLogicNode/IParentNode properties, BehaviorTreeSystemGroup namespace, all Add-On MB-side interfaces, TreeBuilder API — was completely stable. The mechanical port took under two hours once the per-wrapper recipe table was in hand.

---

## Migration Sequence (8 Phases)

| Phase | Name | Key Output |
|-------|------|------------|
| 1 | Inventory + snapshot | File counts per pattern; git tag before deleting old vendor |
| 2 | Remove old version | Delete vendor folder; capture asmdef refs |
| 3 | Import new version | Asset Store install; pin version; apply vendor bug workarounds |
| 4 | API reconnaissance | Read BDP 3 base classes; capture per-wrapper recipes; classify by pattern |
| 5 | Port wrapper library | Apply per-pattern recipe; compile-incrementally |
| 6 | Regenerate demo trees | Rebuild Behavior Tree assets after wrapper port |
| 7 | Test + runtime validation | EditMode tests + 8-check Play mode validation |
| 8 | Skill + wiki sync | This reference file is the Phase 8 deliverable |

**Phase 4 is the highest-leverage hour.** Invest time reading the new base classes and producing a per-wrapper recipe table BEFORE touching any wrapper file. This converts Phase 5 from guesswork into mechanical find-and-replace.

---

## Breaking-Change Recipes

### Pattern A — ECSActionTask / ECSConditionalTask: Add 3rd Generic

**Scope:** Authoring wrapper classes that subclass `ECSActionTask<>` / `ECSConditionalTask<>`
**Risk:** LOW — mechanical edit, no logic changes
**Files affected per wrapper:** Authoring file only (1 of 4-6 files per task)

**Before (BDP 2):**
```csharp
public class Patrol : ECSActionTask<PatrolTaskSystem, PatrolComponent>
{
    public override ComponentType Flag => typeof(PatrolFlag);
    public override PatrolComponent GetBufferElement() => new PatrolComponent { Index = RuntimeIndex };
}
```

**After (BDP 3):**
```csharp
public class Patrol : ECSActionTask<PatrolTaskSystem, PatrolComponent, PatrolFlag>
{
    // Flag property REMOVED — base class implements it via TComponentFlag
    public override PatrolComponent GetBufferElement() => new PatrolComponent { Index = RuntimeIndex };
}
```

**Edit recipe per file (2 lines):**
1. Change `: ECSActionTask<TSystem, TComponent>` → `: ECSActionTask<TSystem, TComponent, TFlag>` (insert the existing flag type as 3rd generic)
2. Delete the `public override ComponentType Flag => typeof(TFlag);` line

Same recipe applies to `ECSConditionalTask`. The `IReevaluateResponder` properties (`ReevaluateFlag`, `ReevaluateSystemType`) are unchanged.

**What is unchanged in the authoring class:**
- `GetBufferElement()` signature and body — identical
- `IReevaluateResponder` properties — identical
- `[Opsive.Shared.Utility.Category(...)]` attribute — identical
- Constructor / any serialized fields — identical

**New in BDP 3 (no wrappers yet):**
BDP 3 adds `ECSCompositeTask<TSystem, TBuffer, TFlag>` and `ECSDecoratorTask<TSystem, TBuffer, TFlag>` for the same pattern. We have no wrapper classes using these yet — noted for future reference only.

---

### Pattern B — EnableBakedBehaviorTreeSystem: Deprecated No-Op

**Scope:** Any bootstrap system that calls `BehaviorTree.EnableBakedBehaviorTreeSystem(world)`
**Risk:** LOW — no behavior change; the call becomes a no-op with a deprecation warning

**Before (BDP 2):**
```csharp
public partial struct BDPBootstrapSystem : ISystem
{
    private void OnUpdate(ref SystemState state)
    {
        state.Enabled = false;
        BehaviorTree.EnableBakedBehaviorTreeSystem(World.DefaultGameObjectInjectionWorld);
    }
}
```

**After (BDP 3):**
BDP 3 auto-bootstraps the baked-tree system on world creation. Remove the explicit call entirely. If your bootstrap file becomes vestigial after this removal (its only non-deprecated content was an Editor log or a dead constant), delete the file.

If your project has other content in the bootstrap file, keep the file and just remove the `EnableBakedBehaviorTreeSystem` call line.

---

## What Stays Stable (Nothing to Do)

The following surface area required zero edits during the BDP 2 → BDP 3 migration:

| Surface | Status |
|---------|--------|
| `Opsive.BehaviorDesigner.Runtime.Components` namespace | STABLE — `EvaluateFlag`, `TaskComponent`, `BranchComponent`, `EnabledFlag` unchanged |
| `TaskStatus` enum | STABLE — 5 values: `Inactive`, `Queued`, `Running`, `Success`, `Failure` |
| `IEventNode` / `Start.ConnectedIndex` | STABLE — TreeBuilder needed no edits |
| `ITreeLogicNode` / `IParentNode` | STABLE — `Index`, `ParentIndex`, `SiblingIndex`, `RuntimeIndex` unchanged |
| `BehaviorTreeSystemGroup` namespace | STABLE — `Opsive.BehaviorDesigner.Runtime.Groups` unchanged |
| `GetBufferElement()` signature | STABLE — body and return type unchanged |
| `IAuthoringTask.AddBufferElement` | STABLE — new `registry` param added but if you never override it, base handles it |
| All task system structs (`ISystem`) | STABLE — system logic, job patterns, ComponentLookup caching all unchanged |
| Bridge / system ordering systems | STABLE — bridge pattern and system group ordering unchanged |
| Throttle systems (e.g., `BDPEvaluateFlagThrottleSystem`) | STABLE — throttle pattern unchanged |
| All Add-On MB-side interfaces | STABLE — `IAttackAgent`, `IDamageable`, `MovementBase`, `FormationsBase` unchanged |
| asmdef reference names | STABLE — all assembly definition references valid post-upgrade |

---

## Gotchas Discovered During This Migration

### G1 — ISubtreeReference Duplicate Definition (BDP 3.0.2 Vendor Bug)

BDP 3.0.2 ships `ISubtreeReference.cs` in the source package that conflicts with the DLL version, causing a duplicate type definition compile error.

**Workaround:**
```bash
rm Packages/com.opsive.behaviordesigner/Runtime/Tasks/ISubtreeReference.cs
rm Packages/com.opsive.behaviordesigner/Runtime/Tasks/ISubtreeReference.cs.meta
```

**Important:** This re-applies on every Asset Store re-import. Keep this documented — it is easy to forget between sessions. Remove this gotcha from the guide if BDP 3.0.3 ships with the fix.

### G2 — Burst Cache Invalidation on BDP Package Update

After installing any new BDP version, Unity may throw stale-Burst compile errors on the first compilation run.

**Fix:**
```bash
rm -rf Library/BurstCache Library/Bee/artifacts Library/ScriptAssemblies
```

Run this immediately after updating the BDP package version, before opening Unity.

### G3 — Stale Demo Tree Builder Paths (Pre-existing, Not a BDP Issue)

During Phase 1 inventory, stale prefab folder paths can hide in demo BDP tree builder files. This is a pre-existing issue unrelated to the BDP API change. It causes tree regeneration to silently no-op (trees not written to disk). Catch this in Phase 6 as part of the demo regen step.

**Lesson:** Always verify tree builder output by checking file modification timestamps after running the build menu item.

### G4 — Editor Asmdef Compile-Blocker Gating Play Mode

Play mode refuses entry if ANY assembly has compile errors — even an unrelated assembly. During Phase 7 runtime validation, parked unrelated work in a different asmdef can block Play mode entry. This is not a BDP issue, but it blocks smoke validation.

**Lesson:** Before attempting Play mode validation during a migration, verify all assemblies compile cleanly (`read_console` shows zero errors). Unrelated parked work in other asmdefs must be resolved first.

---

## Files Affected — Reference Migration

The exact file count varies per consumer project depending on how many ECS task wrappers are in the library. For a wrapper library with ~23 ECS task wrappers and 1 bootstrap file, expect:

| Layer | Files | Pattern | Lines Changed |
|-------|-------|---------|---------------|
| Authoring wrappers | ~23 | A: 3rd generic + remove Flag override | ~46 lines (~2 per file) |
| Bootstrap | 1 (often deleted) | B: deprecated call removal | full file or 1 line |
| Task systems (ISystem structs) | many | none — STABLE | 0 |
| TreeBuilder code | 1-2 | none — STABLE | 0 |
| Bridge + Throttle systems | 1-2 | none — STABLE | 0 |
| Tests | many | none direct — auto-unblocked when authorings green | 0 |

The 80% rule: 80% of your codebase that touches BDP requires zero edits. The other 20% follows two mechanical recipes.

---

## Phase 4 Reconnaissance Artifacts

Recommended artifacts to capture during Phase 4 (kept in `plans/` for the migration session):

| File | Contents |
|------|----------|
| `bdp-N-api-spec.md` | Full BDP API spec (sections per major surface) captured from source inspection |
| `per-wrapper-recipes.md` | File-by-file recipe table for all authoring wrappers |
| `bootstrap-replacement.md` | Bootstrap deprecation details and rationale (if applicable) |
| `unknowns.md` | Items deferred to later phases (vendor namespace moves, vendor bug re-apply triggers, version-pin update path) |

---

## Forward Path (Next Version Migration)

When the next BDP version migration arrives, use this 8-phase sequence as the template:

1. **Phase 1 (Inventory):** Count files by pattern before removing old vendor. Tag git.
2. **Phase 4 (Reconnaissance) is the highest-leverage step.** Spend a full session reading the new base classes and capturing the per-wrapper recipe table before editing any file. A complete recipe table converts Phase 5 into mechanical work.
3. **Phase 5 (Port) — compile-incrementally.** Apply one pattern group at a time, verify error count drops after each group, then continue. Do not batch all wrapper files in one shot without interim compilation checks.
4. **Phase 6 (Demo regen)** and **Phase 7 (Tests)** usually unblock automatically once wrappers compile green. Verify tree builder output by file timestamp.
5. **Clear Library/** caches immediately after installing the new package (G2 above).
6. **Apply vendor workarounds first** (G1 above) before first compilation attempt.

---

## Skills to Update at End of Every BDP Version Migration

| Skill | What to Check |
|-------|---------------|
| `behavior-designer-pro/SKILL.md` + references | Version in Requirements; Key Conventions; this migration guide |
| `bdp-tactical-pack/SKILL.md` | Verify Add-On interface stability; add catalog rows if new tasks shipped |
| `bdp-movement-pack/SKILL.md` | Verify MovementBase namespace unchanged; new locomotion tasks |
| `bdp-formations-pack/SKILL.md` | Verify FormationsBase namespace; new formation types |
| `dots-rpg/SKILL.md` | If it lists specific BDP wrappers or version numbers |
| Project AGENTS.md "Required DOTS Packages" | Bump `com.opsive.behaviordesigner` version line |

---

## Lessons Learned (Specific to This Migration)

- **Recipe-driven port worked.** Wrappers done in under two hours by mechanical edits once the recipe table was complete. The investment in Phase 4 reconnaissance paid off immediately in Phase 5.
- **ISubtreeReference vendor bug re-application.** Re-imports reset the fix silently. This needs to be in the README runbook, not just the skill, so it doesn't surprise on fresh clones.
- **Phase 7 was gated by unrelated parked work.** Play mode refused entry due to compile errors in a different asmdef unrelated to BDP. Future migrations should start with a clean compile state baseline — resolve all other errors before beginning the migration port.
- **Vestigial bootstrap deletion.** When the only content of a bootstrap file becomes vestigial, delete the file. A file whose sole surviving line is a deprecated no-op is noise in the codebase.
