---
name: omg-unity-tof-wallpaper-collection
description: "Wallpaper Collection feature of TheOneFeature — Complete wallpaper collection system with multi-condition unlock, asset caching, and video support."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Wallpaper Collection

## Purpose
Complete wallpaper collection system with multi-condition unlock, asset caching, and video support.

## Public API
**interface**
- `IAssetProvider` (IAssetProvider.cs)
- `IHomeVideoProvider` (IHomeVideoProvider.cs)
- `IWallpaperCollectionService` (IWallpaperCollectionService.cs)
- `IWallpaperUnlockService` (IWallpaperUnlockService.cs)
**class**
- `IsExternalInit` (IsExternalInit.cs)
- `UnlockTypeVisualGroup` (UnlockTypeVisualGroup.cs)
- `WallpaperBlueprint` (WallpaperBlueprint.cs)
- `WallpaperCategoryBlueprint` (WallpaperCategoryBlueprint.cs)
- `WallpaperCategoryRecord` (WallpaperCategoryBlueprint.cs)
- `WallpaperCharacterBlueprint` (WallpaperCharacterBlueprint.cs)
- `WallpaperCharacterRecord` (WallpaperCharacterBlueprint.cs)
- `WallpaperCollectionDefaultConfig` (WallpaperCollectionDefaultConfig.cs)
- `WallpaperCollectionService` (WallpaperCollectionService.cs)
- `WallpaperCollectionToolModule` (WallpaperCollectionToolModule.cs)
- `WallpaperCollectionUserData` (WallpaperCollectionUserData.cs)
- `WallpaperCollectionUserDataController` (WallpaperCollectionUserDataController.cs)
- `WallpaperCollectionValidator` (WallpaperCollectionValidator.cs)
- `WallpaperCollectionVContainer` (WallpaperCollectionVContainer.cs)
- `WallpaperDownloadService` (WallpaperDownloadService.cs)
- `WallpaperRecord` (WallpaperBlueprint.cs)
- `WallpaperRemoteService` (WallpaperRemoteService.cs)
- `WallpaperSetBlueprint` (WallpaperSetBlueprint.cs)
- `WallpaperSetRecord` (WallpaperSetBlueprint.cs)
- `WallpaperUnlockBlueprint` (WallpaperUnlockBlueprint.cs)
- `WallpaperUnlockService` (WallpaperUnlockService.cs)

## Signals / Events
- `OnWallpaperCacheInvalidatedSignal`
- `OnWallpaperDownloadedSignal`
- `OnWallpaperEquippedSignal`
- `OnWallpaperPendingSignal`
- `OnWallpaperProgressUpdateSignal`
- `OnWallpaperTabChangedSignal`
- `OnWallpaperThumbnailLoadedSignal`
- `OnWallpaperUnlockedSignal`
- `OnWallpaperViewedSignal`

## Config / ScriptableObjects
- `WallpaperCollectionDefaultConfig`

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Wallpaper Collection services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (39):**
**interface**
- `IAssetProvider` (IAssetProvider.cs)
- `IHomeVideoProvider` (IHomeVideoProvider.cs)
- `IWallpaperCollectionService` (IWallpaperCollectionService.cs)
- `IWallpaperUnlockService` (IWallpaperUnlockService.cs)
**class**
- `IsExternalInit` (IsExternalInit.cs)
- `UnlockTypeVisualGroup` (UnlockTypeVisualGroup.cs)
- `WallpaperBlueprint` (WallpaperBlueprint.cs)
- `WallpaperCategoryBlueprint` (WallpaperCategoryBlueprint.cs)
- `WallpaperCategoryRecord` (WallpaperCategoryBlueprint.cs)
- `WallpaperCharacterBlueprint` (WallpaperCharacterBlueprint.cs)
- `WallpaperCharacterRecord` (WallpaperCharacterBlueprint.cs)
- `WallpaperCollectionDefaultConfig` (WallpaperCollectionDefaultConfig.cs)
- `WallpaperCollectionService` (WallpaperCollectionService.cs)
- `WallpaperCollectionToolModule` (WallpaperCollectionToolModule.cs)
- `WallpaperCollectionUserData` (WallpaperCollectionUserData.cs)
- `WallpaperCollectionUserDataController` (WallpaperCollectionUserDataController.cs)
- `WallpaperCollectionValidator` (WallpaperCollectionValidator.cs)
- `WallpaperCollectionVContainer` (WallpaperCollectionVContainer.cs)
- `WallpaperDownloadService` (WallpaperDownloadService.cs)
- `WallpaperRecord` (WallpaperBlueprint.cs)
- `WallpaperRemoteService` (WallpaperRemoteService.cs)
- `WallpaperSetBlueprint` (WallpaperSetBlueprint.cs)
- `WallpaperSetRecord` (WallpaperSetBlueprint.cs)
- `WallpaperUnlockBlueprint` (WallpaperUnlockBlueprint.cs)
- `WallpaperUnlockService` (WallpaperUnlockService.cs)
**struct**
- `OnWallpaperCacheInvalidatedSignal` (WallpaperCollectionSignals.cs)
- `OnWallpaperDownloadedSignal` (WallpaperCollectionSignals.cs)
- `OnWallpaperEquippedSignal` (WallpaperCollectionSignals.cs)
- `OnWallpaperPendingSignal` (WallpaperCollectionSignals.cs)
- `OnWallpaperProgressUpdateSignal` (WallpaperCollectionSignals.cs)
- `OnWallpaperTabChangedSignal` (WallpaperCollectionSignals.cs)
- `OnWallpaperThumbnailLoadedSignal` (WallpaperCollectionSignals.cs)
- `OnWallpaperUnlockedSignal` (WallpaperCollectionSignals.cs)
- `OnWallpaperViewedSignal` (WallpaperCollectionSignals.cs)
**record**
- `UnlockConditionRecord` (WallpaperUnlockBlueprint.cs)
- `WallpaperUnlockRecord` (WallpaperUnlockBlueprint.cs)
**enum**
- `ConditionMode` (WallpaperUnlockBlueprint.cs)
- `HomeVideoMode` (WallpaperCollectionDefaultConfig.cs)
- `UnlockType` (UnlockType.cs)

**Detected DI registrations:**
- `WallpaperCollectionService`
- `WallpaperCollectionUserDataController`
- `WallpaperDownloadService`
- `WallpaperRemoteService`
- `WallpaperUnlockService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WallpaperCollection/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WallpaperCollection/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WallpaperCollection/Scripts/Signals/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WallpaperCollection/AddIWallpaperCollectionService.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WallpaperCollection/BLUEPRINT_DATA.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/WallpaperCollection/INTEGRATION_GUIDE.md`
- Namespace: `TheOne.Features.WallpaperCollection.Core.Editor`, `TheOne.Features.WallpaperCollection.Core.Config`, `TheOne.Features.WallpaperCollection.Core.Controllers`, `TheOne.Features.WallpaperCollection.Core.DI`, `TheOne.Features.WallpaperCollection.Core.Models`, `System.Runtime.CompilerServices`, `TheOne.Features.WallpaperCollection.Core.Services`, `TheOne.Features.WallpaperCollection.Core.Signals`
