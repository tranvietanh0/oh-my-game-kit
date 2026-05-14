---
name: omg-unity-tof-donate
description: "Donate feature of TheOneFeature — Complete guide to the Donate feature implementation, configuration, and UI patterns."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Donate

## Purpose
Complete guide to the Donate feature implementation, configuration, and UI patterns.

## Public API
**interface**
- `IDonateHeartProvider` (IDonateHeartProvider.cs)
- `IDonateService` (IDonateService.cs)
**class**
- `DonateConfigBlueprint` (DonateConfigBlueprint.cs)
- `DonateIdolRecord` (DonateIdolsBlueprint.cs)
- `DonateIdolsBlueprint` (DonateIdolsBlueprint.cs)
- `DonateService` (DonateService.cs)
- `DonateTypeRecord` (DonateTypesBlueprint.cs)
- `DonateTypesBlueprint` (DonateTypesBlueprint.cs)
- `DonateUserData` (DonateUserData.cs)
- `DonateUserDataController` (DonateUserDataController.cs)
- `DonateValidator` (DonateValidator.cs)
- `DonateVContainer` (DonateVContainer.cs)
- `SuccessUnlockDonateMilestoneCondition` (SuccessUnlockDonateMilestoneCondition.cs)
- `SuccessUnlockDonateMilestoneSignal` (SuccessUnlockDonateMilestoneSignal.cs)

## Signals / Events
- `SuccessUnlockDonateMilestoneSignal`

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Donate services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (15):**
**interface**
- `IDonateHeartProvider` (IDonateHeartProvider.cs)
- `IDonateService` (IDonateService.cs)
**class**
- `DonateConfigBlueprint` (DonateConfigBlueprint.cs)
- `DonateIdolRecord` (DonateIdolsBlueprint.cs)
- `DonateIdolsBlueprint` (DonateIdolsBlueprint.cs)
- `DonateService` (DonateService.cs)
- `DonateTypeRecord` (DonateTypesBlueprint.cs)
- `DonateTypesBlueprint` (DonateTypesBlueprint.cs)
- `DonateUserData` (DonateUserData.cs)
- `DonateUserDataController` (DonateUserDataController.cs)
- `DonateValidator` (DonateValidator.cs)
- `DonateVContainer` (DonateVContainer.cs)
- `SuccessUnlockDonateMilestoneCondition` (SuccessUnlockDonateMilestoneCondition.cs)
- `SuccessUnlockDonateMilestoneSignal` (SuccessUnlockDonateMilestoneSignal.cs)
**enum**
- `DonateResult` (DonateResult.cs)

**Detected DI registrations:**
- `DonateService`
- `DonateUserDataController`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Donate/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Donate/DOCUMENTATION_INDEX.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Donate/Donate.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Donate/DonateBlueprint.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Donate/DonateUserData.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Donate/CHANGELOG.md`
- Namespace: `TheOne.Features.Donate.Core.Editor`, `TheOne.Features.Donate.Core.Blueprints`, `Core.Features.Donate.Scripts.Conditions`, `TheOne.Features.Donate.Core.DI`, `TheOne.Features.Donate.Core.Models`, `TheOne.Features.Donate.Core.Services`
