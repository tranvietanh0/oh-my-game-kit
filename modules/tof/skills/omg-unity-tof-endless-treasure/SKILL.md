---
name: omg-unity-tof-endless-treasure
description: "Endless Treasure feature of TheOneFeature — All notable changes to this project will be documented in this file."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Endless Treasure

## Purpose
All notable changes to this project will be documented in this file.

## Public API
**class**
- `EndlessTreasureBlueprint` (EndlessTreasureBlueprint.cs)
- `EndlessTreasureDataController` (EndlessTreasureDataController.cs)
- `EndlessTreasureEventBlueprint` (EndlessTreasureEventBlueprint.cs)
- `EndlessTreasureEventRecord` (EndlessTreasureEventBlueprint.cs)
- `EndlessTreasureRecord` (EndlessTreasureBlueprint.cs)
- `EndlessTreasureValidator` (EndlessTreasureValidator.cs)
- `EndlessTreasureVContainer` (EndlessTreasureVContainer.cs)
- `OnClaimEndlessTreasureSignal` (OnClaimEndlessTreasureSignal.cs)
- `TreasureInfo` (EndlessTreasureLocalData.cs)

## Signals / Events
- `OnClaimEndlessTreasureSignal`

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Endless Treasure services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (10):**
**class**
- `EndlessTreasureBlueprint` (EndlessTreasureBlueprint.cs)
- `EndlessTreasureDataController` (EndlessTreasureDataController.cs)
- `EndlessTreasureEventBlueprint` (EndlessTreasureEventBlueprint.cs)
- `EndlessTreasureEventRecord` (EndlessTreasureEventBlueprint.cs)
- `EndlessTreasureRecord` (EndlessTreasureBlueprint.cs)
- `EndlessTreasureValidator` (EndlessTreasureValidator.cs)
- `EndlessTreasureVContainer` (EndlessTreasureVContainer.cs)
- `OnClaimEndlessTreasureSignal` (OnClaimEndlessTreasureSignal.cs)
- `TreasureInfo` (EndlessTreasureLocalData.cs)
**enum**
- `ClaimType` (EndlessTreasureBlueprint.cs)

**Detected DI registrations:**
- `EndlessTreasureDataController`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/EndlessTreasure/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/EndlessTreasure/CHANGELOG.md`
- Namespace: `TheOne.Features.EndlessTreasure.DI`, `TheOne.Features.EndlessTreasure.Core.Editor`, `TheOne.Features.EndlessTreasure.Core.Controllers`, `TheOne.Features.EndlessTreasure.Core.Models.Blueprints`, `TheOne.Features.EndlessTreasure.Core.Models.LocalData`, `TheOne.Features.EndlessTreasure.Core.Models.Signals`
