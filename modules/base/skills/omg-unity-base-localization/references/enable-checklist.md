---
origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---

# Unity Localization — First-Time Enable Checklist

When a consumer project enables `THEONE_LOCALIZATION` for the first time AND installs `com.unity.localization` via the Unity Package Manager, two latent issues commonly surface that the basic Setup section does not cover. Both must be addressed in the same session as the enable, otherwise the project will not compile.

## (1) UITemplate's `TMPLocalization.cs` does not compile out-of-the-box

**Symptom:** After flipping `THEONE_LOCALIZATION` ON and letting Unity recompile, the Editor reports:

```
error CS0246: The type or namespace name 'Castle' could not be found
error CS0103: The name 'GetAllFields' does not exist in the current context
```

**Root cause:** UITemplate's Editor script `TMPLocalization.cs` declares `using Castle.DynamicProxy.Internal;` and relies on the `GetAllFields()` extension method shipped by Castle.Core. Castle.Core is NOT bundled in standard Unity / VContainer / Odin installs, so the file has never compiled in any consumer project unless Castle.Core was sideloaded. The file only "worked" historically because the gating define was always OFF in those projects — Unity stripped the file before it reached the compiler.

**Fix (preferred — works on every consumer immediately):** replace the Castle dependency with plain `System.Reflection`:

```csharp
// REMOVE:
// using Castle.DynamicProxy.Internal;

// REPLACE the Castle GetAllFields() call with:
using System.Reflection;

var fields = type.GetFields(
    BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
```

`BindingFlags.Instance | Public | NonPublic` mirrors what Castle's `GetAllFields()` returned for instance fields. If the original code walked the inheritance chain, also add `BindingFlags.FlattenHierarchy` OR loop over `type.BaseType` manually until `null`.

**Fix (alternative — if Castle.Core is genuinely needed elsewhere):** add Castle.Core via NuGetForUnity or as a direct DLL drop under `Assets/Plugins/`. This is the heavier option and only worth it when other Editor scripts also depend on Castle.

**Upstream:** open a PR against the UITemplate package to apply the System.Reflection fix at the source. Every future consumer benefits.

## (2) Consumer `Scripts.asmdef` needs explicit references

**Symptom:** After fixing (1), the project still fails:

```
error CS0246: The type or namespace name 'UITemplateLocalizationManager' could not be found
error CS0246: The type or namespace name 'LocalizationSettings' could not be found
```

**Root cause:** Assembly Definition references in Unity are **not transitive**. The consumer's main `Scripts.asmdef` must directly reference every assembly it uses — referencing an intermediate assembly does NOT pull in that assembly's own references. When `THEONE_LOCALIZATION` is OFF, the gated code paths are stripped pre-compile so the missing references are invisible. Enabling the define unmasks them all at once.

**Fix:** open the consumer's main `Scripts.asmdef` (typically `Assets/Scripts/Scripts.asmdef`) and add BOTH of these to the `references` array:

```json
{
  "name": "Scripts",
  "references": [
    "UITemplate.AutoLocalize",
    "Unity.Localization",
    "...existing references..."
  ]
}
```

- `UITemplate.AutoLocalize` — exposes `UITemplateLocalizationManager` and the gated localization wiring.
- `Unity.Localization` — exposes `LocalizationSettings`, `LocalizedString`, `StringChanged`, etc., from the Unity package.

Both are required. Adding only one leaves the other set of CS0246 errors.

**Verify:** after the asmdef edit, Unity recompiles and the consumer code that references `UITemplateLocalizationManager.Instance` or `LocalizationSettings.SelectedLocale` resolves cleanly.

## Quick checklist — paste into the enable PR description

- [ ] `THEONE_LOCALIZATION` define added to Player Settings → Scripting Define Symbols (per build target if needed)
- [ ] `com.unity.localization` installed via Package Manager
- [ ] Localization Settings asset created and added to Edit → Project Settings → Localization
- [ ] At least one Locale generated and one String Table Collection created
- [ ] UITemplate's `TMPLocalization.cs` patched: Castle.DynamicProxy.Internal removed, replaced with `System.Reflection.BindingFlags.Instance | Public | NonPublic`
- [ ] Consumer `Scripts.asmdef` references include both `UITemplate.AutoLocalize` AND `Unity.Localization`
- [ ] Project compiles with zero errors in both Editor and on each enabled build target
- [ ] Sample LocalizedString resolves at runtime (smoke test in a scene)

## Why both gotchas matter together

The two issues compound. (1) is masked when the define is OFF because the file is stripped pre-compile. (2) is masked when the define is OFF because the referencing code paths are stripped pre-compile. Both unmask simultaneously the moment the define flips ON, producing a wall of CS0246 errors that looks like the localization package itself is broken. It isn't — the wiring just requires these two extra steps that no tutorial currently documents.

## Related

- Main `SKILL.md` — basic setup and string-table authoring
- `api-and-examples.md` — C# usage, Smart Strings, locale management
- Unity Localization package documentation — https://docs.unity3d.com/Packages/com.unity.localization@latest
