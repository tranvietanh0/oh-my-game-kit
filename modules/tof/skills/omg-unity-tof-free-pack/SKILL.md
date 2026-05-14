---
name: omg-unity-tof-free-pack
description: "Free Pack feature of TheOneFeature — Core implementation of freepack core feature for Unity games"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Free Pack

## Purpose
Core implementation of freepack core feature for Unity games

## Public API
**class**
- `FreePackBlueprint` (FreePackBlueprint.cs)
- `FreePackRecord` (FreePackBlueprint.cs)
- `FreePackService` (FreePackService.cs)
- `FreePackValidator` (FreePackValidator.cs)
- `FreePackVContainer` (FreePackVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Free Pack services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (6):**
**class**
- `FreePackBlueprint` (FreePackBlueprint.cs)
- `FreePackRecord` (FreePackBlueprint.cs)
- `FreePackService` (FreePackService.cs)
- `FreePackValidator` (FreePackValidator.cs)
- `FreePackVContainer` (FreePackVContainer.cs)
**enum**
- `ItemStatus` (ItemStatus.cs)

**Detected DI registrations:**
- `FreePackService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FreePack/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FreePack/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/FreePack/CHANGELOG.md`
- Namespace: `TheOne.Features.FreePack.Core.Editor`, `TheOne.Features.FreePack.Core.DI`, `TheOne.Features.FreePack.Core.Models.Blueprints`, `TheOne.Features.FreePack.Core.Models`, `TheOne.Features.FreePack.Core.Models.LocalData`, `TheOne.Features.FreePack.Core.Services`
