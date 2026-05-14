---
name: omg-unity-tof-feature-conditions
description: "Feature Conditions feature of TheOneFeature — A specialized condition system for TheOneFeature framework that provides custom conditions for feature visibility and behavior control."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Feature Conditions

## Purpose
A specialized condition system for TheOneFeature framework that provides custom conditions for feature visibility and behavior control.

## Public API
**class**
- `BattlePassReplaceCondition` (BattlePassReplaceCondition.cs)
- `StarterBundleReplaceCondition` (StarterBundleReplaceCondition.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Feature Conditions services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (2):**
**class**
- `BattlePassReplaceCondition` (BattlePassReplaceCondition.cs)
- `StarterBundleReplaceCondition` (StarterBundleReplaceCondition.cs)

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FeatureConditions/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FeatureConditions/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FeatureConditions/CHANGELOG.md`
- Namespace: `TheOne.Features.FeatureConditions`
