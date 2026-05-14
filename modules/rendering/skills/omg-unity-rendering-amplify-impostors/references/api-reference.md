---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Amplify Impostors — API Reference

## Namespace

```csharp
using AmplifyImpostors;
```

## Core Classes

### AmplifyImpostor (MonoBehaviour)

Main component added to GameObjects/prefabs for baking.

```csharp
public class AmplifyImpostor : MonoBehaviour
{
    // Asset containing bake settings and output references
    public AmplifyImpostorAsset Data { get; set; }

    // Root transform of the object to bake
    public Transform RootTransform { get; set; }

    // LOD Group reference (auto-detected if present)
    public LODGroup LodGroup { get; set; }

    // Renderers to include in bake (auto-detected)
    public Renderer[] Renderers { get; set; }

    // How to integrate with LODGroup
    public LODReplacement m_lodReplacement;

    // Detected render pipeline
    public RenderPipelineInUse m_renderPipelineInUse;

    // LOD index for specific replacement modes
    public int m_insertIndex;

    // Reference to generated impostor GO
    public GameObject m_lastImpostor;

    // Billboard mesh cut mode
    public CutMode m_cutMode;

    // Output folder path
    public string m_folderPath;

    // Custom impostor name
    public string m_impostorName;
}
```

### AmplifyImpostorAsset (ScriptableObject)

Stores bake configuration and output references. Created via `Assets > Create > New Impostor`.

```csharp
[CreateAssetMenu(fileName = "New Impostor", order = 85)]
public class AmplifyImpostorAsset : ScriptableObject
{
    public Material Material;
    public Mesh Mesh;
    public ImpostorType ImpostorType = ImpostorType.Octahedron;
    public Vector2 TexSize = new Vector2(2048, 2048);
    public int HorizontalFrames = 16;  // Range: 1-32
    public int VerticalFrames = 16;    // Range: 1-33
    public int PixelPadding = 32;      // Range: 0-64
    public int MaxVertices = 8;        // Range: 4-16
    public float Tolerance = 0.15f;    // Range: 0-0.2
    public float NormalScale = 0.01f;  // Range: 0-1
    public bool DecoupleAxisFrames = false;
    public bool LockedSizes = true;
    public int SelectedSize = 2048;
    public AmplifyImpostorBakePreset Preset;
    public List<TextureOutput> OverrideOutput;
}
```

### AmplifyImpostorBakePreset (ScriptableObject)

Defines output texture configuration. Created via `Assets > Create > New Bake Preset`.

```csharp
[CreateAssetMenu(fileName = "New Bake Preset", order = 86)]
public class AmplifyImpostorBakePreset : ScriptableObject
{
    public const int DefaultOutputCount = 6;
    public Shader BakeShader;
    public Shader RuntimeShader;
    public int AlphaIndex = 0;
    public List<TextureOutput> Output;
}
```

## Enums

### ImpostorType
```csharp
public enum ImpostorType
{
    Spherical = 0,      // Traditional billboard with parallax
    Octahedron = 1,     // Full-sphere octahedral mapping (best)
    HemiOctahedron = 2  // Upper hemisphere only (trees/foliage)
}
```

### LODReplacement
```csharp
public enum LODReplacement
{
    DoNothing = 0,
    ReplaceCulled = 1,
    ReplaceLast = 2,           // Recommended
    ReplaceAllExceptFirst = 3,
    ReplaceSpecific = 4,
    ReplaceAfterSpecific = 5,
    InsertAfter = 6
}
```

### Image/Texture Settings
```csharp
public enum ImageFormat { PNG = 0, TGA = 1, EXR = 2 }
public enum TextureChannels { RGBA = 0, RGB = 1 }
public enum TextureCompression { None = 0, Normal = 1, High = 2, Low = 3 }
public enum TextureScale { Full = 1, Half = 2, Quarter = 4, Eighth = 8 }
public enum CutMode { Automatic = 0, Manual = 1 }
public enum RenderPipelineInUse { None = 0, HDRP = 1, URP = 2, Custom = 3 }
```

### TextureOutput
```csharp
[System.Serializable]
public class TextureOutput
{
    public int Index = -1;
    public OverrideMask OverrideMask = 0;
    public bool Active = true;
    public string Name = string.Empty;
    public TextureScale Scale = TextureScale.Full;
    public bool SRGB = false;
    public TextureChannels Channels = TextureChannels.RGBA;
    public TextureCompression Compression = TextureCompression.Normal;
    public ImageFormat ImageFormat = ImageFormat.TGA;
}
```

-> See [api-advanced-guide.md](api-advanced-guide.md) for Runtime Shaders, Shader GUIDs, Editor Scripting, and Scripting Define Symbols.
