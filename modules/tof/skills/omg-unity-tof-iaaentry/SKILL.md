---
name: omg-unity-tof-iaaentry
description: "IAAEntry feature of TheOneFeature — The IAA Entry Core feature provides In-App Advertising (IAA) management and control for Unity mobile games. It handles the configuration ..."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# IAAEntry

## Purpose
The IAA Entry Core feature provides In-App Advertising (IAA) management and control for Unity mobile games. It handles the configuration and conditions for showing interstitial ads based on player progress, win/loss counts, and level progression.

## Public API
**interface**
- `IIAAConfig` (IIAAConfig.cs)
- `IIAAEntryService` (IAAEntryService.cs)
**class**
- `IAAEntryConfig` (IAAEntryConfig.cs)
- `IAAEntryConfigConvert` (IAAEntryConfig.Convert.cs)
- `IAAEntryConfigToolModule` (IAAEntryConfigToolModule.cs)
- `IAAEntryConfigValidator` (IAAEntryConfigValidator.cs)
- `IAAEntryDefaultConfig` (IAAEntryDefaultConfig.cs)
- `IAAEntryManagerVContainer` (IAAEntryManagerVContainer.cs)
- `IAAEntryService` (IAAEntryService.cs)
- `KeyConstants` (KeyConstants.cs)
- `LevelConfig` (LevelConfig.cs)
- `LevelWinLoseConfig` (WinLoseConfig.cs)
- `WinLoseConfig` (WinLoseConfig.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
- `IAAEntryDefaultConfig`

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the IAAEntry services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (13):**
**interface**
- `IIAAConfig` (IIAAConfig.cs)
- `IIAAEntryService` (IAAEntryService.cs)
**class**
- `IAAEntryConfig` (IAAEntryConfig.cs)
- `IAAEntryConfigConvert` (IAAEntryConfig.Convert.cs)
- `IAAEntryConfigToolModule` (IAAEntryConfigToolModule.cs)
- `IAAEntryConfigValidator` (IAAEntryConfigValidator.cs)
- `IAAEntryDefaultConfig` (IAAEntryDefaultConfig.cs)
- `IAAEntryManagerVContainer` (IAAEntryManagerVContainer.cs)
- `IAAEntryService` (IAAEntryService.cs)
- `KeyConstants` (KeyConstants.cs)
- `LevelConfig` (LevelConfig.cs)
- `LevelWinLoseConfig` (WinLoseConfig.cs)
- `WinLoseConfig` (WinLoseConfig.cs)

**Detected DI registrations:**
- `IAAEntryService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/IAAEntry/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/IAAEntry/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/IAAEntry/CHANGELOG.md`
- Namespace: `TheOne.Features.IAAEntry.Core.Editor`, `TheOne.Features.IAAEntry.Core.Constants`, `TheOne.Features.IAAEntry.Core.DI`, `TheOne.Features.IAAEntry.Core.Model.Configs`, `TheOne.Features.IAAEntry.Core.Model`, `TheOne.Features.IAAEntry.Core.Services`
