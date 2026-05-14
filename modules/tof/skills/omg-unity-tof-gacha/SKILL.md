---
name: omg-unity-tof-gacha
description: "Gacha feature of TheOneFeature — A comprehensive gacha system with weighted random selection, pity mechanics, and loot table management for TheOne framework."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Gacha

## Purpose
A comprehensive gacha system with weighted random selection, pity mechanics, and loot table management for TheOne framework.

## Public API
**class**
- `GachaDataController` (GachaDataController.cs)
- `GachaLocalData` (GachaLocalData.cs)
- `GachaLootTableBlueprint` (GachaLootTableBlueprint.cs)
- `GachaLootTableRecord` (GachaLootTableBlueprint.cs)
- `GachaPoolBlueprint` (GachaPoolBlueprint.cs)
- `GachaPoolRecord` (GachaPoolBlueprint.cs)
- `GachaState` (GachaLocalData.cs)
- `GachaValidator` (GachaValidator.cs)
- `GachaVContainer` (GachaVContainer.cs)
- `ItemWeightRecord` (GachaLootTableBlueprint.cs)
- `PityRuleRecord` (GachaPoolBlueprint.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Gacha services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (12):**
**class**
- `GachaDataController` (GachaDataController.cs)
- `GachaLocalData` (GachaLocalData.cs)
- `GachaLootTableBlueprint` (GachaLootTableBlueprint.cs)
- `GachaLootTableRecord` (GachaLootTableBlueprint.cs)
- `GachaPoolBlueprint` (GachaPoolBlueprint.cs)
- `GachaPoolRecord` (GachaPoolBlueprint.cs)
- `GachaState` (GachaLocalData.cs)
- `GachaValidator` (GachaValidator.cs)
- `GachaVContainer` (GachaVContainer.cs)
- `ItemWeightRecord` (GachaLootTableBlueprint.cs)
- `PityRuleRecord` (GachaPoolBlueprint.cs)

**Detected DI registrations:**
- `GachaDataController`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Gacha/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Gacha/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Gacha/REVIEW-blueprint-data-2026-03-14.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Gacha/UPDATE-PLAN-blueprint-data-2026-03-14.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Gacha/CHANGELOG.md`
- Namespace: `TheOne.Features.Gacha.Core.Controllers`, `TheOne.Features.Gacha.Core.DI`, `TheOne.Features.Gacha.Core.Editor`, `TheOne.Features.Gacha.Core.Models.Blueprints`, `TheOne.Features.Gacha.Core.Models.LocalData`
