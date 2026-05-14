---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Shader Graph — Nodes, Targets, Sub Graphs

## Creating a Shader Graph

Right-click in Project window:
- **Create > Shader Graph > URP > Lit Shader Graph** — PBR, affected by lights/shadows
- **Create > Shader Graph > URP > Unlit Shader Graph** — always fully lit, no shadow receive
- **Create > Shader Graph > URP > Sprite Lit Shader Graph** — 2D sprites
- **Create > Shader Graph > URP > Fullscreen Shader Graph** — post-processing effects

To assign to material: select material → change Shader to your `.shadergraph` asset.

## Master Stack (URP Lit Blocks)

Fragment stage (surface shader outputs):

| Block | Range | Description |
|-------|-------|-------------|
| Base Color | RGB | Albedo / diffuse color |
| Normal (Tangent Space) | XYZ | Surface normal |
| Smoothness | 0–1 | Surface micro-roughness |
| Metallic | 0–1 | PBR metallic workflow |
| Ambient Occlusion | 0–1 | AO shadow term |
| Alpha | 0–1 | Transparency |
| Alpha Clip Threshold | 0–1 | Cutout mask threshold |
| Emission | RGB | Self-illumination (HDR) |

Vertex stage: Position (Object), Normal (Object), Tangent (Object) — vertex displacement.

## Key Node Categories

### Input — Geometry
| Node | Output | Use |
|------|--------|-----|
| Position | Vector3 | Vertex/fragment position (World/Object/View/Tangent) |
| Normal Vector | Vector3 | Surface normal |
| UV | Vector2 | UV channel (0–3) |
| Vertex Color | Vector4 | Per-vertex RGBA color |
| Screen Position | Vector4 | Screen-space coordinates |
| View Direction | Vector3 | Camera to fragment direction |

### Input — Texture
| Node | Output | Use |
|------|--------|-----|
| Sample Texture 2D | Vector4 | Sample with UV |
| Texture 2D Asset | Texture2D | Texture reference property |
| Texel Size | Vector4 | `1/width`, `1/height`, `width`, `height` |

### Input — Scene
| Node | Output | Use |
|------|--------|-----|
| Camera | Various | Camera position, direction, z-buffer |
| Scene Depth | Float | Depth buffer value |
| Scene Color | Color | Opaque scene buffer |

### Math
| Node | Description |
|------|-------------|
| Lerp | Linear interpolate A→B by T |
| Step | Returns 0 or 1 based on threshold |
| Smoothstep | Smooth 0–1 transition |
| Remap | Map range [A,B] → [C,D] |
| Fresnel Effect | Rim lighting |
| Transform | Convert between coordinate spaces |

### Utility
| Node | Description |
|------|-------------|
| Custom Function | Inline HLSL (String) or external `.hlsl` (File) |
| Sub Graph | Reusable node group |
| Keyword | Toggle/enum branching |
| Branch | If/else node (bool select) |
| Split / Combine / Swizzle | Vector component manipulation |

## Custom Function Node

### String Mode
1. Add node: **Create Node > Utility > Custom Function**
2. Graph Inspector → Node Settings → Mode = **String**
3. Define Input/Output ports; write Body (just contents, no signature):
```hlsl
Out = A * B;
// Use $precision token for auto half/float:
$precision3 scaled = A * ($precision)B;
Out = scaled;
```

### File Mode
```hlsl
// MyShaderFunctions.hlsl
#ifndef MY_SHADER_FUNCTIONS_INCLUDED
#define MY_SHADER_FUNCTIONS_INCLUDED
void ScaleVector_float(float3 A, float B, out float3 Out) { Out = A * B; }
void ScaleVector_half(half3 A, half B, out half3 Out) { Out = A * B; }
#endif
```
Node settings: Mode = **File**, reference `.hlsl` asset, Function = `ScaleVector` (no suffix).

### URP lighting inside Custom Function
```hlsl
#ifdef SHADERGRAPH_PREVIEW
    Out = float3(0.5, 0.5, 0.5);
#else
    #if defined(UNIVERSAL_PIPELINE_CORE_INCLUDED)
        Light mainLight = GetMainLight();
        Out = mainLight.color * mainLight.direction;
    #endif
#endif
```

## Sub Graphs

Create: **Right-click > Create > Shader Graph > Sub Graph**
- Inputs via **Blackboard** (become node ports in parent graph)
- Outputs via **Output node** inside Sub Graph
- No Master Stack — mid-graph utilities only
- Cannot reference scene inputs (Scene Depth, Scene Color)
- Common uses: triplanar mapping, normal blend, color ramp, shared noise

## Blackboard — Shader Properties

| Type | HLSL Type | Use |
|------|-----------|-----|
| Float | `float` | Single value slider |
| Vector2/3/4 | `float2/3/4` | Multi-value |
| Color | `float4` | Color picker + HDR |
| Texture2D | `sampler2D` | Texture slot |
| Boolean | `bool` | Toggle keyword |
| Keyword | variant | Multi-compile branching |

**Reference Name** — internal property name (e.g. `_BaseColor`). Use in C#: `material.SetColor("_BaseColor", ...)`.

## Gotchas

- **Vertex Color in URP Lit**: Connect Vertex Color → Multiply with Base Color → Base Color block. Direct connection washes out base map.
- **Shader Graph vs code**: Shader Graph generates hidden HLSL. Cannot mix `Pass` blocks inside `.shadergraph`.
- **Preview guard**: Always add `#ifdef SHADERGRAPH_PREVIEW` in Custom Function or Editor preview fails to compile.
- **Sub Graph output type**: Must match parent expectation; add Combine node to pad missing channels.
- **Keyword limit**: Each Keyword node adds variants. Keep below 256 global keywords.
- **URP target required**: Generic Shader Graph (no URP target) shows pink in URP project. Always create via **URP > Lit Shader Graph**.
