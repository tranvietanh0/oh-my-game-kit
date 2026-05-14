---
name: omg-unity-tof-screen-protection
description: "Screen Protection feature of TheOneFeature (auto-extracted from code)."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Screen Protection

## Purpose
Screen Protection module. See code references below.

## Public API
**class**
- `ScreenProtectionService` (ScreenProtectionService.cs)
- `ScreenProtectionValidator` (ScreenProtectionValidator.cs)
- `ScreenProtectionVContainer` (ScreenProtectionVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Screen Protection services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (3):**
**class**
- `ScreenProtectionService` (ScreenProtectionService.cs)
- `ScreenProtectionValidator` (ScreenProtectionValidator.cs)
- `ScreenProtectionVContainer` (ScreenProtectionVContainer.cs)

**Detected DI registrations:**
- `ScreenProtectionService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/ScreenProtection/`
- Namespace: `TheOne.Features.ScreenProtection.Core.DI`, `TheOne.Features.ScreenProtection.Editor`, `TheOne.Features.ScreenProtection.Core`
