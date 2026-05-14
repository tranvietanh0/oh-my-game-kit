---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# URP Render Features — Detailed Reference

## ScriptableRendererFeature Lifecycle

```
Create() → called once when feature is created or settings change
AddRenderPasses() → called every frame per camera
Dispose() → cleanup when feature is removed
```

## Full Render Feature Template (Unity 6 Render Graph)

```csharp
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.RenderGraphModule;
using UnityEngine.Rendering.Universal;

public sealed class MyRendererFeature : ScriptableRendererFeature
{
    [SerializeField] private Material m_Material;
    private MyRenderPass m_Pass;

    public override void Create()
    {
        m_Pass = new MyRenderPass(name, m_Material);
    }

    public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)
    {
        if (m_Material == null || m_Pass == null) return;
        if (renderingData.cameraData.cameraType == CameraType.Preview) return;

        m_Pass.renderPassEvent = RenderPassEvent.AfterRenderingOpaques;
        renderer.EnqueuePass(m_Pass);
    }

    protected override void Dispose(bool disposing) => m_Pass?.Dispose();
}
```

## Custom Post-Processing with Volume

**Step 1 — Volume Component:**
```csharp
[VolumeComponentMenu("Post-processing Custom/MyEffect")]
[VolumeRequiresRendererFeatures(typeof(MyRendererFeature))]
[SupportedOnRenderPipeline(typeof(UniversalRenderPipelineAsset))]
public sealed class MyVolumeComponent : VolumeComponent, IPostProcessComponent
{
    public ClampedFloatParameter intensity = new(0f, 0f, 1f);
    public bool IsActive() => intensity.value > 0f;
}
```

**Step 2 — Read volume in AddRenderPasses:**
```csharp
MyVolumeComponent vol = VolumeManager.instance.stack?.GetComponent<MyVolumeComponent>();
if (vol == null || !vol.IsActive()) return;
```

## RenderPassEvent Ordering

Events execute in enum order. Use `+ offset` for fine control:
```csharp
myPass.renderPassEvent = RenderPassEvent.AfterRenderingOpaques + 1; // just after opaques
```

## Render Graph Pass (Unity 6)

```csharp
public override void RecordRenderGraph(RenderGraph renderGraph, ContextContainer frameData)
{
    var resources = frameData.Get<UniversalResourceData>();
    using var builder = renderGraph.AddRasterRenderPass<PassData>(passName, out var data, profilingSampler);

    // Read from camera color
    data.inputTexture = resources.cameraColor;
    builder.UseTexture(data.inputTexture, AccessFlags.Read);

    // Write to temporary texture
    var desc = renderGraph.GetTextureDesc(resources.cameraColor);
    desc.name = "_TempTexture";
    desc.clearBuffer = false;
    var destination = renderGraph.CreateTexture(desc);
    builder.SetRenderAttachment(destination, 0, AccessFlags.Write);

    builder.SetRenderFunc((PassData d, RasterGraphContext ctx) => Execute(d, ctx));

    // Swap so next pass reads our output
    resources.cameraColor = destination;
}
```

## Common Render Features in URP

| Feature | Purpose | Built-in? |
|---------|---------|-----------|
| Render Objects | Draw objects with overrides (layer mask, material, depth) | Yes |
| Screen Space Ambient Occlusion | SSAO | Yes |
| Screen Space Shadows | Screen-space shadow map | Yes |
| Decal | Projective decals | Yes |
| Full Screen Pass | Apply full-screen shader effect | Yes |

## Gotchas

- **Per renderer filtering** (URP 17+): features can be assigned to specific renderers, not all
- **Don't use `CommandBuffer` directly** in Unity 6 — use Render Graph API
- **Preview/Reflection cameras**: always skip in `AddRenderPasses` to avoid errors
- **Material null check**: feature Create() runs before assets import — guard against null
- **Dispose RTHandles**: always release allocated render textures in Dispose()
