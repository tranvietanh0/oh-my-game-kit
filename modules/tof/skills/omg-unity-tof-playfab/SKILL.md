---
name: omg-unity-tof-playfab
description: "Playfab feature of TheOneFeature — Core implementation of playfab core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Playfab

## Purpose
Core implementation of playfab core feature for Unity games

## Public API
**interface**
- `IExpirable` (IExpirable.cs)
- `IPlayFabCleanup` (EntryPoint.cs)
- `IPlayFabInitialize` (EntryPoint.cs)
- `IPlayFabLoginPostProcess` (EntryPoint.cs)
- `IPlayFabLoginProcess` (EntryPoint.cs)
- `IPlayFabLogout` (EntryPoint.cs)
**class**
- `CacheDataService` (CacheDataService.cs)
- `CloudScriptService` (CloudScriptService.cs)
- `CloudScriptVersion` (CloudScriptVersion.cs)
- `EditorGUIUtils` (EditorGUIUtils.cs)
- `Expirable` (Expirable.cs)
- `FileScanner` (FileScanner.cs)
- `FirebaseTokenProvider` (FirebaseTokenProvider.cs)
- `PermissionStatement` (PolicyService.cs)
- `PlayFabApiClient` (PlayFabApiClient.cs)
- `PlayFabAppleAuthMethod` (PlayFabAppleAuthMethod.cs)
- `PlayFabCloudSaveHandler` (PlayFabCloudSaveHandler.cs)
- `PlayFabCloudScriptHandler` (PlayFabCloudScriptHandler.cs)
- `PlayFabConfig` (PlayFabConfig.cs)
- `PlayFabCustomIdAuthMethod` (PlayFabCustomIdAuthMethod.cs)
- `PlayFabDeploymentTool` (PlayFabDeploymentTool.cs)
- `PlayFabExternalAvatarService` (PlayFabExternalAvatarService.cs)
- `PlayFabFacebookAuthMethod` (PlayFabFacebookAuthMethod.cs)
- `PlayFabFileStorageService` (PlayFabFileStorageService.cs)
- `PlayFabFirebaseAuthBridge` (PlayFabFirebaseAuthBridge.cs)
- `PlayFabFirebaseAuthBridgeValidator` (PlayFabFirebaseAuthBridgeValidator.cs)
- `PlayFabFirebaseAuthBridgeVContainer` (PlayFabFirebaseAuthBridgeVContainer.cs)
- `PlayFabGoogleAuthMethod` (PlayFabGoogleAuthMethod.cs)
- `PlayFabHelper` (PlayFabHelper.cs)
- `PlayFabLeaderboardService` (PlayFabLeaderboardService.cs)
- `PlayFabProfileRepository` (PlayFabProfileRepository.cs)
- `PlayFabProvider` (PlayFabProvider.cs)
- `PlayFabUtils` (PlayFabUtils.cs)
- `PlayFabValidator` (PlayFabValidator.cs)
- `PlayFabVContainer` (PlayFabVContainer.cs)
- `PlayFabWrapper` (PlayFabWrapper.cs)
- `PolicyFile` (PolicyService.cs)
- `PolicyService` (PolicyService.cs)
- `ScriptFile` (CloudScriptService.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Playfab services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (40):**
**interface**
- `IExpirable` (IExpirable.cs)
- `IPlayFabCleanup` (EntryPoint.cs)
- `IPlayFabInitialize` (EntryPoint.cs)
- `IPlayFabLoginPostProcess` (EntryPoint.cs)
- `IPlayFabLoginProcess` (EntryPoint.cs)
- `IPlayFabLogout` (EntryPoint.cs)
**class**
- `CacheDataService` (CacheDataService.cs)
- `CloudScriptService` (CloudScriptService.cs)
- `CloudScriptVersion` (CloudScriptVersion.cs)
- `EditorGUIUtils` (EditorGUIUtils.cs)
- `Expirable` (Expirable.cs)
- `FileScanner` (FileScanner.cs)
- `FirebaseTokenProvider` (FirebaseTokenProvider.cs)
- `PermissionStatement` (PolicyService.cs)
- `PlayFabApiClient` (PlayFabApiClient.cs)
- `PlayFabAppleAuthMethod` (PlayFabAppleAuthMethod.cs)
- `PlayFabCloudSaveHandler` (PlayFabCloudSaveHandler.cs)
- `PlayFabCloudScriptHandler` (PlayFabCloudScriptHandler.cs)
- `PlayFabConfig` (PlayFabConfig.cs)
- `PlayFabCustomIdAuthMethod` (PlayFabCustomIdAuthMethod.cs)
- `PlayFabDeploymentTool` (PlayFabDeploymentTool.cs)
- `PlayFabExternalAvatarService` (PlayFabExternalAvatarService.cs)
- `PlayFabFacebookAuthMethod` (PlayFabFacebookAuthMethod.cs)
- `PlayFabFileStorageService` (PlayFabFileStorageService.cs)
- `PlayFabFirebaseAuthBridge` (PlayFabFirebaseAuthBridge.cs)
- `PlayFabFirebaseAuthBridgeValidator` (PlayFabFirebaseAuthBridgeValidator.cs)
- `PlayFabFirebaseAuthBridgeVContainer` (PlayFabFirebaseAuthBridgeVContainer.cs)
- `PlayFabGoogleAuthMethod` (PlayFabGoogleAuthMethod.cs)
- `PlayFabHelper` (PlayFabHelper.cs)
- `PlayFabLeaderboardService` (PlayFabLeaderboardService.cs)
- `PlayFabProfileRepository` (PlayFabProfileRepository.cs)
- `PlayFabProvider` (PlayFabProvider.cs)
- `PlayFabUtils` (PlayFabUtils.cs)
- `PlayFabValidator` (PlayFabValidator.cs)
- `PlayFabVContainer` (PlayFabVContainer.cs)
- `PlayFabWrapper` (PlayFabWrapper.cs)
- `PolicyFile` (PolicyService.cs)
- `PolicyService` (PolicyService.cs)
- `ScriptFile` (CloudScriptService.cs)
**enum**
- `RevisionOption` (CloudScriptVersion.cs)

**Detected DI registrations:**
- `CacheDataService`
- `FirebaseTokenProvider`
- `LeaderboardConfig`
- `PlayFabCloudScriptHandler`
- `PlayFabConfig`
- `PlayFabExternalAvatarService`
- `PlayFabFileStorageService`
- `PlayFabFirebaseAuthBridge`
- `PlayFabLeaderboardService`
- `PlayFabUtils`
- `PlayFabWrapper`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Playfab/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Playfab/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Playfab/FirebaseAuthBridge/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Playfab/Core/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Playfab/FirebaseAuthBridge/CHANGELOG.md`
- Namespace: `TheOne.Features.PlayFab.Editor`, `TheOneFeature.Core.Features.PlayFab.Editor`, `TheOne.Features.PlayFab.Editor.Services`, `TheOne.Features.PlayFab.Core.DI`, `TheOne.Features.PlayFab.Core.Models.Configs`, `TheOne.Features.PlayFab.Core`, `TheOne.Features.Profile.Core.Services`, `TheOne.Features.PlayFab.FirebaseAuthBridge.DI`, `TheOne.Features.PlayFab.FirebaseAuthBridge.Editor`, `TheOne.Features.PlayFab.FirebaseAuthBridge`
