---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Module Templates — Unity + Cocos Scaffolds

Use this when scaffolding a **new** feature module. Both engines share the
same conceptual shape; only the file extensions and asmdef stubs differ.

> Replace `{Feature}` (PascalCase) and `{feature}` (kebab-case) with your
> module name (e.g., `Combat` / `combat`).

---

## Unity scaffold

```
Assets/Scripts/Modules/{Feature}/
├── Domain/
│   ├── Game.{Feature}.Domain.asmdef
│   ├── {Entity}.cs
│   └── {Rules}.cs
├── Application/
│   ├── Game.{Feature}.Application.asmdef
│   ├── Ports/
│   │   ├── I{PortA}.cs
│   │   └── I{PortB}.cs
│   ├── {UseCaseName}UseCase.cs
│   └── Commands/
│       └── {CommandName}Command.cs
├── Presentation/
│   ├── Game.{Feature}.Presentation.asmdef
│   └── {Feature}InputComponent.cs
├── Infrastructure/
│   ├── Game.{Feature}.Infrastructure.asmdef
│   ├── {EngineAdapter}A.cs
│   └── {EngineAdapter}B.cs
├── Tests/
│   ├── Game.{Feature}.Tests.asmdef
│   ├── {Entity}Tests.cs
│   └── {UseCaseName}UseCaseTests.cs
└── module-contract.md
```

### asmdef stubs (paste-ready)

**Domain** (`Game.{Feature}.Domain.asmdef`):

```json
{
    "name": "Game.{Feature}.Domain",
    "rootNamespace": "Game.{Feature}.Domain",
    "references": ["Game.SharedKernel.Domain"],
    "noEngineReferences": true,
    "autoReferenced": false,
    "allowUnsafeCode": false,
    "overrideReferences": false,
    "includePlatforms": [],
    "excludePlatforms": [],
    "defineConstraints": []
}
```

**Application** (`Game.{Feature}.Application.asmdef`):

```json
{
    "name": "Game.{Feature}.Application",
    "rootNamespace": "Game.{Feature}.Application",
    "references": [
        "Game.SharedKernel.Domain",
        "Game.{Feature}.Domain"
    ],
    "noEngineReferences": true,
    "autoReferenced": false,
    "allowUnsafeCode": false,
    "overrideReferences": false,
    "includePlatforms": [],
    "excludePlatforms": [],
    "defineConstraints": []
}
```

**Presentation** (`Game.{Feature}.Presentation.asmdef`):

```json
{
    "name": "Game.{Feature}.Presentation",
    "rootNamespace": "Game.{Feature}.Presentation",
    "references": [
        "Game.SharedKernel.Domain",
        "Game.{Feature}.Application",
        "VContainer"
    ],
    "autoReferenced": false,
    "includePlatforms": [],
    "excludePlatforms": [],
    "defineConstraints": []
}
```

**Infrastructure** (`Game.{Feature}.Infrastructure.asmdef`):

```json
{
    "name": "Game.{Feature}.Infrastructure",
    "rootNamespace": "Game.{Feature}.Infrastructure",
    "references": [
        "Game.SharedKernel.Domain",
        "Game.{Feature}.Application"
    ],
    "autoReferenced": false,
    "includePlatforms": [],
    "excludePlatforms": [],
    "defineConstraints": []
}
```

**Tests** (`Game.{Feature}.Tests.asmdef`):

```json
{
    "name": "Game.{Feature}.Tests",
    "rootNamespace": "Game.{Feature}.Tests",
    "references": [
        "Game.SharedKernel.Domain",
        "Game.{Feature}.Domain",
        "Game.{Feature}.Application",
        "UnityEngine.TestRunner",
        "UnityEditor.TestRunner",
        "nunit.framework"
    ],
    "optionalUnityReferences": ["TestAssemblies"],
    "autoReferenced": false,
    "includePlatforms": []
}
```

---

## Cocos scaffold

```
assets/scripts/Game/modules/{feature}/
├── domain/
│   ├── {entity}.ts
│   └── {rules}.ts
├── application/
│   ├── ports/
│   │   ├── i-{port-a}.ts
│   │   └── i-{port-b}.ts
│   ├── {use-case-name}-use-case.ts
│   └── commands/
│       └── {command-name}-command.ts
├── presentation/
│   └── {feature}-input.ts          // cc.Component
├── infrastructure/
│   ├── cc-{adapter-a}.ts
│   └── cc-{adapter-b}.ts
├── tests/
│   ├── domain/
│   │   └── {entity}.test.ts
│   └── application/
│       └── {use-case-name}-use-case.test.ts
├── index.ts                        // module composition root
└── module-contract.md
```

### `index.ts` — module composition root (paste-ready)

```ts
import { SignalBus } from 'Game/shared-kernel/signal-bus';
import { {UseCaseName}UseCase } from './application/{use-case-name}-use-case';
import type { I{PortA} } from './application/ports/i-{port-a}';
import type { I{PortB} } from './application/ports/i-{port-b}';
import { Cc{AdapterA} } from './infrastructure/cc-{adapter-a}';
import { Cc{AdapterB} } from './infrastructure/cc-{adapter-b}';

export interface {Feature}Module {
    {useCaseName}UseCase: {UseCaseName}UseCase;
}

export function build{Feature}Module(
    bus: SignalBus,
    deps: { /* required ports from other modules */ } = {} as never,
): {Feature}Module {
    const portA: I{PortA} = new Cc{AdapterA}();
    const portB: I{PortB} = new Cc{AdapterB}();

    const useCase = new {UseCaseName}UseCase(portA, portB, bus);

    return { {useCaseName}UseCase: useCase };
}
```

---

## `module-contract.md` template (engine-agnostic)

Drop this into the module root. Fill the placeholders.

```yaml
module: {Feature}
version: 1.0.0

inputs:
  commands:
    - name: {CommandName}
      payload: { /* fields */ }
      returns: Result<{ReturnType}, {ErrorEnum}>
  queries:
    - name: {QueryName}
      payload: { /* fields */ }
      returns: {ReturnType}
  events_consumed:
    - {EventName}

outputs:
  events_emitted:
    - name: {EventName}
      payload: { /* fields */ }
      when: {which use case emits it}

dependencies:
  required_ports:
    - name: I{PortName}
      shape: {method-list summary}
      provided_by: {other module | infrastructure adapter}
  module_deps:
    - name: {OtherModule}
      via: events | port | command

internal:
  - {ClassName1}
  - {ClassName2}
```

For 3 worked examples (Combat / Inventory / Quest), see
`module-contracts.md`.

---

## Quick checklist — what your `module-contract.md` MUST contain

- [ ] `module:` and `version:` (semver)
- [ ] At least one of: `commands`, `queries`, `events_emitted` (a module
      that has none probably shouldn't be a module)
- [ ] Every external port the module needs listed in `required_ports`
- [ ] Every other feature module referenced listed in `module_deps` with
      `via:` declared (port / events / command)
- [ ] `internal:` listing the class names that are NOT public surface

If the contract is empty in `required_ports` AND `module_deps` AND
`events_consumed`, you have a pure decoupled module — that's the cleanest
shape (see Inventory worked example).

---

## After scaffolding

1. Wire the module at the composition root:
   - Unity: add a `LifetimeScope` (or extend an existing scene one) — see
     `unity-patterns.md` § VContainer.
   - Cocos: import `build{Feature}Module` in `bootstrap.ts` and register
     the result in `ServiceLocator` — see `cocos-patterns.md` § manual root.
2. Run tests — `Tests` asmdef compiles in Unity / Vitest passes in Cocos.
3. Commit the scaffold (one commit per module — easy to revert if naming
   changes). The contract gets refined as the module grows; bump `version:`
   per the rules in `module-contracts.md` § "How to evolve a contract".

---

## Related

- `principles.md` — why the four layers and the directory shape
- `module-contracts.md` — full template + 3 worked examples
- `unity-patterns.md` — asmdef + VContainer specifics
- `cocos-patterns.md` — manual root + signalBus + Vitest specifics
- `refactor-playbook.md` — the alternative entry point: god-Component → this scaffold via 7 stages
