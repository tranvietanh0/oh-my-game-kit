---
name: omg-unity-tof-ftue
description: "FTUE feature of TheOneFeature — This module contains the User Experience components for the First Time User Experience (FTUE) system. It provides conditions and actions ..."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# FTUE

## Purpose
This module contains the User Experience components for the First Time User Experience (FTUE) system. It provides conditions and actions to control when and how UI components are shown to guide new users through the game.

## Public API
**class**
- `FinishFTUECondition` (FinishFTUECondition.cs)
- `FTUEHighlightShouldShowComponentAction` (FTUEHighlightShouldShowComponentAction.cs)
- `FTUELoseFlowShowComponentCondition` (FTUELoseFlowShowComponentCondition.cs)
- `FTUEShowComponentCondition` (FTUEShowComponentCondition.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the FTUE services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (4):**
**class**
- `FinishFTUECondition` (FinishFTUECondition.cs)
- `FTUEHighlightShouldShowComponentAction` (FTUEHighlightShouldShowComponentAction.cs)
- `FTUELoseFlowShowComponentCondition` (FTUELoseFlowShowComponentCondition.cs)
- `FTUEShowComponentCondition` (FTUEShowComponentCondition.cs)

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FTUE/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FTUE/UserExperience/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FTUE/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FTUE/UserExperience/CHANGELOG.md`
- Namespace: `TheOne.Features.FTUE.Common`, `TheOne.Features.FTUE.UserExperience`
