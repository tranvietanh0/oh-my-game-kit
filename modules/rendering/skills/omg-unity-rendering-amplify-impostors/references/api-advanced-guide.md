---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Amplify Impostors — API Advanced Reference

## Runtime Shaders (URP)

After importing `URP Shaders 17.3.unitypackage`:

| Shader | Type | Use |
|--------|------|-----|
| `AmplifyImpostorsTemplateURP` | Octahedron/HemiOcta | Default URP impostor shader |
| `SphericalImpostorURP` | Spherical | Parallax-based spherical |
| `OctahedronImpostorURP` | Octahedron | Alternative octahedron |

## Shader GUIDs (for programmatic reference)

```csharp
// BiRP
public const string ShaderBiRP = "e82933f4c0eb9ba42aab0739f48efe21";
public const string ShaderOctaBiRP = "572f9be5706148142b8da6e9de53acdb";
// HDRP
public const string ShaderHDRP = "175c951fec709c44fa2f26b8ab78b8dd";
public const string ShaderOctaHDRP = "56236dc63ad9b7949b63a27f0ad180b3";
// URP
public const string ShaderURP = "da79d698f4bf0164e910ad798d07efdf";
public const string ShaderOctaURP = "83dd8de9a5c14874884f9012def4fdcc";
```

## Editor Scripting

### Programmatic Bake (Editor only)

```csharp
#if UNITY_EDITOR
// 1. Load or create AmplifyImpostorAsset
var asset = ScriptableObject.CreateInstance<AmplifyImpostorAsset>();
asset.ImpostorType = ImpostorType.Octahedron;
asset.TexSize = new Vector2(1024, 1024);
asset.HorizontalFrames = 8;
asset.VerticalFrames = 8;

// 2. Add component to source GO
var impostor = sourceGO.AddComponent<AmplifyImpostor>();
impostor.Data = asset;
impostor.m_lodReplacement = LODReplacement.ReplaceLast;

// 3. Bake (uses ImpostorBakingTools internally)
// The bake is triggered via the Inspector "Bake Impostor" button
// or programmatically through the editor inspector code
#endif
```

## Scripting Define Symbols

| Symbol | Purpose |
|--------|---------|
| `AMPLIFY_IMPOSTORS` | Optional define to detect AI presence in code (v1.0.2+) |
