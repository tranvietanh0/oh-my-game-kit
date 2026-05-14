---
name: omg-unity-tof-iap
description: "IAP feature of TheOneFeature — A feature package for In-App Purchase functionality in TheOne framework, providing a standardized interface for managing in-app purchases..."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# IAP

## Purpose
A feature package for In-App Purchase functionality in TheOne framework, providing a standardized interface for managing in-app purchases in Unity mobile games.

## Public API
**class**
- `FeatureIAPService` (FeatureIAPService.cs)
- `FeatureIAPVContainer` (FeatureIAPVContainer.cs)
- `IAPPackageConfig` (IAPPackageConfig.cs)
- `IapPackData` (IapPacksLocalData.cs)
- `IapPackDataService` (IapPackDataService.cs)
- `IapPackSuggestionService` (IapPackSuggestionService.cs)
- `IAPValidator` (IAPValidator.cs)
- `PurchaseIdAttribute` (PurchaseIdAttribute.cs)
- `PurchaseIdDropdownDrawer` (PurchaseIdDropdownDrawer.cs)
- `ShopPackReplaceBlueprint` (ShopPackReplaceBlueprint.cs)
- `ShopPackReplaceRecord` (ShopPackReplaceBlueprint.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
- `ShopPackReplaceBlueprint`

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the IAP services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (11):**
**class**
- `FeatureIAPService` (FeatureIAPService.cs)
- `FeatureIAPVContainer` (FeatureIAPVContainer.cs)
- `IAPPackageConfig` (IAPPackageConfig.cs)
- `IapPackData` (IapPacksLocalData.cs)
- `IapPackDataService` (IapPackDataService.cs)
- `IapPackSuggestionService` (IapPackSuggestionService.cs)
- `IAPValidator` (IAPValidator.cs)
- `PurchaseIdAttribute` (PurchaseIdAttribute.cs)
- `PurchaseIdDropdownDrawer` (PurchaseIdDropdownDrawer.cs)
- `ShopPackReplaceBlueprint` (ShopPackReplaceBlueprint.cs)
- `ShopPackReplaceRecord` (ShopPackReplaceBlueprint.cs)

**Detected DI registrations:**
- `FeatureIAPService`
- `IapPackDataService`
- `IapPackSuggestionService`
- `PurchaseIdAttribute`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas
- Store validation is async; `PurchaseIdAttribute` must be applied to string fields only.
- ShopPackReplaceBlueprint uses record types; edits via editor may drop null fields.

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/IAP/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/IAP/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/IAP/CHANGELOG.md`
- Namespace: `TheOne.Features.IAP.Core`, `TheOne.Features.IAP.Core.DI`, `TheOne.Features.IAP.Core.Models.Blueprints`, `TheOne.Features.IAP.Core.Models`, `TheOne.Features.IAP.Core.Services`
