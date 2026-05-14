---
name: omg-unity-tof-sexy-card-shop
description: "Sexy Card Shop feature of TheOneFeature — SexyCardShop is a gacha-style card collection system that allows players to purchase card packs using in-game currency or watching ads. C..."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Sexy Card Shop

## Purpose
SexyCardShop is a gacha-style card collection system that allows players to purchase card packs using in-game currency or watching ads. Cards are wallpapers that get unlocked in the player's collection. The feature supports one-time free pulls per pack and integrates seamlessly with the WallpaperCollection system.

## Public API
**class**
- `SexyCardPackBlueprint` (SexyCardPackBlueprint.cs)
- `SexyCardPackRecord` (SexyCardPackBlueprint.cs)
- `SexyCardShopLocalDataController` (SexyCardShopLocalDataController.cs)
- `SexyCardShopService` (SexyCardShopService.cs)
- `SexyCardShopValidator` (SexyCardShopValidator.cs)
- `SexyCardShopVContainer` (SexyCardShopVContainer.cs)
- `SuccessOpenSexyCardCondition` (SuccessOpenSexyCardCondition.cs)
- `SuccessPurchaseCardSignal` (SuccessPurchaseCardSignal.cs)

## Signals / Events
- `SuccessPurchaseCardSignal`

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Sexy Card Shop services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (9):**
**class**
- `SexyCardPackBlueprint` (SexyCardPackBlueprint.cs)
- `SexyCardPackRecord` (SexyCardPackBlueprint.cs)
- `SexyCardShopLocalDataController` (SexyCardShopLocalDataController.cs)
- `SexyCardShopService` (SexyCardShopService.cs)
- `SexyCardShopValidator` (SexyCardShopValidator.cs)
- `SexyCardShopVContainer` (SexyCardShopVContainer.cs)
- `SuccessOpenSexyCardCondition` (SuccessOpenSexyCardCondition.cs)
- `SuccessPurchaseCardSignal` (SuccessPurchaseCardSignal.cs)
**enum**
- `PurchaseType` (SexyCardPackBlueprint.cs)

**Detected DI registrations:**
- `SexyCardShopLocalDataController`
- `SexyCardShopService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/SexyCardShop/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/SexyCardShop/SexyCardShop.md`
- Namespace: `TheOneFeature.Core.Features.SexyCardShop.Editor`, `TheOne.Features.SexyCardShop.Core.Conditions`, `TheOneFeature.Core.Features.SexyCardShop.Scripts.DI`, `TheOne.Features.SexyCardShop.Core.Blueprints`, `TheOne.Features.SexyCardShop.Core.Models.LocalData`, `TheOne.Features.SexyCardShop.Core.Models.Signals`, `TheOneFeature.Core.Features.SexyCardShop.Scripts.Services`
