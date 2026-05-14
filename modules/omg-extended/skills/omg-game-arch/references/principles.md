---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Principles — 4-Layer Clean Architecture for Game Code

This file is **the single owner of universal principles**. Engine references
(`unity-patterns.md`, `cocos-patterns.md`) MAY ONLY specialize what is here.
They MUST NOT introduce new universal principles. If a candidate rule applies
to both engines, it belongs in this file.

> **Starter pattern, adapt as needed.** This is a known-good baseline, not a
> dogma. Teams with existing architecture should specialize these principles to
> their constraints — incrementally — not big-bang. The
> `refactor-playbook.md` is designed for that.

---

## The 4 layers

```
┌─────────────────────────────────────────────────────────┐
│  Presentation     (MonoBehaviour / cc.Component, UI)    │
│       ▼                                                 │
│  Application      (use cases, ports = interfaces)       │
│       ▼                                                 │
│  Domain           (entities, rules, pure logic)         │
│       ▲                                                 │
│  Infrastructure   (engine adapters: audio, persistence) │
│                   injected up at composition root       │
└─────────────────────────────────────────────────────────┘
```

| Layer | Owns | Imports | Engine import? |
|---|---|---|---|
| **Domain** | Entities, value objects, rules, formulas, invariants | nothing | **Forbidden** |
| **Application** | Use cases, ports (interfaces), command/query handlers | Domain only | **Forbidden** |
| **Presentation** | `MonoBehaviour` / `cc.Component`, input wiring, UI bindings | Application | Required |
| **Infrastructure** | Adapters that implement Application's ports (audio, animation, persistence, network) | Application | Required |

**Rule of thumb:** if a class has the word "Manager", "Handler", "Controller",
or "System" in its name and lives in Presentation, suspect a god-Component —
extract its logic to Application.

---

## The dependency rule

**Outer layers depend inward; inner layers know nothing about outer.**

- Presentation → Application → Domain — direct import allowed.
- Domain ← Infrastructure — Infrastructure implements Application's ports;
  the concrete is **injected up** at the composition root, never imported by
  Application or Domain.
- **Forbidden:** any cross-module direct concrete reference. Use a port, an
  event, or a command. See `inter-module-communication.md`.

Compiler/lint enforcement (engine-specific):

- Unity: asmdef strict — one asmdef per layer per feature; the C# compiler
  refuses cross-module concrete refs. See `unity-patterns.md`.
- Cocos: TS has no asmdef equivalent — enforced via `eslint-plugin-import`
  `no-restricted-paths`. See `cocos-patterns.md`.

---

## Vertical feature modules

Code is grouped **by feature**, not by file type. A "feature module" is a
self-contained vertical slice of the four layers.

```
{feature}/
  domain/
  application/
  presentation/
  infrastructure/
  tests/
  module-contract.md     ← mandatory; declares I/O + deps + events
```

Example features: Combat, Inventory, Quest, Progression, Shop, Tutorial.

A module owns its public surface — declared in `module-contract.md`. Anything
not in the contract is `internal:` and must not be imported by any other
module. The contract is the API; everything else is implementation detail.

See `module-contracts.md` for the template and three worked examples.

---

## Dependency injection at the composition root

A **composition root** is the one place that knows concrete implementations.
Everything below it sees only interfaces (ports).

- Unity: VContainer `LifetimeScope` per scene/feature. See `unity-patterns.md`.
- Cocos: manual composition root in `bootstrap.ts` or feature `index.ts`. See
  `cocos-patterns.md`.

**Why centralize:** the composition root is the only file that changes when
you swap an adapter (e.g., Wwise → FMOD). All other code is decoupled.

**Smell:** any `new ConcreteService()` outside the composition root is wrong
unless the type is a pure Domain value object.

---

## Why these principles (calibrated for ~50-person studio)

- **Testability** — Domain pure → 100% unit-testable without engine runtime.
  Application pure-with-port-mocks → 90% unit-testable.
- **Reversibility** — adapter swaps cost one composition-root edit. No
  shotgun-surgery on Presentation.
- **Onboarding** — a new dev finds Combat by `cd Combat/`, reads
  `module-contract.md`, knows what events flow in/out and what ports are
  required. No archaeology.
- **GDD traceability** — features map 1:1 to modules; contracts map 1:1 to
  GDD sections. When the GDD changes, the contract diff is the spec diff.

---

## Closing meta-principle

> **Push complexity to the boundaries.** Engine messiness lives in
> Presentation + Infrastructure. Domain + Application stay typed, pure,
> testable. Each boundary absorbs chaos and exports order.

---

## Related

- `module-contracts.md` — the artifact that anchors a module's public surface
- `inter-module-communication.md` — port / event / command decision matrix
- `function-contracts.md` — function-level pre/post/error contracts
- `testing-strategy.md` — coverage targets per layer
- `unity-patterns.md` — Unity specialization (asmdef + VContainer + NUnit)
- `cocos-patterns.md` — Cocos specialization (manual root + signalBus + Vitest)
- `refactor-playbook.md` — the 7-stage incremental refactor playbook
