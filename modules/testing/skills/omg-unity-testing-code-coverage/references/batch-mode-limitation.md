---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: testing
protected: false
---
# Batch Mode Package Coverage Limitation

## The Problem

Batch mode (`-batchmode`) does NOT instrument UPM package assemblies. Coverage reports show **0 classes analyzed** for any code in `Packages/` — regardless of configuration.

Affected assemblies in this project:
- `com.the1studio.dots-core` → 0% in batch mode
- `com.the1studio.dots-battlefield` → 0% in batch mode
- `Assembly-CSharp` (Assets/) → captured correctly

## All Attempted Workarounds (All Failed)

| Attempt | Flag Used | Result |
|---------|-----------|--------|
| Explicit assembly filter | `assemblyFilters:+com.the1studio.dots-*` | 0 classes captured |
| Package alias | `assemblyFilters:+<packages>` | 0 classes captured |
| Path filter | `pathFilters:+**/Packages/**` | No effect |
| Burst disable | `--burst-disable-compilation` | No effect |
| Debug mode | `-debugCodeOptimization` | No effect |

Confirmed via 2+ hours of testing (October 2025, 146 tests passed, all showed 0% batch coverage).
Re-confirmed March 2026 with `assemblyFilters:+DOTSRPG.*` -- still 0% for package assemblies.
See: `See the unity-code-coverage skill for details`

## Why It Happens

GUI mode instruments all loaded assemblies (including packages) at editor startup. Batch mode only instruments assemblies in `Assets/` at launch. This is an engine-level limitation in Unity 6.x, not a configuration issue.

## Settings.json Investigation (2026-03-14)

The "Enable Code Coverage" toggle is stored via `CoveragePreferences` which wraps `UnityEditor.SettingsManagement.Settings`. Storage path: `ProjectSettings/Packages/com.unity.testtools.codecoverage/Settings.json`.

**Key finding**: Settings.json starts and remains EMPTY (`m_DictionaryValues: []`) until the user toggles the checkbox inside the **Code Coverage window** (Window > Analysis > Code Coverage). The toggle also sets `Coverage.enabled` (Unity runtime API) which is the actual gate for instrumentation. On domain reload, the window reads `Coverage.enabled` to sync its checkbox state -- NOT from Settings.json.

The EditorPrefs file (`~/.local/share/unity3d/prefs`) does NOT contain any coverage-related keys. The setting is exclusively in Settings.json (project-scoped, not user-scoped).

## Workarounds

### Option A — GUI Mode (Recommended)
Window → Code Coverage → enable → Test Runner → Run All → `CodeCoverage/Report/index.html`

Full package coverage captured correctly.

### Option B — Test Count Proxy (CI/CD)
Run tests without coverage flags:
```bash
unity-editor -batchmode -testPlatform EditMode -runTests -testResults ./TestResults.xml
```
Use test count as coverage proxy. 270+ passing tests for `com.the1studio.dots-core` = strong coverage signal.

### Option C — GUI-based CI Runner
Use a CI machine with a display (VM, not headless container). Uncommon but possible.

## Future

Unity roadmap does not confirm a fix for batch mode package coverage. Monitor v1.4+ release notes.
