---
name: omg-unity-tof-daily-mission
description: "Daily Mission feature of TheOneFeature — A feature package for TheOne framework"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Daily Mission

## Purpose
Drives daily quest objectives with milestone tiers, reset-on-new-day signals, and blueprint-driven task definitions via `DailyMissionDataController`.

## Public API
**class**
- `CollectDailyMissionRewardSignal` (CollectDailyMissionRewardSignal.cs)
- `DailyMissionBlueprint` (DailyMissionBlueprint.cs)
- `DailyMissionDataController` (DailyMissionDataController.cs)
- `DailyMissionMilestoneBlueprint` (DailyMissionMilestoneBlueprint.cs)
- `DailyMissionMilestoneRecord` (DailyMissionMilestoneBlueprint.cs)
- `DailyMissionNewDaySignal` (DailyMissionNewDaySignal.cs)
- `DailyMissionRecord` (DailyMissionBlueprint.cs)
- `DailyMissionStaticData` (DailyMissionStaticData.cs)
- `DailyMissionValidator` (DailyMissionValidator.cs)
- `DailyMissionVContainer` (DailyMissionVContainer.cs)
- `MilestoneInfo` (DailyMissionLocalData.cs)
- `MissionInfo` (DailyMissionLocalData.cs)
- `UpdateQuestSignal` (UpdateQuestSignal.cs)

## Signals / Events
- `CollectDailyMissionRewardSignal`
- `DailyMissionNewDaySignal`
- `UpdateQuestSignal`

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Daily Mission services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (13):**
**class**
- `CollectDailyMissionRewardSignal` (CollectDailyMissionRewardSignal.cs)
- `DailyMissionBlueprint` (DailyMissionBlueprint.cs)
- `DailyMissionDataController` (DailyMissionDataController.cs)
- `DailyMissionMilestoneBlueprint` (DailyMissionMilestoneBlueprint.cs)
- `DailyMissionMilestoneRecord` (DailyMissionMilestoneBlueprint.cs)
- `DailyMissionNewDaySignal` (DailyMissionNewDaySignal.cs)
- `DailyMissionRecord` (DailyMissionBlueprint.cs)
- `DailyMissionStaticData` (DailyMissionStaticData.cs)
- `DailyMissionValidator` (DailyMissionValidator.cs)
- `DailyMissionVContainer` (DailyMissionVContainer.cs)
- `MilestoneInfo` (DailyMissionLocalData.cs)
- `MissionInfo` (DailyMissionLocalData.cs)
- `UpdateQuestSignal` (UpdateQuestSignal.cs)

**Detected DI registrations:**
- `DailyMissionDataController`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/DailyMission/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/DailyMission/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/DailyMission/CHANGELOG.md`
- Namespace: `TheOne.Features.DailyMission.Core.Controllers`, `TheOne.Features.DailyMission.Core.DI`, `TheOne.Features.DailyMission.Core.Editor`, `TheOne.Features.DailyMission.Core.Models.Blueprints`, `TheOne.Features.DailyMission.Core.Models.LocalData`, `TheOne.Features.DailyMission.Core.Models.Signals`, `TheOne.Features.DailyMission.Core.Models.Signals.StaticData`
