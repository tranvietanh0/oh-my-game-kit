---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Amplify Impostors — Baking Guide

## Impostor Types

| Type | Enum | Use Case | View Coverage |
|------|------|----------|---------------|
| **Spherical** | `ImpostorType.Spherical = 0` | Simple objects, parallax depth | Single ring of views + parallax |
| **Octahedron** | `ImpostorType.Octahedron = 1` | Characters, props, full 360 view | Full sphere mapped to octahedron UV (recommended) |
| **HemiOctahedron** | `ImpostorType.HemiOctahedron = 2` | Trees, foliage, ground objects | Upper hemisphere only (no bottom views) |

## Baking Workflow (Editor)

1. **Import URP shaders**: `Assets/AmplifyImpostors/Plugins/EditorResources/Shaders/URP Shaders 17.3.unitypackage`
2. **Add component**: Select prefab/GO → Inspector → Add Component → `Amplify Impostor`
3. **Set renderers**: Component auto-detects renderers. Verify list includes all mesh parts
4. **Configure settings**: Atlas size, frame count, impostor type
5. **Bake**: Click "Bake Impostor" → choose save folder → outputs `.asset` + texture files
6. **Result**: New impostor GO with MeshFilter + MeshRenderer using baked material

## Atlas Settings (AmplifyImpostorAsset)

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `ImpostorType` | enum | Octahedron | 0-2 | Billboard mapping type |
| `TexSize` | Vector2 | 2048×2048 | — | Atlas texture resolution |
| `HorizontalFrames` | int | 16 | 1-32 | Columns in atlas grid |
| `VerticalFrames` | int | 16 | 1-33 | Rows in atlas grid |
| `PixelPadding` | int | 32 | 0-64 | Padding between frames (prevents bleeding) |
| `MaxVertices` | int | 8 | 4-16 | Max vertices for billboard mesh shape |
| `Tolerance` | float | 0.15 | 0-0.2 | Shape detection tolerance |
| `NormalScale` | float | 0.01 | 0-1 | Billboard mesh normal offset |
| `DecoupleAxisFrames` | bool | false | — | Allow different H/V frame counts |
| `LockedSizes` | bool | true | — | Lock width/height together |

## LOD Integration

### LODReplacement Modes

| Mode | Enum Value | Behavior |
|------|-----------|----------|
| `DoNothing` | 0 | No LOD integration |
| `ReplaceCulled` | 1 | Replace the culled LOD |
| `ReplaceLast` | 2 | Replace the last LOD level (recommended) |
| `ReplaceAllExceptFirst` | 3 | Replace all LODs except LOD0 |
| `ReplaceSpecific` | 4 | Replace a specific LOD index |
| `ReplaceAfterSpecific` | 5 | Replace all after a specific index |
| `InsertAfter` | 6 | Insert impostor after a specific LOD |

### Recommended Setup for DOTS Units

```
LOD0: Full Synty model (close range, < 10m)
LOD1: Impostor (mid to far range, > 10m)
Culled: > 100m
```

For mass-spawned units (100+), skip LOD0 entirely — use impostor only.

## Bake Preset (AmplifyImpostorBakePreset)

Output texture slots (6 total):

| Index | Name | Content | Default Format |
|-------|------|---------|---------------|
| 0 | `_Albedo` | Albedo + Alpha | RGBA, sRGB, TGA |
| 1 | `_Normals` | Normals + Depth | RGBA, Linear, TGA |
| 2 | `_Specular` | Specular + Smoothness | RGBA, Linear, TGA |
| 3 | `_Occlusion` | Occlusion | RGB, Linear, TGA |
| 4 | `_Emission` | Emission | RGB, sRGB, TGA |
| 5 | `_Position` | World Position (optional) | RGBA, Linear, off by default |

### TextureOutput Settings

| Field | Type | Options |
|-------|------|---------|
| `Active` | bool | Enable/disable output |
| `Scale` | TextureScale | Full(1), Half(2), Quarter(4), Eighth(8) |
| `SRGB` | bool | sRGB color space |
| `Channels` | TextureChannels | RGBA(0), RGB(1) |
| `Compression` | TextureCompression | None(0), Normal(1), High(2), Low(3) |
| `ImageFormat` | ImageFormat | PNG(0), TGA(1), EXR(2) |

## Recommended Settings by Use Case

### Mass DOTS Units (this project)
```
ImpostorType: Octahedron
TexSize: 1024x1024
HorizontalFrames: 8
VerticalFrames: 8
PixelPadding: 16
MaxVertices: 6
Compression: Normal
```

### High-Quality Distant Props
```
ImpostorType: Octahedron
TexSize: 2048x2048
HorizontalFrames: 16
VerticalFrames: 16
PixelPadding: 32
MaxVertices: 8
Compression: High
```

## Pre-Bake Checklist

- [ ] URP shader package imported (matches Unity version)
- [ ] Source model in T-pose / bind pose (disable Animator)
- [ ] All renderers visible and assigned in component
- [ ] Lighting setup matches runtime lighting (affects baked appearance)
- [ ] Scene has no post-processing that could affect bake
- [ ] Save scene before baking (bake modifies scene temporarily)
