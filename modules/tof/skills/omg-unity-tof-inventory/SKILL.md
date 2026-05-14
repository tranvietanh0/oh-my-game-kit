---
name: omg-unity-tof-inventory
description: "Inventory feature of TheOneFeature — A feature package for TheOne framework"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Inventory

## Purpose
Tracks and mutates currency balances through a generic `IRewardHandler` contract backed by `InventoryService` with VContainer DI registration.

## Public API
**interface**
- `IRewardHandler` (IRewardHandler.cs)
**class**
- `CurrencySelectorAttribute` (CurrencySelectorAttribute.cs)
- `CurrencySelectorAttributeDrawer` (CurrencySelectorAttributeDrawer.cs)
- `InventoryService` (InventoryService.cs)
- `InventoryValidator` (InventoryValidator.cs)
- `InventoryVContainer` (InventoryVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Inventory services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (6):**
**interface**
- `IRewardHandler` (IRewardHandler.cs)
**class**
- `CurrencySelectorAttribute` (CurrencySelectorAttribute.cs)
- `CurrencySelectorAttributeDrawer` (CurrencySelectorAttributeDrawer.cs)
- `InventoryService` (InventoryService.cs)
- `InventoryValidator` (InventoryValidator.cs)
- `InventoryVContainer` (InventoryVContainer.cs)

**Detected DI registrations:**
- `InventoryService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Inventory/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Inventory/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Inventory/CHANGELOG.md`
- Namespace: `TheOne.Features.Inventory.Core.Editor`, `TheOne.Features.Inventory.Core`, `TheOne.Features.Inventory.Core.DI`, `TheOne.Features.Inventory.Core.Services`
