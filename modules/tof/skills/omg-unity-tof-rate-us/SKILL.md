---
name: omg-unity-tof-rate-us
description: "Rate Us feature of TheOneFeature — In-app store rating prompt with conditional display based on player milestones."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Rate Us

## Purpose
In-app store rating prompt with conditional display based on player milestones (e.g., show after a successful run). Wraps the platform store-rating adapter and exposes show/success conditions for integration with the FTUE and reward pipelines.

## Public API
**class**
- `RateSuccessCondition` (RateSuccessCondition.cs)
- `RateUsService` (RateUsService.cs)
- `RateUsShowCondition` (RateUsShowCondition.cs)
- `RateUsValidator` (RateUsValidator.cs)
- `RateUsVContainer` (RateUsVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Rate Us services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (5):**
**class**
- `RateSuccessCondition` (RateSuccessCondition.cs)
- `RateUsService` (RateUsService.cs)
- `RateUsShowCondition` (RateUsShowCondition.cs)
- `RateUsValidator` (RateUsValidator.cs)
- `RateUsVContainer` (RateUsVContainer.cs)

**Detected DI registrations:**
- `RateUsService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/RateUs/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/RateUs/CHANGELOG.md`
- Namespace: `TheOne.Features.RateUs.Editor`, `TheOne.Features.RateUs.Core.Conditions`, `TheOne.Features.RateUs.Core.DI`, `TheOne.Features.RateUs.Core`
