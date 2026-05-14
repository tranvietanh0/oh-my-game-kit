---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Shared Constants Pattern

When the same value appears in **2+ files**, create a shared constants class:

```csharp
namespace [YourPackage].Editor
{
    /// <summary>Shared shader name, property, and keyword constants.</summary>
    internal static class ShaderConstants
    {
        // Shader names
        internal const string UrpLit = "Universal Render Pipeline/Lit";

        // Property names (prefix: Prop)
        internal const string PropBaseMap = "_BaseMap";
        internal const string PropSmoothness = "_Smoothness";

        // Keywords (prefix: Keyword)
        internal const string KeywordAlphaTest = "_ALPHATEST_ON";

        // Tags (prefix: Tag)
        internal const string TagRenderType = "RenderType";
    }
}
```

When a value is **file-local only**, use `private const`:

```csharp
public static class MyEditorTool
{
    private const string TilesParentName = "Tiles";
    private const string ObstaclesParentName = "Obstacles";
    private const float DefaultSmoothness = 0.5f;
}
```

## Naming Conventions for Constants

| Prefix | Use case | Example |
|--------|----------|---------|
| `Prop` | Shader property name | `PropBaseMap = "_BaseMap"` |
| `Keyword` | Shader keyword | `KeywordAlphaTest = "_ALPHATEST_ON"` |
| `Tag` | Shader/material tag | `TagRenderType = "RenderType"` |
| *(none)* | Shader name or other string | `UrpLit = "Universal Render Pipeline/Lit"` |

## Where to Put Constants

| Scope | Location |
|-------|----------|
| Cross-file (editor tools) | `[Package].Editor` namespace, `internal static class ShaderConstants` |
| Cross-file (runtime) | `[Package]` namespace, `internal static class GameplayConstants` |
| Single file | `private const` inside the class |
