---
name: omg-unity-tof-secret-store
description: "Secret Store feature of TheOneFeature (auto-extracted from code)."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Secret Store

## Purpose
Secret Store module. See code references below.

## Public API
**interface**
- `ISecret` (ISecret.cs)
- `ISecretStoreService` (ISecretStoreService.cs)
**class**
- `SecretManager` (SecretManager.cs)
- `SecretStoreService` (SecretStoreService.cs)
- `SecretStoreToolModule` (SecretStoreToolModule.cs)
- `SecretStoreValidator` (SecretStoreValidator.cs)
- `SecretStoreVContainer` (SecretStoreVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Secret Store services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (7):**
**interface**
- `ISecret` (ISecret.cs)
- `ISecretStoreService` (ISecretStoreService.cs)
**class**
- `SecretManager` (SecretManager.cs)
- `SecretStoreService` (SecretStoreService.cs)
- `SecretStoreToolModule` (SecretStoreToolModule.cs)
- `SecretStoreValidator` (SecretStoreValidator.cs)
- `SecretStoreVContainer` (SecretStoreVContainer.cs)

**Detected DI registrations:**
- `SecretStoreService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/SecretStore/`
- Namespace: `TheOne.Features.SecretStore.DI`, `TheOne.Features.SecretStore.Editor`, `TheOne.Features.SecretStore`
