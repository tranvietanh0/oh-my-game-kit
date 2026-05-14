---
name: omg-unity-tof-card-collection
description: "Card Collection feature of TheOneFeature — The core module powers the limited-time card collection event. It manages player state, imports Blueprint data, exposes pack/chest/sessio..."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Card Collection

## Purpose
The core module powers the limited-time card collection event. It manages player state, imports Blueprint data, exposes pack/chest/session APIs, and raises signals for the UI layer. The module targets the following loop:

## Public API
**class**
- `CardCollectionCardPacksBlueprint` (CardCollectionCardPacksBlueprint.cs)
- `CardCollectionCardsBlueprint` (CardCollectionCardsBlueprint.cs)
- `CardCollectionColorPalettesBlueprint` (CardCollectionColorPalettesBlueprint.cs)
- `CardCollectionMiscParamBlueprint` (CardCollectionMiscParamBlueprint.cs)
- `CardCollectionService` (CardCollectionService.cs)
- `CardCollectionSessionsBlueprint` (CardCollectionSessionsBlueprint.cs)
- `CardCollectionSetsBlueprint` (CardCollectionSetsBlueprint.cs)
- `CardCollectionStarChestsBlueprint` (CardCollectionStarChestsBlueprint.cs)
- `CardCollectionUIAction` (CardCollectionUIAction.cs)
- `CardCollectionUserData` (CardCollectionUserData.cs)
- `CardCollectionUserDataController` (CardCollectionUserDataController.cs)
- `CardCollectionValidator` (CardCollectionValidator.cs)
- `CardCollectionVContainer` (CardCollectionVContainer.cs)
- `CardPackRecord` (CardCollectionCardPacksBlueprint.cs)
- `CardRecord` (CardCollectionCardsBlueprint.cs)
- `ColorPaletteRecord` (CardCollectionColorPalettesBlueprint.cs)
- `RewardRecord` (RewardRecord.cs)
- `SessionRecord` (CardCollectionSessionsBlueprint.cs)
- `SetRecord` (CardCollectionSetsBlueprint.cs)
- `StarChestRecord` (CardCollectionStarChestsBlueprint.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Card Collection services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (26):**
**class**
- `CardCollectionCardPacksBlueprint` (CardCollectionCardPacksBlueprint.cs)
- `CardCollectionCardsBlueprint` (CardCollectionCardsBlueprint.cs)
- `CardCollectionColorPalettesBlueprint` (CardCollectionColorPalettesBlueprint.cs)
- `CardCollectionMiscParamBlueprint` (CardCollectionMiscParamBlueprint.cs)
- `CardCollectionService` (CardCollectionService.cs)
- `CardCollectionSessionsBlueprint` (CardCollectionSessionsBlueprint.cs)
- `CardCollectionSetsBlueprint` (CardCollectionSetsBlueprint.cs)
- `CardCollectionStarChestsBlueprint` (CardCollectionStarChestsBlueprint.cs)
- `CardCollectionUIAction` (CardCollectionUIAction.cs)
- `CardCollectionUserData` (CardCollectionUserData.cs)
- `CardCollectionUserDataController` (CardCollectionUserDataController.cs)
- `CardCollectionValidator` (CardCollectionValidator.cs)
- `CardCollectionVContainer` (CardCollectionVContainer.cs)
- `CardPackRecord` (CardCollectionCardPacksBlueprint.cs)
- `CardRecord` (CardCollectionCardsBlueprint.cs)
- `ColorPaletteRecord` (CardCollectionColorPalettesBlueprint.cs)
- `RewardRecord` (RewardRecord.cs)
- `SessionRecord` (CardCollectionSessionsBlueprint.cs)
- `SetRecord` (CardCollectionSetsBlueprint.cs)
- `StarChestRecord` (CardCollectionStarChestsBlueprint.cs)
**struct**
- `OnCardCollectedEvent` (CardCollectionEvents.cs)
- `OnCardStarAddedEvent` (CardCollectionEvents.cs)
- `OnSessionCompletedEvent` (CardCollectionEvents.cs)
- `OnSessionEndedEvent` (CardCollectionEvents.cs)
- `OnSetCompletedEvent` (CardCollectionEvents.cs)
**enum**
- `CardType` (CardCollectionCardsBlueprint.cs)

**Detected DI registrations:**
- `CardCollectionHelper`
- `CardCollectionService`
- `CardCollectionUserDataController`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CardCollection/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CardCollection/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CardCollection/CODE_ORGANIZATION.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CardCollection/ENCAPSULATION_REFACTORING.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CardCollection/QUICK_TEST_GUIDE.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/CardCollection/SERVICE_ORGANIZATION.md`
- Namespace: `TheOne.Features.CardCollection.Core.DI`, `TheOne.Features.CardCollection.Core.Editor`, `TheOne.Features.CardCollection.Core.Models`, `TheOne.Features.CardCollection.Core.Services`
