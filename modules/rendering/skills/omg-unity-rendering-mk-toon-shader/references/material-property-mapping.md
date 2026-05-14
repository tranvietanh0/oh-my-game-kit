---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# MK Toon Material Property Mapping

## Synty → MK Toon Migration

When migrating from Synty `Generic_Basic` to MK Toon:

| Synty Property | MK Toon Property | Notes |
|----------------|------------------|-------|
| `_Albedo_Map` | `_AlbedoMap` | Rename only (both Texture2D) |
| `_Color` | `_AlbedoColor` | Color tint — also tagged `[MainColor]` |
| `_Normal_Map` | `_NormalMap` | Normal texture |
| `_Metallic` | `_Metallic` | Same name |
| `_Smoothness` | `_Smoothness` | Same name |
| n/a | `_Light` | Set to Cel(1) or Banded(2) for toon look |
| n/a | `_LightBands` | 2–3 for hard toon, 6+ for soft |
| n/a | `_DiffuseSmoothness` | 0 = hard edge, 1 = smooth gradient |

## Full Property Reference

### Input (Core)
| Property | Uniform | Type | Description |
|----------|---------|------|-------------|
| Albedo Color | `_AlbedoColor` | Color | Base tint (tagged `[MainColor]`) |
| Albedo Map | `_AlbedoMap` | Texture2D | Base texture (keyword: `_MK_ALBEDO_MAP`) |
| Albedo Map Intensity | `_AlbedoMapIntensity` | Range(0,1) | Texture influence on color |
| Alpha Cutoff | `_AlphaCutoff` | Range(0,1) | Alpha clipping threshold |
| Metallic | `_Metallic` | Range(0,1) | PBS metallic value |
| Smoothness | `_Smoothness` | Range(0,1) | PBS smoothness |
| Roughness | `_Roughness` | Range(0,1) | Roughness workflow alternative |
| Normal Map | `_NormalMap` | Texture2D | Normal map (keyword: `_MK_NORMAL_MAP`) |
| Normal Map Intensity | `_NormalMapIntensity` | Float | Normal strength |
| Emission Color | `_EmissionColor` | Color(HDR) | Emission tint |
| Emission Map | `_EmissionMap` | Texture2D | Emission texture |
| Occlusion Map | `_OcclusionMap` | Texture2D | AO map |

### Stylize (Toon Shading)
| Property | Uniform | Type | Description |
|----------|---------|------|-------------|
| Light Mode | `_Light` | Enum(Light) | `Builtin`(0), `Cel`(1), `Banded`(2), `Ramp`(3) |
| Light Bands | `_LightBands` | Int(2–12) | Band count for Banded mode |
| Light Bands Scale | `_LightBandsScale` | Range(0,1) | Band smoothness |
| Light Threshold | `_LightThreshold` | Range(0,1) | Shadow threshold |
| Diffuse Smoothness | `_DiffuseSmoothness` | Range(0,1) | Shadow edge softness |
| Diffuse Threshold | `_DiffuseThresholdOffset` | Range(0,1) | Shadow threshold offset |
| Diffuse Ramp | `_DiffuseRamp` | Texture2D | Custom ramp texture (Ramp mode) |
| Wrapped Lighting | `_WrappedLighting` | Bool | Enable wrapped diffuse |
| Receive Shadows | `_ReceiveShadows` | Bool | Shadow reception toggle |

### Outline (Outline variants only)
| Property | Uniform | Type | Description |
|----------|---------|------|-------------|
| Outline Mode | `_Outline` | Enum(Outline) | `HullObject`(1), `HullOrigin`(2), `HullClip`(3) |
| Outline Size | `_OutlineSize` | Float(>=0) | Outline width |
| Outline Color | `_OutlineColor` | Color | Outline color |
| Outline Noise | `_OutlineNoise` | Range(-1,1) | Noise distortion |
| Outline Constant Size | `_OutlineConstantSize` | Bool | Screen-space constant width |

### Dissolve
| Property | Uniform | Type | Description |
|----------|---------|------|-------------|
| Dissolve Mode | `_Dissolve` | Enum | `Off`(0), `Default`(1), `BorderColor`(2), `BorderRamp`(3) |
| Dissolve Amount | `_DissolveAmount` | Range(0,1) | Progress (animate 0→1) |
| Dissolve Map | `_DissolveMap` | Texture2D | Noise pattern |
| Dissolve Border Size | `_DissolveBorderSize` | Range(0,1) | Border glow width |
| Dissolve Border Color | `_DissolveBorderColor` | Color | Border glow color |

### Rim Lighting
| Property | Uniform | Type | Description |
|----------|---------|------|-------------|
| Rim Mode | `_Rim` | Enum(Rim) | `Off`(0), `Default`(1), `Split`(2) |
| Rim Color | `_RimColor` | Color | Rim highlight color |
| Rim Size | `_RimSize` | Range(0,1) | Rim width |
| Rim Smoothness | `_RimSmoothness` | Range(0,1) | Rim edge softness |

### Gooch Ramp
| Property | Uniform | Type | Description |
|----------|---------|------|-------------|
| Gooch Ramp Intensity | `_GoochRampIntensity` | Range(0,1) | Blend strength |
| Gooch Ramp | `_GoochRamp` | Texture2D | Custom ramp texture |
| Gooch Bright Color | `_GoochBrightColor` | Color | Lit side warm color |
| Gooch Dark Color | `_GoochDarkColor` | Color | Shadow side cool color |

### Iridescence
| Property | Uniform | Type | Description |
|----------|---------|------|-------------|
| Iridescence | `_Iridescence` | Enum | `Off`(0), `On`(1) |
| Iridescence Ramp | `_IridescenceRamp` | Texture2D | Color ramp |
| Iridescence Size | `_IridescenceSize` | Range(0,5) | Effect size |
| Iridescence Color | `_IridescenceColor` | Color | Tint color |

## Workflow Enums Reference

| Enum | Values |
|------|--------|
| `Workflow` | Metallic(0), Specular(1), Roughness(2) |
| `Surface` | Opaque(0), Transparent(1) |
| `Light` | Builtin(0), Cel(1), Banded(2), Ramp(3) |
| `Dissolve` | Off(0), Default(1), BorderColor(2), BorderRamp(3) |
| `Rim` | Off(0), Default(1), Split(2) |
| `Outline` | HullObject(1), HullOrigin(2), HullClip(3) |
| `Diffuse` | Lambert(0), OrenNayar(1), Minnaert(2) |
| `Specular` | Off(0), Isotropic(1), Anisotropic(2) |

## Impostor Baking Compatibility

When baking Amplify Impostors from MK Toon materials:
- `ImpostorBatchBaker.CopyTextureProperties()` must map `_AlbedoMap` → URP/Lit `_BaseMap`
- `_AlbedoColor` → `_BaseColor` (MK Toon uses different names from URP standard)
- `_NormalMap` → `_BumpMap`, `_Smoothness`, `_Metallic` are same names
