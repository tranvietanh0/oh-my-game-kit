---
name: omg-unity-tof-no-internet
description: "No Internet feature of TheOneFeature — A feature package for TheOne framework"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# No Internet

## Purpose
Detects offline state and blocks gameplay behind a connectivity gate via `NoInternetService` and `NoInternetValidator`.

## Public API
**class**
- `NoInternetService` (NoInternetService.cs)
- `NoInternetValidator` (NoInternetValidator.cs)
- `NoInternetVContainer` (NoInternetVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the No Internet services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (3):**
**class**
- `NoInternetService` (NoInternetService.cs)
- `NoInternetValidator` (NoInternetValidator.cs)
- `NoInternetVContainer` (NoInternetVContainer.cs)

**Detected DI registrations:**
- `NoInternetService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/NoInternet/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/NoInternet/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/NoInternet/CHANGELOG.md`
- Namespace: `TheOne.Features.NoInternet.Editor`, `TheOne.Features.NoInternet.Core.DI`, `TheOne.Features.NoInternet.Core.Services`
