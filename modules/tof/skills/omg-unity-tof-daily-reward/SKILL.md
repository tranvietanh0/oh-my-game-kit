---
name: omg-unity-tof-daily-reward
description: "Daily Reward feature of TheOneFeature — Core implementation of dailyreward core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Daily Reward

## Purpose
Core implementation of dailyreward core feature for Unity games

## Public API
**class**
- `DailyRewardBlueprint` (DailyRewardBlueprint.cs)
- `DailyRewardDataController` (DailyRewardDataController.cs)
- `DailyRewardRecord` (DailyRewardBlueprint.cs)
- `DailyRewardValidator` (DailyRewardValidator.cs)
- `DailyRewardVContainer` (DailyRewardVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Daily Reward services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (5):**
**class**
- `DailyRewardBlueprint` (DailyRewardBlueprint.cs)
- `DailyRewardDataController` (DailyRewardDataController.cs)
- `DailyRewardRecord` (DailyRewardBlueprint.cs)
- `DailyRewardValidator` (DailyRewardValidator.cs)
- `DailyRewardVContainer` (DailyRewardVContainer.cs)

**Detected DI registrations:**
- `DailyRewardDataController`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/DailyReward/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/DailyReward/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/DailyReward/CHANGELOG.md`
- Namespace: `TheOne.Features.DailyReward.Core.Controllers`, `TheOne.Features.DailyReward.Core.DI`, `TheOne.Features.DailyReward.Core.Editor`, `TheOne.Features.DailyReward.Core.Models.Blueprints`, `TheOne.Features.DailyReward.Core.Models.LocalData`
