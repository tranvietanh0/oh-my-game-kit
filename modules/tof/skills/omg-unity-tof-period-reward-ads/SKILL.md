---
name: omg-unity-tof-period-reward-ads
description: "Period Reward Ads feature of TheOneFeature (auto-extracted from code)."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Period Reward Ads

## Purpose
Period Reward Ads module. See code references below.

## Public API
**class**
- `PeriodRewardAdsBlueprint` (PeriodRewardAdsBlueprint.cs)
- `PeriodRewardAdsDataController` (PeriodRewardAdsDataController.cs)
- `PeriodRewardAdsDataHelper` (PeriodRewardAdsDataHelper.cs)
- `PeriodRewardAdsJsonToolModule` (PeriodRewardAdsJsonToolModule.cs)
- `PeriodRewardAdsRecord` (PeriodRewardAdsBlueprint.cs)
- `PeriodRewardAdsRemoteConfig` (PeriodRewardAdsRemoteConfig.cs)
- `PeriodRewardAdsService` (PeriodRewardAdsService.cs)
- `PeriodRewardAdsVContainer` (PeriodRewardAdsVContainer.cs)
- `Validator` (Validator.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Period Reward Ads services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (9):**
**class**
- `PeriodRewardAdsBlueprint` (PeriodRewardAdsBlueprint.cs)
- `PeriodRewardAdsDataController` (PeriodRewardAdsDataController.cs)
- `PeriodRewardAdsDataHelper` (PeriodRewardAdsDataHelper.cs)
- `PeriodRewardAdsJsonToolModule` (PeriodRewardAdsJsonToolModule.cs)
- `PeriodRewardAdsRecord` (PeriodRewardAdsBlueprint.cs)
- `PeriodRewardAdsRemoteConfig` (PeriodRewardAdsRemoteConfig.cs)
- `PeriodRewardAdsService` (PeriodRewardAdsService.cs)
- `PeriodRewardAdsVContainer` (PeriodRewardAdsVContainer.cs)
- `Validator` (Validator.cs)

**Detected DI registrations:**
- `PeriodRewardAdsDataController`
- `PeriodRewardAdsDataHelper`
- `PeriodRewardAdsRemoteConfig`
- `PeriodRewardAdsService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/PeriodRewardAds/`
- Namespace: `TheOne.Features.PeriodRewardAds.Editor`, `Core.Features.PeriodRewardAds.Editor`, `TheOne.Features.PeriodRewardAds.DI`, `TheOne.Features.PeriodRewardAds.Models`, `TheOne.Features.PeriodRewardAds.Services`
