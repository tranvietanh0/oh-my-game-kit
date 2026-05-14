---
name: omg-unity-tof-notification
description: "Notification feature of TheOneFeature — Smart notification permission handling for Unity mobile games with user-experience-aware timing."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Notification

## Purpose
The Notification feature provides a smart notification permission handling system for Unity mobile games with user experience-aware timing. It seamlessly integrates with the user experience system to request notification permissions at optimal moments, ensuring a non-intrusive user experience while maximizing permission grant rates.

## Public API
**class**
- `NotificationService` (NotificationService.cs)
- `NotificationValidator` (NotificationValidator.cs)
- `NotificationVContainer` (NotificationVContainer.cs)

## Signals / Events
_None detected._

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Notification services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (3):**
**class**
- `NotificationService` (NotificationService.cs)
- `NotificationValidator` (NotificationValidator.cs)
- `NotificationVContainer` (NotificationVContainer.cs)

**Detected DI registrations:**
- `NotificationService`

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Notification/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Notification/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Notification/CHANGELOG.md`
- Namespace: `TheOne.Features.NoInternet.Editor`, `TheOne.Features.Notification.DI`, `TheOne.Features.Notification.Services`
