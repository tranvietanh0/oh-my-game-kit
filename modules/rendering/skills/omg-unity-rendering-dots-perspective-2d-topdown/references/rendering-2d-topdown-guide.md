---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# 2D Top-Down Rendering Guide

## Quad Mesh (XZ Plane)

Top-down sprites use a custom quad mesh lying flat in the XZ plane (y=0). Save as a shared asset.

```csharp
var mesh = new Mesh { name = "Quad2D" };
mesh.vertices = new[] {
    new Vector3(-0.5f, 0f, -0.5f),
    new Vector3( 0.5f, 0f, -0.5f),
    new Vector3(-0.5f, 0f,  0.5f),
    new Vector3( 0.5f, 0f,  0.5f),
};
mesh.uv = new[] {
    new Vector2(0f, 0f), new Vector2(1f, 0f),
    new Vector2(0f, 1f), new Vector2(1f, 1f),
};
mesh.triangles = new[] { 0, 2, 1, 2, 3, 1 };
mesh.normals = new[] { Vector3.up, Vector3.up, Vector3.up, Vector3.up };
mesh.RecalculateBounds();
AssetDatabase.CreateAsset(mesh, "Assets/.../Quad2D.asset");
```

## Material Strategy: Cutout (Not Transparent)

Transparent materials force per-entity depth sorting, defeating SRP Batcher. Use opaque + alpha clip instead.

| Property | Cutout Value | Transparent Value |
|----------|-------------|-------------------|
| `_Surface` | 0 (Opaque) | 1 (Transparent) |
| `_AlphaClip` | 1 (On) | 0 (Off) |
| `_Cutoff` | 0.5 | n/a |
| `_SrcBlend` | One | SrcAlpha |
| `_DstBlend` | Zero | OneMinusSrcAlpha |
| `_ZWrite` | 1 | 0 |
| RenderQueue | AlphaTest | Transparent |
| Keyword | `_ALPHATEST_ON` | `_SURFACE_TYPE_TRANSPARENT` |

**Result**: 608 batches (transparent) vs 28 batches (cutout) for 2K units.

## Per-Entity Color Tinting

Use one shared material per sprite texture (white base color). Apply team color per-entity via:

```csharp
// Component (in dots-rpg package)
[MaterialProperty("_BaseColor")]
public struct SpriteColor : IComponentData { public float4 Value; }

// Authoring
spriteAnim.BaseColor = teamColor; // Baked into SpriteColor component
```

The DOTS Entities Graphics system reads `[MaterialProperty]` attributes and overrides the material property per-entity. No material instances needed.

## Sprite Sheet Animation

For animated sprites, use `SpriteAnimationAuthoring`:

```csharp
var spriteAnim = go.AddComponent<SpriteAnimationAuthoring>();
spriteAnim.FrameCount = 4;    // Total frames in sheet
spriteAnim.Columns = 4;       // Sheet columns
spriteAnim.FPS = 8f;           // Playback speed
spriteAnim.BaseColor = color;  // Per-entity tint
```

`SpriteAnimationSystem` writes `SpriteSheetUV [MaterialProperty("_BaseMap_ST")]` to animate UV offset. Use `while` loop (not `if`) for frame advancement to handle large deltaTime.

## Death Fade (2D-Specific)

`DeathFadeSystem` runs after `DeathAnimationSystem` in CombatSystemGroup. It lerps alpha:

```csharp
float alpha = death.Duration > 0f ? math.saturate(death.Remaining / death.Duration) : 0f;
color.Value.w = alpha;
```

Requires `[WithAll(typeof(DeadTag))]` and `[RequireMatchingQueriesForUpdate]` to auto-skip when no dead 2D entities exist.

## Prefab Structure

```
UnitPrefab (root)
├── MeshFilter → shared Quad2D.asset
├── MeshRenderer → shared cutout material (white base)
├── StatsAuthoring, CombatAuthoring, AIAuthoring, NavigationAuthoring
├── HealthBarAuthoring (Offset = 0.8)
├── SpriteAnimationAuthoring (BaseColor = teamColor)
└── [RangedAttackAuthoring | MageAttackAuthoring] (per class)
```

- `transform.localScale = (scale, 1, scale)` — Y=1 for flat quad
- `ShadowCastingMode.Off` + `receiveShadows = false`
- Arrow prefabs: same structure, scale `(0.4, 1, 0.4)`
- AoE prefabs: transparent material (exception to cutout rule — AoE is visual-only)

## Projectile Configuration (2D)
```csharp
ranged.ArcHeight = 0f;    // Flat trajectory
ranged.IsFlat = true;     // No capsule pitch offset
```
