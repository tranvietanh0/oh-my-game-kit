---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Unity Localization — API & Code Examples

## C# Usage

```csharp
using UnityEngine.Localization;
using UnityEngine.Localization.Settings;

public class LocalizedUI : MonoBehaviour {
    // Inspector reference:
    [SerializeField] LocalizedString startText = new("UI", "menu_start");

    void OnEnable() {
        startText.StringChanged += UpdateText;
    }

    void OnDisable() {
        startText.StringChanged -= UpdateText;
    }

    void UpdateText(string value) {
        label.text = value;  // Auto-updates on locale change
    }

    // One-shot load:
    async void LoadString() {
        string text = await LocalizationSettings.StringDatabase
            .GetLocalizedStringAsync("UI", "menu_start").Task;
    }

    // With arguments:
    async void LoadFormatted() {
        string text = await LocalizationSettings.StringDatabase
            .GetLocalizedStringAsync("Gameplay", "health_label",
                arguments: new object[] { currentHealth }).Task;
    }
}
```

## Smart Strings (Advanced Formatting)

Enable Smart String on entries for powerful formatting:

```
// Placeholder:
"Hello, {player-name}!"

// Plural:
"{count:plural:There is {} item|There are {} items}"

// Choose:
"{gender:choose(m|f|n):He|She|They} picked up the item"

// Conditional:
"{health:choose(>50|>20|>0):Healthy|Wounded|Critical}"

// Nested:
"You found {item-count} {item-count:plural:{item-name}|{item-name}s}"
```

## Locale Management

```csharp
// Get available locales:
var locales = LocalizationSettings.AvailableLocales.Locales;

// Get current locale:
var current = LocalizationSettings.SelectedLocale;

// Change locale:
LocalizationSettings.SelectedLocale =
    LocalizationSettings.AvailableLocales.GetLocale("vi");

// Startup locale selector (Project Settings → Localization):
// 1. CommandLineSelector (--language=vi)
// 2. SystemLocaleSelector (OS language)
// 3. SpecificLocaleSelector (fallback default)
```

## Asset Tables (Localized Assets)

```csharp
// Localized sprites, audio, prefabs:
[SerializeField] LocalizedSprite flagSprite;
[SerializeField] LocalizedAudioClip voiceLine;

async void LoadLocalizedAsset() {
    Sprite flag = await flagSprite.LoadAssetAsync().Task;
    AudioClip clip = await voiceLine.LoadAssetAsync().Task;
}
```

## TMPro Integration

```
1. Add "Localize String Event" component to TextMeshProUGUI
2. Assign String Reference (table + key)
3. Wire "Update String" event to TMPro.text setter
4. Per-locale fonts: Use Font Asset fallback list or locale-specific font overrides
```

## Import/Export

```
Window → Asset Management → Localization Tables
├── Export → CSV, Google Sheets, XLIFF
└── Import → Same formats

// Google Sheets Extension:
// Install: com.unity.localization (includes Google Sheets support)
// Configure: Service Account + Sheet ID in table editor
```

## Common Gotchas

1. **Async loading**: Strings load asynchronously. Use `StringChanged` event, not direct access
2. **Missing entries**: Falls back to key name. Set fallback locale in settings
3. **Smart String escaping**: Use `\{` for literal braces
4. **Locale codes**: Use ISO 639-1 (en, vi, ja, ko, zh-Hans, zh-Hant)
5. **Font coverage**: CJK languages need large font atlases — use SDF fonts + fallback chains
6. **RTL**: TMPro supports RTL via `isRightToLeftText`. Test with Arabic/Hebrew early
7. **No auto-define ships with the package**: Unity Localization 1.x does NOT define a scripting symbol when installed (unlike packages such as `UNITY_ADDRESSABLES` or `UNITY_INPUT_SYSTEM`). Code that references `UnityEngine.Localization.*` types behind a `#if UNITY_LOCALIZATION` guard will silently NEVER compile in. Convention: define your own `UNITY_LOCALIZATION_PRESENT` in **Player Settings → Other Settings → Scripting Define Symbols** (or via a `versionDefines` clause on the asmdef once `com.unity.localization` is installed) and gate localization-aware code on that. Without this, demo bootstrap classes that wire the resolver compile but never bind it — `LocBridge.T(key)` stays pass-through.
8. **Unity compiler compatibility**: Avoid C# `init` accessors in reusable Unity package DTOs unless the package explicitly provides `System.Runtime.CompilerServices.IsExternalInit`; use `set` for Unity 2022/Unity 6 compatibility.
9. **IMGUI EditorWindow exceptions**: Never let file IO/parser exceptions escape `OnGUI`; guard missing files and show validation issues instead, otherwise Unity can report misleading `Invalid GUILayout state` errors because Begin/End layout calls are interrupted.
10. **Unity Editor `PackageInfo` ambiguity**: `UnityEditor.PackageInfo` and `UnityEditor.PackageManager.PackageInfo` can collide; use an alias such as `using UnityPackageInfo = UnityEditor.PackageManager.PackageInfo;` before calling `FindForAssembly`.
11. **Locked CSV files**: `File.Exists` only proves the CSV path exists; `File.ReadAllText` can still throw `IOException` sharing violations if Excel/another process locks the file. Route CSV parsing through a safe helper that catches read/parse exceptions and reports validation issues instead of escaping `OnGUI`.
