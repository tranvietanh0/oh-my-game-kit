---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Inter-Module Communication — Port / Event / Command

Three patterns. One forbidden anti-pattern.

| Pattern | When to use | Mechanism | Sync? | Returns? |
|---|---|---|---|---|
| **Port** | Cross-module call needs an immediate result | Caller's Application defines an interface; callee implements; wired at composition root | Sync | Yes |
| **Event** | Fire-and-forget; multiple consumers may react | Shared bus (VContainer SignalBus / Cocos signalBus / RxJS Subject) | Async | No |
| **Command** | Cross-feature mutation with explicit intent and a single owner | Command type + handler registry | Sync or async | Optional |

**Forbidden:** any direct concrete cross-module reference. If `Combat`
imports `Inventory.InventoryService` directly, the architecture has failed
— even if the code compiles. Use a port, an event, or a command.

Compiler/lint enforcement:
- **Unity**: asmdef strict refuses cross-module refs at compile time. See `unity-patterns.md`.
- **Cocos**: `eslint-plugin-import` `no-restricted-paths` refuses at lint time. See `cocos-patterns.md`.

---

## Decision matrix — which pattern?

```
Does the caller need a return value NOW?
├── Yes → PORT
└── No  → does the action have ONE owning module that must process it?
         ├── Yes → COMMAND  (one handler, may emit events afterward)
         └── No  → EVENT    (zero or many subscribers)
```

Quick examples:

| Scenario | Pattern | Why |
|---|---|---|
| Combat asks Inventory "is this item equipped?" | **Port** (`IEquippedItemQuery`) | Needs answer before damage calc |
| Player picks up item → Quest may complete, UI may toast, Achievement may unlock | **Event** (`ItemPickedUp`) | Multiple unrelated consumers |
| Player buys an item from Shop UI | **Command** (`PurchaseItemCommand`) | One owning module (Shop) handles, may emit `PurchaseCompleted` event |
| Combat fires every frame to refresh UI health bar | **Event** (`HealthChanged`) | UI subscribes; Combat doesn't care who listens |
| Save system needs current inventory state | **Port** (`IInventoryQuery`) | Save needs the data immediately |

---

## Port — synchronous interface

The **caller's Application layer** defines the interface. The **callee's
Application or Infrastructure** implements it. The composition root binds.

```ts
// Combat/application/ports/i-equipped-item-query.ts
export interface IEquippedItemQuery {
    isEquipped(itemId: string): boolean;
    getEquippedDamage(slot: 'main' | 'off'): number;
}
```

```ts
// Inventory/infrastructure/equipped-item-query-adapter.ts
import type { IEquippedItemQuery } from 'Combat/application/ports/i-equipped-item-query';
import { InventoryRepository } from 'Inventory/application/inventory-repository';

export class EquippedItemQueryAdapter implements IEquippedItemQuery {
    constructor(private repo: InventoryRepository) {}
    isEquipped(id: string): boolean { return this.repo.equipped.has(id); }
    getEquippedDamage(slot: 'main' | 'off'): number { return this.repo.damageOf(slot); }
}
```

```ts
// bootstrap.ts (composition root)
container.bind(IEquippedItemQuery, new EquippedItemQueryAdapter(inventoryRepo));
```

**Key:** Combat's Application owns the interface shape. Inventory adapts to
that shape. Combat never imports any Inventory type directly.

---

## Event — fire-and-forget, multi-subscriber

A module emits; zero, one, or many subscribers react. **The emitter does not
know who listens.** This is the architectural payoff.

```ts
// Combat/application/attack-use-case.ts
export class AttackUseCase {
    constructor(private bus: SignalBus) {}

    execute(target: Health, amount: number): Result<DamageResult, AttackError> {
        const r = attack(target, amount);
        if (r.ok) {
            this.bus.emit('DamageDealt', { targetId: target.id, amount: r.value.actualDamage });
        }
        return r;
    }
}
```

```ts
// Quest/application/damage-tracker.ts
class DamageTracker {
    constructor(bus: SignalBus, private quests: QuestRepository) {
        bus.on('DamageDealt', (e) => this.quests.recordDamage(e.targetId, e.amount));
    }
}
```

**Event naming convention:** past tense (`DamageDealt`, `ItemPickedUp`,
`QuestCompleted`). Events describe **what already happened**, not commands to
execute.

**When NOT to use events:**

- The caller needs a return value → **port**.
- Only one module should ever react → **command** (clearer intent).
- Cross-frame state propagation in tight loops — events have a per-emit cost;
  use direct port for hot paths.

---

## Command — explicit intent, single owner

A `Command` is a typed request to mutate. A handler claims that command type;
exactly one handler per command. After processing, the handler may emit
events.

```ts
// Shop/application/commands/purchase-item-command.ts
export interface PurchaseItemCommand {
    kind: 'PurchaseItem';
    itemId: string;
    payerId: string;
}

// Shop/application/handlers/purchase-item-handler.ts
export class PurchaseItemHandler {
    constructor(
        private wallet: IWallet,
        private inventory: IInventoryWriter,
        private bus: SignalBus,
    ) {}

    handle(cmd: PurchaseItemCommand): Result<Receipt, PurchaseError> {
        const r = this.wallet.charge(cmd.payerId, /* price */);
        if (!r.ok) return err(r.error);
        this.inventory.add(cmd.payerId, cmd.itemId);
        this.bus.emit('PurchaseCompleted', { ... });
        return ok({ receiptId: ... });
    }
}
```

```ts
// Caller — Presentation
shopUi.onBuyClick = (id) => commandBus.send({ kind: 'PurchaseItem', itemId: id, payerId: me });
```

**When commands beat events:**

- The action has clear intent ("purchase", "equip", "accept quest") — name it.
- You need a result (success / failure / payload) — events don't return.
- You want to validate the action centrally before any side effect.

**When events beat commands:**

- Multiple unrelated modules react to "what just happened" — pure broadcast.

---

## Forbidden — direct concrete cross-module reference

```ts
// WRONG — Combat module
import { InventoryService } from 'Inventory/application/inventory-service';

class AttackUseCase {
    constructor(private inv: InventoryService) {}  // <-- concrete cross-module import
    // ...
}
```

Why this fails:

1. Compiler/lint can't enforce the dependency rule.
2. Combat unit tests pull in Inventory → Domain isolation broken.
3. Swapping `InventoryService` for a fake breaks one Combat test at a time.
4. Cyclic dependency risk grows linearly with module count.

Fix: define `IEquippedItemQuery` (port) in Combat's Application; let
Inventory's Infrastructure adapt. The composition root is the only place
that knows both concretes.

---

## Picking shared types — where do they live?

Common types referenced by multiple modules (`PlayerId`, `ItemId`,
`Currency`) live in a **shared kernel** module:

- Unity: `Assets/Scripts/Modules/SharedKernel/` with its own asmdef.
- Cocos: `assets/scripts/Game/shared-kernel/` with eslint allow-list.

**Rule:** the shared kernel contains **only** value types and interfaces. No
behavior. No engine imports. Adding a class to shared-kernel requires
explicit team review — it becomes API for every module.

---

## Related

- `principles.md` — the dependency rule (this file's foundation)
- `module-contracts.md` — module declares its emitted/consumed events + required ports
- `function-contracts.md` — events emitted by a function are explicit side effects
- `unity-patterns.md` — VContainer SignalBus + asmdef enforcement
- `cocos-patterns.md` — Cocos signalBus + eslint enforcement
