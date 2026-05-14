---
name: omg-unity-tof-battle-pass
description: "Battle Pass feature of TheOneFeature — Core implementation of battlepass core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Battle Pass

## Purpose
Core implementation of battlepass core feature for Unity games

## Public API
**interface**
- `IBattlePassPointProvider` (IBattlePassPointProvider.cs)
**class**
- `BattlePassBlueprint` (BattlePassBlueprint.cs)
- `BattlePassCheatButton` (BattlePassCheatButton.cs)
- `BattlePassFinalChestBlueprint` (BattlePassFinalChestBlueprint.cs)
- `BattlePassFinalChestService` (BattlePassFinalChestService.cs)
- `BattlePassFinalChestVContainer` (BattlePassFinalChestVContainer.cs)
- `BattlePassFrameRewardHandler` (BattlePassFrameRewardHandler.cs)
- `BattlePassResetButton` (BattlePassResetButton.cs)
- `BattlePassRewardHandlerVContainer` (BattlePassRewardHandlerVContainer.cs)
- `BattlePassService` (BattlePassService.cs)
- `BattlePassTemporaryMaxLivesRewardHandler` (BattlePassTemporaryMaxLivesRewardHandler.cs)
- `BattlePassValidator` (BattlePassValidator.cs)
- `BattlePassVContainer` (BattlePassVContainer.cs)
- `EventData` (BattlePassLocalData.cs)
- `EventNameView` (EventNameView.cs)
- `EventRecord` (BattlePassBlueprint.cs)
- `FinalChestValidator` (FinalChestValidator.cs)
- `LevelRecord` (BattlePassBlueprint.cs)
- `PremiumPassRewardHandler` (PremiumPassRewardHandler.cs)
- `RemainingTimeView` (RemainingTimeView.cs)
- `RewardHandlersValidator` (RewardHandlersValidator.cs)
- `RewardRecord` (BattlePassBlueprint.cs)
- `RewardStateObjectsView` (RewardStateObjectsView.cs)
- `RewardTypeRecord` (BattlePassBlueprint.cs)
- `SkipLevelRewardHandler` (SkipLevelRewardHandler.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Battle Pass services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (27):**
**interface**
- `IBattlePassPointProvider` (IBattlePassPointProvider.cs)
**class**
- `BattlePassBlueprint` (BattlePassBlueprint.cs)
- `BattlePassCheatButton` (BattlePassCheatButton.cs)
- `BattlePassFinalChestBlueprint` (BattlePassFinalChestBlueprint.cs)
- `BattlePassFinalChestService` (BattlePassFinalChestService.cs)
- `BattlePassFinalChestVContainer` (BattlePassFinalChestVContainer.cs)
- `BattlePassFrameRewardHandler` (BattlePassFrameRewardHandler.cs)
- `BattlePassResetButton` (BattlePassResetButton.cs)
- `BattlePassRewardHandlerVContainer` (BattlePassRewardHandlerVContainer.cs)
- `BattlePassService` (BattlePassService.cs)
- `BattlePassTemporaryMaxLivesRewardHandler` (BattlePassTemporaryMaxLivesRewardHandler.cs)
- `BattlePassValidator` (BattlePassValidator.cs)
- `BattlePassVContainer` (BattlePassVContainer.cs)
- `EventData` (BattlePassLocalData.cs)
- `EventNameView` (EventNameView.cs)
- `EventRecord` (BattlePassBlueprint.cs)
- `FinalChestValidator` (FinalChestValidator.cs)
- `LevelRecord` (BattlePassBlueprint.cs)
- `PremiumPassRewardHandler` (PremiumPassRewardHandler.cs)
- `RemainingTimeView` (RemainingTimeView.cs)
- `RewardHandlersValidator` (RewardHandlersValidator.cs)
- `RewardRecord` (BattlePassBlueprint.cs)
- `RewardStateObjectsView` (RewardStateObjectsView.cs)
- `RewardTypeRecord` (BattlePassBlueprint.cs)
- `SkipLevelRewardHandler` (SkipLevelRewardHandler.cs)
**enum**
- `RewardState` (RewardState.cs)
- `RewardType` (RewardType.cs)

**Detected DI registrations:**
- `BattlePassFinalChestService`
- `BattlePassFrameRewardHandler`
- `BattlePassService`
- `BattlePassTemporaryMaxLivesRewardHandler`
- `PremiumPassRewardHandler`
- `SkipLevelRewardHandler`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/BattlePass/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/BattlePass/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/BattlePass/FinalChest/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/BattlePass/RewardHandlers/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/BattlePass/Core/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/BattlePass/FinalChest/CHANGELOG.md`
- Namespace: `TheOne.Features.BattlePass.Core.DI`, `TheOne.Features.BattlePass.Core.Editor`, `TheOne.Features.BattlePass.Core.Models`, `TheOne.Features.BattlePass.Core.Services`, `TheOne.Features.BattlePass.Core.Views`, `TheOne.Features.BattlePass.FinalChest.Editor`, `TheOne.Features.BattlePass.FinalChest.DI`, `TheOne.Features.BattlePass.FinalChest.Models`, `TheOne.Features.BattlePass.FinalChest.Services`, `TheOne.Features.BattlePass.RewardHandler.Core`, `TheOne.Features.BattlePass.RewardHandler.DI`
