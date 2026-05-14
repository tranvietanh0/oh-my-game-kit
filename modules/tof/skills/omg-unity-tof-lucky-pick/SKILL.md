---
name: omg-unity-tof-lucky-pick
description: "Lucky Pick feature of TheOneFeature — LuckyPick is a triple-option wallpaper picker. Players choose one wallpaper from three slots before each game. One slot is always free; t..."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Lucky Pick

## Purpose
LuckyPick is a triple-option wallpaper picker. Players choose one wallpaper from three slots before each game. One slot is always free; the remaining slots require watching a rewarded ad or paying currency. Each slot draws from its own independent item pool. Pool advancement on win depends on whether the player manually picked a card: manual pick advances all pools, auto-pick advances only the free pool.

## Public API
**interface**
- `ILuckyPickService` (ILuckyPickService.cs)
**class**
- `LuckyPickPoolBlueprint` (LuckyPickPoolBlueprint.cs)
- `LuckyPickPoolRecord` (LuckyPickPoolBlueprint.cs)
- `LuckyPickService` (LuckyPickService.cs)
- `LuckyPickUserData` (LuckyPickUserData.cs)
- `LuckyPickUserDataController` (LuckyPickUserDataController.cs)
- `LuckyPickValidator` (LuckyPickValidator.cs)
- `LuckyPickVContainer` (LuckyPickVContainer.cs)

## Signals / Events
- `OnLuckyPickItemPickedSignal`
- `OnLuckyPickRefreshedSignal`

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Lucky Pick services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (10):**
**interface**
- `ILuckyPickService` (ILuckyPickService.cs)
**class**
- `LuckyPickPoolBlueprint` (LuckyPickPoolBlueprint.cs)
- `LuckyPickPoolRecord` (LuckyPickPoolBlueprint.cs)
- `LuckyPickService` (LuckyPickService.cs)
- `LuckyPickUserData` (LuckyPickUserData.cs)
- `LuckyPickUserDataController` (LuckyPickUserDataController.cs)
- `LuckyPickValidator` (LuckyPickValidator.cs)
- `LuckyPickVContainer` (LuckyPickVContainer.cs)
**struct**
- `OnLuckyPickItemPickedSignal` (LuckyPickSignals.cs)
- `OnLuckyPickRefreshedSignal` (LuckyPickSignals.cs)

**Detected DI registrations:**
- `LuckyPickService`
- `LuckyPickUserDataController`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/LuckyPick/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/LuckyPick/LuckyPick.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/LuckyPick/CHANGELOG.md`
- Namespace: `TheOne.Features.LuckyPick.Core.Controllers`, `TheOne.Features.LuckyPick.Core.DI`, `TheOne.Features.LuckyPick.Core.Editor`, `TheOne.Features.LuckyPick.Core.Models`, `TheOne.Features.LuckyPick.Core.Services`, `TheOne.Features.LuckyPick.Core.Signals`
