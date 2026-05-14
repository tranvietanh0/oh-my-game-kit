---
name: omg-unity-tof-firebase
description: "Firebase feature of TheOneFeature — Firebase Authentication service providing sign-in methods and user management."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Firebase

## Purpose
Firebase Authentication service providing sign-in methods and user management.

## Public API
**interface**
- `ICloudFunctionsService` (ICloudFunctionsService.cs)
- `IConverter` (IConverter.cs)
- `IFirebaseAuthService` (IFirebaseAuthService.cs)
- `IFirebaseDisposable` (IFirebaseDisposable.cs)
- `IFirebaseInitializable` (IFirebaseInitializable.cs)
- `IFirestoreProvider` (IFirestoreProvider.cs)
- `IPlayerData` (IPlayerData.cs)
**class**
- `AuthStateChangedEventArgs` (IFirebaseAuthService.cs)
- `ChangeMemberRoleMessageConverter` (ChangeMemberRoleMessageConverter.cs)
- `CloudFunctionDataResponse` (CloudFunctionModels.cs)
- `CloudFunctionException` (ICloudFunctionsService.cs)
- `CloudFunctionNames` (CloudFunctionModels.cs)
- `CloudFunctionResult` (ICloudFunctionsService.cs)
- `CloudFunctionsConfig` (CloudFunctionsConfig.cs)
- `CloudFunctionsValidator` (CloudFunctionsValidator.cs)
- `CloudFunctionsVContainer` (CloudFunctionsVContainer.cs)
- `CollectionHandler` (CollectionHandler.cs)
- `CollectionParam` (CollectionParam.cs)
- `DeleteGuildNotifyConverter` (DeleteGuildNotifyConverter.cs)
- `DocumentParam` (CollectionParam.cs)
- `DocumentSerializer` (DocumentSerializer.cs)
- `FirebaseAuthResult` (IFirebaseAuthService.cs)
- `FirebaseAuthService` (FirebaseAuthService.cs)
- `FirebaseAuthValidator` (FirebaseAuthValidator.cs)
- `FirebaseAuthVContainer` (FirebaseAuthVContainer.cs)
- `FirebaseCoreValidator` (FirebaseCoreValidator.cs)
- `FirebaseCoreVContainer` (FirebaseCoreVContainer.cs)
- `FirebaseInitializationException` (FirebaseInitializer.cs)
- `FirebaseInitializer` (FirebaseInitializer.cs)
- `FirestoreConfig` (FirestoreTaskExtensions.cs)
- `FirestoreCoreValidator` (FirestoreCoreValidator.cs)
- `FirestoreCoreVContainer` (FirestoreCoreVContainer.cs)
- `FirestoreGuildValidator` (FirestoreGuildValidator.cs)
- `FirestoreGuildVContainer` (FirestoreGuildVContainer.cs)
- `FirestoreListenerExtensions` (FirestoreListenerExtensions.cs)
- `FirestoreLivesHelpValidator` (FirestoreLivesHelpValidator.cs)
- `FirestoreLivesHelpVContainer` (FirestoreLivesHelpVContainer.cs)
- `FirestoreOperationException` (FirestoreTaskExtensions.cs)
- `FirestoreParam` (FirestoreParam.cs)
- `FirestorePlayerValidator` (FirestorePlayerValidator.cs)
- `FirestorePlayerVContainer` (FirestorePlayerVContainer.cs)
- `FirestoreProvider` (FirestoreProvider.cs)
- `FirestoreTaskExtensions` (FirestoreTaskExtensions.cs)
- `FirestoreTimeoutException` (FirestoreTaskExtensions.cs)
- `FirestoreWrapper` (FirestoreWrapper.cs)
- `GetFirebaseTokenRequest` (CloudFunctionModels.cs)
- `GetFirebaseTokenResponse` (CloudFunctionModels.cs)
- `GuidProfileConverter` (GuidProfileConverter.cs)
- `GuildChatService` (GuildChatService.cs)
- `GuildDocument` (GuildDocument.cs)
- `GuildPlayerData` (GuildPlayerData.cs)
- `GuildPlayerDataConverter` (GuildPlayerDataConverter.cs)
- `GuildService` (GuildService.cs)
- `HttpCloudFunctionsService` (HttpCloudFunctionsService.cs)
- `JoinRequest` (GuildPlayerData.cs)
- `JoinRequestMessageConverter` (JoinRequestMessageConverter.cs)
- `JoinResponseMessageConverter` (JoinResponseMessageConverter.cs)
- `KickMemberMessageConverter` (KickMemberMessageConverter.cs)
- `LivesHelpDataSyncService` (LivesHelpDataSyncService.cs)
- `LivesHelpMessageConverter` (LivesHelpMessageConverter.cs)
- `LivesPlayerData` (LivesPlayerData.cs)
- `LivesPlayerDataConverter` (LivesPlayerDataConverter.cs)
- `MemberEntryConverter` (MemberEntryConverter.cs)
- `MemberJoinedMessageConverter` (MemberJoinedMessageConverter.cs)
- `MemberLeftMessageConverter` (MemberLeftMessageConverter.cs)
- `MessageConverter` (MessageConverter.cs)
- `NetworkDebugConfig` (NetworkDebugConfig.cs)
- `NetworkRetryableTask` (FirestoreTaskExtensions.cs)
- `PlayerDataManager` (PlayerDataManager.cs)
- `PlayerProfile` (PlayerProfile.cs)
- `PlayerProfileConverter` (PlayerProfileConverter.cs)
- `SdkCloudFunctionsService` (SdkCloudFunctionsService.cs)
- `StickerMessageConverter` (StickerMessageConverter.cs)
- `TextMessageConverter` (TextMessageConverter.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
- `CloudFunctionsConfig`

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Firebase services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (74):**
**interface**
- `ICloudFunctionsService` (ICloudFunctionsService.cs)
- `IConverter` (IConverter.cs)
- `IFirebaseAuthService` (IFirebaseAuthService.cs)
- `IFirebaseDisposable` (IFirebaseDisposable.cs)
- `IFirebaseInitializable` (IFirebaseInitializable.cs)
- `IFirestoreProvider` (IFirestoreProvider.cs)
- `IPlayerData` (IPlayerData.cs)
**class**
- `AuthStateChangedEventArgs` (IFirebaseAuthService.cs)
- `ChangeMemberRoleMessageConverter` (ChangeMemberRoleMessageConverter.cs)
- `CloudFunctionDataResponse` (CloudFunctionModels.cs)
- `CloudFunctionException` (ICloudFunctionsService.cs)
- `CloudFunctionNames` (CloudFunctionModels.cs)
- `CloudFunctionResult` (ICloudFunctionsService.cs)
- `CloudFunctionsConfig` (CloudFunctionsConfig.cs)
- `CloudFunctionsValidator` (CloudFunctionsValidator.cs)
- `CloudFunctionsVContainer` (CloudFunctionsVContainer.cs)
- `CollectionHandler` (CollectionHandler.cs)
- `CollectionParam` (CollectionParam.cs)
- `DeleteGuildNotifyConverter` (DeleteGuildNotifyConverter.cs)
- `DocumentParam` (CollectionParam.cs)
- `DocumentSerializer` (DocumentSerializer.cs)
- `FirebaseAuthResult` (IFirebaseAuthService.cs)
- `FirebaseAuthService` (FirebaseAuthService.cs)
- `FirebaseAuthValidator` (FirebaseAuthValidator.cs)
- `FirebaseAuthVContainer` (FirebaseAuthVContainer.cs)
- `FirebaseCoreValidator` (FirebaseCoreValidator.cs)
- `FirebaseCoreVContainer` (FirebaseCoreVContainer.cs)
- `FirebaseInitializationException` (FirebaseInitializer.cs)
- `FirebaseInitializer` (FirebaseInitializer.cs)
- `FirestoreConfig` (FirestoreTaskExtensions.cs)
- `FirestoreCoreValidator` (FirestoreCoreValidator.cs)
- `FirestoreCoreVContainer` (FirestoreCoreVContainer.cs)
- `FirestoreGuildValidator` (FirestoreGuildValidator.cs)
- `FirestoreGuildVContainer` (FirestoreGuildVContainer.cs)
- `FirestoreListenerExtensions` (FirestoreListenerExtensions.cs)
- `FirestoreLivesHelpValidator` (FirestoreLivesHelpValidator.cs)
- `FirestoreLivesHelpVContainer` (FirestoreLivesHelpVContainer.cs)
- `FirestoreOperationException` (FirestoreTaskExtensions.cs)
- `FirestoreParam` (FirestoreParam.cs)
- `FirestorePlayerValidator` (FirestorePlayerValidator.cs)
- `FirestorePlayerVContainer` (FirestorePlayerVContainer.cs)
- `FirestoreProvider` (FirestoreProvider.cs)
- `FirestoreTaskExtensions` (FirestoreTaskExtensions.cs)
- `FirestoreTimeoutException` (FirestoreTaskExtensions.cs)
- `FirestoreWrapper` (FirestoreWrapper.cs)
- `GetFirebaseTokenRequest` (CloudFunctionModels.cs)
- `GetFirebaseTokenResponse` (CloudFunctionModels.cs)
- `GuidProfileConverter` (GuidProfileConverter.cs)
- `GuildChatService` (GuildChatService.cs)
- `GuildDocument` (GuildDocument.cs)
- `GuildPlayerData` (GuildPlayerData.cs)
- `GuildPlayerDataConverter` (GuildPlayerDataConverter.cs)
- `GuildService` (GuildService.cs)
- `HttpCloudFunctionsService` (HttpCloudFunctionsService.cs)
- `JoinRequest` (GuildPlayerData.cs)
- `JoinRequestMessageConverter` (JoinRequestMessageConverter.cs)
- `JoinResponseMessageConverter` (JoinResponseMessageConverter.cs)
- `KickMemberMessageConverter` (KickMemberMessageConverter.cs)
- `LivesHelpDataSyncService` (LivesHelpDataSyncService.cs)
- `LivesHelpMessageConverter` (LivesHelpMessageConverter.cs)
- `LivesPlayerData` (LivesPlayerData.cs)
- `LivesPlayerDataConverter` (LivesPlayerDataConverter.cs)
- `MemberEntryConverter` (MemberEntryConverter.cs)
- `MemberJoinedMessageConverter` (MemberJoinedMessageConverter.cs)
- `MemberLeftMessageConverter` (MemberLeftMessageConverter.cs)
- `MessageConverter` (MessageConverter.cs)
- `NetworkDebugConfig` (NetworkDebugConfig.cs)
- `NetworkRetryableTask` (FirestoreTaskExtensions.cs)
- `PlayerDataManager` (PlayerDataManager.cs)
- `PlayerProfile` (PlayerProfile.cs)
- `PlayerProfileConverter` (PlayerProfileConverter.cs)
- `SdkCloudFunctionsService` (SdkCloudFunctionsService.cs)
- `StickerMessageConverter` (StickerMessageConverter.cs)
- `TextMessageConverter` (TextMessageConverter.cs)

**Detected DI registrations:**
- `FirebaseAuthService`
- `FirebaseInitializer`
- `FirestoreWrapper`
- `GuildChatService`
- `GuildService`
- `GuildUtility`
- `HttpCloudFunctionsService`
- `LivesHelpDataSyncService`
- `PlayerDataManager`
- `SdkCloudFunctionsService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Firebase/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Firebase/Auth/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Firebase/CloudFunctions/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Firebase/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Firebase/Firestore/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Firebase/Firestore/Guild/README.md`
- Namespace: `TheOne.Features.Firebase.Auth.DI`, `TheOne.Features.Firebase.Auth.Editor`, `TheOne.Features.Firebase.Auth`, `TheOne.Features.Firebase.CloudFunctions.DI`, `TheOne.Features.Firebase.CloudFunctions.Editor`, `TheOne.Features.Firebase.CloudFunctions`, `TheOne.Features.Firebase.Core.DI`, `TheOne.Features.Firebase.Core.Editor`, `TheOne.Features.Firebase.Core`, `TheOne.Features.Firestore.Core.DI`, `TheOne.Features.Firestore.Core.Editor`, `TheOne.Features.Firestore.Core`, `TheOne.Features.Firestore.Guild.DI`, `TheOne.Features.Firestore.Guild.Editor`, `TheOne.Features.Firestore.Guild`, `TheOne.Features.Firestore.LivesHelp.DI`, `TheOne.Features.Firestore.LivesHelp.Editor`, `TheOne.Features.Firestore.LivesHelp`, `TheOne.Features.Firestore.Player.DI`, `TheOne.Features.Firestore.Player.Editor`, `TheOne.Features.Firestore.Player`
