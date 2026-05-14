---
name: omg-unity-tof-milestone-streak
description: "Milestone Streak feature of TheOneFeature — This package provides a milestone-based streak system for TheOne Framework that rewards players for consecutive achievements."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Milestone Streak

## Purpose
This package provides a milestone-based streak system for TheOne Framework that rewards players for consecutive achievements.

## Public API
**class**
- `MilestoneStreakConfig` (MilestoneStreakConfig.cs)
- `MilestoneStreakLocalDataController` (MilestoneStreakLocalDataController.cs)
- `MilestoneStreakRewardRecord` (MilestoneStreakRewardsBlueprint.cs)
- `MilestoneStreakRewardsBlueprint` (MilestoneStreakRewardsBlueprint.cs)
- `MilestoneStreakService` (MilestoneStreakService.cs)
- `MilestoneStreakValidator` (MilestoneStreakValidator.cs)
- `MilestoneStreakVContainer` (MilestoneStreakVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Milestone Streak services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (7):**
**class**
- `MilestoneStreakConfig` (MilestoneStreakConfig.cs)
- `MilestoneStreakLocalDataController` (MilestoneStreakLocalDataController.cs)
- `MilestoneStreakRewardRecord` (MilestoneStreakRewardsBlueprint.cs)
- `MilestoneStreakRewardsBlueprint` (MilestoneStreakRewardsBlueprint.cs)
- `MilestoneStreakService` (MilestoneStreakService.cs)
- `MilestoneStreakValidator` (MilestoneStreakValidator.cs)
- `MilestoneStreakVContainer` (MilestoneStreakVContainer.cs)

**Detected DI registrations:**
- `MilestoneStreakLocalDataController`
- `MilestoneStreakService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/MilestoneStreak/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/MilestoneStreak/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/MilestoneStreak/CHANGELOG.md`
- Namespace: `TheOne.Features.MilestoneStreak.Editor`, `TheOne.Features.Core.Feature.MilestoneStreak.Scripts.BlueprintReaders`, `TheOne.Features.Core.Feature.MilestoneStreak.Scripts.Configs`, `TheOne.Features.MilestoneStreak.Core.DI`, `TheOne.Features.Core.Feature.MilestoneStreak.LocalData`, `TheOne.Features.Core.Feature.MilestoneStreak.Scripts.Services`
