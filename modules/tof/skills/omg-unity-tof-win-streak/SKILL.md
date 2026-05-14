---
name: omg-unity-tof-win-streak
description: "Win Streak feature of TheOneFeature — Core implementation of win streak before play core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Win Streak

## Purpose
Core implementation of win streak before play core feature for Unity games

## Public API
**interface**
- `IModifier` (IModifier.cs)
- `IStreakLeaderboardService` (IStreakLeaderboardService.cs)
- `IWinStreakHandler` (IWinStreakHandler.cs)
- `IWinStreakService` (IWinStreakService.cs)
**class**
- `BeforePlayFTUECreatorToolModule` (BeforePlayFTUECreatorWindow.cs)
- `DefaultWinStreakHandler` (DefaultWinStreakHandler.cs)
- `InitStreakFTUEAction` (InitStreakFTUEAction.cs)
- `Modifier` (IModifier.cs)
- `PlayerStreakData` (PlayerStreakData.cs)
- `PvEStreakLeaderboardDataController` (PvEStreakLeaderboardLocalData.cs)
- `PvEStreakLeaderboardEnemyBlueprint` (PvEStreakLeaderboardEnemyBlueprint.cs)
- `PvEStreakLeaderboardEnemyRankRecord` (PvEStreakLeaderboardEnemyBlueprint.cs)
- `PvEStreakLeaderboardEnemyRecord` (PvEStreakLeaderboardEnemyBlueprint.cs)
- `PvEStreakLeaderboardMiscParamBlueprint` (PvEStreakLeaderboardMiscParamBlueprint.cs)
- `PvEStreakLeaderboardService` (PvEStreakLeaderboardService.cs)
- `RangeIntConverter` (PvEStreakLeaderboardEnemyBlueprint.cs)
- `RankStreakBlueprint` (RankStreakBlueprint.cs)
- `RankStreakRecord` (RankStreakBlueprint.cs)
- `ScoreStreakBlueprint` (ScoreStreakBlueprint.cs)
- `ScoreStreakRecord` (ScoreStreakBlueprint.cs)
- `ScriptableObjectExtensions` (ScriptableObjectExtensions.cs)
- `StreakCategoryBlueprint` (StreakCategoryBlueprint.cs)
- `StreakCategoryRecord` (StreakCategoryBlueprint.cs)
- `StreakLeaderboardDataController` (StreakLeaderboardDataController.cs)
- `StreakLeaderboardPvEValidator` (StreakLeaderboardPvEValidator.cs)
- `StreakLeaderboardPvEVContainer` (StreakLeaderboardPvEVContainer.cs)
- `StreakLeaderboardValidator` (StreakLeaderboardValidator.cs)
- `StreakLeaderboardVContainer` (StreakLeaderboardVContainer.cs)
- `StreakTypeBlueprint` (StreakTypeBlueprint.cs)
- `StreakTypeRecord` (StreakTypeBlueprint.cs)
- `WinStreakConstant` (WinStreakConstant.cs)
- `WinStreakCoreValidator` (WinStreakCoreValidator.cs)
- `WinStreakData` (WinStreakData.cs)
- `WinStreakInfoAttribute` (WinStreakInfoAttribute.cs)
- `WinStreakLocalDataController` (WinStreakLocalDataController.cs)
- `WinStreakRewardBlueprint` (WinStreakRewardBlueprint.cs)
- `WinStreakRewardRecord` (WinStreakRewardBlueprint.cs)
- `WinStreakRewardService` (WinStreakRewardService.cs)
- `WinStreakRewardValidator` (WinStreakRewardValidator.cs)
- `WinStreakRewardVContainer` (WinStreakRewardVContainer.cs)
- `WinStreakService` (WinStreakService.cs)
- `WinStreakSuddenDeadAutoPopupInHomeAction` (WinStreakSuddenDeadAutoPopupInHomeAction.cs)
- `WinStreakSuddenDeadConfigBlueprint` (WinStreakSuddenDeadConfigBlueprint.cs)
- `WinStreakSuddenDeadDataController` (WinStreakSuddenDeadDataController.cs)
- `WinStreakSuddenDeadLocalData` (WinStreakSuddenDeadLocalData.cs)
- `WinStreakSuddenDeadProgressBlueprint` (WinStreakSuddenDeadProgressBlueprint.cs)
- `WinStreakSuddenDeadProgressData` (WinStreakSuddenDeadProgressBlueprint.cs)
- `WinStreakSuddenDeadService` (WinStreakSuddenDeadService.cs)
- `WinStreakSuddenDeadValidator` (WinStreakSuddenDeadValidator.cs)
- `WinStreakSuddenDeadVContainer` (WinStreakSuddenDeadVContainer.cs)
- `WinStreakVContainer` (WinStreakVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Win Streak services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (54):**
**interface**
- `IModifier` (IModifier.cs)
- `IStreakLeaderboardService` (IStreakLeaderboardService.cs)
- `IWinStreakHandler` (IWinStreakHandler.cs)
- `IWinStreakService` (IWinStreakService.cs)
**class**
- `BeforePlayFTUECreatorToolModule` (BeforePlayFTUECreatorWindow.cs)
- `DefaultWinStreakHandler` (DefaultWinStreakHandler.cs)
- `InitStreakFTUEAction` (InitStreakFTUEAction.cs)
- `Modifier` (IModifier.cs)
- `PlayerStreakData` (PlayerStreakData.cs)
- `PvEStreakLeaderboardDataController` (PvEStreakLeaderboardLocalData.cs)
- `PvEStreakLeaderboardEnemyBlueprint` (PvEStreakLeaderboardEnemyBlueprint.cs)
- `PvEStreakLeaderboardEnemyRankRecord` (PvEStreakLeaderboardEnemyBlueprint.cs)
- `PvEStreakLeaderboardEnemyRecord` (PvEStreakLeaderboardEnemyBlueprint.cs)
- `PvEStreakLeaderboardMiscParamBlueprint` (PvEStreakLeaderboardMiscParamBlueprint.cs)
- `PvEStreakLeaderboardService` (PvEStreakLeaderboardService.cs)
- `RangeIntConverter` (PvEStreakLeaderboardEnemyBlueprint.cs)
- `RankStreakBlueprint` (RankStreakBlueprint.cs)
- `RankStreakRecord` (RankStreakBlueprint.cs)
- `ScoreStreakBlueprint` (ScoreStreakBlueprint.cs)
- `ScoreStreakRecord` (ScoreStreakBlueprint.cs)
- `ScriptableObjectExtensions` (ScriptableObjectExtensions.cs)
- `StreakCategoryBlueprint` (StreakCategoryBlueprint.cs)
- `StreakCategoryRecord` (StreakCategoryBlueprint.cs)
- `StreakLeaderboardDataController` (StreakLeaderboardDataController.cs)
- `StreakLeaderboardPvEValidator` (StreakLeaderboardPvEValidator.cs)
- `StreakLeaderboardPvEVContainer` (StreakLeaderboardPvEVContainer.cs)
- `StreakLeaderboardValidator` (StreakLeaderboardValidator.cs)
- `StreakLeaderboardVContainer` (StreakLeaderboardVContainer.cs)
- `StreakTypeBlueprint` (StreakTypeBlueprint.cs)
- `StreakTypeRecord` (StreakTypeBlueprint.cs)
- `WinStreakConstant` (WinStreakConstant.cs)
- `WinStreakCoreValidator` (WinStreakCoreValidator.cs)
- `WinStreakData` (WinStreakData.cs)
- `WinStreakInfoAttribute` (WinStreakInfoAttribute.cs)
- `WinStreakLocalDataController` (WinStreakLocalDataController.cs)
- `WinStreakRewardBlueprint` (WinStreakRewardBlueprint.cs)
- `WinStreakRewardRecord` (WinStreakRewardBlueprint.cs)
- `WinStreakRewardService` (WinStreakRewardService.cs)
- `WinStreakRewardValidator` (WinStreakRewardValidator.cs)
- `WinStreakRewardVContainer` (WinStreakRewardVContainer.cs)
- `WinStreakService` (WinStreakService.cs)
- `WinStreakSuddenDeadAutoPopupInHomeAction` (WinStreakSuddenDeadAutoPopupInHomeAction.cs)
- `WinStreakSuddenDeadConfigBlueprint` (WinStreakSuddenDeadConfigBlueprint.cs)
- `WinStreakSuddenDeadDataController` (WinStreakSuddenDeadDataController.cs)
- `WinStreakSuddenDeadLocalData` (WinStreakSuddenDeadLocalData.cs)
- `WinStreakSuddenDeadProgressBlueprint` (WinStreakSuddenDeadProgressBlueprint.cs)
- `WinStreakSuddenDeadProgressData` (WinStreakSuddenDeadProgressBlueprint.cs)
- `WinStreakSuddenDeadService` (WinStreakSuddenDeadService.cs)
- `WinStreakSuddenDeadValidator` (WinStreakSuddenDeadValidator.cs)
- `WinStreakSuddenDeadVContainer` (WinStreakSuddenDeadVContainer.cs)
- `WinStreakVContainer` (WinStreakVContainer.cs)
**struct**
- `RangeInt` (PvEStreakLeaderboardEnemyBlueprint.cs)
**enum**
- `StreakLeaderboardFeatureStatus` (StreakLeaderboardLocalData.cs)
- `StreakSuddenDeadFeatureStatus` (WinStreakSuddenDeadLocalData.cs)

**Detected DI registrations:**
- `DefaultWinStreakHandler`
- `PvEStreakLeaderboardDataController`
- `PvEStreakLeaderboardService`
- `StreakLeaderboardDataController`
- `WinStreakLocalDataController`
- `WinStreakRewardService`
- `WinStreakService`
- `WinStreakSuddenDeadDataController`
- `WinStreakSuddenDeadService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WinStreak/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WinStreak/BeforePlay/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WinStreak/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WinStreak/Leaderboard/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WinStreak/Leaderboard/PvE/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WinStreak/BeforePlay/CHANGELOG.md`
- Namespace: `TheOne.Features.WinStreak.Reward.DI`, `TheOne.Features.WinStreak.BeforePlay.Scripts.Editor`, `TheOne.Features.WinStreak.Reward.Models.Blueprints`, `TheOne.Features.WinStreak.Reward.Services`, `TheOne.Features.WinStreak.Core.Attributes`, `TheOne.Features.WinStreak.Core.Controller`, `TheOne.Features.WinStreak.Core.Default`, `TheOne.Features.WinStreak.Core.DI`, `TheOne.Features.WinStreak.Core.Editor`, `TheOne.Features.WinStreak.Core.FTUE`, `TheOne.Features.WinStreak.Core.Models.Blueprint`, `TheOne.Features.WinStreak.Core.Models.LocalData`, `TheOne.Features.WinStreak.Core.Services`, `TheOne.Features.WinStreak.Leaderboard.Core.Controller`, `TheOne.Features.WinStreak.Leaderboard.Core.DI`, `TheOne.Features.WinStreak.Leaderboard.Core.Editor`, `TheOne.Features.WinStreak.Leaderboard.Core.Models.Blueprint`, `TheOne.Features.WinStreak.Leaderboard.Core.Models.LocalData`, `TheOne.Features.WinStreak.Leaderboard.Core.Services`, `TheOne.Features.WinStreak.Leaderboard.PvE.DI`, `TheOne.Features.WinStreak.Leaderboard.PvE.Editor`, `TheOne.Features.WinStreak.Leaderboard.PvE.Models.Blueprints`, `TheOne.Features.WinStreak.Leaderboard.PvE.Models.LocalData`, `TheOne.Features.WinStreak.Leaderboard.PvE.Service`, `TheOne.Features.WinStreak.SuddenDead.Core.DI`, `TheOne.Features.WinStreak.SuddenDead.Core.Editor`, `TheOne.Features.WinStreak.SuddenDead.Core.Controllers`, `TheOne.Features.WinStreak.SuddenDead.Core.Models`, `TheOne.Features.WinStreak.SuddenDead.Core.Services`
