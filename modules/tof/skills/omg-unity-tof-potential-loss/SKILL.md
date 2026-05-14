---
name: omg-unity-tof-potential-loss
description: "Potential Loss feature of TheOneFeature — A feature package for TheOne framework"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Potential Loss

## Purpose
Surfaces loss-aversion prompts using blueprint-configured thresholds via `PotentialLossService` to improve session-end retention.

## Public API
**interface**
- `IPotentialLoss` (IPotentialLoss.cs)
**class**
- `PotentialLossBlueprint` (PotentialLossBlueprint.cs)
- `PotentialLossRecord` (PotentialLossBlueprint.cs)
- `PotentialLossService` (PotentialLossService.cs)
- `PotentialLossValidator` (PotentialLossValidator.cs)
- `PotentialLossVContainer` (PotentialLossVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Potential Loss services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (6):**
**interface**
- `IPotentialLoss` (IPotentialLoss.cs)
**class**
- `PotentialLossBlueprint` (PotentialLossBlueprint.cs)
- `PotentialLossRecord` (PotentialLossBlueprint.cs)
- `PotentialLossService` (PotentialLossService.cs)
- `PotentialLossValidator` (PotentialLossValidator.cs)
- `PotentialLossVContainer` (PotentialLossVContainer.cs)

**Detected DI registrations:**
- `PotentialLossService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/PotentialLoss/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/PotentialLoss/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/PotentialLoss/CHANGELOG.md`
- Namespace: `TheOne.Features.PotentialLoss.Editor`, `TheOne.Features.PotentialLoss.Core.DI`, `TheOneFeature.Core.Features.PotentialLoss.Scripts.Models`, `TheOne.Features.PotentialLoss.Core`
