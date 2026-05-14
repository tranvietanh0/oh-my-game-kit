---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Isometric Rendering Guide

## BillboardSprite Shader

Located at `Packages/com.the1studio.dots-core/Runtime/Rendering/BillboardSprite.shader`.

### Shader Properties
```hlsl
Properties {
    _BaseMap ("Sprite Texture", 2D) = "white" {}
    _BaseColor ("Color", Color) = (1, 1, 1, 1)
    _Cutoff ("Alpha Cutoff", Range(0, 1)) = 0.5
}
```

### Tags
```hlsl
Tags {
    "RenderType" = "TransparentCutout"
    "RenderPipeline" = "UniversalPipeline"
    "Queue" = "AlphaTest"
}
```

### Three URP Passes

1. **BillboardForward** (`LightMode = UniversalForward`) — main color output with alpha clip
2. **BillboardShadowCaster** (`LightMode = ShadowCaster`) — shadow map with bias correction
3. **DepthOnly** (`LightMode = DepthOnly`) — depth prepass, `ColorMask 0`

All passes share the same billboard vertex logic and use `Cull Off`.

### Billboard Vertex Transform

The key technique: instead of using the object's model matrix rotation, offset vertices from the object center along camera-aligned axes.

```hlsl
float3 centerWS = TransformObjectToWorld(float3(0, 0, 0));

// Scale extraction from M matrix columns
float scaleXLen = length(float3(UNITY_MATRIX_M[0][0], UNITY_MATRIX_M[1][0], UNITY_MATRIX_M[2][0]));
float scaleYLen = length(float3(UNITY_MATRIX_M[0][1], UNITY_MATRIX_M[1][1], UNITY_MATRIX_M[2][1]));

// Camera-aligned axes
float3 camRight = normalize(UNITY_MATRIX_V[0].xyz);
float3 camUp    = normalize(UNITY_MATRIX_V[1].xyz);

float3 worldPos = centerWS
    + camRight * input.positionOS.x * scaleXLen
    + camUp    * input.positionOS.y * scaleYLen;

output.positionCS = TransformWorldToHClip(worldPos);
```

### Shadow Bias Correction

Billboard quads need special shadow handling. The face normal is approximated as camera forward:

```hlsl
float3 normalWS = -normalize(UNITY_MATRIX_V[2].xyz);

#if _CASTING_PUNCTUAL_LIGHT_SHADOW
    float3 lightDir = normalize(_LightPosition - worldPos);
#else
    float3 lightDir = _LightDirection;
#endif

worldPos = ApplyShadowBias(worldPos, normalWS, lightDir);
```

### DOTS Instancing Block

Required for per-entity material property overrides via Entities Graphics:

```hlsl
#pragma target 4.5                    // Required for DOTS instancing
#pragma multi_compile_instancing
#pragma multi_compile _ DOTS_INSTANCING_ON

#ifdef DOTS_INSTANCING_ON
    UNITY_DOTS_INSTANCING_START(MaterialPropertyMetadata)
        UNITY_DOTS_INSTANCED_PROP(float4, _BaseMap_ST)
        UNITY_DOTS_INSTANCED_PROP(float4, _BaseColor)
        UNITY_DOTS_INSTANCED_PROP(float , _Cutoff)
    UNITY_DOTS_INSTANCING_END(MaterialPropertyMetadata)

    #define _BaseMap_ST UNITY_ACCESS_DOTS_INSTANCED_PROP_WITH_DEFAULT(float4, _BaseMap_ST)
    #define _BaseColor  UNITY_ACCESS_DOTS_INSTANCED_PROP_WITH_DEFAULT(float4, _BaseColor)
    #define _Cutoff     UNITY_ACCESS_DOTS_INSTANCED_PROP_WITH_DEFAULT(float , _Cutoff)
#endif
```

## Material Setup (C# Editor)

```csharp
var mat = new Material(Shader.Find("DOTSCore/BillboardSprite"));
mat.SetTexture("_BaseMap", spriteTexture);
mat.SetColor("_BaseColor", Color.white);     // Per-entity override via SpriteColor
mat.SetFloat("_Cutoff", 0.5f);
mat.SetOverrideTag("RenderType", "TransparentCutout");
mat.renderQueue = (int)RenderQueue.AlphaTest;
mat.EnableKeyword("_ALPHATEST_ON");
mat.enableInstancing = true;
```

## Quad Mesh for Billboards

Isometric billboards use a vertical quad (XY plane, not XZ like top-down):

```csharp
mesh.vertices = new[] {
    new Vector3(-0.5f, 0f, 0f),   // Bottom-left
    new Vector3( 0.5f, 0f, 0f),   // Bottom-right
    new Vector3(-0.5f, 1f, 0f),   // Top-left
    new Vector3( 0.5f, 1f, 0f),   // Top-right
};
```

The billboard shader ignores mesh orientation and aligns to camera anyway, but the UV mapping matters for sprite display.

## Per-Entity Properties

| Component | MaterialProperty | Controls |
|-----------|-----------------|----------|
| `SpriteColor` | `_BaseColor` | Team color tint |
| `SpriteSheetUV` | `_BaseMap_ST` | Sprite sheet frame (UV offset/scale) |

Both use `[MaterialProperty("...")]` attribute for automatic DOTS Entities Graphics override.

## Performance Notes

- Cutout (AlphaTest) enables SRP Batcher batching — all billboard entities with same material batch together
- `enableInstancing = true` on material is required for GPU instancing fallback
- Shadow pass adds ~30% draw call overhead but provides grounding visual cue
- For 100+ units, billboard quads are 10-50x cheaper than skinned mesh renderers
