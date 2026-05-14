---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# System Update Order (Phase 5-6 Updated)

All groups run inside `SimulationSystemGroup` in this fixed order:

```
0. PreFixedStepDeadAgentCleanupSystem  (SimulationSystemGroup, OrderFirst + UpdateBefore FixedStep)
   +- Disables NavMeshPath + stops AgentBody for dead agents before Agents Nav runs

   FixedStepSimulationSystemGroup
   +- AgentSystemGroup (Agents Navigation: NavMeshPathSystem, NavMeshSteeringSystem, etc.)

1. CoreSystemGroup       (OrderFirst)
   +- LifetimeSystem

2. StatsSystemGroup
   +- DerivedStatsSystem -> StatModifierTickSystem -> LevelUpSystem -> StatsSyncSystem

3. AISystemGroup
   +- AILeashInitSystem (OrderFirst) -> DetectionSystem -> AggroInitSystem -> AggroSystem
   +- AIRespawnResetSystem (OrderLast, consumes RespawnReadyTag)

4. BehaviorTreeSystemGroup (managed by Behavior Designer Pro)
   +- Conditional Tasks + Action Tasks (parallel job execution)

5. NavigationSystemGroup
   +- AgentNavigationBridgeSystem (OrderFirst) -> [Agents Nav FixedStep] -> AgentCCOverrideSystem (OrderLast)

6. SkillsSystemGroup
   +- TargetGridSystem (OrderFirst) -> SkillCooldownSystem -> SkillCastingSystem -> LinearProjectileSystem -> ParabolicArcSystem -> HomingSystem -> ProjectileCollisionSystem -> AreaEffectSystem (OrderLast)

7. CombatSystemGroup
   +- CombatRespawnResetSystem -> RegenSystem (UpdateAfter CombatRespawnResetSystem) -> AttackTimerSystem -> StatusEffectStackSystem (Pass 1: merge/stack)
   -> StatusEffectTickSystem (Pass 2: tick/decay) -> CCStateSyncSystem (sync MovementRestriction)
   -> HitFlashTriggerSystem -> AutoAttackSystem -> RangedAttackSystem -> MageAttackSystem
   -> DamageProcessingSystem -> HealProcessingSystem -> KnockbackSystem -> DeathSystem
   -> DeathAnimationSystem -> HitFlashAnimateSystem -> BattleStateSystem
   -> WinConditionSystemBase (abstract, project subclass) -> BattleEndSystem (OrderLast, clears NavigationTarget+CombatTarget when BattleOver)

8. InventorySystemGroup
   +- EquipmentSystem -> LootDropSystem -> PickupSystem
   +- InventoryRespawnResetSystem (OrderLast, consumes RespawnReadyTag)

9. SpawningSystemGroup   (OrderLast in SimulationSystemGroup)
   +- SpawnTimerSystem -> SpawnSystem -> RespawnSystem
   -> RespawnReadyCleanupSystem (removes RespawnReadyTag)
   -> SpawnCleanupSystem
```

## Phase 5-6 Key Changes

- DerivedStats split into 3 (DerivedCombatStats, DerivedResourceStats, DerivedLocomotion)
- StatusEffectTickSystem split into 2 passes: StatusEffectStackSystem (merge), StatusEffectTickSystem (tick)
- CCStateSyncSystem extracted and runs after StatusEffectTickSystem
- RespawnReadyTag bridge pattern: DeathSystem spawns tag, consumed by CombatRespawnResetSystem, AIRespawnResetSystem, InventoryRespawnResetSystem in same frame
- RespawnReadyCleanupSystem removes tag at frame end (Phase 5)
- Navigation module now independent of Combat (CC/impulse moved to Core)
- Per-module respawn resets ensure atomic state cleanup across all modules
