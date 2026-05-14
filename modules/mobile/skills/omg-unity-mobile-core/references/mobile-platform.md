---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: mobile
protected: false
---
# Unity Mobile — Platform Details & Optimization

## Performance Targets by Device Tier

| Tier | Devices | Target FPS | Draw Calls | Tris/Frame | Memory |
|------|---------|-----------|------------|------------|--------|
| Low | 2019 phones, budget | 30 | <100 | <100K | <200MB |
| Mid | 2021 phones, mid-range | 30–60 | <200 | <300K | <400MB |
| High | 2023+ flagships | 60 | <500 | <700K | <800MB |

## Frame Rate & Battery

```csharp
Application.targetFrameRate = 30;  // Battery-friendly
Application.targetFrameRate = 60;  // Smooth but more battery
QualitySettings.vSyncCount = 0;    // Required for targetFrameRate to work

// Adaptive: lower FPS when thermal pressure:
void Update() {
    if (SystemInfo.batteryLevel < 0.2f && SystemInfo.batteryStatus == BatteryStatus.Discharging)
        Application.targetFrameRate = 30;
}
```

## Texture Compression

| Format | Platform | Quality | Size | When |
|--------|----------|---------|------|------|
| ASTC 6x6 | Android + iOS | High | Small | Default choice |
| ASTC 4x4 | Both | Best | Medium | UI, characters |
| ASTC 8x8 | Both | Good | Smallest | Terrain, backgrounds |
| ETC2 | Android (GLES3) | Good | Small | Fallback for old devices |

Set per-platform in Texture Import Settings → Platform override.

## Shader Optimization

```
1. Minimize shader variants:
   - Strip unused keywords (Project Settings → Graphics → Shader Stripping)
   - Use shader_feature instead of multi_compile for per-material keywords

2. Mobile-friendly shading:
   - Use URP/Mobile shaders (SimpleLit, Unlit)
   - Avoid: tessellation, complex PBR, SSR, SSAO
   - Limit: real-time shadows (1 cascade, 1024px), additional lights (4 max)

3. Shader warmup at loading screen:
   ShaderVariantCollection.WarmUp();
```

## Draw Call Reduction

```
1. SRP Batcher: Enabled by default in URP (same shader = 1 draw call)
2. GPU Instancing: For many identical objects (trees, particles)
3. Texture Atlasing: Combine textures to share materials
4. Static Batching: For non-moving objects (Player Settings → Static Batching)
5. Dynamic Batching: For small meshes <300 verts (URP Asset → enable)
6. Occlusion Culling: Window → Rendering → Occlusion Culling → Bake
```

## Memory Management

```csharp
// Texture: use mipmaps for 3D, max 1024x1024 chars, 512x512 props
// Disable Read/Write unless needed at runtime

// Audio:
// - Streaming for music (>10s)
// - Decompress on Load for SFX (<5s)
// - Compressed in Memory for medium clips

// Mesh: enable compression (Low/Medium/High), disable Read/Write

// Forced cleanup:
Resources.UnloadUnusedAssets();
System.GC.Collect();
```

## Build Size Optimization

```
1. Managed Stripping Level: High (Project Settings → Player → Other)
   - May need [Preserve] attribute on reflection targets

2. Code stripping:
   - IL2CPP + Link.xml for preserving assemblies
   - Engine code stripping: Project Settings → Player → Strip Engine Code

3. Asset optimization:
   - Remove unused assets (use Addressables for on-demand loading)
   - Compress textures aggressively (ASTC 6x6 or 8x8)
   - Use Sprite Atlases for 2D

4. Android:
   - App Bundle (.aab) instead of APK
   - Split APKs by architecture (ARMv7 vs ARM64)

5. iOS:
   - Bitcode: Disabled (deprecated by Apple)
   - ARM64 only (32-bit dropped)
```

## Platform-Specific Settings

### Android
```
- Scripting Backend: IL2CPP (required for ARM64)
- Minimum API: 24+ (Android 7.0) for Vulkan
- Graphics API: Vulkan (preferred) + OpenGLES 3.0 (fallback)
- Target architecture: ARM64 (required for Play Store)
- Keystore: Required for release builds
```

### iOS
```
- Scripting Backend: IL2CPP (only option)
- Minimum iOS: 15.0+ for Unity 6
- Metal API: Default and only option
- Xcode: Required for building
- Memory warnings: Application.lowMemory += () => { CleanupCache(); };
```

## Adaptive Performance (Samsung)

```csharp
// com.unity.adaptiveperformance + provider package
// Auto-adjusts quality based on thermal state:
// - Reduces resolution, lowers LOD, disables effects, throttles FPS
```

## Common Gotchas

1. **Editor vs Device**: Always profile on target device, not Editor
2. **Thermal throttling**: After 5 min sustained load, device clocks down — design for sustained perf
3. **Screen.dpi varies**: Use `Screen.width/height` not DPI for layout
4. **Touch vs mouse**: New Input System handles both; legacy uses `Input.GetTouch`
5. **Background app**: `OnApplicationPause(true)` — save state, pause timers
6. **Notch/cutout**: Use `Screen.safeArea` for UI placement
