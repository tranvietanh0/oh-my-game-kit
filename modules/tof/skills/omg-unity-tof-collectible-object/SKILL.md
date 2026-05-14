---
name: omg-unity-tof-collectible-object
description: "Collectible Object feature of TheOneFeature — A feature package for TheOne framework"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Collectible Object

## Purpose
Tracks in-level collectible pickups with spawn-point queries via `ICollectibleObjectPointProvider` and state management in `CollectibleObjectService`.

## Public API
**interface**
- `ICollectibleObjectPointProvider` (ICollectibleObjectPointProvider.cs)
**class**
- `CollectibleObjectService` (CollectibleObjectService.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Collectible Object services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (2):**
**interface**
- `ICollectibleObjectPointProvider` (ICollectibleObjectPointProvider.cs)
**class**
- `CollectibleObjectService` (CollectibleObjectService.cs)

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CollectibleObject/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CollectibleObject/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CollectibleObject/CHANGELOG.md`
- Namespace: `TheOne.Features.CollectibleObject.Core.Models`, `System.Runtime.CompilerServices`, `TheOne.Features.CollectibleObject.Core.Services`
