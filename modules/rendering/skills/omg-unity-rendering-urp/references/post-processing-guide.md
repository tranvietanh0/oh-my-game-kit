---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# URP Post-Processing & Volume System Guide

## Volume System Setup

1. Add **Volume** component to a GameObject
2. Set **Mode**: Global (everywhere) or Local (trigger collider + blend distance)
3. Assign a **Volume Profile** asset
4. Add overrides: Bloom, Color Adjustments, Tonemapping, Depth of Field, etc.

**Layer mask**: Camera must have matching Volume Layer Mask in its URP Camera Data.

## Built-in Volume Overrides

| Override | Key Settings | Use Case |
|----------|-------------|----------|
| **Bloom** | Intensity, Threshold, Scatter | Glow on bright areas |
| **Color Adjustments** | Exposure, Contrast, Saturation, Hue Shift | Color grading |
| **Tonemapping** | Mode (None/ACES/Neutral) | HDR → display range mapping |
| **Depth of Field** | Focus Distance, Aperture (Bokeh) | Camera focus effect |
| **Motion Blur** | Intensity, Clamp | Speed/rotation blur |
| **Vignette** | Intensity, Smoothness, Rounded | Darken screen edges |
| **Lift/Gamma/Gain** | Per-channel color wheels | Fine color grading |
| **Film Grain** | Intensity, Response | Cinematic grain |
| **Lens Distortion** | Intensity, X/Y Multiplier | Barrel/pincushion distortion |
| **Chromatic Aberration** | Intensity | RGB channel separation |
| **Panini Projection** | Distance, Crop to Fit | Wide-angle distortion fix |
| **SSAO** (Screen Space AO) | Intensity, Radius, Samples | Contact shadows |
| **SMAA/FXAA/TAA** | Quality, Blend Speed | Anti-aliasing |

## Scripting Volume Overrides

```csharp
// Get a Volume Profile override at runtime
Volume volume = GetComponent<Volume>();
if (volume.profile.TryGet<Bloom>(out var bloom))
{
    bloom.intensity.Override(5f);
}

// Or via VolumeManager (global)
VolumeManager.instance.stack.GetComponent<ColorAdjustments>().saturation.Override(-100f);
```

## Camera Stacking with Post-Processing

```
Base Camera (Render Type: Base)
  └── Overlay Camera (UI — Clear Depth only, no post-processing)
```

Post-processing applies only to the **Base Camera**. Overlay cameras inherit the base camera's output.

**C# setup:**
```csharp
var baseCamData = baseCamera.GetUniversalAdditionalCameraData();
baseCamData.cameraStack.Add(overlayCamera);
// Ensure overlay camera renderType = CameraRenderType.Overlay
```

## Custom Post-Processing (ScriptableRendererFeature)

For effects not available as Volume overrides, inject a custom render pass:

```csharp
public class MyPostProcessFeature : ScriptableRendererFeature
{
    public override void Create()
    {
        myPass = new MyPostProcessPass();
        myPass.renderPassEvent = RenderPassEvent.BeforeRenderingPostProcessing;
    }

    public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData data)
    {
        renderer.EnqueuePass(myPass);
    }
}
```

See `references/urp-render-features.md` for full pass implementation patterns.

## HDR Requirements

Post-processing effects (Bloom, Tonemapping, Color Grading) require **HDR** enabled:
- URP Asset → Quality → **HDR** = On
- Camera → Rendering → **HDR** = On

Without HDR: Bloom clamps at 1.0, ACES tonemapping has no effect.

## Performance Notes

| Effect | Cost | Notes |
|--------|------|-------|
| Bloom | Medium | Reduce Scatter + lower resolution threshold |
| SSAO | High | Use lower Sample Count on mobile |
| Depth of Field (Bokeh) | High | Avoid on mobile; use Gaussian mode |
| Motion Blur | Medium | Clamp value limits sample count |
| TAA | Medium | Adds slight blur; best for desktop |
| FXAA | Low | Fast, less quality |
| SMAA | Low-Medium | Better than FXAA, cheaper than TAA |

**Mobile recommendation**: Bloom (low intensity) + Color Adjustments + FXAA only.

## Gotchas

- **Volume Layer mismatch** — Camera won't pick up Volume effects if layer masks don't match. Check camera's Volume Layer Mask setting.
- **HDR off → Bloom broken** — Bloom requires HDR. Pink/no-glow = check HDR setting.
- **Overlay camera post-processing** — Overlay cameras do NOT apply post-processing. Only Base Camera processes volumes.
- **SSAO in Forward** — SSAO requires DepthNormals pass. Custom shaders must include `DepthNormals` pass or SSAO won't affect them.
- **Tonemapping None** — In HDR scenes, skip tonemapping = washed-out output. Always apply Neutral or ACES for final output.
