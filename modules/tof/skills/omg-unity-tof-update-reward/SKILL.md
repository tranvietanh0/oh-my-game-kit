---
name: omg-unity-tof-update-reward
description: "Update Reward feature of TheOneFeature (auto-extracted from code)."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Update Reward

## Purpose
Update Reward module. See code references below.

## Public API
**interface**
- `IVersionProvider` (IVersionProvider.cs)
**class**
- `DefaultVersionProvider` (DefaultVersionProvider.cs)
- `EditorVersionProvider` (EditorVersionProvider.cs)
- `FeatureRewardRecord` (UpdateRewardBlueprint.cs)
- `PatchRewardRecord` (UpdateRewardBlueprint.cs)
- `UpdateRewardBlueprint` (UpdateRewardBlueprint.cs)
- `UpdateRewardDataController` (UpdateRewardDataController.cs)
- `UpdateRewardTestModule` (UpdateRewardTestModule.cs)
- `UpdateRewardValidator` (UpdateRewardValidator.cs)
- `UpdateRewardVContainer` (UpdateRewardVContainer.cs)
- `VersionInfo` (VersionInfo.cs)
- `VersionRewardRecord` (UpdateRewardBlueprint.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Update Reward services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (12):**
**interface**
- `IVersionProvider` (IVersionProvider.cs)
**class**
- `DefaultVersionProvider` (DefaultVersionProvider.cs)
- `EditorVersionProvider` (EditorVersionProvider.cs)
- `FeatureRewardRecord` (UpdateRewardBlueprint.cs)
- `PatchRewardRecord` (UpdateRewardBlueprint.cs)
- `UpdateRewardBlueprint` (UpdateRewardBlueprint.cs)
- `UpdateRewardDataController` (UpdateRewardDataController.cs)
- `UpdateRewardTestModule` (UpdateRewardTestModule.cs)
- `UpdateRewardValidator` (UpdateRewardValidator.cs)
- `UpdateRewardVContainer` (UpdateRewardVContainer.cs)
- `VersionInfo` (VersionInfo.cs)
- `VersionRewardRecord` (UpdateRewardBlueprint.cs)

**Detected DI registrations:**
- `IVersionProvider`
- `UpdateRewardDataController`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/UpdateReward/`
- Namespace: `TheOne.Features.UpdateReward.Core`, `TheOne.Features.UpdateReward.Core.DI`, `TheOne.Features.UpdateReward.Editor`, `Core.Features.UpdateReward.Editor`
