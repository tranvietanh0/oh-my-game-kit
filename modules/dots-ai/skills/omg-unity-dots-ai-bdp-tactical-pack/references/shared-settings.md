---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# BDP Tactical Pack — Shared Settings (FormationsBase)

All 13 tactical tasks inherit these settings from `FormationsBase`. Settings are identical to those in the Formations Pack — same base class.

---

## Formation Group Settings

| Setting | Type | Description |
|---------|------|-------------|
| `Is2D` | bool | Enable for XZ-plane (top-down/side-view). Disables Y-axis movement in formation calculations |
| `FormationGroupID` | int | Group membership key — all entities with same ID act as a coordinated unit. **Required for all tactical tasks** |
| `ForceLeader` | Transform | Designate a specific agent as group leader. If null, leader is auto-assigned (first agent added) |

---

## Leader Settings

| Setting | Type | Description |
|---------|------|-------------|
| `FormationDirection` | enum | How leader determines facing: `Transform` (follow a Transform), `Movement` (face movement direction), `Specified` (fixed direction vector) |
| `MoveToInitialFormation` | bool | If true, group forms up at starting positions before executing task |
| `FailOnAgentRemoval` | bool | If true, task fails when any agent is removed from group (e.g., death). Default: false |
| `UpdateUnitLocationsOnAgentRemoval` | bool | If true, redistribute formation positions when an agent is removed. Recommended when `FailOnAgentRemoval = false` |

---

## Formation Settings

| Setting | Type | Description |
|---------|------|-------------|
| `RotationSpeed` | float | Degrees/sec for formation rotation alignment |
| `RotationThreshold` | float | Degrees — group is considered aligned when all members within this threshold |
| `OutOfRangeDistanceDelta` | float | Distance delta for "out of range" classification — used by Retreat (safe distance) and repositioning tasks |
| `InRangeDistanceDelta` | float | Distance delta for "in range" classification — used by Defend patrol radius |
| `OutOfRangeSpeedMultiplier` | float | Speed multiplier when moving to position (Charge, Retreat use this for sprint/flee) |
| `StuckDuration` | float | Seconds before a stuck agent is considered failed and task transitions |
| `StopOnTaskEnd` | bool | If true, NavMeshAgent velocity is zeroed when task ends. Set false for smooth task chaining |

---

## Tactical Settings

These settings are specific to Tactical Pack tasks (not present in base Formations Pack):

| Setting | Type | Description |
|---------|------|-------------|
| `Targets` | List\<Transform\> | Target list for the task — enemies to attack, retreat from, or surround |
| `AttackDelay` | enum | When group triggers attack: `None` (immediately), `Arrival` (when individual arrives), `GroupArrival` (when ALL members arrive) |

---

## Setting Interaction Notes

- **`FormationGroupID` + `AttackDelay = GroupArrival`**: All members with matching GroupID must arrive before ANY attacks. If any member's path is blocked indefinitely, attack never fires — set `StuckDuration` as a fallback.

- **`MoveToInitialFormation = true`**: Adds formation setup latency before task executes. Disable for reactive tasks (Ambush trigger, Reinforcements Response urgency).

- **`Is2D = true`**: Required for BattleDemo2D and BattleDemoSideView. Without it, formation offsets include Y-axis displacement → units stack vertically instead of spreading on XZ plane.

- **`StopOnTaskEnd = false` + chained tasks**: If transitioning directly from Charge → Attack in the same BDP tree, set `StopOnTaskEnd = false` on Charge to prevent a visible deceleration pause between tasks.

- **`FailOnAgentRemoval = true`** is aggressive — one death aborts the entire group's task. Use only for scripted sequences. For organic combat, use `false` + `UpdateUnitLocationsOnAgentRemoval = true`.
