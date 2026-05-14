---
name: omg-unity-tof-currency-progress
description: "Currency Progress feature of TheOneFeature — Core implementation of currencyprogress core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Currency Progress

## Purpose
Core implementation of currencyprogress core feature for Unity games

## Public API
**interface**
- `ICurrencyCollector` (ICurrencyCollector.cs)
**class**
- `CurrencyProgressBlueprint` (CurrencyProgressBlueprint.cs)
- `CurrencyProgressService` (CurrencyProgressService.cs)
- `CurrencyProgressValidator` (CurrencyProgressValidator.cs)
- `CurrencyProgressVContainer` (CurrencyProgressVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Currency Progress services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (5):**
**interface**
- `ICurrencyCollector` (ICurrencyCollector.cs)
**class**
- `CurrencyProgressBlueprint` (CurrencyProgressBlueprint.cs)
- `CurrencyProgressService` (CurrencyProgressService.cs)
- `CurrencyProgressValidator` (CurrencyProgressValidator.cs)
- `CurrencyProgressVContainer` (CurrencyProgressVContainer.cs)

**Detected DI registrations:**
- `CurrencyProgressService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CurrencyProgress/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CurrencyProgress/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CurrencyProgress/CHANGELOG.md`
- Namespace: `TheOne.Features.CurrencyProgress.Core.DI`, `TheOne.Features.CurrencyProgress.Core.Editor`, `TheOne.Features.CurrencyProgress.Core.Blueprints`, `TheOne.Features.CurrencyProgress.Core.Services`
