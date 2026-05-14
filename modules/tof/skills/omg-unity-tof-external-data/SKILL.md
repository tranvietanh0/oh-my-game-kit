---
name: omg-unity-tof-external-data
description: "External Data feature of TheOneFeature (auto-extracted from code)."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# External Data

## Purpose
External Data module. See code references below.

## Public API
**class**
- `ExternalBinaryDataStorage` (ExternalBinaryDataStorage.cs)
- `ExternalDataAsset` (ExternalDataManagerSettings.cs)
- `ExternalDataManagerToolModule` (ExternalDataManagerToolModule.cs)
- `ExternalDataVContainer` (ExternalDataVContainer.cs)
- `ExternalFileVersionManager` (ExternalFileVersionManager.cs)
- `ExternalFileVersionManagerConfig` (ExternalFileVersionManagerConfig.cs)
- `ExternalTextDataStorage` (ExternalTextDataStorage.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
- `ExternalDataAsset`
- `ExternalFileVersionManagerConfig`

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the External Data services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (7):**
**class**
- `ExternalBinaryDataStorage` (ExternalBinaryDataStorage.cs)
- `ExternalDataAsset` (ExternalDataManagerSettings.cs)
- `ExternalDataManagerToolModule` (ExternalDataManagerToolModule.cs)
- `ExternalDataVContainer` (ExternalDataVContainer.cs)
- `ExternalFileVersionManager` (ExternalFileVersionManager.cs)
- `ExternalFileVersionManagerConfig` (ExternalFileVersionManagerConfig.cs)
- `ExternalTextDataStorage` (ExternalTextDataStorage.cs)

**Detected DI registrations:**
- `ExternalBinaryDataStorage`
- `ExternalFileVersionManager`
- `ExternalTextDataStorage`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/ExternalData/`
- Namespace: `TheOne.Features.ExternalData.Core`, `TheOne.Features.ExternalData.Core.DI`, `TheOne.Features.Editor`
