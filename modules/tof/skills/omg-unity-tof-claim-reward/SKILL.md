---
name: omg-unity-tof-claim-reward
description: "Claim Reward feature of TheOneFeature (auto-extracted from code)."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Claim Reward

## Purpose
Claim Reward module. See code references below.

## Public API
**interface**
- `IClaimRewardHandler` (IClaimRewardHandler.cs)
- `IClaimRewardService` (IClaimRewardService.cs)
- `IRewardEntry` (IRewardEntry.cs)
**class**
- `CardRewardEntry` (CardRewardEntry.cs)
- `ChestRewardEntry` (ChestRewardEntry.cs)
- `ClaimRewardConstants` (ClaimRewardConstants.cs)
- `ClaimRewardCoreValidator` (ClaimRewardCoreValidator.cs)
- `ClaimRewardDataController` (ClaimRewardDataController.cs)
- `ClaimRewardHandlerExtensions` (IClaimRewardHandler.cs)
- `ClaimRewardService` (ClaimRewardService.cs)
- `ClaimRewardUIAction` (ClaimRewardUIAction.cs)
- `ClaimRewardVContainer` (ClaimRewardVContainer.cs)
- `ClaimViewType` (IClaimRewardHandler.cs)
- `DefaultRewardEntry` (DefaultRewardEntry.cs)
- `RewardEntry` (RewardEntry.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Claim Reward services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (15):**
**interface**
- `IClaimRewardHandler` (IClaimRewardHandler.cs)
- `IClaimRewardService` (IClaimRewardService.cs)
- `IRewardEntry` (IRewardEntry.cs)
**class**
- `CardRewardEntry` (CardRewardEntry.cs)
- `ChestRewardEntry` (ChestRewardEntry.cs)
- `ClaimRewardConstants` (ClaimRewardConstants.cs)
- `ClaimRewardCoreValidator` (ClaimRewardCoreValidator.cs)
- `ClaimRewardDataController` (ClaimRewardDataController.cs)
- `ClaimRewardHandlerExtensions` (IClaimRewardHandler.cs)
- `ClaimRewardService` (ClaimRewardService.cs)
- `ClaimRewardUIAction` (ClaimRewardUIAction.cs)
- `ClaimRewardVContainer` (ClaimRewardVContainer.cs)
- `ClaimViewType` (IClaimRewardHandler.cs)
- `DefaultRewardEntry` (DefaultRewardEntry.cs)
- `RewardEntry` (RewardEntry.cs)

**Detected DI registrations:**
- `ClaimRewardDataController`
- `ClaimRewardService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/ClaimReward/`
- Namespace: `TheOne.Features.ClaimReward.Core.Editor`, `TheOne.Features.ClaimReward.Core`, `TheOne.Features.ClaimReward.Core.Controllers`, `TheOne.Features.ClaimReward.Core.DI`, `TheOne.Features.ClaimReward.Core.Handlers`, `TheOne.Features.ClaimReward.Core.Models`, `TheOne.Features.ClaimReward.Core.Services`
