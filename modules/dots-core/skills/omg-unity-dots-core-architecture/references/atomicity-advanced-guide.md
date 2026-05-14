---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# ECS Atomicity Advanced Guide — Refactoring Decision Flow & See Also

## 5. Refactoring Decision Flow

```
Is the component >8 fields?
  YES → Is it IBufferElementData? → YES → Exception 5 (exempt if same-pass access)
                                  → NO  → Split by concern (Config / State / Stacking)
  NO  → Does it mix concerns?
        YES → Split
        NO  → PASS

Does the system use switch/enum dispatch?
  YES → >2 cases? → FAIL — use tag dispatch
      → ≤2 cases AND <15 lines each AND no config component? → Exception 4 (acceptable)
  NO  → >150 lines? → Split at natural boundary
      → Writes >2 component types? → Extract writes to dedicated system
      → Imports ≥5 module namespaces? → Split — too many responsibilities

Does a module import >2 sibling modules?
  YES → Introduce bridge components in DOTSRPG.Core
  NO  → PASS
```

---

## See Also

- [reusability-checklist.md](reusability-checklist.md) — full cross-project portability audit
- [solid-ecs.md](solid-ecs.md) — SOLID principles adapted for ECS
- [component-decisions.md](component-decisions.md) — create vs extend decisions
- [system-decisions.md](system-decisions.md) — create vs extend decisions
