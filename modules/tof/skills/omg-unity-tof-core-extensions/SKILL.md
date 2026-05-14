---
name: omg-unity-tof-core-extensions
description: "Extensions feature of TheOneFeature — All notable changes to this package will be documented in this file."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Extensions

## Purpose
All notable changes to this package will be documented in this file.

## Public API
**class**
- `OSAExtensions` (OSAExtensions.cs)
- `RectTransformExtensions` (RectTransformExtensions.cs)
- `Texture2DBlurExtensions` (Texture2DBlurExtensions.cs)
- `Texture2DExtensions` (Texture2DExtensions.cs)
- `TimeExtensions` (TimeExtensions.cs)
- `UniTaskExtensions` (UniTaskExtensions.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Extensions services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (6):**
**class**
- `OSAExtensions` (OSAExtensions.cs)
- `RectTransformExtensions` (RectTransformExtensions.cs)
- `Texture2DBlurExtensions` (Texture2DBlurExtensions.cs)
- `Texture2DExtensions` (Texture2DExtensions.cs)
- `TimeExtensions` (TimeExtensions.cs)
- `UniTaskExtensions` (UniTaskExtensions.cs)

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Extensions/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Extensions/CHANGELOG.md`
- Namespace: `TheOne.Features.Extensions`
