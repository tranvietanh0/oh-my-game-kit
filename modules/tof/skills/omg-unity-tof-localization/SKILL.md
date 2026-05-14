---
name: omg-unity-tof-localization
description: "Localization feature of TheOneFeature — All notable changes to this package will be documented in this file."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Localization

## Purpose
All notable changes to this package will be documented in this file.

## Public API
**class**
- `LanguageRecord` (LocalizationLanguagesBlueprint.cs)
- `LocalizationLanguagesBlueprint` (LocalizationLanguagesBlueprint.cs)
- `LocalizationService` (LocalizationService.cs)
- `LocalizationUserData` (LocalizationUserData.cs)
- `LocalizationUserDataController` (LocalizationUserDataController.cs)
- `LocalizationValidator` (LocalizationValidator.cs)
- `LocalizationVContainer` (LocalizationVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Localization services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (7):**
**class**
- `LanguageRecord` (LocalizationLanguagesBlueprint.cs)
- `LocalizationLanguagesBlueprint` (LocalizationLanguagesBlueprint.cs)
- `LocalizationService` (LocalizationService.cs)
- `LocalizationUserData` (LocalizationUserData.cs)
- `LocalizationUserDataController` (LocalizationUserDataController.cs)
- `LocalizationValidator` (LocalizationValidator.cs)
- `LocalizationVContainer` (LocalizationVContainer.cs)

**Detected DI registrations:**
- `LocalizationService`
- `LocalizationUserDataController`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Localization/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Localization/CHANGELOG.md`
- Namespace: `TheOne.Features.Localization.Core.DI`, `TheOne.Features.Localization.Core.Editor`, `TheOne.Features.Localization.Core.Models`, `TheOne.Features.Localization.Core.Services`
