---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: testing
protected: false
---
# DOTS Unit Testing Gotchas

## Common Gotchas

1. **SystemAPI in tests**: Cannot call `SystemAPI.*` outside a system's `OnUpdate`. Use `EntityManager` directly in test assertions.

2. **IJobEntity query mismatch**: Entity must have ALL components from `Execute()` params. Missing one causes the entity to be silently skipped.

3. **ECB not flushed**: Structural changes from ECB only visible after ECB system update.

4. **DeltaTime in EditMode**: `SystemAPI.Time.DeltaTime` is near-zero in synchronous test updates. Use `SetDeltaTime(dt)` helper (calls `m_World.SetTime(new TimeData(elapsed + dt, dt))`). Requires `using Unity.Core;` for `TimeData`. For dt-dependent tests (decay, timers), either force dt via `SetDeltaTime()` or design tests to work with dt=0 (set values at exact threshold, e.g., threat=0 for `<= 0` prune).

5. **EnableableComponent vs WithNone**: `[WithNone(typeof(DeadTag))]` filters ENABLED DeadTag. Disabled DeadTag entities still match.

6. **StatusEffect StackCount**: `StatusEffectTickSystem` calculates `tickDamage = Value * StackCount`. If `StatusEffectStackSystem` isn't registered (or effect is added manually), `StackCount` defaults to 0 causing zero damage. Always set `StackCount = 1` when manually adding StatusEffects in tests.

7. **CompleteAllTrackedJobs**: Add `m_Manager.CompleteAllTrackedJobs()` after `SimulationSystemGroup.Update()` in the base `Update()` method. Parallel `IJobEntity` jobs may not be complete before assertions without this.

8. **Missing system registration**: If a system has `[UpdateAfter(typeof(X))]`, system X doesn't need to be registered (ordering is just a hint). But if X initializes data that the tested system depends on (e.g., StatusEffectStackSystem initializes StackCount), you must register X or replicate its initialization in test setup.

9. **StatusEffect field names**: `StatusEffect` uses `Value` (not `DamagePerTick`), `Duration` (not `RemainingDuration`), `Elapsed` (not `Timer`). Always read the actual component struct before writing test code — never assume field names.

10. **PlayMode tests require editor focus**: PlayMode tests enter Play mode. If Unity is minimized/unfocused, tests fail with "did not start within timeout". MCP `run_tests` with `mode=PlayMode` will also fail. Always ensure editor is visible before running.

11. **MCP test runner stuck after PlayMode failure**: If PlayMode tests fail to initialize, MCP may stay in `tests_running` state. All subsequent `run_tests` and `refresh_unity` calls return `tests_running` error. Fix: click Unity Editor to give focus, or restart Unity.

12. **Stale cache after type changes**: Adding/renaming/splitting `IComponentData` types invalidates Burst cache and compiled assemblies. Tests fail with misleading `ComponentTypeHandle<T> invalidated by structural change` (T varies randomly). Fix: `rm -rf Library/BurstCache Library/Bee/artifacts Library/ScriptAssemblies` then force recompile. NEVER suppress with LogAssert.Expect.

13. **EnabledRefRW filters to enabled-only**: Using `EnabledRefRW<T>` in `IJobEntity.Execute()` makes the query only match entities where `T` is ENABLED. To write an enableable flag regardless of state, use `ComponentLookup<T>.SetComponentEnabled(entity, true)` instead.

14. **Staggered systems need multiple Update() calls**: Systems with frame-stagger logic (e.g., `(entity.Index + FrameCount) % N != 0`) may skip entities on any single update. Tests must call `for (int i = 0; i < N; i++) Update()` to guarantee at least one frame aligns. Found in `TowerTargetingSystem` (stagger=4) — single `Update()` caused flaky `Entity.Null` results.

15. **UPM package test discovery requires testables**: `manifest.json` needs `"testables": ["com.the1studio.dots-puzzle"]` (your package name) for Test Runner to discover tests in UPM packages. Without this entry, tests compile but never appear in the Test Runner window.

16. **ECB-spawned entities need TWO Update() calls**: ECB structural changes (create, add component) are deferred to ECB system playback. First `Update()` records the ECB commands; `EndSimulationEntityCommandBufferSystem` plays them back at end of frame, making entities exist. Second `Update()` is needed for systems to actually process the newly-created entities. Common pattern: `Update(); Update(); Assert...`.

17. **State-machine tests need system isolation**: When testing systems that manage phase transitions (e.g., cascade state machine), registering ALL systems causes other systems to advance the phase past the expected value within a single `Update()`. Fix: make the test base's system registration virtual (`RegisterPuzzleSystems()`) and override to register ONLY the system under test. Example: `CascadeControlSystemTests` registers only `CascadeControlSystem` + `SwapExecuteSystem`, excluding match detection, gravity, spawn, etc. that would advance the cascade.

18. **Test base inheriting registers unwanted systems**: When `QueuePuzzleTestBase` extends `DOTSPuzzleTestBase`, the base registers ALL match-3 systems (shuffle, gravity, etc.) that interfere with queue puzzle tests. Fix: override `RegisterPuzzleSystems()` in the subclass to register only systems relevant to that puzzle type. Base match-3 systems like `BoardShuffleSystem` access `BoardEntityMap` entities that may not exist in queue puzzle context, causing `ArgumentException: The entity does not exist`.

19. **Test asmdef naming — bare names, NOT `.Runtime` suffix; one Tests asmdef per package**: A common convention contradicts an outdated hint that test asmdefs should reference `<Pkg>.Runtime`:
    - Runtime asmdefs use **bare** names: e.g. `DOTSProgression`, `DOTSProgression.MetaProgression`, `DOTSProgression.Checkpoint`, `DOTSCore`, `DOTSCore.Stats`. **NEVER** add a `.Runtime` suffix when the runtime asmdefs themselves don't carry one — those names won't resolve to any assembly.
    - Test asmdefs use the package-id-style `.Tests` suffix: `com.the1studio.dots-progression.Tests`, `com.the1studio.dots-inventory.Tests`. Lives at `Packages/<pkg>/Tests/EditMode/<pkg>.Tests.asmdef`.
    - **One Tests asmdef per package.** Do NOT create per-folder test asmdefs (e.g. `DOTSProgression.Tests.EditMode`, `DOTSInventory.Tests.EditMode`) inside `Tests/EditMode/` — Unity will see two asmdefs in the same dir and compile fails with type ambiguity.
    - When a new sub-asmdef is added to a package's Runtime (e.g., new `DOTSProgression.Persistence`), update the existing `com.the1studio.<pkg>.Tests.asmdef`'s `references` array to add it. Don't spawn a sibling Tests asmdef.
    - **Symptom of bug**: After creating a `Tests.EditMode.asmdef` referencing `<Pkg>.Runtime`, Test Runner reports "assembly reference not found" and ALL tests in the package stop appearing. Verify by `find Packages/<pkg>/Tests -name "*.asmdef"` — should return exactly ONE.
    - Fix: delete the duplicate asmdef + its `.meta`, add new sub-asmdef refs to the canonical Tests asmdef.

20. **PlayMode high-iteration tests need periodic frame yielding**: A `[UnityTest]` that drives 10K+ iterations of a system in a tight loop will lock the editor frame and either time out the runner or throttle for several minutes before completing. Yield every ~512 iterations (`if ((i & 0x1FF) == 0x1FF) yield return null;`) so the test runner gets to tick between batches. Found in a 10K-pull chi-squared session driver — without yielding, runner stalled past timeout. Cheap to add, no determinism impact (yield does NOT advance the simulated clock).

21. **Tier-2 Bridge readers query default world, not test world**: When testing static Tier-2 Bridge readers (e.g., `CheckpointReader`, `BuffSlotReader`, `ModifierReader` in dots-progression), the readers query `World.DefaultGameObjectInjectionWorld` by design — NOT the `m_World` you create in `DOTSTestBase`. Without redirecting the default world in `[SetUp]`, all `Reader.Refresh()` calls return safe defaults and assertions fail with `Expected:1 But was:0`.

    Pattern:
    ```csharp
    private World originalDefaultWorld;

    [SetUp]
    public void SetUp()
    {
        base.SetUp();  // creates m_World per DOTSTestBase
        originalDefaultWorld = World.DefaultGameObjectInjectionWorld;
        World.DefaultGameObjectInjectionWorld = m_World;
    }

    [TearDown]
    public void TearDown()
    {
        World.DefaultGameObjectInjectionWorld = originalDefaultWorld;
        base.TearDown();
    }
    ```

    Pair with `InternalsVisibleTo`: Bridge reader `Reset()` helpers should stay `internal` at runtime (so production code goes through `RunStateDomainReloadResetHook`, never bypasses it). Tests access them via `[assembly: InternalsVisibleTo("...Tests")]` on the runtime asmdef. Attribute target is the asmdef `name` field, NOT `rootNamespace`.

    Discovered 2026-05-06 during a Tier-2 Bridge reader test rewrite. 8/8 tests went RED → GREEN once the default-world redirect was added.

## What NOT to Test

- **Baker internals** — test SubScene baking via integration tests instead
- **Burst compilation** — add `[BurstCompile(CompileSynchronously=true)]` if needed
- **Job scheduling performance** — use Profiler, not unit tests
- **Navigation pathfinding** — depends on Agents Nav runtime (PlayMode only)
- **BDP behavior trees** — requires full BDP runtime + baked trees
