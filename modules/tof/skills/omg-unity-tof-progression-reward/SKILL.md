---
name: omg-unity-tof-progression-reward
description: "Progression Reward feature of TheOneFeature — This package provides a level-based chest reward system for TheOne Framework that grants rewards as players progress through game levels."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Progression Reward

## Purpose
This package provides a level-based chest reward system for TheOne Framework that grants rewards as players progress through game levels.

## Public API
**class**
- `IsExternalInit` (IsExternalInit.cs)
- `LevelChestProgressionService` (LevelChestProgressionService.cs)
- `ProgressionRewardConstants` (ProgressionRewardConstants.cs)
- `ProgressionRewardConstantValues` (ProgressionRewardConstants.cs)
- `ProgressionRewardLevelChestValidator` (ProgressionRewardLevelChestValidator.cs)
- `ProgressionRewardLevelChestVContainer` (ProgressionReward.LevelChestVContainer.cs)
- `ProgressionRewardService` (ProgressionRewardService.cs)
- `ProgressionRewardValidator` (ProgressionRewardValidator.cs)
- `ProgressionRewardVContainer` (ProgressionRewardVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Progression Reward services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (9):**
**class**
- `IsExternalInit` (IsExternalInit.cs)
- `LevelChestProgressionService` (LevelChestProgressionService.cs)
- `ProgressionRewardConstants` (ProgressionRewardConstants.cs)
- `ProgressionRewardConstantValues` (ProgressionRewardConstants.cs)
- `ProgressionRewardLevelChestValidator` (ProgressionRewardLevelChestValidator.cs)
- `ProgressionRewardLevelChestVContainer` (ProgressionReward.LevelChestVContainer.cs)
- `ProgressionRewardService` (ProgressionRewardService.cs)
- `ProgressionRewardValidator` (ProgressionRewardValidator.cs)
- `ProgressionRewardVContainer` (ProgressionRewardVContainer.cs)

**Detected DI registrations:**
- `LevelChestProgressionService`
- `ProgressionRewardService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/ProgressionReward/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/ProgressionReward/LevelChest/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/ProgressionReward/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/ProgressionReward/Core/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/ProgressionReward/LevelChest/CHANGELOG.md`
- Namespace: `TheOne.Features.ProgressionReward.Core.Editor`, `TheOne.Features.ProgressionReward.DI`, `System.Runtime.CompilerServices`, `TheOne.Features.ProgressionReward.Core`, `TheOne.Features.ProgressionReward.LevelChest.Editor`, `TheOne.Features.ProgressionReward.LevelChest.DI`, `TheOneFeature.Core.Features.ProgressionReward.LevelChest`
