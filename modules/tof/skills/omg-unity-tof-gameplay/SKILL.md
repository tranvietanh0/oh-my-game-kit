---
name: omg-unity-tof-gameplay
description: "Gameplay feature of TheOneFeature — Core implementation of gameplay core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Gameplay

## Purpose
Core implementation of gameplay core feature for Unity games

## Public API
**interface**
- `IBoosterService` (IBoosterService.cs)
- `IGameplayService` (IGameplayService.cs)
- `IReviveService` (IReviveService.cs)
- `IStarProvider` (IStarProvider.cs)
**class**
- `BindableDifficultyObjectsView` (BindableDifficultyObjectsView.cs)
- `DifficultyObjectsView` (DifficultyObjectsView.cs)
- `GameplayBlueprint` (GameplayBlueprint.cs)
- `GameplayValidator` (GameplayValidator.cs)
- `GameplayVContainer` (GameplayVContainer.cs)
- `GameStartTracker` (GameStartTracker.cs)
- `LevelGroupBlueprint` (LevelGroupBlueprint.cs)
- `LevelGroupRecord` (LevelGroupBlueprint.cs)
- `LevelView` (LevelView.cs)
- `PermanentLostSignal` (PermanentLostSignal.cs)
- `ReviveRewardHandler` (ReviveRewardHandler.cs)
- `WinRewardedAdWatchedSignal` (WinRewardedAdWatchedSignal.cs)

## Signals / Events
- `PermanentLostSignal`
- `WinRewardedAdWatchedSignal`

## Config / ScriptableObjects
- `GameplayBlueprint`

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Gameplay services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (17):**
**interface**
- `IBoosterService` (IBoosterService.cs)
- `IGameplayService` (IGameplayService.cs)
- `IReviveService` (IReviveService.cs)
- `IStarProvider` (IStarProvider.cs)
**class**
- `BindableDifficultyObjectsView` (BindableDifficultyObjectsView.cs)
- `DifficultyObjectsView` (DifficultyObjectsView.cs)
- `GameplayBlueprint` (GameplayBlueprint.cs)
- `GameplayValidator` (GameplayValidator.cs)
- `GameplayVContainer` (GameplayVContainer.cs)
- `GameStartTracker` (GameStartTracker.cs)
- `LevelGroupBlueprint` (LevelGroupBlueprint.cs)
- `LevelGroupRecord` (LevelGroupBlueprint.cs)
- `LevelView` (LevelView.cs)
- `PermanentLostSignal` (PermanentLostSignal.cs)
- `ReviveRewardHandler` (ReviveRewardHandler.cs)
- `WinRewardedAdWatchedSignal` (WinRewardedAdWatchedSignal.cs)
**enum**
- `Difficulty` (Difficulty.cs)

**Detected DI registrations:**
- `GameStartTracker`
- `ReviveRewardHandler`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Gameplay/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Gameplay/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Gameplay/CHANGELOG.md`
- Namespace: `TheOne.Features.Gameplay.Core.Editor`, `TheOne.Features.Gameplay.Core.DI`, `TheOne.Features.Gameplay.Handlers`, `TheOne.Features.Gameplay.Core.Models.Blueprints`, `TheOne.Features.Gameplay.Core.Models`, `TheOne.Features.Gameplay.Core.Models.Signals`, `TheOne.Features.Gameplay.Core.Services`, `TheOne.Features.Gameplay.Core.Views`
