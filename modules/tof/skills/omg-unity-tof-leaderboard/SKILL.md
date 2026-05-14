---
name: omg-unity-tof-leaderboard
description: "Leaderboard feature of TheOneFeature — Core implementation of leaderboard core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Leaderboard

## Purpose
Core implementation of leaderboard core feature for Unity games

## Public API
**interface**
- `ILeaderboardService` (ILeaderboardService.cs)
**class**
- `DummyLeaderboardService` (DummyLeaderboardService.cs)
- `LeaderboardConfig` (LeaderboardConfig.cs)
- `LeaderboardCoreValidator` (LeaderboardCoreValidator.cs)
- `LeaderboardVContainer` (LeaderboardVContainer.cs)
- `PassedLevelsTracker` (PassedLevelsTracker.cs)
- `PassedLevelsTrackerVContainer` (PassedLevelsTrackerVContainer.cs)
- `PlayerLeaderboardEntry` (PlayerLeaderboardEntry.cs)
- `PlayerLeaderboardEntryView` (PlayerLeaderboardEntryView.cs)
- `PositionColorView` (PositionColorView.cs)
- `PositionObjectView` (PositionObjectView.cs)
- `PositionTextView` (PositionTextView.cs)
- `PositionView` (PositionView.cs)
- `ScoreTextView` (ScoreTextView.cs)
- `ScoreView` (ScoreView.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Leaderboard services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (16):**
**interface**
- `ILeaderboardService` (ILeaderboardService.cs)
**class**
- `DummyLeaderboardService` (DummyLeaderboardService.cs)
- `LeaderboardConfig` (LeaderboardConfig.cs)
- `LeaderboardCoreValidator` (LeaderboardCoreValidator.cs)
- `LeaderboardVContainer` (LeaderboardVContainer.cs)
- `PassedLevelsTracker` (PassedLevelsTracker.cs)
- `PassedLevelsTrackerVContainer` (PassedLevelsTrackerVContainer.cs)
- `PlayerLeaderboardEntry` (PlayerLeaderboardEntry.cs)
- `PlayerLeaderboardEntryView` (PlayerLeaderboardEntryView.cs)
- `PositionColorView` (PositionColorView.cs)
- `PositionObjectView` (PositionObjectView.cs)
- `PositionTextView` (PositionTextView.cs)
- `PositionView` (PositionView.cs)
- `ScoreTextView` (ScoreTextView.cs)
- `ScoreView` (ScoreView.cs)
**enum**
- `HighScoreType` (HighScoreType.cs)

**Detected DI registrations:**
- `DummyLeaderboardService`
- `LeaderboardConfig`
- `PassedLevelsTracker`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Leaderboard/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Leaderboard/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Leaderboard/PassedLevelsTracker/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Leaderboard/Core/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Leaderboard/PassedLevelsTracker/CHANGELOG.md`
- Namespace: `TheOne.Features.Leaderboard.Core.DI`, `TheOne.Features.Leaderboard.Core.Models.Configs`, `TheOne.Features.Leaderboard.Core.Models`, `TheOne.Features.Leaderboard.Core.Services`, `TheOne.Features.Leaderboard.Core.Views`, `TheOne.Features.Leaderboard.Core.Views.Score`, `TheOne.Features.Leaderboard.PassedLevelsTracker.DI`, `TheOne.Features.Leaderboard.Editor`, `TheOne.Features.Leaderboard.PassedLevelsTracker.Models.LocalData`, `TheOne.Features.Leaderboard.PassedLevelsTracker.Services`
