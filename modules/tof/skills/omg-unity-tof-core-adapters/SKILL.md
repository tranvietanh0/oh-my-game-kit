---
name: omg-unity-tof-core-adapters
description: "Adapters feature of TheOneFeature — Adapter patterns and interfaces for TheOne Feature framework"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Adapters

## Purpose
Adapter patterns and interfaces for TheOne Feature framework

## Public API
**class**
- `AdaptersValidator` (AdaptersValidator.cs)
- `TheOneFeatureAdaptersVContainer` (TheOneFeatureAdaptersVContainer.cs)
- `TheOneFeatureAnalyticService` (TheOneFeatureAnalyticService.cs)
- `TheOneFeatureAudioAdapter` (TheOneFeatureAudioAdapter.cs)
- `TheOneFeatureIAAAdapter` (TheOneFeatureIAAAdapter.cs)
- `TheOneFeatureLocalizationAdapter` (TheOneFeatureLocalizationAdapter.cs)
- `TheOneFeatureRemoteConfigAdapter` (TheOneFeatureRemoteConfigAdapter.cs)
- `TheOneFeatureScreenManager` (TheOneFeatureScreenManager.cs)
- `TheOneFeatureStoreRatingAdapter` (TheOneFeatureStoreRatingAdapter.cs)
- `TheOneFeatureUIInteractionManager` (TheOneFeatureUIInteractionManager.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Adapters services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (10):**
**class**
- `AdaptersValidator` (AdaptersValidator.cs)
- `TheOneFeatureAdaptersVContainer` (TheOneFeatureAdaptersVContainer.cs)
- `TheOneFeatureAnalyticService` (TheOneFeatureAnalyticService.cs)
- `TheOneFeatureAudioAdapter` (TheOneFeatureAudioAdapter.cs)
- `TheOneFeatureIAAAdapter` (TheOneFeatureIAAAdapter.cs)
- `TheOneFeatureLocalizationAdapter` (TheOneFeatureLocalizationAdapter.cs)
- `TheOneFeatureRemoteConfigAdapter` (TheOneFeatureRemoteConfigAdapter.cs)
- `TheOneFeatureScreenManager` (TheOneFeatureScreenManager.cs)
- `TheOneFeatureStoreRatingAdapter` (TheOneFeatureStoreRatingAdapter.cs)
- `TheOneFeatureUIInteractionManager` (TheOneFeatureUIInteractionManager.cs)

**Detected DI registrations:**
- `TheOneFeatureAnalyticService`
- `TheOneFeatureAudioAdapter`
- `TheOneFeatureIAAAdapter`
- `TheOneFeatureLocalizationAdapter`
- `TheOneFeatureRemoteConfigAdapter`
- `TheOneFeatureScreenManager`
- `TheOneFeatureStoreRatingAdapter`
- `TheOneFeatureUIInteractionManager`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Adapters/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Adapters/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Adapters/CHANGELOG.md`
- Namespace: `TheOne.Features.Adapters.DI`, `TheOne.Features.Adapters.Core.Editor`, `TheOne.Features.Adapters.Services`
