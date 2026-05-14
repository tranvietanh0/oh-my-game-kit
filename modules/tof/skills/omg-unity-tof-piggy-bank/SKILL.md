---
name: omg-unity-tof-piggy-bank
description: "Piggy Bank feature of TheOneFeature — Core implementation of piggybank core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Piggy Bank

## Purpose
Core implementation of piggybank core feature for Unity games

## Public API
**class**
- `PiggyBankBlueprint` (PiggyBankBlueprint.cs)
- `PiggyBankService` (PiggyBankService.cs)
- `PiggyBankValidator` (PiggyBankValidator.cs)
- `PiggyBankVContainer` (PiggyBankVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Piggy Bank services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (4):**
**class**
- `PiggyBankBlueprint` (PiggyBankBlueprint.cs)
- `PiggyBankService` (PiggyBankService.cs)
- `PiggyBankValidator` (PiggyBankValidator.cs)
- `PiggyBankVContainer` (PiggyBankVContainer.cs)

**Detected DI registrations:**
- `PiggyBankService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/PiggyBank/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/PiggyBank/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/PiggyBank/CHANGELOG.md`
- Namespace: `TheOne.Features.PiggyBank.Editor`, `TheOne.Features.PiggyBank.Core.DI`, `TheOne.Features.PiggyBank.Core.Models.Blueprints`, `TheOne.Features.PiggyBank.Core.Services`
