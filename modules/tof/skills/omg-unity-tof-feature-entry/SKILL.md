---
name: omg-unity-tof-feature-entry
description: "Feature Entry feature of TheOneFeature — Core implementation of entry core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Feature Entry

## Purpose
Core implementation of entry core feature for Unity games

## Public API
**interface**
- `IFeatureCondition` (IFeatureCondition.cs)
- `IFeatureConditionHandler` (IFeatureCondition.Handler.cs)
- `IFeatureCurrencyTracking` (IFeatureCurrencyTracking.cs)
- `IFeatureEntry` (IFeatureEntry.cs)
- `IFeatureEntryService` (IFeatureEntryService.cs)
- `IFeatureEntryView` (IFeatureEntry.View.cs)
- `IFeatureInitializeHandler` (IFeatureInitializeHandler.cs)
- `IFeatureInitializeService` (IFeatureInitializeService.cs)
- `IFeatureLocation` (FeatureEntryLocationConfig.cs)
**class**
- `BaseFeatureCondition` (IFeatureCondition.cs)
- `BaseFeatureConditionHandler` (IFeatureCondition.Handler.cs)
- `FeatureConditionDropdownAttribute` (FeatureConditionDropdownAttribute.cs)
- `FeatureConditionOptionAttributeDrawer` (FeatureConditionOptionAttributeDrawer.cs)
- `FeatureDropdownAttribute` (FeatureDropdownAttribute.cs)
- `FeatureEntryAsyncExtensions` (FeatureEntryAsyncExtensions.cs)
- `FeatureEntryConfig` (FeatureEntryConfig.cs)
- `FeatureEntryConfigConvert` (FeatureEntryConfig.Convert.cs)
- `FeatureEntryConfigToolModule` (FeatureEntryConfigToolModule.cs)
- `FeatureEntryDataController` (FeatureEntryDataController.cs)
- `FeatureEntryDefaultConfig` (FeatureEntryDefaultConfig.cs)
- `FeatureEntryFTUECondition` (FeatureEntryFTUECondition.cs)
- `FeatureEntryLocationConfig` (FeatureEntryLocationConfig.cs)
- `FeatureEntryLocationConfigToolModule` (FeatureEntryLocationConfigToolModule.cs)
- `FeatureEntryPresenterExtensions` (IFeatureEntry.cs)
- `FeatureEntryService` (FeatureEntryService.cs)
- `FeatureEntryUnlockModel` (FeatureEntryUnlockService.cs)
- `FeatureEntryUnlockService` (FeatureEntryUnlockService.cs)
- `FeatureEntryValidator` (FeatureEntryValidator.cs)
- `FeatureEntryVContainer` (FeatureEntryVContainer.cs)
- `FeatureInitializeService` (FeatureInitializeService.cs)
- `FeatureLocation` (FeatureEntryLocationConfig.cs)
- `FeatureManagerVContainer` (FeatureManagerVContainer.cs)
- `FeatureOptionAttributeDrawer` (FeatureOptionAttributeDrawer.cs)
- `TypeDropdownAttribute` (TypeDropdownAttribute.cs)
- `TypeDropdownAttributeDrawer` (TypeDropdownAttributeDrawer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
- `FeatureEntryDefaultConfig`
- `FeatureEntryLocationConfig`
- `FeatureLocation`

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Feature Entry services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (35):**
**interface**
- `IFeatureCondition` (IFeatureCondition.cs)
- `IFeatureConditionHandler` (IFeatureCondition.Handler.cs)
- `IFeatureCurrencyTracking` (IFeatureCurrencyTracking.cs)
- `IFeatureEntry` (IFeatureEntry.cs)
- `IFeatureEntryService` (IFeatureEntryService.cs)
- `IFeatureEntryView` (IFeatureEntry.View.cs)
- `IFeatureInitializeHandler` (IFeatureInitializeHandler.cs)
- `IFeatureInitializeService` (IFeatureInitializeService.cs)
- `IFeatureLocation` (FeatureEntryLocationConfig.cs)
**class**
- `BaseFeatureCondition` (IFeatureCondition.cs)
- `BaseFeatureConditionHandler` (IFeatureCondition.Handler.cs)
- `FeatureConditionDropdownAttribute` (FeatureConditionDropdownAttribute.cs)
- `FeatureConditionOptionAttributeDrawer` (FeatureConditionOptionAttributeDrawer.cs)
- `FeatureDropdownAttribute` (FeatureDropdownAttribute.cs)
- `FeatureEntryAsyncExtensions` (FeatureEntryAsyncExtensions.cs)
- `FeatureEntryConfig` (FeatureEntryConfig.cs)
- `FeatureEntryConfigConvert` (FeatureEntryConfig.Convert.cs)
- `FeatureEntryConfigToolModule` (FeatureEntryConfigToolModule.cs)
- `FeatureEntryDataController` (FeatureEntryDataController.cs)
- `FeatureEntryDefaultConfig` (FeatureEntryDefaultConfig.cs)
- `FeatureEntryFTUECondition` (FeatureEntryFTUECondition.cs)
- `FeatureEntryLocationConfig` (FeatureEntryLocationConfig.cs)
- `FeatureEntryLocationConfigToolModule` (FeatureEntryLocationConfigToolModule.cs)
- `FeatureEntryPresenterExtensions` (IFeatureEntry.cs)
- `FeatureEntryService` (FeatureEntryService.cs)
- `FeatureEntryUnlockModel` (FeatureEntryUnlockService.cs)
- `FeatureEntryUnlockService` (FeatureEntryUnlockService.cs)
- `FeatureEntryValidator` (FeatureEntryValidator.cs)
- `FeatureEntryVContainer` (FeatureEntryVContainer.cs)
- `FeatureInitializeService` (FeatureInitializeService.cs)
- `FeatureLocation` (FeatureEntryLocationConfig.cs)
- `FeatureManagerVContainer` (FeatureManagerVContainer.cs)
- `FeatureOptionAttributeDrawer` (FeatureOptionAttributeDrawer.cs)
- `TypeDropdownAttribute` (TypeDropdownAttribute.cs)
- `TypeDropdownAttributeDrawer` (TypeDropdownAttributeDrawer.cs)

**Detected DI registrations:**
- `FeatureConditionDropdownAttribute`
- `FeatureDropdownAttribute`
- `FeatureEntryDataController`
- `FeatureEntryService`
- `FeatureEntryUnlockService`
- `FeatureInitializeService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FeatureEntry/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FeatureEntry/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FeatureEntry/Core/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FeatureEntry/Default/CHANGELOG.md`
- Namespace: `TheOne.Features.FeatureEntry.Core.Editor`, `TheOne.Features.FeatureEntry.Core`, `TheOne.Features.FeatureEntry.Core.DI`, `TheOne.Features.FeatureEntry.Core.Entry`, `TheOneFeature.Core.Features.FeatureEntry.Scripts.FTUE`, `TheOne.Features.FeatureEntry.Core.LocalData`, `TheOne.Features.FeatureEntry.Core.Models.Conditions`, `TheOne.Features.FeatureEntry.Core.Models`, `TheOne.Features.FeatureEntry.Core.Services`, `TheOne.Features.FeatureEntry.Default.DI`, `TheOne.Features.FeatureEntry.Default`
