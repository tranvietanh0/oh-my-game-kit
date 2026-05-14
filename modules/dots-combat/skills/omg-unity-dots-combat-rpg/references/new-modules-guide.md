---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# New Modules — DOTSRPG (v0.5.0 additions)

> All Burst-compiled except SaveSystem/LoadSystem (file I/O).

## Wave/Round Manager (DOTSRPG.Spawning)

| Type | Key Fields | Notes |
|------|-----------|-------|
| `WaveDefinition` | `int WaveIndex, TotalWaves`, `float PreWaveDelay, PostWaveDelay` | Config per wave |
| `WaveState` | `int CurrentWave, AliveCount`, `WavePhase Phase`, `float PhaseTimer` | Singleton |
| `WaveEvent` | `WaveEventType Type, int WaveIndex` | `IBufferElementData`; WaveEventCleanupSystem |
| `WaveConfig` | `DynamicBuffer<WaveDefinition>` | Singleton holding all wave definitions |
| `WaveSpawnedTag` | — | Tag on wave-spawned entities for tracking |

**WavePhase**: `Idle=0`, `PreWave=1`, `Active=2`, `PostWave=3`, `Complete=4` | **WaveEventType**: `WaveStarted=0`, `WaveComplete=1`, `AllWavesComplete=2`

**Systems** (SpawningSystemGroup): `WaveManagerSystem` → `WaveTaggingSystem` → `WaveUnitTrackingSystem` → `WaveEventCleanupSystem`

## Upgrade System (DOTSRPG.Progression)

| Type | Key Fields | Notes |
|------|-----------|-------|
| `UpgradeLevel` | `int Level, MaxLevel` | Per-entity upgrade tier |
| `UpgradeDefinition` | `int UpgradeId`, `StatType Stat`, `ModifierType ModType`, `float Value` | What each level grants |
| `UpgradeRequest` | `Entity Target, int UpgradeId` | Fire-and-forget; consumed by UpgradeSystem |
| `UpgradeEvent` | `Entity Target, int UpgradeId, int NewLevel` | `IBufferElementData` result |

**Systems**: `UpgradeSystem` (validates level cap, applies StatModifier) → `UpgradeEventCleanupSystem`

## Synergy/Trait System (DOTSRPG.Combat.Synergy)

| Type | Key Fields | Notes |
|------|-----------|-------|
| `TraitEntry` | `int TraitId, int Count` | `IBufferElementData` on team singleton |
| `SynergyDefinition` | `int TraitId, int Threshold`, `StatType Stat`, `float Bonus` | Threshold + reward |
| `ActiveSynergy` | `int SynergyId, int Tier` | `IBufferElementData` — active synergies on team |
| `TeamSynergyState` | `bool IsDirty` | Dirty flag; set by SynergyDirtySystem |
| `SynergyModifierSource` | `int SynergyId` | Tag on applied StatModifiers for cleanup |

**Systems**: `SynergyDirtySystem` → `SynergyResolutionSystem` (recalculates when dirty) → `SynergyCleanupSystem`

## Talent/Skill Tree (DOTSRPG.Skills)

| Type | Key Fields | Notes |
|------|-----------|-------|
| `TalentNode` | `int NodeId, int PrereqId`, `int PointCost`, `StatType Stat`, `float Value` | DAG node |
| `TalentProgress` | `DynamicBuffer<TalentNode>` | Per-entity unlocked nodes |
| `TalentPoints` | `int Available, int Spent` | Spendable points per entity |
| `TalentUnlockRequest` | `Entity Target, int NodeId` | Consumed by TalentUnlockSystem |
| `TalentEvent` | `Entity Target, int NodeId` | `IBufferElementData` result |

**GOTCHA**: `TalentUnlockSystem` uses `SystemBase` (not ISystem) — two-pass read/write avoids `BufferTypeHandle` invalidation in Entities 1.4.

## Build/Placement System (DOTSRPG.Structures)

| Type | Key Fields | Notes |
|------|-----------|-------|
| `BuildGrid` | `int Width, Height`, `float CellSize`, `float3 Origin` | Singleton grid config |
| `BuildGridCell` | `GridPosition Pos, bool IsOccupied, Entity Occupant` | `IBufferElementData` on grid entity |
| `BuildRequest` | `int PrefabId`, `GridPosition Pos`, `byte TeamId` | Consumed by BuildValidationSystem |
| `BuildEvent` | `Entity Built, GridPosition Pos` | `IBufferElementData` result |
| `DemolishRequest` | `Entity Target` | Consumed by DemolishSystem |

**Systems**: `BuildValidationSystem` (bounds + occupancy) → `BuildExecutionSystem` (instantiate, mark cell) → `DemolishSystem` → `BuildEventCleanupSystem`

## Party System (DOTSRPG.AI)

| Type | Key Fields | Notes |
|------|-----------|-------|
| `PartyMember` | `Entity PartyLeader, int SlotIndex` | Back-reference to leader |
| `PartyRole` | `byte Role` | `0=Frontline, 1=Ranged, 2=Support` |
| `PartyFormation` | `FormationType Type`, `float Spacing` | Config on leader |
| `PartyBuff` | `StatType Stat`, `float Value`, `int BuffId` | `IBufferElementData` on leader |

**FormationType**: `Line=0`, `Column=1`, `Wedge=2`, `Circle=3` | **Systems**: `PartyFormationSystem` (writes NavigationTarget per member) → `PartyBuffSystem` (propagates buffs to member StatModifiers)

## Path/Lane System (DOTSRPG.Navigation)

| Type | Key Fields | Notes |
|------|-----------|-------|
| `WaypointPath` | `DynamicBuffer<float3> Waypoints` | Ordered path (singleton or per-entity) |
| `WaypointFollower` | `int CurrentIndex`, `float Speed`, `float SpeedMultiplier` | Per-entity follower state; `SpeedMultiplier` is applied locally for speed zones — never mutate `MoveSpeed.Value` |
| `LaneId` | `byte Value` | Assigns follower to a WaypointPath entity |
| `PathEndReachedEvent` | `Entity Follower` | `IBufferElementData` on last waypoint reached |
| `WaypointSpeedZone` | `float3 Center`, `float Radius`, `float SpeedMultiplier` | Speed modifier volume |

**Systems**: `WaypointFollowSystem` (uses `AIConstants.WaypointArrivalSq`, writes `NavigationTarget`) → `PathEndEventCleanupSystem`

## Summon System (DOTSRPG.Skills)

| Type | Key Fields | Notes |
|------|-----------|-------|
| `SummonConfig` | `Entity SummonPrefab`, `float Cooldown`, `int MaxSummons` | Per-entity config |
| `SummonState` | `float CooldownRemaining`, `int ActiveCount` | Mutable state |
| `SummonRequest` | `Entity Owner, float3 SpawnPos` | Consumed by SummonSystem |
| `SummonEvent` | `Entity Owner, Entity Summoned` | `IBufferElementData` result |
| `SummonedByTag` | `Entity Owner` | Tag on summoned entity for owner tracking |

**Systems**: `SummonCooldownSystem` → `SummonSystem` (validates max, instantiates, sets TeamId) → `SummonTrackingSystem` → `SummonEventCleanupSystem`

## Camera System (DOTSRPG.Core)

Camera module now delegates visual camera control to **Cinemachine 3.x** via `CinemachineCameraBridge` MonoBehaviour. ECS owns data only; Cinemachine owns camera movement.

**Deleted**: `CameraConfig`, `CameraMode`, `CameraOrbitState`, `CameraRTSInput`, `CameraOutput` (v0.4 components — replaced by Cinemachine 3.x)
**Deleted systems**: `CameraFollowSystem`, `CameraAutoZoomSystem`, `CameraBoundsSystem`, `CameraOutputSystem`, `CameraShakeDecaySystem`

| Type | Key Fields | Notes |
|------|-----------|-------|
| `CameraTarget` | (singleton tag) | Entity to follow; read by `CinemachineCameraBridge` |
| `CameraShakeEvent` | `float Intensity` | `IBufferElementData`; triggers `CinemachineImpulseSource` |
| `CameraAutoZoomTarget` | (enableable tag) | Added to all game entities via spawner; marks entity for zoom bounds calculation |
| `CameraAutoZoomBounds` | `float2 Min, Max; int EntityCount` | Singleton; computed each frame by `CameraAutoZoomBoundsSystem` (Burst job) |
| `CameraTrauma` | `float Value` | Singleton; drives impulse generation; decayed by `TraumaShakeSystem` |
| `HitStopEvent` | `float TimeScale, float Duration` | Singleton; controls `Time.timeScale`; managed by `HitStopSystem` |
| `CameraAccessibility` | `bool ReduceMotion` | Singleton; suppresses all impulse when true |
| `CameraZoomAnticipation` | `float3 LookAheadOffset` | Written by `CameraZoomAnticipationSystem` |
| `CameraFocusRequest` | `Entity Target, float Priority` | Triggers boss focus cam priority swap via bridge |

**Systems**: `CameraAutoZoomBoundsSystem` (Burst job → AABB of alive units) → `TraumaShakeSystem` (decay trauma over time) → `HitStopSystem` (restore timeScale after duration) → `CameraZoomAnticipationSystem` (write look-ahead) → `CombatTraumaSystem` (add trauma on hit/kill)

**Bridge pattern**: `CinemachineCameraBridge` MonoBehaviour reads all above singletons in `LateUpdate` and drives Cinemachine components. → See `unity-cinemachine` skill for bridge code.

## Save/Load System (DOTSRPG.Persistence — separate asmdef)

| Type | Key Fields | Notes |
|------|-----------|-------|
| `SaveSlot` | `int SlotIndex`, `string FileName` | **Managed** — not Burst-compatible |
| `SaveComplete` / `LoadComplete` | — | Tags added after successful save/load |
| `SavedComponentFlags` | `uint Flags` | Bitfield of saved components |

**Systems**: `SaveSystem` (NOT Burst — `BinaryWriter`) → `LoadSystem` (NOT Burst — `BinaryReader`) → `SaveEventCleanupSystem`

**SaveConstants**: `SaveDirectory="SaveData/"`, `SaveExtension=".sav"`, `CurrentSaveVersion=1`

```csharp
ecb.AddComponent(ecb.CreateEntity(), new SaveStateRequest { SlotIndex = 0 });  // save
ecb.AddComponent(ecb.CreateEntity(), new LoadStateRequest { SlotIndex = 0 });  // load
```
