---
name: omg-unity-tof-authentication
description: "Authentication feature of TheOneFeature — A comprehensive authentication system for Unity games that provides secure user authentication with support for multiple authentication m..."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Authentication

## Purpose
A comprehensive authentication system for Unity games that provides secure user authentication with support for multiple authentication methods.

## Public API
**interface**
- `IAuthenticationMethod` (IAuthenticationMethod.cs)
- `IAuthenticationService` (IAuthenticationService.cs)
**class**
- `AppleSignInPostProcessBuild` (AppleSignInPostProcessBuild.cs)
- `AppleSignInValidator` (AppleSignInValidator.cs)
- `AuthenticationPlayerData` (AuthenticationPlayerData.cs)
- `AuthenticationValidator` (AuthenticationValidator.cs)
- `AuthResult` (AuthResult.cs)
- `FacebookAuthenticationValidator` (FacebookAuthenticationValidator.cs)
- `FacebookPostProcessBuild` (FacebookPostProcessBuild.cs)

## Signals / Events
- `UserLoggedInAndDataFetchedSignal`
- `UserLoginResultSignal`
- `UserLogoutSignal`
- `UserStartLoginSignal`

## Config / ScriptableObjects
_None detected._

## Integration Steps
1. Reference package `TheOneFeature` in your project.
2. Register the Authentication services via VContainer (see Architecture).
3. Configure any ScriptableObjects listed in *Config* section.
4. Subscribe to signals listed in *Signals / Events* to react to state changes.

## Architecture
**Detected public types (12):**
**interface**
- `IAuthenticationMethod` (IAuthenticationMethod.cs)
- `IAuthenticationService` (IAuthenticationService.cs)
**class**
- `AppleSignInPostProcessBuild` (AppleSignInPostProcessBuild.cs)
- `AppleSignInValidator` (AppleSignInValidator.cs)
- `AuthenticationPlayerData` (AuthenticationPlayerData.cs)
- `AuthenticationValidator` (AuthenticationValidator.cs)
- `AuthResult` (AuthResult.cs)
- `FacebookAuthenticationValidator` (FacebookAuthenticationValidator.cs)
- `FacebookPostProcessBuild` (FacebookPostProcessBuild.cs)
**struct**
- `UserLogoutSignal` (UserLogoutSignal.cs)
- `UserStartLoginSignal` (UserStartLoginSignal.cs)
**enum**
- `AuthenticationMethod` (AuthenticationMethod.cs)

## Dependencies
_Run with FEATURE_MATRIX/DEPENDENCY_GRAPH integration to fill._

## Gotchas

_(None reported yet — open an issue in `The1Studio/oh-my-game-kit-unity` if you hit one.)_

## References
- Source: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Authentication/`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Authentication/Core/README.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Authentication/CHANGELOG.md`
- Doc: `UnityTheOneFeatureProject/Packages/TheOneFeature/Core/Features/Authentication/Core/CHANGELOG.md`
- Namespace: `TheOne.Features.Authentication.Core`, `TheOne.Feature.Authentication.Core.Editor`
