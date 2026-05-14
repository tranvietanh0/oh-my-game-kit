---
name: omg-unity-tof-race-event
description: "Race Event feature of TheOneFeature — Core implementation of racing core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Race Event

## Purpose
Core implementation of racing core feature for Unity games

## Public API
**class**
- `RaceEventConfig` (RaceEventConfig.cs)
- `RaceEventEndSignal` (RaceEventSignal.cs)
- `RaceEventLocalDataController` (RaceEventLocalDataController.cs)
- `RaceEventRewardBlueprint` (RaceEventRewardBlueprint.cs)
- `RaceEventRewardRecord` (RaceEventRewardBlueprint.cs)
- `RaceEventService` (RaceEventService.cs)
- `RaceEventStartSignal` (RaceEventSignal.cs)
- `RaceEventStopSignal` (RaceEventSignal.cs)
- `RaceEventValidator` (RaceEventValidator.cs)
- `RacerBotBlueprint` (RacerBotBlueprint.cs)
- `RacerBotRecord` (RacerBotBlueprint.cs)
- `RacerBotSpeedData` (RacerBotSpeedData.cs)
- `RaceResult` (RaceEventService.cs)
- `RacerLocalData` (RacerLocalData.cs)
- `RacingEventVContainer` (RacingEventVContainer.cs)

## Signals / Events
- `RaceEventEndSignal`
- `RaceEventStartSignal`
- `RaceEventStopSignal`

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Race Event services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (15):**
**class**
- `RaceEventConfig` (RaceEventConfig.cs)
- `RaceEventEndSignal` (RaceEventSignal.cs)
- `RaceEventLocalDataController` (RaceEventLocalDataController.cs)
- `RaceEventRewardBlueprint` (RaceEventRewardBlueprint.cs)
- `RaceEventRewardRecord` (RaceEventRewardBlueprint.cs)
- `RaceEventService` (RaceEventService.cs)
- `RaceEventStartSignal` (RaceEventSignal.cs)
- `RaceEventStopSignal` (RaceEventSignal.cs)
- `RaceEventValidator` (RaceEventValidator.cs)
- `RacerBotBlueprint` (RacerBotBlueprint.cs)
- `RacerBotRecord` (RacerBotBlueprint.cs)
- `RacerBotSpeedData` (RacerBotSpeedData.cs)
- `RaceResult` (RaceEventService.cs)
- `RacerLocalData` (RacerLocalData.cs)
- `RacingEventVContainer` (RacingEventVContainer.cs)

**Detected DI registrations:**
- `RaceEventLocalDataController`
- `RaceEventService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/RaceEvent/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/RaceEvent/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/RaceEvent/CHANGELOG.md`
- Namespace: `TheOne.Features.RaceEvent.Editor`, `TheOne.Features.RaceEvent.Core.Blueprints`, `TheOne.Features.RaceEvent.Core.DI`, `TheOne.Features.RaceEvent.Core.LocalData.Controllers`, `TheOne.Features.RaceEvent.Core.LocalData.Models`, `TheOne.Features.RaceEvent.Core`, `TheOne.Features.RaceEvent.Core.Services`, `TheOne.Features.RaceEvent.Core.Signals`
