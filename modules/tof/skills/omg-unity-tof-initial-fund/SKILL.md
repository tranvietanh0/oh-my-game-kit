---
name: omg-unity-tof-initial-fund
description: "Initial Fund feature of TheOneFeature — All notable changes to this package will be documented in this file."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Initial Fund

## Purpose
All notable changes to this package will be documented in this file.

## Public API
**class**
- `InitialFundService` (InitialFundService.cs)
- `InitialFundValidator` (InitialFundValidator.cs)
- `InitialFundVContainer` (InitialFundVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Initial Fund services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (3):**
**class**
- `InitialFundService` (InitialFundService.cs)
- `InitialFundValidator` (InitialFundValidator.cs)
- `InitialFundVContainer` (InitialFundVContainer.cs)

**Detected DI registrations:**
- `InitialFundService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/InitialFund/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/InitialFund/CHANGELOG.md`
- Namespace: `TheOne.Features.InitialFund.DI`, `TheOne.Features.InitialFund.Editor`, `TheOne.Features.InitialFund`
