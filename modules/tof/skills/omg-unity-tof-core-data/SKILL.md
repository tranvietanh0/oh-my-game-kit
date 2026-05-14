---
name: omg-unity-tof-core-data
description: "Data feature of TheOneFeature — A flexible condition system for TheOne Feature framework that provides a unified interface for evaluating various game conditions. This m..."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Data

## Purpose
A flexible condition system for TheOne Feature framework that provides a unified interface for evaluating various game conditions. This module supports composite conditions, time-based conditions, and level requirements with dependency injection support.

## Public API
**interface**
- `ICommonCondition` (ICommonCondition.cs)
**class**
- `AbstractConverter` (AbstractConverter.cs)
- `CommonCondition` (ICommonCondition.cs)
- `CommonConditionDictionary` (CommonConditionDictionary.cs)
- `CommonConditionToolModule` (CommonConditionToolModule.cs)
- `CompositeCondition` (CompositeCondition.cs)
- `DayOfWeekRepeatableCondition` (DayOfWeekRepeatableCondition.cs)
- `LevelCondition` (LevelCondition.cs)
- `LevelInCurrentSessionCondition` (LevelInCurrentSessionCondition.cs)
- `LevelResultCondition` (LevelResultCondition.cs)
- `RawBooleanCondition` (RawBooleanCondition.cs)
- `ScreenCondition` (ScreenCondition.cs)
- `SessionCondition` (SessionCondition.cs)
- `ShortTypeBinder` (ShortTypeBinder.cs)
- `TimeOfDayRepeatableCondition` (TimeOfDayRepeatableCondition.cs)
- `TimeRangeCondition` (TimeRangeCondition.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Data services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (20):**
**interface**
- `ICommonCondition` (ICommonCondition.cs)
**class**
- `AbstractConverter` (AbstractConverter.cs)
- `CommonCondition` (ICommonCondition.cs)
- `CommonConditionDictionary` (CommonConditionDictionary.cs)
- `CommonConditionToolModule` (CommonConditionToolModule.cs)
- `CompositeCondition` (CompositeCondition.cs)
- `DayOfWeekRepeatableCondition` (DayOfWeekRepeatableCondition.cs)
- `LevelCondition` (LevelCondition.cs)
- `LevelInCurrentSessionCondition` (LevelInCurrentSessionCondition.cs)
- `LevelResultCondition` (LevelResultCondition.cs)
- `RawBooleanCondition` (RawBooleanCondition.cs)
- `ScreenCondition` (ScreenCondition.cs)
- `SessionCondition` (SessionCondition.cs)
- `ShortTypeBinder` (ShortTypeBinder.cs)
- `TimeOfDayRepeatableCondition` (TimeOfDayRepeatableCondition.cs)
- `TimeRangeCondition` (TimeRangeCondition.cs)
**enum**
- `CompareType` (CompareType.cs)
- `CompositeConditionType` (CompositeConditionType.cs)
- `TimeRangeConditionType` (TimeRangeConditionType.cs)
- `TrackingLevelType` (TrackingLevelType.cs)

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Data/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Data/CommonCondition/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Data/JsonConverter/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Data/CommonCondition/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Data/CommonCondition/Core/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Data/JsonConverter/CHANGELOG.md`
- Namespace: `TheOne.Features.Data.CommonCondition.Condition`, `TheOne.Features.Data.CommonCondition.Enum`, `TheOne.Features.Data.CommonCondition.Editor`, `TheOne.Features.Data.JsonConverter`
