---
name: omg-unity-tof-reward-animation
description: "Reward Animation feature of TheOneFeature — This package provides a comprehensive animation system for reward collection interactions in TheOne Framework."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Reward Animation

## Purpose
This package provides a comprehensive animation system for reward collection interactions in TheOne Framework.

## Public API
**class**
- `BaseCurrencyAnimation` (BaseCurrencyAnimation.cs)
- `BoosterFlyoutAnimation` (BoosterFlyoutAnimation.cs)
- `EntryButtonItemCurrencyAnimation` (EntryButtonItemCurrencyAnimation.cs)
- `FlyingCurrencyAnimation` (FlyingCurrencyAnimation.cs)
- `LivesFlyoutAnimation` (LivesFlyoutAnimation.cs)
- `RewardAnimationManager` (RewardAnimationManager.cs)
- `RewardAnimationValidator` (RewardAnimationValidator.cs)
- `RewardAnimationVContainer` (RewardAnimationVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Reward Animation services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (8):**
**class**
- `BaseCurrencyAnimation` (BaseCurrencyAnimation.cs)
- `BoosterFlyoutAnimation` (BoosterFlyoutAnimation.cs)
- `EntryButtonItemCurrencyAnimation` (EntryButtonItemCurrencyAnimation.cs)
- `FlyingCurrencyAnimation` (FlyingCurrencyAnimation.cs)
- `LivesFlyoutAnimation` (LivesFlyoutAnimation.cs)
- `RewardAnimationManager` (RewardAnimationManager.cs)
- `RewardAnimationValidator` (RewardAnimationValidator.cs)
- `RewardAnimationVContainer` (RewardAnimationVContainer.cs)

**Detected DI registrations:**
- `RewardAnimationManager`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/RewardAnimation/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/RewardAnimation/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/RewardAnimation/CHANGELOG.md`
- Namespace: `TheOne.Features.RewardAnimation.Core.DI`, `TheOne.Features.RewardAnimation.Core.Editor`, `TheOne.Features.RewardAnimation.Animation`, `TheOne.Features.RewardAnimation.Managers`, `TheOne.Features.RewardAnimation.Core.Models`
