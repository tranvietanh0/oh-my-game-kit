---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# MK Toon Artistic Styles Guide

## Artistic Mode Overview

| Enum Value | Style | Description |
|-----------|-------|-------------|
| `Off`(0) | None | Standard toon, no artistic overlay |
| `Drawn`(1) | Drawn/Painted | Hand-drawn look with brush stroke texture |
| `Hatching`(2) | Hatching | Cross-hatch pattern in shadow regions |
| `Sketch`(3) | Sketch | Pencil sketch appearance |

### Artistic Properties

| Property | Uniform | Type | Description |
|----------|---------|------|-------------|
| Artistic Mode | `_Artistic` | Enum(Artistic) | Active style |
| Artistic Projection | `_ArtisticProjection` | Enum | `TangentSpace`(0), `ScreenSpace`(1) |

**Projection modes:**
- `TangentSpace` — Pattern follows mesh surface (distorts with perspective)
- `ScreenSpace` — Pattern is screen-fixed (consistent size, no mesh distortion)

## Gooch Ramp Shading

Gooch shading blends warm (lit) and cool (shadow) colors for a stylized non-photorealistic look.

**Setup:**
1. Set `_GoochRampIntensity` > 0 to enable
2. `_GoochBrightColor` — warm tint for lit faces (typically warm yellow/orange)
3. `_GoochDarkColor` — cool tint for shadow faces (typically cool blue/purple)
4. Optionally assign `_GoochRamp` texture for custom ramp curve

```csharp
mat.SetFloat("_GoochRampIntensity", 0.7f);
mat.SetColor("_GoochBrightColor", new Color(1f, 0.9f, 0.6f));  // warm
mat.SetColor("_GoochDarkColor", new Color(0.3f, 0.4f, 0.8f));  // cool
```

## Iridescence

Creates a rainbow/oil-slick color shift that varies with view angle.

**Setup:**
1. Set `_Iridescence` = On(1)
2. Assign `_IridescenceRamp` — a gradient texture (typically left-to-right rainbow)
3. `_IridescenceSize` — controls how quickly the color shifts across the surface (0–5)
4. `_IridescenceColor` — additional tint multiplied over the ramp

```csharp
mat.SetInt("_Iridescence", 1);
mat.SetTexture("_IridescenceRamp", rainbowRampTex);
mat.SetFloat("_IridescenceSize", 2.0f);
mat.EnableKeyword("_MK_IRIDESCENCE");
```

## Global Shader Features

Configurable via `Window/MK/Toon/Install Wizard` or `Configuration.cs`:

| Feature | Default | Description |
|---------|---------|-------------|
| Multiply Vertex Color with Albedo | Off | Enables vertex color × albedo (useful for terrain) |
| Outline Distance Fading | Off | Linear/Exponential/Inverse outline fade with distance |
| Force Point Filtering | Off | Forces point filtering on all textures |
| Dissolve Screen Space Projection | Off | Forces dissolve pattern into screen space |
| Local Antialiasing | On | Smooths toon edges (disabled on mobile) |
| Detail UV Sets | Off | Allow UV7 for detail maps |
| Stylize System Shadows | Off | Apply toon style to shadow maps |
| Legacy Noise | Off | Use legacy noise calculation |
| Linear Light Attenuation | Off | URP only — more linear falloff for point/spot lights |

## Programmatic Material Setup

```csharp
var shader = Shader.Find("MK/Toon/URP/Standard/Simple");
var mat = new Material(shader);

// Base
mat.SetColor("_AlbedoColor", Color.white);
mat.SetTexture("_AlbedoMap", albedoTexture);
mat.EnableKeyword("_MK_ALBEDO_MAP");

// Toon: Cel with 3 bands
mat.SetInt("_Light", 1);            // Cel
mat.SetFloat("_LightBands", 3);
mat.SetFloat("_DiffuseSmoothness", 0.1f);
mat.SetFloat("_LightThreshold", 0.5f);
mat.EnableKeyword("_MK_LIGHT_CEL");

// Rim lighting
mat.SetInt("_Rim", 1);
mat.SetColor("_RimColor", new Color(1, 1, 1, 0.5f));
mat.SetFloat("_RimSize", 0.3f);
mat.EnableKeyword("_MK_RIM_DEFAULT");

// Outline (Outline variant only)
mat.SetFloat("_OutlineSize", 0.003f);
mat.SetColor("_OutlineColor", Color.black);

// REQUIRED: sync to Unity system properties
MK.Toon.Properties.UpdateSystemProperties(mat);
```

## Dissolve Death Animation

To animate unit death with dissolve:

```csharp
// Animate _DissolveAmount from 0 → 1 over death duration
mat.SetInt("_Dissolve", 2);  // BorderColor mode
mat.SetColor("_DissolveBorderColor", new Color(1f, 0.3f, 0f));  // orange glow
mat.SetFloat("_DissolveBorderSize", 0.1f);
// Then tween: mat.SetFloat("_DissolveAmount", t) where t: 0→1
```
