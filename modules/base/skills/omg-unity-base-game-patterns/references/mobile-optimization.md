---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Mobile Project Settings & Optimization

## Player Settings

```
Color Space: Linear
Auto Graphics API: OFF
Graphics APIs: Vulkan, OpenGLES3 (Android) / Metal (iOS)
Scripting Backend: IL2CPP
API Compatibility: .NET Standard 2.1
Managed Stripping Level: High
Active Input Handling: Input System Package (New)
Default Is Fullscreen: ON
Render Outside Safe Area: ON
Optimized Frame Pacing: ON
```

## Quality Settings

```
Default: Medium

Low:    URP-Low, 0.7 render scale, no shadows, no post-processing
Medium: URP-Medium, 0.85 render scale, soft shadows, bloom
High:   URP-High, 1.0 render scale, full shadows, full post-processing
```

## Physics Settings

```
Project Settings > Physics (3D):
  Fixed Timestep: 0.02 (50Hz) — or 0.04 for casual games
  Gravity: (0, -9.81, 0) — or (0, -20, 0) for snappier feel
  Default Solver Iterations: 4 (reduce to 2 for casual)
  Auto Sync Transforms: OFF

Physics 2D:
  Velocity Iterations: 4 (reduce to 2 for casual)
  Position Iterations: 2
  Auto Sync Transforms: OFF
```

## Time & Audio Settings

```
Time:
  Fixed Timestep: 0.02
  Maximum Allowed Timestep: 0.1

Audio:
  DSP Buffer Size: Best Performance (casual) / Default (audio-focused)
  Max Real Voices: 24
  Max Virtual Voices: 64
```

## Performance Rules

### Draw Call Budget
| Tier | Target | Max |
|------|--------|-----|
| Low-end Android | 50 | 80 |
| Mid Android | 100 | 150 |
| iOS (A-series) | 150 | 200 |

### Texture Compression
```
Android: ASTC (6x6 for color, 4x4 for normal maps)
iOS: ASTC (same)
Fallback: ETC2 (Android only, for old GPU)
Max size: 1024 for characters, 2048 for environments
```

### Memory Budget
```
Total RAM budget: 50% of device minimum (target 1GB device → 500MB max)
Textures: 200MB
Audio: 50MB
Code: 100MB
Other: 150MB
```

### Battery / Thermal
```
Application.targetFrameRate = 30; // casual games
Application.targetFrameRate = 60; // action games

// Throttle when thermal warning
void OnApplicationFocus(bool hasFocus) {
    if (!hasFocus) Application.targetFrameRate = 20;
    else Application.targetFrameRate = 60;
}
```

### Object Pooling (mandatory for mobile)
- Pre-warm pools at scene start
- Never Instantiate/Destroy frequently spawned objects at runtime
- Pool: projectiles, VFX, enemies, damage numbers

### GC Alloc Rules
- Never `new` in `Update()` — pre-allocate
- Use `SetText("{0}", val)` not string concat in TMP
- Avoid LINQ in hot paths
- Use `NativeArray`/`NativeList` for large data sets
