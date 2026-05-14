---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Testing Strategy — Pyramid + Coverage + Mock vs Fake

This file declares **what to test and at what coverage**. Engine-specific
runners (NUnit / Vitest) and how-to are in `unity-patterns.md` and
`cocos-patterns.md`.

---

## The pyramid

```
                ┌───────────────────────────┐
                │  Presentation: smoke      │   <- few; manual or play-mode
                │  + manual playtest        │
                ├───────────────────────────┤
                │  Infrastructure:          │   <- a handful per adapter
                │  integration tests        │
                ├───────────────────────────┤
                │  Application: 90% unit    │   <- many; ports mocked
                │  (mock ports)             │
                ├───────────────────────────┤
                │  Domain: 100% unit        │   <- most; pure, no engine
                │  (pure, fast, no engine)  │
                └───────────────────────────┘
```

| Layer | Coverage target | Style | Why |
|---|---|---|---|
| **Domain** | 100% unit | Pure functions, no engine import | Logic is the heart of the game; bugs here are content-level, debugging is brutal in the engine |
| **Application** | 90% unit | Mock the ports, run the use case | Verifies orchestration: "given X event, the use case calls port Y and emits event Z" |
| **Presentation** | smoke + manual | Play-mode test in Unity, headless harness in Cocos | Cheap to verify "screen renders"; expensive to verify pixel correctness |
| **Infrastructure** | integration | Spin up engine subsystem (audio, persistence) | Adapters are thin wrappers; one happy-path + one failure-path each is enough |

---

## Why 100% on Domain

Domain code is:

1. **Pure** — no I/O, no engine, no time. Tests run in milliseconds.
2. **Stable** — Domain rarely changes once a feature ships; coverage doesn't churn.
3. **High-leverage** — a Domain bug ripples through every Presentation that
   uses the entity. Cheaper to catch in 100ms unit test than in a 5-minute
   play-mode session.

The 100% target is realistic precisely because Domain has no excuses — no
engine to mock, no time to fake. Every branch is reachable.

---

## Why only 90% on Application

Application use cases coordinate ports. The remaining ~10% is glue code
(constructor wiring, port registration in the composition root) — testing
it is testing the DI container, not your logic.

Aim to test:

- **Happy path** — input → expected port calls → expected event emitted.
- **Each error branch** — every `Result<T, Error>` `Err` variant.
- **Idempotency** — sending the same command twice doesn't double-emit.
- **Event consumption** — given event X, the listener does Y.

---

## Mock vs fake — when to use which

**Mock** — verifies *interactions*. "The use case called `audio.play('hit')`
exactly once."

**Fake** — *behaves* like the real thing in-memory. "The fake repository
remembers what was added and returns it on get."

| Scenario | Use |
|---|---|
| "Did the use case call the audio port?" | Mock |
| "Does the use case correctly read inventory state?" | Fake (FakeInventoryRepository) |
| "Was `DamageDealt` event emitted with the right payload?" | Mock the bus, capture emit |
| "Does the Domain entity reject invalid state?" | Pure unit test, no double |
| "Does my adapter actually persist?" | Integration test, real engine |

**Rule of thumb:**

- Domain tests use **no doubles** — they're pure functions.
- Application tests use **mocks** for ports they call (verify the call) and
  **fakes** for ports they read state from (verify the result).
- Infrastructure tests use **the real engine subsystem** (NUnit play-mode
  test or Vitest with a real adapter against a temp folder).

---

## What NOT to test

- **Engine internals** — assume Unity/Cocos work. Don't test that
  `AudioSource.Play()` plays a sound.
- **Trivial getters/setters** — type system already enforces.
- **Config loading** — covered by integration; unit-testing config readers
  is high-friction, low-value.
- **UI pixel layouts** — visual regression is its own discipline; not unit
  test territory.
- **Composition root** — DI container does the work; trust the container.
  Test the use cases that the container produces.

---

## Test structure (engine-agnostic)

Tests live alongside the feature module:

```
{feature}/
  domain/
  application/
  presentation/
  infrastructure/
  tests/
    domain/             # pure unit tests
    application/        # use case tests (mocked ports)
    integration/        # adapter tests against real engine
```

**Naming:**

- `should_<expectedOutcome>_when_<condition>` — descriptive, asserts
  behavior.
- `should_returnError_when_inputIsNegative` ✓
- `testAttack` ✗ (says nothing).

**Independence:** each test is independent. No shared mutable fixture.
Setup/teardown rebuilds the world for every case.

---

## Running tests in CI

- Domain + Application unit tests run on every PR — must be < 30s total in
  the dev loop.
- Infrastructure integration tests run on PR but may be slower (engine spin-up
  cost) — acceptable up to 2 minutes.
- Presentation smoke / play-mode tests run nightly or pre-release — too
  slow for per-commit.

If your Domain + Application tests take more than 30s, suspect a missed
fake-vs-real boundary (a Domain test pulled in an engine call).

---

## Mutation testing — optional but high-leverage on Domain

Once Domain coverage hits 100%, run mutation testing (e.g., Stryker for TS,
Stryker.NET for C#) on Domain only. This catches the "100% line coverage,
0% behavior coverage" trap. Mutation score targets:

- Domain: ≥ 90% kill rate.
- Application: ≥ 70% kill rate (mocks introduce noise).

If you can't reach the target, your tests are asserting structure, not
behavior. Refactor the tests to assert the visible result.

---

## Related

- `principles.md` — why Domain is pure (foundation of testability)
- `function-contracts.md` — preconditions are the unit-test boundary
- `inter-module-communication.md` — events tested via mock-the-bus
- `module-contracts.md` — contracts list the events and ports — those become
  the test surface
- `unity-patterns.md` — NUnit setup, play-mode tests, asmdef for Tests
- `cocos-patterns.md` — Vitest config, headless harness
