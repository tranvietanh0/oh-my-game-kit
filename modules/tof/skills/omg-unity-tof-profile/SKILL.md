---
name: omg-unity-tof-profile
description: "Profile feature of TheOneFeature — Core implementation of profile core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Profile

## Purpose
Core implementation of profile core feature for Unity games

## Public API
**interface**
- `IExternalAvatarService` (IExternalAvatarService.cs)
- `IProfileItemService` (IProfileItemService.cs)
- `IProfileRepository` (IProfileRepository.cs)
- `IProfileService` (IProfileService.cs)
**class**
- `CountryCodeBlueprint` (CountryCodeBlueprint.cs)
- `CountryFlagView` (CountryFlagView.cs)
- `CountryNameView` (CountryNameView.cs)
- `CountryRecord` (CountryCodeBlueprint.cs)
- `CountryView` (CountryView.cs)
- `CurrentProfilePlayerView` (CurrentProfilePlayerView.cs)
- `DummyProfileRepository` (DummyProfileRepository.cs)
- `PlayerView` (PlayerView.cs)
- `ProfileBlueprint` (ProfileBlueprint.cs)
- `ProfileFTUEAction` (ProfileFTUEAction.cs)
- `ProfileItem` (ProfileBlueprint.cs)
- `ProfileItemService` (ProfileItemService.cs)
- `ProfileLocalData` (ProfileLocalData.cs)
- `ProfilePlayerView` (ProfilePlayerView.cs)
- `ProfileService` (ProfileService.cs)
- `ProfileUtility` (ProfileUtility.cs)
- `ProfileValidator` (ProfileValidator.cs)
- `ProfileVContainer` (ProfileVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
- `ProfileBlueprint`

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Profile services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (23):**
**interface**
- `IExternalAvatarService` (IExternalAvatarService.cs)
- `IProfileItemService` (IProfileItemService.cs)
- `IProfileRepository` (IProfileRepository.cs)
- `IProfileService` (IProfileService.cs)
**class**
- `CountryCodeBlueprint` (CountryCodeBlueprint.cs)
- `CountryFlagView` (CountryFlagView.cs)
- `CountryNameView` (CountryNameView.cs)
- `CountryRecord` (CountryCodeBlueprint.cs)
- `CountryView` (CountryView.cs)
- `CurrentProfilePlayerView` (CurrentProfilePlayerView.cs)
- `DummyProfileRepository` (DummyProfileRepository.cs)
- `PlayerView` (PlayerView.cs)
- `ProfileBlueprint` (ProfileBlueprint.cs)
- `ProfileFTUEAction` (ProfileFTUEAction.cs)
- `ProfileItem` (ProfileBlueprint.cs)
- `ProfileItemService` (ProfileItemService.cs)
- `ProfileLocalData` (ProfileLocalData.cs)
- `ProfilePlayerView` (ProfilePlayerView.cs)
- `ProfileService` (ProfileService.cs)
- `ProfileUtility` (ProfileUtility.cs)
- `ProfileValidator` (ProfileValidator.cs)
- `ProfileVContainer` (ProfileVContainer.cs)
**record**
- `Player` (Player.cs)

**Detected DI registrations:**
- `ProfileItemService`
- `ProfileService`
- `ProfileUtility`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Profile/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Profile/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Profile/CHANGELOG.md`
- Namespace: `TheOneFeature.Core.Features.Playfab.Editor`, `TheOne.Features.Profile.Core.DI`, `TheOne.Features.Profile.Core.FTUE`, `TheOne.Features.Profile.Core.Models.Blueprints`, `System.Runtime.CompilerServices`, `TheOne.Features.Profile.Core.Models`, `TheOne.Features.Profile.Core.Services`, `TheOne.Features.Profile.Core.Views`
