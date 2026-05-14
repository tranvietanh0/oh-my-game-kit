---
name: omg-unity-tof-social
description: "Social feature of TheOneFeature — Chat messaging system with support for text, stickers, and help request messages."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Social

## Purpose
Chat messaging system with support for text, stickers, and help request messages.

## Public API
**interface**
- `IChatService` (IChatService.cs)
- `IDocument` (IDocument.cs)
- `IGuildChatService` (IGuildChatService.cs)
- `IGuildMemberManager` (IGuildMemberManager.cs)
- `IGuildMemberRepository` (IGuildMemberRepository.cs)
- `IGuildNotifier` (IGuildNotifier.cs)
- `IGuildNotify` (IGuildNotify.cs)
- `IGuildService` (IGuildService.cs)
- `IMessage` (IMessage.cs)
- `INotify` (INotify.cs)
- `IPlayerChatService` (IPlayerChatService.cs)
**class**
- `BaseMessage` (BaseMessage.cs)
- `ChangeMemberRoleMessage` (ChangeMemberRoleMessage.cs)
- `DeletedGuildNotify` (DeletedGuildNotify.cs)
- `EmptyResponse` (EmptyResponse.cs)
- `GetCurrentGuildIdResponse` (GetCurrentGuildIdResponse.cs)
- `GetGuildResponse` (GetGuildResponse.cs)
- `GetJoinRequestsResponse` (GetJoinRequestsResponse.cs)
- `GetListGuildResponse` (GetListGuildResponse.cs)
- `GetMemberResponse` (GetMemberResponse.cs)
- `GetMembersResponse` (GetMembersResponse.cs)
- `GetMessagesResponse` (IChatService.cs)
- `GuildLogoBlueprint` (GuildLogoBlueprint.cs)
- `GuildLogoRecord` (GuildLogoBlueprint.cs)
- `GuildParamBlueprint` (GuildParamBlueprint.cs)
- `GuildProfile` (GuildProfile.cs)
- `GuildRoleBlueprint` (GuildRoleBlueprint.cs)
- `GuildUtility` (GuildUtility.cs)
- `GuildValidator` (GuildValidator.cs)
- `JoinRequestMessage` (JoinRequestMessage.cs)
- `JoinResponseMessage` (JoinResponseMessage.cs)
- `KickMemberMessage` (KickMemberMessage.cs)
- `LivesHelpMessage` (LivesHelpMessage.cs)
- `MemberEntry` (MemberEntry.cs)
- `MemberJoinedMessage` (MemberJoinedMessage.cs)
- `MemberLeftMessage` (MemberLeftMessage.cs)
- `RoleExtensions` (RoleExtensions.cs)
- `RoleRecord` (GuildRoleBlueprint.cs)
- `SendJoinRequestResponse` (SendJoinRequestResponse.cs)
- `StickerMessage` (StickerMessage.cs)
- `TextMessage` (TextMessage.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Social services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (44):**
**interface**
- `IChatService` (IChatService.cs)
- `IDocument` (IDocument.cs)
- `IGuildChatService` (IGuildChatService.cs)
- `IGuildMemberManager` (IGuildMemberManager.cs)
- `IGuildMemberRepository` (IGuildMemberRepository.cs)
- `IGuildNotifier` (IGuildNotifier.cs)
- `IGuildNotify` (IGuildNotify.cs)
- `IGuildService` (IGuildService.cs)
- `IMessage` (IMessage.cs)
- `INotify` (INotify.cs)
- `IPlayerChatService` (IPlayerChatService.cs)
**class**
- `BaseMessage` (BaseMessage.cs)
- `ChangeMemberRoleMessage` (ChangeMemberRoleMessage.cs)
- `DeletedGuildNotify` (DeletedGuildNotify.cs)
- `EmptyResponse` (EmptyResponse.cs)
- `GetCurrentGuildIdResponse` (GetCurrentGuildIdResponse.cs)
- `GetGuildResponse` (GetGuildResponse.cs)
- `GetJoinRequestsResponse` (GetJoinRequestsResponse.cs)
- `GetListGuildResponse` (GetListGuildResponse.cs)
- `GetMemberResponse` (GetMemberResponse.cs)
- `GetMembersResponse` (GetMembersResponse.cs)
- `GetMessagesResponse` (IChatService.cs)
- `GuildLogoBlueprint` (GuildLogoBlueprint.cs)
- `GuildLogoRecord` (GuildLogoBlueprint.cs)
- `GuildParamBlueprint` (GuildParamBlueprint.cs)
- `GuildProfile` (GuildProfile.cs)
- `GuildRoleBlueprint` (GuildRoleBlueprint.cs)
- `GuildUtility` (GuildUtility.cs)
- `GuildValidator` (GuildValidator.cs)
- `JoinRequestMessage` (JoinRequestMessage.cs)
- `JoinResponseMessage` (JoinResponseMessage.cs)
- `KickMemberMessage` (KickMemberMessage.cs)
- `LivesHelpMessage` (LivesHelpMessage.cs)
- `MemberEntry` (MemberEntry.cs)
- `MemberJoinedMessage` (MemberJoinedMessage.cs)
- `MemberLeftMessage` (MemberLeftMessage.cs)
- `RoleExtensions` (RoleExtensions.cs)
- `RoleRecord` (GuildRoleBlueprint.cs)
- `SendJoinRequestResponse` (SendJoinRequestResponse.cs)
- `StickerMessage` (StickerMessage.cs)
- `TextMessage` (TextMessage.cs)
**enum**
- `JoinStatus` (JoinResponseMessage.cs)
- `Role` (Role.cs)
- `SendJoinRequestStatus` (SendJoinRequestStatus.cs)

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Social/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Social/Chat/Scripts/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Social/Core/Scripts/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Social/Guild/Scripts/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Social/Chat/Scripts/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Social/Core/Scripts/CHANGELOG.md`
- Namespace: `TheOne.Features.Social.Chat`, `TheOne.Features.Social.Core`, `Core.Features.Social.Guild.Editor`
