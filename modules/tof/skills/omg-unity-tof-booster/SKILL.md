---
name: omg-unity-tof-booster
description: "Booster feature of TheOneFeature — Core implementation of booster core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Booster

## Purpose
Core implementation of booster core feature for Unity games

## Public API
**class**
- `BoosterBlueprint` (BoosterBlueprint.cs)
- `BoosterPurchaseRecord` (BoosterBlueprint.cs)
- `BoosterRecord` (BoosterBlueprint.cs)
- `BoosterService` (BoosterService.cs)
- `BoosterValidator` (BoosterValidator.cs)
- `BoosterVContainer` (BoosterVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Booster services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (7):**
**class**
- `BoosterBlueprint` (BoosterBlueprint.cs)
- `BoosterPurchaseRecord` (BoosterBlueprint.cs)
- `BoosterRecord` (BoosterBlueprint.cs)
- `BoosterService` (BoosterService.cs)
- `BoosterValidator` (BoosterValidator.cs)
- `BoosterVContainer` (BoosterVContainer.cs)
**enum**
- `PurchaseType` (PurchaseType.cs)

**Detected DI registrations:**
- `BoosterService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Booster/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Booster/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Booster/Default/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Booster/Core/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Booster/Default/CHANGELOG.md`
- Namespace: `TheOne.Features.Booster.Core.Models.Blueprints`, `TheOne.Features.Booster.Core.Models`, `TheOne.Features.Booster.Default.DI`, `TheOne.Features.Booster.Default.Editor`, `TheOne.Features.Booster.Default.Services`
