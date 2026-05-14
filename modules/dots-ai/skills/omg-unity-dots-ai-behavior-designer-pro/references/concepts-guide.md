---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# Concepts — Behavior Designer Pro (DOTS Entity)

> **Prerequisites:** `dots-ecs-core` (ECS fundamentals)

## What Is a Behavior Tree?

A collection of tasks arranged hierarchically. Four task types: **Action**, **Conditional**, **Composite**, **Decorator**. Execution is **depth-first, left-to-right** — task arrangement determines AI behavior.

## Execution Flow

```
Root
├── Composite (controls child execution order)
│   ├── Conditional (check state → Success/Failure)
│   ├── Action (do something → Success/Failure/Running)
│   └── Decorator (modify child's return status)
└── ...
```

Each tick traverses the tree top→bottom, left→right. Tasks return:

| Status | Meaning |
|--------|---------|
| `TaskStatus.Success` | Task completed successfully |
| `TaskStatus.Failure` | Task failed |
| `TaskStatus.Running` | Task in progress, re-tick next frame |
| `TaskStatus.Queued` | Task waiting to execute |

## Task Types

### Action Tasks
- Modify game state (move, attack, wait)
- Return any status (Success, Failure, Running)
- Entity tasks must be independent (no stacking)

### Conditional Tasks
- Check game state (is target visible? is health low?)
- Return only Success or Failure (never Running)
- Can be **reevaluated** via Conditional Aborts (`IReevaluateResponder`)

### Composite Tasks

| Composite | Traversal | Stops When |
|-----------|-----------|------------|
| **Sequence** | L→R sequential | Child returns **Failure** |
| **Selector** | L→R sequential | Child returns **Success** |
| **Parallel** | All children simultaneously | Configurable |
| **Parallel Selector** | All simultaneously | First child **Success** |
| **Utility Selector** | By utility score | Selected child completes |

### Decorator Tasks

| Decorator | Effect |
|-----------|--------|
| **Inverter** | Flips Success↔Failure |
| **Repeater** | Repeats child N times or forever |
| **Cooldown** | Delays re-execution for duration |
| **Conditional Evaluator** | Re-checks condition while child runs |

## Conditional Aborts

Selectively reevaluate conditional tasks without traversing entire tree.

| Abort Type | Scope | When Reevaluated |
|------------|-------|------------------|
| **None** | No reevaluation | Never |
| **Self** | Same parent composite | When any task within current branch is active |
| **Lower Priority** | Right-side branches | When any task to the right is active |
| **Both** | Self + Lower Priority | Both scopes |

- Only reevaluate **conditional** tasks (never actions)
- Trigger on **status transitions** only (not continuous)
- ECS implementation requires `IReevaluateResponder` interface + dedicated reevaluate system + flag

## Data Communication (ECS)

Entity tasks use **ECS component data** for communication between tasks — NOT SharedVariable/Blackboard (those are GameObject-only).

- Tasks read/write ECS components (`IComponentData`, `IBufferElementData`)
- Perception data flows via `PerceivedEntity` and `AggroEntry` buffers
- Decisions written to `NavigationTarget`, `CombatTarget` components
- See [dots-rpg-integration-guide.md](dots-rpg-integration-guide.md) for data flow details
