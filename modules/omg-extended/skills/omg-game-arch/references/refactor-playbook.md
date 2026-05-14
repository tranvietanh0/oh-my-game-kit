---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Refactor Playbook — God-Component → 4-Layer Module in 7 Stages

This is the playbook. **Each stage is one commit.** Follow them in order;
revertibility is the value proposition. Stage 7 (document the contract) is
non-optional — a module without a contract is "in progress."

We use **Combat** as the running example for both engines. The narrative is
parallel: same gameplay (player presses attack, deals damage to a target,
plays an animation, plays an audio cue, updates the HUD).

> Diffs are excerpts focused on what each stage changes. They are not full
> files. The full files would be ~200 lines each at stage 0; the playbook
> shows just the deltas.

---

## Stage table at a glance

| # | Stage | Goal | Acceptance |
|---|---|---|---|
| 1 | **Identify** | List god-Components: file, line count, responsibilities | Tracking note committed |
| 2 | **Extract pure** | Move logic to plain class | Pure class compiles with no engine import |
| 3 | **Add port** | Define interface for engine-bound dep | Interface in Application, no impl yet |
| 4 | **Adapter** | Component becomes thin caller (< 50 lines) | Component shrinks; Adapter implements port |
| 5 | **Tests** | Unit-test pure class | Domain tests pass without engine runtime |
| 6 | **Wire DI** | Register adapter at composition root | Composition root is the only place that knows concretes |
| 7 | **Document contract** | Write `module-contract.md` | Contract present, lists ALL events emitted/consumed and ports required |

---

## Stage 0 — Baseline (the god-Component before)

**Unity (`Combat/Presentation/CombatController.cs`):** ~200 lines mixing input
handling, damage calculation, animation triggers, audio cues, HUD updates,
and direct cross-module access.

```csharp
// stage 0 — the god — DO NOT IMITATE
public class CombatController : MonoBehaviour
{
    [SerializeField] Animator animator;
    [SerializeField] AudioSource audio;
    [SerializeField] CombatHud hud;
    [SerializeField] InventoryService inventory;   // <-- direct cross-module ref!

    int playerLevel = 1;
    float lastAttackTime;

    void Update() {
        if (Input.GetButtonDown("Fire1") && Time.time - lastAttackTime > 0.4f) {
            lastAttackTime = Time.time;
            // 50 lines of damage formula inline...
            int dmg = Mathf.RoundToInt(playerLevel * 1.5f * (inventory.IsEquipped("sword") ? 2f : 1f));
            // animation
            animator.SetTrigger("Attack");
            // audio
            audio.PlayOneShot(audio.clip);
            // hud
            hud.ShowFloatingText(transform.position + Vector3.up, $"-{dmg}", Color.red);
        }
    }
}
```

**Cocos (`combat/combat-controller.ts`):** parallel structure, same problems.

```ts
// stage 0 — the god — DO NOT IMITATE
@ccclass
export class CombatController extends cc.Component {
    @property(Animation)        animation: Animation = null!;
    @property(AudioSource)      audio: AudioSource = null!;
    @property(CombatHud)        hud: CombatHud = null!;
    @property(InventoryService) inventory: InventoryService = null!;  // direct ref!

    playerLevel = 1;
    lastAttackTime = 0;

    update() {
        if (input.isPressed('Fire1') && performance.now() - this.lastAttackTime > 400) {
            this.lastAttackTime = performance.now();
            // 50 lines of damage formula inline
            const dmg = Math.round(this.playerLevel * 1.5 * (this.inventory.isEquipped('sword') ? 2 : 1));
            this.animation.play('attack');
            this.audio.playOneShot(this.audio.clip);
            this.hud.showFloatingText(this.node.position.add(cc.v3(0, 1, 0)), `-${dmg}`, cc.Color.RED);
        }
    }
}
```

**Smell tally:**
1. Mixed responsibilities (input + logic + presentation).
2. Direct cross-module concrete reference (`inventory`).
3. Untestable — Domain logic (the formula) lives in `Update()` / `update()`.
4. Engine APIs scattered everywhere — no swap path.

---

## Stage 1 — Identify

**Goal:** list every god-Component (file, line count, responsibilities)
in a tracking note.

**Mechanical steps:**

1. `find Assets/Scripts -name "*Controller.cs" -o -name "*Manager.cs"` (Unity)
   or `find assets/scripts -name "*-controller.ts" -o -name "*-manager.ts"` (Cocos).
2. For each candidate: count lines, list responsibilities (in 2-5 bullets).
3. Commit a `refactor-targets.md` at repo root — reviewed but not blocking.

**Unity diff:**

```diff
+ refactor-targets.md
+
+ - Combat/Presentation/CombatController.cs (200 lines)
+   - input, damage calc, animation, audio, HUD, direct cross-module to Inventory
+   - target shape: Combat module scaffold per module-templates.md
```

**Cocos diff:** identical, just different paths in the targets list.

**When done:** the tracking note is committed; no code changes.

**Common gotcha:** trying to refactor everything at once. Pick ONE
god-Component for stages 2-7. Combat is our running example.

---

## Stage 2 — Extract pure

**Goal:** move the formula (Domain logic) into a plain class with no engine
import. Keep the `MonoBehaviour` / `cc.Component` calling the new class — the
Component is still doing too much, that's fine for now.

**Mechanical steps:**

1. Create `Combat/Domain/DamageCalculator.cs` (or `combat/domain/damage-calculator.ts`).
2. Move the formula. Convert any `inventory.IsEquipped(...)` reference to a
   parameter (the Component still passes it in for now).
3. Make Domain return `Result<DamageResult, AttackError>`.
4. The Component now calls `DamageCalculator.Compute(...)` instead of
   inlining the formula.

**Unity diff:**

```diff
+ // Combat/Domain/DamageCalculator.cs  (NEW, no UnityEngine)
+ public class DamageCalculator {
+     public Result<DamageResult, AttackError> Compute(int attackerLevel, bool hasSword) {
+         if (attackerLevel < 1) return Result<DamageResult, AttackError>.Err(AttackError.InvalidLevel);
+         var dmg = (int)Math.Round(attackerLevel * 1.5f * (hasSword ? 2f : 1f));
+         return Result<DamageResult, AttackError>.Ok(new DamageResult(dmg));
+     }
+ }

  // Combat/Presentation/CombatController.cs  (MODIFIED)
- int dmg = Mathf.RoundToInt(playerLevel * 1.5f * (inventory.IsEquipped("sword") ? 2f : 1f));
+ var r = new DamageCalculator().Compute(playerLevel, inventory.IsEquipped("sword"));
+ if (!r.IsOk) return;
+ int dmg = r.Value.Amount;
```

**Cocos diff:**

```diff
+ // combat/domain/damage-calculator.ts  (NEW, no cc.*)
+ export class DamageCalculator {
+     compute(attackerLevel: number, hasSword: boolean): Result<DamageResult, AttackError> {
+         if (attackerLevel < 1) return err({ kind: 'InvalidLevel' });
+         const dmg = Math.round(attackerLevel * 1.5 * (hasSword ? 2 : 1));
+         return ok({ amount: dmg });
+     }
+ }

  // combat/combat-controller.ts  (MODIFIED)
- const dmg = Math.round(this.playerLevel * 1.5 * (this.inventory.isEquipped('sword') ? 2 : 1));
+ const r = new DamageCalculator().compute(this.playerLevel, this.inventory.isEquipped('sword'));
+ if (!r.ok) return;
+ const dmg = r.value.amount;
```

**When done:** Domain class compiles in isolation. Unity asmdef for Domain
has `"noEngineReferences": true` → the compiler enforces purity. Cocos Domain
has no `import 'cc'` line.

**Common gotcha:** smuggling engine types into Domain via "convenient"
fields (e.g., `Vector3` as a parameter). For positions, use Domain
value-types (`Position { x, y, z }`) and convert at the Presentation
boundary.

---

## Stage 3 — Add port

**Goal:** define interfaces in Application for everything the Component
calls into the engine for. No implementations yet — just the shapes.

**Mechanical steps:**

1. For each engine-bound call in the Component (animation, audio, HUD,
   inventory query), name the port (`IAnimationPlayer`, `IAudioCue`,
   `ICombatHud`, `IEquippedItemQuery`).
2. Place each interface in `Combat/Application/Ports/`.
3. Don't change the Component yet — it still uses concretes.

**Unity diff:**

```diff
+ // Combat/Application/Ports/IAnimationPlayer.cs  (NEW)
+ public interface IAnimationPlayer { void Play(string animId); }

+ // Combat/Application/Ports/IAudioCue.cs  (NEW)
+ public interface IAudioCue { void Play(string cueId); }

+ // Combat/Application/Ports/ICombatHud.cs  (NEW)
+ public interface ICombatHud { void ShowFloatingText(Vector3 worldPos, string text, Color color); }

+ // Combat/Application/Ports/IEquippedItemQuery.cs  (NEW)
+ public interface IEquippedItemQuery { bool IsEquipped(string itemId); }
```

**Cocos diff:**

```diff
+ // combat/application/ports/i-animation-player.ts  (NEW)
+ export interface IAnimationPlayer { play(animId: string): void; }

+ // combat/application/ports/i-audio-cue.ts  (NEW)
+ export interface IAudioCue { play(cueId: string): void; }

+ // combat/application/ports/i-combat-hud.ts  (NEW)
+ export interface ICombatHud { showFloatingText(pos: Vec3, text: string, color: Color): void; }

+ // combat/application/ports/i-equipped-item-query.ts  (NEW)
+ export interface IEquippedItemQuery { isEquipped(itemId: string): boolean; }
```

**When done:** all four ports compile in Application. Component is
unchanged (still references concretes — that's stage 4's job).

**Common gotcha:** designing an over-broad port like `IUiManager` with 20
methods. Keep ports cohesive — one role per port. `ICombatHud` covers
combat HUD only.

---

## Stage 4 — Adapter

**Goal:** introduce an Application use case that orchestrates ports; let
Infrastructure adapt the engine concretes to the ports; shrink the
Component to a thin caller.

**Mechanical steps:**

1. Create `Combat/Application/AttackUseCase.cs` — accepts ports,
   `DamageCalculator`, and a bus.
2. Create `Combat/Infrastructure/AnimatorAnimationPlayer.cs` — wraps
   `Animator` and implements `IAnimationPlayer`. Same for audio and HUD.
3. Component now: reads input → calls `useCase.Execute(...)` → done.
4. The Component's line count target: < 50 lines.

**Unity diff (use case + adapter + slim Component):**

```diff
+ // Combat/Application/AttackUseCase.cs  (NEW)
+ public class AttackUseCase {
+     readonly DamageCalculator _calc;
+     readonly IAnimationPlayer _anim;
+     readonly IAudioCue _audio;
+     readonly ICombatHud _hud;
+     readonly IEquippedItemQuery _equipped;
+
+     public AttackUseCase(DamageCalculator c, IAnimationPlayer a, IAudioCue au, ICombatHud h, IEquippedItemQuery eq) {
+         _calc = c; _anim = a; _audio = au; _hud = h; _equipped = eq;
+     }
+
+     public Result<DamageResult, AttackError> Execute(int level, Vector3 hudPos) {
+         var r = _calc.Compute(level, _equipped.IsEquipped("sword"));
+         if (!r.IsOk) return r;
+         _anim.Play("attack");
+         _audio.Play("attack_sword");
+         _hud.ShowFloatingText(hudPos, $"-{r.Value.Amount}", Color.red);
+         return r;
+     }
+ }

+ // Combat/Infrastructure/AnimatorAnimationPlayer.cs  (NEW)
+ public class AnimatorAnimationPlayer : MonoBehaviour, IAnimationPlayer {
+     [SerializeField] Animator animator;
+     public void Play(string animId) => animator.SetTrigger(animId);
+ }

  // Combat/Presentation/CombatController.cs  (~200 lines → ~25 lines)
- int dmg = ...; animator.SetTrigger(...); audio.PlayOneShot(...); hud.ShowFloatingText(...);
+ public class CombatController : MonoBehaviour {
+     [Inject] AttackUseCase _useCase;
+     int _playerLevel = 1;
+     float _lastAttack;
+     void Update() {
+         if (!Input.GetButtonDown("Fire1")) return;
+         if (Time.time - _lastAttack < 0.4f) return;
+         _lastAttack = Time.time;
+         _useCase.Execute(_playerLevel, transform.position + Vector3.up);
+     }
+ }
```

**Cocos diff:** parallel — `AttackUseCase` in `combat/application/`,
`CcAnimationAdapter` etc. in `combat/infrastructure/`, `CombatController`
shrinks to input handling + `useCase.execute(...)`.

**When done:** the Component is < 50 lines, contains zero formula and zero
direct engine sub-system calls.

**Common gotcha:** trying to do stage 4 *and* stage 6 in one commit. Keep
DI wiring (Stage 6) separate. In stage 4, the Component still receives
the use case via a temporary `[Inject]` placeholder (or even a public
setter as a stopgap) — wiring comes next.

---

## Stage 5 — Tests

**Goal:** prove Domain + Application are unit-testable without engine
runtime.

**Mechanical steps:**

1. Create `Combat/Tests/DamageCalculatorTests.cs` (NUnit) /
   `combat/tests/damage-calculator.test.ts` (Vitest).
2. Test the formula's edge cases.
3. Create `AttackUseCaseTests` with mocked ports — verify Execute calls
   each port and emits events.
4. Run tests. They must pass without launching the engine.

**Unity diff:**

```diff
+ // Combat/Tests/DamageCalculatorTests.cs
+ [TestFixture]
+ public class DamageCalculatorTests {
+     [Test]
+     public void should_returnDoubleDamage_when_swordIsEquipped() {
+         var r = new DamageCalculator().Compute(attackerLevel: 10, hasSword: true);
+         Assert.IsTrue(r.IsOk);
+         Assert.AreEqual(30, r.Value.Amount);  // 10 * 1.5 * 2 = 30
+     }
+
+     [Test]
+     public void should_returnError_when_levelIsZero() {
+         var r = new DamageCalculator().Compute(0, false);
+         Assert.IsFalse(r.IsOk);
+         Assert.AreEqual(AttackError.InvalidLevel, r.Error);
+     }
+ }
```

**Cocos diff:**

```diff
+ // combat/tests/damage-calculator.test.ts
+ import { describe, it, expect } from 'vitest';
+ import { DamageCalculator } from '../domain/damage-calculator';
+
+ describe('DamageCalculator', () => {
+     it('should_returnDoubleDamage_when_swordIsEquipped', () => {
+         const r = new DamageCalculator().compute(10, true);
+         expect(r.ok).toBe(true);
+         if (r.ok) expect(r.value.amount).toBe(30);
+     });
+
+     it('should_returnError_when_levelIsZero', () => {
+         const r = new DamageCalculator().compute(0, false);
+         expect(r.ok).toBe(false);
+     });
+ });
```

**When done:** Edit Mode tests (Unity) / `vitest run` (Cocos) green. Total
runtime < 1 second for the Domain suite.

**Common gotcha:** the test pulls in the Component by accident (e.g.,
imports `CombatController.cs`) — pulls in `UnityEngine` → fails to compile
in Edit Mode. Domain + Application tests must reference Domain +
Application asmdefs only.

---

## Stage 6 — Wire DI

**Goal:** the composition root becomes the only place that knows concrete
adapters.

**Mechanical steps:**

1. Unity: create `CombatSceneLifetimeScope.cs` (or extend an existing
   scope). Register all four ports → adapters; register `AttackUseCase`.
2. Cocos: edit `combat/index.ts` (per `module-templates.md`) — `buildCombatModule`
   wires concretes to ports, returns `{ attackUseCase }`. Bootstrap calls
   it once.
3. Remove the temporary `[Inject]` placeholder / setter from stage 4 — DI
   now does the work.
4. Verify the game still runs end-to-end (manual playtest of the attack).

**Unity diff:**

```diff
+ // Bootstrap/CombatSceneLifetimeScope.cs  (NEW)
+ public class CombatSceneLifetimeScope : LifetimeScope {
+     [SerializeField] AnimatorAnimationPlayer _anim;
+     [SerializeField] WwiseAudioCue _audio;
+     [SerializeField] UguiCombatHud _hud;
+     protected override void Configure(IContainerBuilder b) {
+         b.RegisterComponent<IAnimationPlayer>(_anim);
+         b.RegisterComponent<IAudioCue>(_audio);
+         b.RegisterComponent<ICombatHud>(_hud);
+         b.Register<IEquippedItemQuery, EquippedItemQueryAdapter>(Lifetime.Scoped);
+         b.Register<DamageCalculator>(Lifetime.Singleton);
+         b.Register<AttackUseCase>(Lifetime.Scoped);
+     }
+ }
```

**Cocos diff:**

```diff
+ // combat/index.ts  (NEW or replaces ad-hoc wiring)
+ import { SignalBus } from 'Game/shared-kernel/signal-bus';
+ import { AttackUseCase } from './application/attack-use-case';
+ import { DamageCalculator } from './domain/damage-calculator';
+ import { CcAnimationAdapter } from './infrastructure/cc-animation-adapter';
+ import { CcAudioAdapter } from './infrastructure/cc-audio-adapter';
+ import { CcCombatHud } from './infrastructure/cc-combat-hud';
+
+ export function buildCombatModule(bus: SignalBus, deps: { equippedItemQuery: IEquippedItemQuery }) {
+     const calc = new DamageCalculator();
+     const useCase = new AttackUseCase(calc,
+         new CcAnimationAdapter(), new CcAudioAdapter(), new CcCombatHud(),
+         deps.equippedItemQuery, bus);
+     return { attackUseCase: useCase };
+ }
```

**When done:** game runs identically. The Component receives `AttackUseCase`
via DI; the composition root is the only file that names a concrete adapter.

**Common gotcha:** Lifetime scope bleed. `Lifetime.Singleton` for
`DamageCalculator` is fine (stateless). `Lifetime.Singleton` for use cases
that hold per-actor state is wrong → use `Lifetime.Scoped` per scene.

---

## Stage 7 — Document contract (MANDATORY POLISH)

**Goal:** write `module-contract.md` declaring the module's full public
surface. This is the artifact that anchors the module — without it, the
refactor is incomplete.

**Mechanical steps:**

1. Open `Assets/Scripts/Modules/Combat/module-contract.md` (or
   `assets/scripts/Game/modules/combat/module-contract.md`).
2. Fill every section: `module:`, `version:` (start `1.0.0`),
   `inputs.commands`, `inputs.queries`, `inputs.events_consumed`,
   `outputs.events_emitted`, `dependencies.required_ports`,
   `dependencies.module_deps`, `internal:`.
3. Ensure every event the use case emits is in `outputs.events_emitted`.
4. Ensure every port the use case takes is in `dependencies.required_ports`.
5. Mark internal classes (anything in `Domain/` and `Application/` not
   exposed via the contract) in `internal:`.

### Worked artifact — `module-contract.md` for refactored Combat

```yaml
module: Combat
version: 1.0.0

inputs:
  commands:
    - name: AttackCommand
      payload: { attackerId: ActorId, targetId: ActorId }
      returns: Result<DamageResult, AttackError>
  queries: []
  events_consumed:
    - PlayerLevelChanged       # update local cached attacker level

outputs:
  events_emitted:
    - name: DamageDealt
      payload: { targetId: ActorId, amount: number }
      when: AttackUseCase.Execute succeeds
    # NOTE: refactor preserves stage-0 behavior; ActorDied event
    # will be added in v1.1.0 once Health entity owns death state

dependencies:
  required_ports:
    - name: IAnimationPlayer
      shape: Play(animId)
      provided_by: Infrastructure (AnimatorAnimationPlayer / CcAnimationAdapter)
    - name: IAudioCue
      shape: Play(cueId)
      provided_by: Infrastructure (WwiseAudioCue / CcAudioAdapter)
    - name: ICombatHud
      shape: ShowFloatingText(pos, text, color)
      provided_by: Presentation (UguiCombatHud / CcCombatHud)
    - name: IEquippedItemQuery
      shape: IsEquipped(itemId)
      provided_by: Inventory (via port)
  module_deps:
    - name: Inventory
      via: port           # IEquippedItemQuery — Inventory's Infrastructure adapts

internal:
  - DamageCalculator       # Domain
  - DamageResult           # Domain
  - AttackError            # Domain
  - AttackUseCase          # Application
```

> This is the **refactor result** contract. Compare to the **greenfield
> design** Combat contract in `module-contracts.md` — both valid, different
> starting points. The refactor result is more conservative because the
> stage-0 god-Component constrained what could be moved without breaking
> behavior. Future minor versions (1.1.0) can expand toward the greenfield
> shape.

**When done:**

- Contract artifact present at module root.
- Every emitted event listed.
- Every required port listed.
- `internal:` lists Domain + Application classes that are NOT public.
- Module is now reviewable as a unit — a teammate reads the contract and
  knows the module's full I/O surface in 60 seconds.

**Common gotcha:** the contract drifts after stage 7. Mitigation: bump
`version:` whenever you change the public surface; future doctor check
will assert contract-vs-code parity. For now, treat the contract as
conventionally enforced (code review).

---

## After all 7 stages

Commit history:

```
feat(combat): identify refactor targets                           [stage 1]
feat(combat): extract DamageCalculator to Domain                  [stage 2]
feat(combat): add IAnimationPlayer / IAudioCue / ICombatHud ports [stage 3]
feat(combat): introduce AttackUseCase + adapters; slim Component  [stage 4]
test(combat): unit-test DamageCalculator + AttackUseCase          [stage 5]
feat(combat): wire CombatSceneLifetimeScope (Unity) / index.ts (Cocos) [stage 6]
docs(combat): add module-contract.md                              [stage 7]
```

Seven small commits. Any of them can be reverted individually if a step
goes wrong.

---

## Scope creep — what you should NOT do during this refactor

- Add new features. Each stage preserves stage-0 behavior; new behavior
  goes in a follow-up `feat(combat): ...` commit on a fresh branch.
- Refactor adjacent modules. Inventory keeps working through stage 4 via the
  temporary direct ref; only stage 6 swaps it for the port. If Inventory
  has its own god-Component, that's a separate refactor cycle.
- Optimize. Get the architecture right first; profile and optimize after.

---

## Related

- `principles.md` — the dependency rule each stage enforces
- `function-contracts.md` — Result<T, Error> introduced at stage 2
- `inter-module-communication.md` — port pattern at stage 3, event at stage 4
- `module-contracts.md` — template + greenfield Combat (compare with stage-7 result)
- `unity-patterns.md` — asmdef + VContainer specifics for stages 1, 4, 6
- `cocos-patterns.md` — composition root + signalBus + Vitest specifics
- `module-templates.md` — directory shape stages 2-4 are converging toward
- `testing-strategy.md` — coverage targets stage 5 should hit
