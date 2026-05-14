---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Unity Patterns — asmdef Strict + VContainer + NUnit

This file **specializes** the universal principles for Unity. It does NOT
introduce new universal principles. If a rule applies to Cocos too, it
belongs in `principles.md` instead.

> Versions pinned at authoring time (2026-05-03):
> - Unity 2022.3 LTS+
> - VContainer 1.16+ (`jp.hadashikick.vcontainer`)
> - Unity Test Framework 1.4+ (NUnit 3.5)

---

## asmdef strict — one asmdef per layer per feature

The C# compiler is the dependency-rule enforcer. Each feature module ships
**5 asmdefs** (Domain / Application / Presentation / Infrastructure / Tests):

```
Assets/Scripts/Modules/Combat/
├── Domain/
│   ├── Game.Combat.Domain.asmdef
│   ├── Health.cs
│   ├── DamageCalculator.cs
│   └── CombatRules.cs
├── Application/
│   ├── Game.Combat.Application.asmdef
│   ├── AttackUseCase.cs
│   └── Ports/
│       ├── IAnimationPlayer.cs
│       ├── IAudioCue.cs
│       └── ICombatHud.cs
├── Presentation/
│   ├── Game.Combat.Presentation.asmdef
│   └── CombatInputComponent.cs
├── Infrastructure/
│   ├── Game.Combat.Infrastructure.asmdef
│   ├── AnimatorAnimationPlayer.cs
│   ├── WwiseAudioCue.cs
│   └── UguiCombatHud.cs
├── Tests/
│   ├── Game.Combat.Tests.asmdef
│   ├── DamageCalculatorTests.cs
│   └── AttackUseCaseTests.cs
└── module-contract.md
```

### asmdef reference matrix

| asmdef | References allowed | References forbidden |
|---|---|---|
| `Game.Combat.Domain` | `Game.SharedKernel.Domain` (only) | UnityEngine, any other module |
| `Game.Combat.Application` | `Game.Combat.Domain`, ports declared in own folder, shared kernel | UnityEngine, other modules' concretes |
| `Game.Combat.Presentation` | `Game.Combat.Application`, `UnityEngine`, `VContainer` | other modules' concretes; Domain implementation details |
| `Game.Combat.Infrastructure` | `Game.Combat.Application`, `UnityEngine`, engine SDKs | Domain implementation details |
| `Game.Combat.Tests` | `Game.Combat.Domain`, `Game.Combat.Application`, NUnit | Presentation, Infrastructure (test those separately) |

### Sample asmdef (Domain — engine-free)

```json
{
    "name": "Game.Combat.Domain",
    "rootNamespace": "Game.Combat.Domain",
    "references": ["Game.SharedKernel.Domain"],
    "includePlatforms": [],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": false,
    "autoReferenced": false,
    "defineConstraints": [],
    "noEngineReferences": true
}
```

The `"noEngineReferences": true` flag is the magic — Unity refuses to
compile this asmdef against `UnityEngine.dll`. Domain stays pure by
contract.

---

## VContainer composition root

VContainer is the locked DI choice. Each scene (or each feature) gets one
`LifetimeScope` that wires Application's ports to Infrastructure's adapters.

```csharp
// Assets/Scripts/Bootstrap/CombatSceneLifetimeScope.cs
using VContainer;
using VContainer.Unity;
using Game.Combat.Application;
using Game.Combat.Application.Ports;
using Game.Combat.Infrastructure;

public class CombatSceneLifetimeScope : LifetimeScope
{
    [SerializeField] AnimatorAnimationPlayer _animPlayer;
    [SerializeField] WwiseAudioCue _audioCue;
    [SerializeField] UguiCombatHud _combatHud;

    protected override void Configure(IContainerBuilder builder)
    {
        // Ports → adapters (the only place that knows concretes)
        builder.RegisterComponent<IAnimationPlayer>(_animPlayer);
        builder.RegisterComponent<IAudioCue>(_audioCue);
        builder.RegisterComponent<ICombatHud>(_combatHud);

        // Cross-module port (Inventory adapts)
        builder.Register<IEquippedItemQuery, EquippedItemQueryAdapter>(Lifetime.Scoped);

        // Use case
        builder.Register<AttackUseCase>(Lifetime.Scoped);

        // Signal bus (events)
        builder.RegisterMessageBroker<DamageDealt>(/* options */);
        builder.RegisterMessageBroker<ActorDied>(/* options */);
    }
}
```

**Rule:** any `new` outside this LifetimeScope (and outside Domain value-object
constructors) is suspect. Run a code review check for `new ` in Presentation
and Infrastructure files; flag anything that isn't a `Vector3` or similar pure
value type.

---

## ScriptableObject at the Infrastructure boundary

ScriptableObjects are **data** — they live in Infrastructure (or shared
kernel for cross-feature configs). They are NOT logic containers.

```csharp
// Game.Combat.Infrastructure
[CreateAssetMenu(menuName = "Combat/Damage Profile")]
public class DamageProfile : ScriptableObject
{
    public int BaseDamage;
    public float CritChance;
    public AnimationCurve FalloffByDistance;
}
```

The Application layer reads `DamageProfile` via a port:

```csharp
// Game.Combat.Application/Ports
public interface IDamageProfileReader
{
    DamageProfile Get(AttackKind kind);
}
```

Composition root binds; Domain still doesn't import `UnityEngine`.

---

## NUnit setup — Tests asmdef + Edit Mode + Play Mode

Tests live in their own asmdef:

```json
{
    "name": "Game.Combat.Tests",
    "rootNamespace": "Game.Combat.Tests",
    "references": [
        "Game.Combat.Domain",
        "Game.Combat.Application",
        "Game.SharedKernel.Domain",
        "UnityEngine.TestRunner",
        "UnityEditor.TestRunner",
        "nunit.framework"
    ],
    "optionalUnityReferences": ["TestAssemblies"],
    "includePlatforms": []
}
```

### Edit Mode — pure Domain + Application

```csharp
[TestFixture]
public class DamageCalculatorTests
{
    [Test]
    public void should_returnZero_when_targetIsImmune()
    {
        var calc = new DamageCalculator(new CombatRules());
        var result = calc.Compute(attacker: 100, target: ImmuneTarget(), kind: AttackKind.Slash);
        Assert.That(result.Value.ActualDamage, Is.EqualTo(0));
    }
}
```

### Play Mode — Presentation smoke

Play-mode tests cover Presentation wiring (component instantiates, receives
input). Keep them few and focused — every play-mode test costs seconds.

```csharp
[UnityTest]
public IEnumerator should_invokeAttackUseCase_when_attackButtonPressed()
{
    var go = new GameObject();
    var cmp = go.AddComponent<CombatInputComponent>();
    cmp.UseCase = Substitute.For<AttackUseCase>();   // NSubstitute
    cmp.OnAttackPressed();
    yield return null;
    cmp.UseCase.Received(1).Execute(Arg.Any<...>());
}
```

---

## Common Unity gotchas

| Gotcha | Fix |
|---|---|
| `MonoBehaviour` referencing concrete `WwiseAudio` directly | Define `IAudioCue` in Application; inject via `[Inject]` |
| Domain class accidentally `using UnityEngine` | asmdef `"noEngineReferences": true` catches at compile time; if missing, add it |
| LifetimeScope present in every scene → DI graph diverges | One root `ProjectScope` for app-wide singletons; per-scene scopes inherit |
| `[SerializeField]` of port interface | Won't serialize — use `[SerializeField]` on the concrete adapter, register it as the port in `Configure` |
| Scope leak: a `Lifetime.Scoped` registered in `ProjectScope` lives forever | Use `Lifetime.Scoped` on per-scene scopes; `Lifetime.Singleton` only when truly app-wide |

---

## Universal principles this file specializes

- `principles.md` § "The 4 layers" → Unity-specific asmdef enforcement
- `principles.md` § "Dependency injection" → VContainer LifetimeScope
- `inter-module-communication.md` § "Port" → `[Inject]` + LifetimeScope binding
- `inter-module-communication.md` § "Event" → VContainer SignalBus / MessageBroker
- `testing-strategy.md` § "Domain 100%" → Edit Mode NUnit
- `testing-strategy.md` § "Presentation smoke" → Play Mode `[UnityTest]`
- `module-contracts.md` → `module-contract.md` lives at module root alongside asmdefs

---

## Related

- `cocos-patterns.md` — parallel for Cocos (manual root + signalBus + Vitest)
- `module-templates.md` — ready-to-paste Unity scaffold including asmdef stubs
- `refactor-playbook.md` — Combat-feature Unity diff for each of the 7 stages
