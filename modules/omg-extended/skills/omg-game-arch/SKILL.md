---
name: omg-game-arch
description: "Author game-engine code with 4-layer Clean Architecture (Domain/Application/Presentation/Infrastructure), vertical feature modules, mandatory module-contract.md, and unit-testable logic. Cocos + Unity today, RN/Web tomorrow. Use when refactoring god-Components, designing systems from a GDD, or scaffolding a new feature module."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Game Architecture — Author & Refactor Skill

Teach game devs to organize **game-engine code** as 4-layer Clean Architecture
with vertical feature modules and a mandatory `module-contract.md`. Today:
**Cocos** (TS / `cc.Component`) and **Unity** (C# / `MonoBehaviour`). Future
engines (RN, Web) free-ride on the same universal references.

> **Disambiguation.** `omg-game-arch` is for **game code** (MonoBehaviour,
> cc.Component, game features, GDDs). For **agentic systems** (agent loops,
> tools, MCP, prompt cache) load `omg-architecture` instead. Same word
> "architecture", different domains.

## When to use

- **Refactoring** a god-MonoBehaviour or god-`cc.Component` into layered, testable code.
- **Designing** a feature module from a Game Design Document (GDD) or requirement spec.
- **Scaffolding** a new feature with the right directory shape and `module-contract.md`.
- **Reviewing** module boundaries — direct concrete cross-module refs, missing port, missing contract.
- **Wiring DI** — VContainer (Unity) or manual composition root (Cocos).

## Decision tree — which reference do I load?

Load **only** the references your task needs. Each is self-contained.

| Intent | Load |
|---|---|
| Universal principles + dependency rule + DI primer | `references/principles.md` |
| Author or read a `module-contract.md` (template + worked Combat / Inventory / Quest) | `references/module-contracts.md` |
| Cross-module call: port vs event vs command? | `references/inter-module-communication.md` |
| Function-level pre/post/error contracts (`Result<T, Error>`) | `references/function-contracts.md` |
| Test pyramid, coverage targets, mock vs fake | `references/testing-strategy.md` |
| Unity specifics (asmdef strict, VContainer, NUnit, ScriptableObject) | `references/unity-patterns.md` |
| Cocos specifics (composition root, signalBus, Vitest, eslint-plugin-import) | `references/cocos-patterns.md` |
| Scaffold a new feature module (Unity + Cocos directory trees) | `references/module-templates.md` |
| Refactor a god-Component to a layered module (7-stage incremental playbook) | `references/refactor-playbook.md` |

## The 4 layers (one-liner each)

1. **Domain** — pure entities + rules. No engine import. 100% unit-testable.
2. **Application** — use cases + ports. Depends on Domain. 90% unit-testable.
3. **Presentation** — `MonoBehaviour` / `cc.Component`. Thin: receives input, calls use case.
4. **Infrastructure** — engine adapters (animation, audio, persistence) injected into Application's ports at the composition root.

Dependency rule: **Presentation → Application → Domain ← Infrastructure (injects up)**. Compiler-enforced via asmdef in Unity; lint-enforced via `eslint-plugin-import no-restricted-paths` in Cocos.

## The module contract (mandatory per feature module)

Every feature module ships a `module-contract.md` declaring:

- `module:` name, `version:` semver
- `inputs:` commands (mutations), queries (reads), events_consumed
- `outputs:` events_emitted
- `dependencies:` required_ports (interfaces), module_deps (other features, marked "via events" or "via port")
- `internal:` implementation detail — NOT public surface

Worked examples (Combat / Inventory / Quest) live in `references/module-contracts.md`.

## Inter-module communication — three patterns, one rule

| Pattern | When | Mechanism |
|---|---|---|
| **Port** | Sync cross-module call needs result | Caller's Application defines interface; callee implements; wired at composition root |
| **Event** | Fire-and-forget, multi-subscriber | Shared bus (VContainer SignalBus / Cocos signalBus) |
| **Command** | Cross-feature mutation with explicit intent | Command + handler registry |

**Forbidden:** direct concrete-class reference between modules.

## Quick-fire heuristics (apply before opening a reference)

- **Logic in Presentation?** → extract to Application use case; Presentation stays < 50 lines.
- **`new` keyword crossing module boundary?** → wrong; declare a port and inject the adapter at the composition root.
- **Domain class imports `UnityEngine` / `cc`?** → wrong; Domain MUST be engine-free.
- **No `module-contract.md`?** → not done. Stage 7 of the refactor playbook is non-optional.
- **Throwing exceptions in Domain?** → use `Result<T, Error>`; throws are an Application/Infrastructure concern.

## How to apply

1. Match user intent → reference via the decision tree above.
2. Load only that reference (and any backlinks it explicitly calls out).
3. **Quote the principle by name.** e.g., *"This violates the dependency rule — Presentation imports a concrete `WwiseAudio` from Infrastructure. Define `IAudioCue` in Application; let Infrastructure implement it; inject at composition root."*
4. **Acknowledge "starter pattern, adapt as needed."** Teams with existing architecture should specialize, not big-bang.
5. **Refactor incrementally.** Use the 7-stage playbook — one commit per stage; stage 7 (contract) is the artifact that anchors the module.

## Sources & verification

- **Stable:** universal principles, dependency rule, layer names, module-contract template — engine-agnostic, unlikely to change.
- **Volatile (verify before pasting):** VContainer / Vitest / `eslint-plugin-import` config samples in engine references — pin author-time version with date stamp; future updates via `omg-issue` flow.

## Scope

Authoring + refactor guidance for **game code**. Does NOT:
- Cover engine-runtime tuning (frame rate, GC, draw calls) — out of scope.
- Replace the GDD itself — translates GDD → module contracts.
- Apply to non-game projects — for agentic systems use `omg-architecture`.
