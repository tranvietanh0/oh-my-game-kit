---
name: omg-unity-tof-economy-entry
description: "Economy Entry feature of TheOneFeature — The Economy Entry Core feature provides comprehensive economy management for Unity mobile games. It handles currency pricing, rewards, co..."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Economy Entry

## Purpose
The Economy Entry Core feature provides comprehensive economy management for Unity mobile games. It handles currency pricing, rewards, costs, and resource management including lives system with recharge mechanics.

## Public API
**interface**
- `ICurrencyConfig` (EconomyConfig.cs)
- `IEconomyEntryService` (EconomyEntryService.cs)
**class**
- `BoosterConfig` (EconomyConfig.cs)
- `EconomyEntryConfig` (EconomyEntryConfig.cs)
- `EconomyEntryConfigConvert` (EntryConfig.Convert.cs)
- `EconomyEntryConfigToolModule` (EconomyEntryConfigToolModule.cs)
- `EconomyEntryDefaultConfig` (EconomyEntryDefaultConfig.cs)
- `EconomyEntryService` (EconomyEntryService.cs)
- `EconomyManagerVContainer` (EconomyManagerVContainer.cs)
- `EconomyValidator` (EconomyValidator.cs)
- `KeyConstants` (KeyConstants.cs)
- `ValueConfig` (EconomyConfig.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
- `EconomyEntryDefaultConfig`

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Economy Entry services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (12):**
**interface**
- `ICurrencyConfig` (EconomyConfig.cs)
- `IEconomyEntryService` (EconomyEntryService.cs)
**class**
- `BoosterConfig` (EconomyConfig.cs)
- `EconomyEntryConfig` (EconomyEntryConfig.cs)
- `EconomyEntryConfigConvert` (EntryConfig.Convert.cs)
- `EconomyEntryConfigToolModule` (EconomyEntryConfigToolModule.cs)
- `EconomyEntryDefaultConfig` (EconomyEntryDefaultConfig.cs)
- `EconomyEntryService` (EconomyEntryService.cs)
- `EconomyManagerVContainer` (EconomyManagerVContainer.cs)
- `EconomyValidator` (EconomyValidator.cs)
- `KeyConstants` (KeyConstants.cs)
- `ValueConfig` (EconomyConfig.cs)

**Detected DI registrations:**
- `EconomyEntryService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/EconomyEntry/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/EconomyEntry/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/EconomyEntry/CHANGELOG.md`
- Namespace: `TheOne.Features.EconomyEntry.Core.Editor`, `TheOne.Features.EconomyEntry.Core.Constants`, `TheOne.Features.EconomyEntry.Core.DI`, `TheOne.Features.EconomyEntry.Core.Models`, `TheOne.Features.EconomyEntry.Core.Services`
