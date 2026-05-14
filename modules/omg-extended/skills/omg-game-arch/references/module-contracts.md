---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Module Contracts — Template + 3 Worked Examples

Every feature module ships a **`module-contract.md`** at its root. This is
the artifact that anchors the module: it declares the public surface,
dependencies, and event flow. Anything not in the contract is `internal:`
and must not be imported by other modules.

> **Stage 7 of the refactor playbook is non-optional.** A module without a
> contract is "in progress." See `refactor-playbook.md`.

---

## Template (verbatim — paste this into your new module)

```yaml
module: <FeatureName>
version: 1.0.0

inputs:
  commands:        # external mutations; return Result<T, Error>
    - name: <CommandName>
      payload: <type>
      returns: Result<<T>, <ErrorEnum>>
  queries:         # external reads (sync, no mutation)
    - name: <QueryName>
      payload: <type>
      returns: <T>
  events_consumed: # what this module subscribes to (read-only intent)
    - <EventName>

outputs:
  events_emitted:
    - name: <EventName>
      payload: <type>
      when: <which use case emits, in plain English>

dependencies:
  required_ports: # interfaces this module declares; supplied at composition root
    - name: <IPortName>
      shape: <method-list summary>
      provided_by: <other module | infrastructure adapter>
  module_deps:    # other feature modules this references
    - name: <OtherModule>
      via: events | port | command   # how the link is realised

internal:         # NOT public. Do not import from another module.
  - <ClassName1>
  - <ClassName2>
```

---

## Worked example 1 — Combat (port + event consumer + event emitter + command)

```yaml
module: Combat
version: 1.2.0

inputs:
  commands:
    - name: AttackCommand
      payload: { attackerId: ActorId, targetId: ActorId, attackKind: AttackKind }
      returns: Result<DamageResult, AttackError>
  queries:
    - name: GetHealth
      payload: { actorId: ActorId }
      returns: Health
  events_consumed:
    - PlayerDied             # to clear in-flight attacks targeting the dead player
    - LevelLoaded            # to reset combat state

outputs:
  events_emitted:
    - name: DamageDealt
      payload: { targetId: ActorId, amount: number, fatal: boolean }
      when: AttackUseCase succeeds with non-zero damage
    - name: ActorDied
      payload: { actorId: ActorId, killerId: ActorId | null }
      when: damage reduces Health to 0

dependencies:
  required_ports:
    - name: IAnimationPlayer
      shape: play(animId), stop(animId)
      provided_by: Infrastructure (AnimatorAnimationPlayer / cc.AnimationAdapter)
    - name: IAudioCue
      shape: play(cueId, volume?)
      provided_by: Infrastructure (WwiseAudioCue / cc.AudioAdapter)
    - name: ICombatHud
      shape: showFloatingText(pos, text, color), shake(intensity)
      provided_by: Presentation (UguiCombatHud / cc.HudComponent)
    - name: IEquippedItemQuery
      shape: isEquipped(itemId), getEquippedDamage(slot)
      provided_by: Inventory (via port)
  module_deps:
    - name: Inventory
      via: port      # IEquippedItemQuery
    - name: Quest
      via: events    # Quest subscribes to DamageDealt / ActorDied; Combat doesn't know

internal:
  - AttackUseCase
  - DamageCalculator
  - CombatRules
  - Health (entity)
  - AttackError (error enum)
```

---

## Worked example 2 — Inventory (event-only deps; pure decoupled)

This module shows the **simplest** valid contract: no ports needed, no
commands required from outside; pure event-driven. Other modules query via
port (declared by callers like Combat), but Inventory itself has no
external port requirements.

```yaml
module: Inventory
version: 1.0.0

inputs:
  commands:
    - name: AddItemCommand
      payload: { ownerId: ActorId, itemId: ItemId, qty: number }
      returns: Result<InventorySnapshot, InventoryError>
    - name: EquipItemCommand
      payload: { ownerId: ActorId, itemId: ItemId, slot: SlotKind }
      returns: Result<InventorySnapshot, InventoryError>
  queries:
    - name: GetInventory
      payload: { ownerId: ActorId }
      returns: InventorySnapshot
  events_consumed:
    - ItemPickedUp           # auto-add via use case
    - ItemDropped            # auto-remove

outputs:
  events_emitted:
    - name: InventoryChanged
      payload: { ownerId: ActorId, snapshot: InventorySnapshot, reason: ChangeReason }
      when: any AddItem / RemoveItem / EquipItem succeeds

dependencies:
  required_ports: []       # nothing needed at composition root from outside
  module_deps: []          # pure decoupled; world reaches it only through events + commands

internal:
  - InventoryRepository
  - InventoryUseCases
  - InventorySnapshot
  - InventoryError
```

Notes:
- **No `required_ports`** — Inventory needs nothing engine-bound; persistence is internal.
- **No `module_deps`** — other modules talk to Inventory only via the
  event/command bus + the ports they declare on themselves. Inventory does
  not import a single line from any other module.
- This is the cleanest shape. Aim every module here when feasible.

---

## Worked example 3 — Quest (port + event emitter + command, multi-pattern composition)

```yaml
module: Quest
version: 1.1.0

inputs:
  commands:
    - name: AcceptQuestCommand
      payload: { actorId: ActorId, questId: QuestId }
      returns: Result<QuestState, QuestError>
    - name: AbandonQuestCommand
      payload: { actorId: ActorId, questId: QuestId }
      returns: Result<Unit, QuestError>
  queries:
    - name: GetActiveQuests
      payload: { actorId: ActorId }
      returns: QuestState[]
  events_consumed:
    - DamageDealt            # progress "deal X damage" objectives
    - ItemPickedUp           # progress "collect X" objectives
    - ActorDied              # progress "defeat X" objectives

outputs:
  events_emitted:
    - name: QuestAccepted
      payload: { actorId: ActorId, questId: QuestId, state: QuestState }
      when: AcceptQuestCommand succeeds
    - name: QuestObjectiveCompleted
      payload: { actorId: ActorId, questId: QuestId, objectiveId: ObjectiveId }
      when: any consumed event satisfies an objective predicate
    - name: QuestCompleted
      payload: { actorId: ActorId, questId: QuestId, rewards: Reward[] }
      when: all objectives complete

dependencies:
  required_ports:
    - name: IQuestProgressTracker
      shape: load(actorId), save(actorId, state)
      provided_by: Infrastructure (PersistenceAdapter)
    - name: IQuestNotifier
      shape: showAccepted(state), showCompleted(state)
      provided_by: Presentation (UguiQuestToast / cc.QuestToast)
  module_deps:
    - name: Combat
      via: events    # consumes DamageDealt, ActorDied
    - name: Inventory
      via: events    # consumes ItemPickedUp

internal:
  - QuestState
  - ObjectivePredicate
  - QuestUseCases
  - QuestError
```

This shows **multi-pattern composition** — a port for persistence, a port
for UI notification, and event consumption from two upstream modules.

---

## How to evolve a contract — versioning rules

1. **Patch (`x.y.Z`)** — add an internal class, change implementation.
   Public surface unchanged. No breaking change.
2. **Minor (`x.Y.0`)** — add a new command, query, event_emitted, or port.
   Old contract still compiles. **Add-only.**
3. **Major (`X.0.0`)** — remove or rename a public command/event/port, or
   change a payload shape. **Breaking** — every consuming module must update.

When making a major change:
- Open a tracking issue listing every consuming module.
- Coordinate the rename across modules (use port `vNext` alongside `v` for one
  release, then drop `v`).

---

## Common smells in contracts

| Smell | Fix |
|---|---|
| `module_deps:` lists 5+ modules | Extract a shared kernel for common types; convert direct deps to events |
| `events_consumed:` lists events from a module that also appears in `module_deps via port` | Pick one — port for sync need, events for reactive flow |
| `required_ports:` shape is "everything UI" | UI port too coarse; split (animation / audio / hud) |
| `internal:` empty | Suspect — a non-trivial module has internal types; if truly empty, the module might be a port-only stub |

---

## Related

- `principles.md` — the dependency rule that contracts express
- `inter-module-communication.md` — the patterns referenced in `module_deps`
- `function-contracts.md` — function-level pre/post (contracts compose up)
- `module-templates.md` — directory scaffold + this contract template per engine
- `refactor-playbook.md` — stage 7 produces a contract for the refactored module
