---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Asset Hunter Pro — Gotchas & Workarounds

## 1. Scripts Appear Unused (FALSE POSITIVE)
**Issue**: MonoScripts referenced only by code (`AddComponent<T>`, `GetComponent<T>`) appear "unused" because build dependency tracking only sees serialized references.
**Fix**: Exclude `MonoScript` type in Settings, or verify each script manually.
**Severity**: HIGH — most common false positive.

## 2. Must Build First
**Issue**: No `.ahbuildinfo` file = no unused asset data. The tool REQUIRES a build to generate dependency data.
**Fix**: Run `File > Build Settings > Build` for the target platform. Even a failed build may generate partial data.

## 3. Addressables False Positives
**Issue**: Assets loaded via Addressables API (`Addressables.LoadAssetAsync<T>`) don't appear in build dependencies because they're loaded dynamically.
**Fix**: Exclude Addressable groups/folders from unused scan.

## 4. Large Project Performance
**Issue**: First scan of >10K assets can take 30-60 seconds. Dependency graph for deep hierarchies even longer.
**Fix**: Use cached results after first scan. Close other Editor windows during scan.

## 5. Dictionary Serialization
**Issue**: `AH_SettingsManager` uses custom serialization for `Dictionary<,>` (Unity can't serialize dictionaries natively). Settings may not persist correctly if accessed via reflection.
**Fix**: Use the public API methods (`AddPathToExcludeList`, etc.) instead of direct dictionary manipulation.

## 6. Build Report Only Available in Editor
**Issue**: All APIs are `#if UNITY_EDITOR`. No runtime access. Build reports are Editor artifacts.
**Fix**: For CI/CD, use batch mode (`-executeMethod`) with custom editor scripts.

## 7. DOTS SubScene Entities
**Issue**: Assets baked into SubScenes ARE tracked by build dependencies (they're serialized). But manually-spawned entities via `EntityCommandBuffer` reference no prefab and leave no asset trace.
**Fix**: Track ECB-created entity patterns separately. Asset Hunter can't detect these.

## 8. Stale Build Reports
**Issue**: Old `.ahbuildinfo` files may show assets as unused that are now used (or vice versa) if the project changed since the build.
**Fix**: Always use the LATEST build report. Delete old `.ahbuildinfo` files periodically.

## 9. Resources.Load False Positives
**Issue**: Assets in `Resources/` folders loaded via `Resources.Load("name")` use string paths — Asset Hunter may not track the string→asset connection.
**Fix**: Exclude `Resources/` folders, or migrate to Addressables.

## 10. Package Assets
**Issue**: UPM package assets (`Packages/com.*/`) are managed externally. Marking them "unused" is misleading.
**Fix**: Exclude all `Packages/` paths in Settings.
