---
name: omg-unity-tof-lives
description: "Lives feature of TheOneFeature — A feature package for TheOne framework"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Lives

## Purpose
Manages player lives with regen timers, infinite-lives grants, and a friend-help gifting flow via `LivesService` and `LivesHelpService`.

## Public API
**interface**
- `ILivesHelpDataSyncService` (ILivesHelpDataSyncService.cs)
**class**
- `Config` (InitialInfiniteLivesService.cs)
- `InfiniteLivesRewardHandler` (InfiniteLivesRewardHandler.cs)
- `InitialInfiniteLivesService` (InitialInfiniteLivesService.cs)
- `InitialInfiniteLivesValidator` (InitialInfiniteLivesValidator.cs)
- `InitialInfiniteLivesVContainer` (InitialInfiniteLivesVContainer.cs)
- `LivesHelpBlueprint` (LivesHelpBlueprint.cs)
- `LivesHelpService` (LivesHelpService.cs)
- `LivesHelpVContainer` (LivesHelpVContainer.cs)
- `LivesRewardHandler` (LivesRewardHandler.cs)
- `LivesService` (LivesService.cs)
- `LivesValidator` (LivesValidator.cs)
- `LivesVContainer` (LivesVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Lives services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (13):**
**interface**
- `ILivesHelpDataSyncService` (ILivesHelpDataSyncService.cs)
**class**
- `Config` (InitialInfiniteLivesService.cs)
- `InfiniteLivesRewardHandler` (InfiniteLivesRewardHandler.cs)
- `InitialInfiniteLivesService` (InitialInfiniteLivesService.cs)
- `InitialInfiniteLivesValidator` (InitialInfiniteLivesValidator.cs)
- `InitialInfiniteLivesVContainer` (InitialInfiniteLivesVContainer.cs)
- `LivesHelpBlueprint` (LivesHelpBlueprint.cs)
- `LivesHelpService` (LivesHelpService.cs)
- `LivesHelpVContainer` (LivesHelpVContainer.cs)
- `LivesRewardHandler` (LivesRewardHandler.cs)
- `LivesService` (LivesService.cs)
- `LivesValidator` (LivesValidator.cs)
- `LivesVContainer` (LivesVContainer.cs)

**Detected DI registrations:**
- `InfiniteLivesRewardHandler`
- `InitialInfiniteLivesService`
- `InitialInfiniteLivesService.Config`
- `LivesHelpService`
- `LivesRewardHandler`
- `LivesService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Lives/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Lives/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Lives/Help/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Lives/InitialInfiniteLives/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Lives/Core/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Lives/Help/CHANGELOG.md`
- Namespace: `TheOne.Features.Lives.Core.Editor`, `TheOne.Features.Lives.Core.DI`, `TheOne.Features.Lives.Core.Models`, `System.Runtime.CompilerServices`, `TheOne.Features.Lives.Core.Services`, `TheOne.Features.Lives.Help.Editor`, `TheOne.Features.Lives.Help.DI`, `TheOne.Features.Lives.Help.Models`, `TheOne.Features.Lives.Help.Services`, `TheOne.Features.Lives.Core.Services.Editor`, `TheOne.Features.Lives.InitialInfiniteLives.DI`, `TheOne.Features.Lives.InitialInfiniteLives`
