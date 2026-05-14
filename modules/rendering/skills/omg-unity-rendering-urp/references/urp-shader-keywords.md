---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# URP Shader Multi-Compile Keywords Reference

## Required Keywords by Pass

### ForwardLit Pass (`"LightMode" = "UniversalForward"`)

```hlsl
// Shadows — MUST include _MAIN_LIGHT_SHADOWS_SCREEN for Unity 6 screen-space shadows
#pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
#pragma multi_compile _ _SHADOWS_SOFT

// Additional lights (skip if shader only uses main directional)
#pragma multi_compile _ _ADDITIONAL_LIGHTS_VERTEX _ADDITIONAL_LIGHTS
#pragma multi_compile _ _ADDITIONAL_LIGHT_SHADOWS

// Fog
#pragma multi_compile_fog

// Light features (optional — add only if needed to reduce variants)
#pragma multi_compile _ _LIGHT_LAYERS
#pragma multi_compile _ _LIGHT_COOKIES
#pragma multi_compile _ _SCREEN_SPACE_OCCLUSION
#pragma multi_compile _ _FORWARD_PLUS

// Lightmaps (if supporting baked lighting)
#pragma multi_compile _ LIGHTMAP_ON
#pragma multi_compile _ DIRLIGHTMAP_COMBINED
#pragma multi_compile _ LIGHTMAP_SHADOW_MIXING
#pragma multi_compile _ SHADOWS_SHADOWMASK
```

### ShadowCaster Pass (`"LightMode" = "ShadowCaster"`)

No multi_compile needed — shadow caster only writes depth.

### DepthOnly Pass (`"LightMode" = "DepthOnly"`)

No multi_compile needed — depth only writes depth.

### DepthNormals Pass (`"LightMode" = "DepthNormals"`)

No multi_compile needed — writes depth + normals for SSAO.

## Key URP HLSL Includes

```hlsl
// Core transforms, matrices, time, fog
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

// Lighting: GetMainLight, GetAdditionalLight, SampleSH
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

// Shadows: TransformWorldToShadowCoord, ApplyShadowBias
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Shadows.hlsl"

// Space transforms from SRP Core
#include "Packages/com.unity.render-pipelines.core/ShaderLibrary/SpaceTransforms.hlsl"
```

## Key HLSL Functions

| Function | Include | Returns | Notes |
|----------|---------|---------|-------|
| `GetMainLight()` | Lighting.hlsl | `Light` struct | No shadows |
| `GetMainLight(shadowCoord)` | Lighting.hlsl | `Light` struct | With shadow attenuation |
| `GetAdditionalLight(i, posWS)` | Lighting.hlsl | `Light` struct | i-th additional light |
| `GetAdditionalLightsCount()` | Lighting.hlsl | `int` | Number of additional lights |
| `SampleSH(normalWS)` | Lighting.hlsl | `half3` | Ambient from spherical harmonics |
| `TransformWorldToShadowCoord(posWS)` | Shadows.hlsl | `float4` | Shadow map UV coord |
| `TransformObjectToHClip(posOS)` | Core.hlsl | `float4` | Object → clip space |
| `TransformObjectToWorld(posOS)` | Core.hlsl | `float3` | Object → world space |
| `GetVertexPositionInputs(posOS)` | Core.hlsl | struct | positionCS/WS/VS/NDC |
| `GetVertexNormalInputs(normalOS)` | Core.hlsl | struct | normalWS, tangentWS |
| `ComputeFogFactor(posCS.z)` | Core.hlsl | `float` | Fog density |
| `MixFog(color, fogFactor)` | Core.hlsl | `half3` | Apply fog to color |

## Light Struct

```hlsl
struct Light {
    half3  direction;           // light direction (world space)
    half3  color;               // light color × intensity
    float  distanceAttenuation; // 1 for directional, falloff for point/spot
    half   shadowAttenuation;   // 0 = fully in shadow, 1 = fully lit
    uint   layerMask;           // light layer mask
};
```

## SRP Batcher CBUFFER Rules

```hlsl
// ALL non-texture properties must be in UnityPerMaterial CBUFFER
// CBUFFER must be IDENTICAL across ALL passes in the shader
CBUFFER_START(UnityPerMaterial)
    float4 _BaseMap_ST;     // _ST suffix auto-generated for textures
    float4 _BaseColor;
    float  _Smoothness;
    float  _Metallic;
CBUFFER_END

// Textures go OUTSIDE the CBUFFER
TEXTURE2D(_BaseMap);
SAMPLER(sampler_BaseMap);
```

## Common Gotchas

- **_MAIN_LIGHT_SHADOWS_SCREEN**: Unity 6 URP default — missing this keyword means no shadows
- **TransformWorldToShadowCoord without shadow keywords**: returns garbage if shadow keywords not compiled
- **GetMainLight() vs GetMainLight(shadowCoord)**: without shadowCoord, `shadowAttenuation` is always 1
- **SampleSH returns skybox color**: if scene uses skybox ambient, SH contains skybox hue (often blue) — multiply by albedo to tint
- **multi_compile variant explosion**: each `multi_compile` doubles variants — use `shader_feature` for editor-only features
- **shader_feature vs multi_compile**: `shader_feature` strips unused variants in builds; `multi_compile` keeps all
