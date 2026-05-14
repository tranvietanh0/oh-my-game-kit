---
name: omg-unity-tof-time
description: "Time feature of TheOneFeature — A feature package for TheOne framework"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Time

## Purpose
Provides authoritative server-synchronized time and named period windows (`PeriodRecord`) for scheduling cooldowns and limited-time events.

## Public API
**class**
- `IsExternalInit` (IsExternalInit.cs)
- `PeriodBlueprint` (PeriodBlueprint.cs)
- `PeriodDataController` (PeriodDataController.cs)
- `SpecialPeriods` (SpecialPeriods.cs)
- `TimePeriodService` (TimePeriodService.cs)
- `TimeService` (TimeService.cs)
- `TimeValidator` (TimeValidator.cs)
- `TimeVContainer` (TimeVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Time services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (9):**
**class**
- `IsExternalInit` (IsExternalInit.cs)
- `PeriodBlueprint` (PeriodBlueprint.cs)
- `PeriodDataController` (PeriodDataController.cs)
- `SpecialPeriods` (SpecialPeriods.cs)
- `TimePeriodService` (TimePeriodService.cs)
- `TimeService` (TimeService.cs)
- `TimeValidator` (TimeValidator.cs)
- `TimeVContainer` (TimeVContainer.cs)
**record**
- `PeriodRecord` (PeriodBlueprint.cs)

**Detected DI registrations:**
- `PeriodDataController`
- `TimePeriodService`
- `TimeService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Time/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Time/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Time/CHANGELOG.md`
- Namespace: `TheOne.Features.Time.Editor`, `TheOne.Feature.Time.Core.Controllers`, `TheOne.Feature.Time.Core.DI`, `System.Runtime.CompilerServices`, `TheOne.Feature.Time.Core.Models`, `TheOne.Feature.Time.Core.Services`
