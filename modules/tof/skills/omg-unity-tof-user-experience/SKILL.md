---
name: omg-unity-tof-user-experience
description: "User Experience feature of TheOneFeature — A feature package for TheOne framework"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# User Experience

## Purpose
Governs home-flow routing and show-condition logic via `IUserExperienceService`, controlling which UI screens are visible at session start.

## Public API
**interface**
- `IHomeFlowHandler` (IHomeFlowHandler.cs)
- `IShouldGoHome` (IShouldGoHome.cs)
- `IShouldGoHomeService` (IShouldGoHomeService.cs)
- `IUserExperienceService` (IUserExperienceService.cs)
**class**
- `DefaultUserExperienceValue` (DefaultUserExperienceValue.cs)
- `DefaultValidate` (DefaultValidate.cs)
- `HomeFlowHandler` (HomeFlowHandler.cs)
- `ShouldGoHomeService` (ShouldGoHomeService.cs)
- `ShouldShowComponent` (ShouldShowComponent.cs)
- `UserExperienceConfigKey` (UserExperienceConfigKey.cs)
- `UserExperienceLocalData` (UserExperienceLocalData.cs)
- `UserExperienceService` (UserExperienceService.cs)
- `UserExperienceValidator` (UserExperienceValidator.cs)
- `UserExperienceValueToolModule` (UserExperienceValueToolModule.cs)
- `UserExperienceVContainer` (UserExperienceVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
- `DefaultUserExperienceValue`

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the User Experience services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (15):**
**interface**
- `IHomeFlowHandler` (IHomeFlowHandler.cs)
- `IShouldGoHome` (IShouldGoHome.cs)
- `IShouldGoHomeService` (IShouldGoHomeService.cs)
- `IUserExperienceService` (IUserExperienceService.cs)
**class**
- `DefaultUserExperienceValue` (DefaultUserExperienceValue.cs)
- `DefaultValidate` (DefaultValidate.cs)
- `HomeFlowHandler` (HomeFlowHandler.cs)
- `ShouldGoHomeService` (ShouldGoHomeService.cs)
- `ShouldShowComponent` (ShouldShowComponent.cs)
- `UserExperienceConfigKey` (UserExperienceConfigKey.cs)
- `UserExperienceLocalData` (UserExperienceLocalData.cs)
- `UserExperienceService` (UserExperienceService.cs)
- `UserExperienceValidator` (UserExperienceValidator.cs)
- `UserExperienceValueToolModule` (UserExperienceValueToolModule.cs)
- `UserExperienceVContainer` (UserExperienceVContainer.cs)

**Detected DI registrations:**
- `HomeFlowHandler`
- `ShouldGoHomeService`
- `UserExperienceService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/UserExperience/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/UserExperience/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/UserExperience/DefaultImplement/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/UserExperience/DefaultImplement/SHOWCONDITON_USAGE.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/UserExperience/Core/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/UserExperience/DefaultImplement/CHANGELOG.md`
- Namespace: `TheOne.Features.UserExperience.Core.Components`, `TheOne.Features.UserExperience.Core.Models`, `TheOne.Features.UserExperience.Core.Services`, `TheOne.Features.UserExperience.DefaultImplement.DI`, `TheOne.Features.UserExperience.Editor`, `TheOne.Features.UserExperience.DefaultImplement.Models`, `TheOne.Features.UserExperience.DefaultImplement.Services`
