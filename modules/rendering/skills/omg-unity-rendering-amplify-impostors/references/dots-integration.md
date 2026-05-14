---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Amplify Impostors — DOTS Integration

## Why Impostors for DOTS

| Approach | Per-Unit Cost | 100 Units |
|----------|--------------|-----------|
| Synty PolygonKnights (full) | 5 SkinnedMeshRenderers, ~10K tris, 50+ bones | 500 SMRs, 1M tris, 5000 bones → 0.9 FPS |
| Unity Primitives (current) | 1 MeshRenderer, ~100 tris | 100 MRs, 10K tris → 60+ FPS |
| **Amplify Impostor** | 1 MeshRenderer, ~4-8 tris, 1 material | 100 MRs, 800 tris → 60+ FPS with Synty visuals |

## ECS Compatibility

Amplify Impostors output is a standard **MeshFilter + MeshRenderer + Material** — fully compatible with DOTS SubScene baking via Entities Graphics.

### What Bakes Cleanly to ECS

- MeshFilter → `RenderMesh` / `MaterialMeshInfo`
- MeshRenderer → `RenderBounds`, `WorldRenderBounds`
- Material (impostor shader) → batched via SRP Batcher
- No SkinnedMeshRenderer, no bones, no Animator

### DOTS Instancing

v1.0.0 changelog: "Fixed DOTS Instancing Use shader model 4.5 (#56)"

Impostor shaders support DOTS instancing natively on v1.0.3+. This enables:
- GPU instancing across many impostor entities
- SRP Batcher compatibility
- Efficient batching when all units share same impostor atlas

## Integration Workflow

### Step 1: Bake Impostor from Synty Model

```
Editor workflow:
1. Place Synty character prefab in scene
2. Disable Animator component (T-pose)
3. Add AmplifyImpostor component
4. Set: Octahedron, 1024x1024, 8x8 frames
5. Click "Bake Impostor"
6. Save to Assets/Demos/BattleDemo/Impostors/
```

### Step 2: Create Unit Prefab with Impostor

```
Prefab structure:
Root GO (authoring components)
└── Mesh (impostor GO: MeshFilter + MeshRenderer + impostor material)
```

The impostor GO replaces the Synty model child. Same prefab structure as current primitives.

### Step 3: Update BattleDemoUnitPrefabCreator

Replace primitive mesh child with impostor mesh reference:

```csharp
// Instead of: GameObject.CreatePrimitive(shape)
// Load pre-baked impostor asset
var impostorAsset = AssetDatabase.LoadAssetAtPath<AmplifyImpostorAsset>(impostorPath);
var meshGO = new GameObject("Mesh");
meshGO.AddComponent<MeshFilter>().sharedMesh = impostorAsset.Mesh;
meshGO.AddComponent<MeshRenderer>().sharedMaterial = impostorAsset.Material;
```

### Step 4: SubScene Baking

Impostor prefabs bake to ECS entities identically to primitive prefabs:
- `RenderMeshArray` picks up the impostor mesh + material
- `MaterialMeshInfo` indexes into the array
- `RenderBounds` computed from impostor mesh bounds
- No special handling needed

## Impostor Atlas Sharing

For maximum batching, **all units of the same type should share one impostor atlas**:

| Unit Type | Impostor Atlas | Shared By |
|-----------|---------------|-----------|
| Knight_01 | `Knight01_Impostor.asset` | RedMelee + BlueMelee (tinted via material property) |
| Soldier_01 | `Soldier01_Impostor.asset` | RedRanger + BlueRanger |
| Knight_02 | `Knight02_Impostor.asset` | RedMage + BlueMage |
| Knight_03 | `Knight03_Impostor.asset` | RedBoss + BlueBoss |

Team color differentiation options:
1. **Separate bakes** per team color (Orange/Blue) — doubles atlas count but perfect colors
2. **Material property override** — single atlas + per-entity `_BaseColor` tint via `MaterialProperty`

## Performance Expectations

### VRAM per Impostor Atlas (Octahedron, 8x8 frames)

| Resolution | Albedo+Alpha | Normals+Depth | Specular | Total (compressed) |
|-----------|-------------|--------------|----------|-------------------|
| 512x512 | 0.33 MB | 0.33 MB | 0.33 MB | ~1 MB |
| 1024x1024 | 1.33 MB | 1.33 MB | 1.33 MB | ~4 MB |
| 2048x2048 | 5.33 MB | 5.33 MB | 5.33 MB | ~16 MB |

For 4 unit types × 2 teams = 8 atlases at 1024: ~32 MB VRAM total.

### Draw Calls

- All units sharing same impostor atlas = **1 draw call** (GPU instanced)
- 4 unit types = minimum 4 draw calls (one per unique material)
- With team color variants: 8 draw calls total

## Billboard Facing

Impostor shaders handle camera-facing rotation internally in the vertex shader. No ECS system needed to rotate billboards — the shader does it automatically based on view direction and octahedral UV sampling.

## Limitations

- **No animation**: Impostors are static snapshots. Units won't show walk/attack anims
- **View angle snapping**: At low frame counts (4x4), angle transitions may be visible
- **Close-up quality**: Noticeable as flat at close range. Best combined with LOD (full model close, impostor far)
- **Bake is offline**: Must bake in Editor, can't generate at runtime
- **One atlas per visual**: Different team colors need separate bakes OR material tinting
