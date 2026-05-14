---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---

# God-Prefab Extraction Risk — Plan-Phase Detection

When a task says "lazy-load a prefab," "move prefab to Addressables," or "remove this from the scene," there is a risk hiding in the prefab's structure: **god-prefabs** — single prefabs that contain N independent subsystem singletons nested under one root controller. Naive removal cascades into N runtime NREs across the codebase, one per eager `Init()` callsite.

## Signature — what a god-prefab looks like

A prefab is a god-prefab if ANY of the following hold:

1. **Multiple MonoBehaviour singletons under one root.** The root has an "Aggregator" / "Controller" / "Manager" name and its children include 2+ classes with `public static T Instance` patterns. Example pattern observed in production: `IAP_Controller` parent with `LBoxesController`, `IAP_Offers_PlanetsPacks`, `MechaPass`, etc. all nested underneath.
2. **>5 scene-serialized fields reference instances inside it.** Other scene objects directly drag-and-drop references to its child components. `grep -r "<ChildComponentName>" Assets/**/*.unity` shows N scenes pointing at children.
3. **Eager `Init()` callsites distributed across systems.** Multiple unrelated systems call `<ChildSingleton>.Instance.Init()` or `<ChildSingleton>.Instance.<Method>` in their own `Awake/Start`. Removing the prefab from the scene means every one of those callsites NREs simultaneously.
4. **No explicit lifecycle owner.** No single system "owns" loading/unloading the prefab; everyone assumes it exists in-scene forever.

If 2+ of these are true → god-prefab → ESCALATE in plan-phase before writing code.

## Detection during planning (Step 2)

When the plan involves moving a prefab to Addressables or removing it from the scene, the planner MUST:

1. **Scan the prefab's component tree.** List every `MonoBehaviour` and tag those with static `Instance` accessors.
2. **Count inbound scene references.** Grep `.unity` and `.prefab` files under `Assets/**` for `m_Script:` or `fileID` references targeting children of the prefab. Threshold: >5 → flag.
3. **Count `Instance.` callsites.** Grep source for `<ChildClass>.Instance.` across the codebase. Threshold: 2+ unrelated callers → flag.
4. **Report findings as a plan-blocking risk.** Include the singleton list, the callsite count, and a proposed mitigation in the plan-phase output.

## Mitigation — what to propose instead

When a god-prefab is detected, the implementer MUST NOT proceed with naive "remove from scene + load via Addressables on demand." Escalate via `AskUserQuestion` with these options:

- **Split the god-prefab** into N independent prefabs, one per singleton, each independently Addressable-loadable. Update each Init() callsite to await its specific load. Highest effort, cleanest end-state.
- **Keep it scene-resident, lazy-load only the heavy assets it references** (textures, sprite atlases, sub-prefabs). Lower risk, leaves the singleton wiring intact.
- **Introduce a Lite/Heavy split** — a Lite stub stays in-scene answering `Instance` queries with no-ops or queued requests; the Heavy implementation Addressable-loads on first real use. Highest preservation of existing call sites; requires care with state-replay on hydration.
- **Abort the move.** Sometimes the prefab is genuinely scene-essential and Addressables is the wrong tool. Document the decision.

## Plan-phase enforcement

This is a HARD-GATE during Step 2 (Planning):

- If the plan moves a prefab to Addressables AND the planner did NOT scan its component tree, the plan is incomplete. Block at the Post-Plan review gate.
- The plan-phase output MUST include a "Prefab risk audit" section with the singleton count, callsite count, and chosen mitigation. Empty audit = incomplete plan.
- If the audit fires the god-prefab signature, the implementer MUST get explicit user approval for the chosen mitigation path before any code changes.

## Why this rule exists

Real incident (2026-05-10): a omg-cook session "lazy-loaded" `IAP_Controller.prefab`. The prefab housed `LBoxesController`, `IAP_Offers_PlanetsPacks`, `MechaPass`, and 3+ other singletons. Removing it from the scene NREd in 7 unrelated systems on next play, each at an eager `Init()` callsite. Recovery required reverting the change and reauthoring the migration with a Lite/Heavy split. Total cost: ~3 hours of debug + revert + replan. Detection at plan-phase would have caught all 7 callsites in <2 minutes of grepping.

## Related

- `unity-addressables` skill (in oh-my-game-kit-unity) — Addressable group registration patterns; Lite/Heavy MonoBehaviour singleton pattern
- `unity-game-patterns` skill — prefab serialization, scene references
- `references/workflow-steps.md` § Step 2 (Planning) — where this check fires
- `references/review-cycle.md` — Post-Plan review gate
