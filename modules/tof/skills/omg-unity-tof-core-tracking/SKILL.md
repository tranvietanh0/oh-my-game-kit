---
name: omg-unity-tof-core-tracking
description: "Tracking feature of TheOneFeature — This package provides comprehensive analytics tracking services for TheOne Framework features."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Tracking

## Purpose
This package provides comprehensive analytics tracking services for TheOne Framework features.

## Public API
**interface**
- `IFeaturesTrackingService` (FeaturesTrackingService.cs)
- `IIAPTrackingService` (IAPTrackingService.cs)
**class**
- `FeaturesTrackingService` (FeaturesTrackingService.cs)
- `FeaturesTrackingVContainer` (FeaturesTrackingVContainer.cs)
- `FeatureTrackingValidator` (FeatureTrackingValidator.cs)
- `IAPTrackingService` (IAPTrackingService.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Tracking services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (6):**
**interface**
- `IFeaturesTrackingService` (FeaturesTrackingService.cs)
- `IIAPTrackingService` (IAPTrackingService.cs)
**class**
- `FeaturesTrackingService` (FeaturesTrackingService.cs)
- `FeaturesTrackingVContainer` (FeaturesTrackingVContainer.cs)
- `FeatureTrackingValidator` (FeatureTrackingValidator.cs)
- `IAPTrackingService` (IAPTrackingService.cs)

**Detected DI registrations:**
- `FeaturesTrackingService`
- `IAPTrackingService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Tracking/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Tracking/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Tracking/CHANGELOG.md`
- Namespace: `TheOne.Features.Tracking.DI`, `TheOne.Features.Tracking.Editor`, `TheOneFeature.Core.Tracking.Scripts.Services`
