---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# 2D Top-Down Camera Guide

## Camera Setup

Orthographic camera looking straight down (-Y axis) at the XZ simulation plane.

```csharp
// Editor scene setup
camGo.transform.position = new Vector3(0, CameraHeight, 0);  // e.g. 200
camGo.transform.rotation = Quaternion.Euler(90f, 0f, 0f);

cam.orthographic = true;
cam.orthographicSize = 110f;      // Initial size (will be overridden by auto-zoom)
cam.nearClipPlane = 0.1f;
cam.farClipPlane = CameraHeight + 50f;  // MUST exceed camera Y position
cam.clearFlags = CameraClearFlags.SolidColor;
cam.backgroundColor = new Color(0.15f, 0.15f, 0.2f);
```

**Critical**: `farClipPlane` must be greater than `CameraHeight` or ground-level entities will be beyond the far clip distance and invisible.

## Auto-Zoom Camera Controller

MonoBehaviour on the Main Camera that tracks alive units and adjusts orthographic size.

### Algorithm
1. Query all alive entities (`GameEntityTag` + `LocalTransform`, exclude `DeadTag`)
2. Compute AABB in XZ plane (min/max of all positions)
3. Derive target ortho size from extents + padding, clamped to min/max
4. Smooth lerp ortho size and camera XZ position

### Key Implementation Details

```csharp
// Compute AABB of alive units
float3 min = transforms[0].Position;
float3 max = transforms[0].Position;
for (int i = 1; i < transforms.Length; i++) {
    min = math.min(min, transforms[i].Position);
    max = math.max(max, transforms[i].Position);
}

float3 center = (min + max) * 0.5f;
float3 extents = (max - min) * 0.5f;

// Ortho size from largest axis (account for aspect ratio)
float sizeFromZ = extents.z + Padding;
float sizeFromX = (extents.x + Padding) / cam.aspect;
float targetSize = math.max(sizeFromX, sizeFromZ);
targetSize = math.clamp(targetSize, MinOrthoSize, MaxOrthoSize);

// Smooth lerp
cam.orthographicSize = math.lerp(cam.orthographicSize, targetSize, dt * ZoomSmooth);
```

### Pan (XZ Only)
Camera only moves on XZ — Y is fixed at CameraHeight.

```csharp
float targetX = math.lerp(pos.x, center.x, dt * PanSmooth);
float targetZ = math.lerp(pos.z, center.z, dt * PanSmooth);
transform.position = new Vector3(targetX, pos.y, targetZ);
```

## Typical Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| CameraHeight | 200 | High enough for large arenas |
| MinOrthoSize | 10 | Close-up view |
| MaxOrthoSize | 30 | Zoomed-out for full arena |
| Padding | 5 | Extra space around unit bounds |
| ZoomSmooth | 3 | Lerp speed for zoom |
| PanSmooth | 3 | Lerp speed for pan |

## EntityQuery Pattern

Use `World.DefaultGameObjectInjectionWorld` to bridge MonoBehaviour and DOTS:

```csharp
private EntityQuery _aliveQuery;
private bool _queryCreated;

void LateUpdate() {
    var world = World.DefaultGameObjectInjectionWorld;
    if (world == null || !world.IsCreated) return;

    if (!_queryCreated) {
        _aliveQuery = world.EntityManager.CreateEntityQuery(
            ComponentType.ReadOnly<GameEntityTag>(),
            ComponentType.ReadOnly<LocalTransform>(),
            ComponentType.Exclude<DeadTag>());
        _queryCreated = true;
    }

    var transforms = _aliveQuery.ToComponentDataArray<LocalTransform>(Allocator.Temp);
    // ... compute bounds ...
    transforms.Dispose();
}
```

Always dispose the query in `OnDestroy` and check `World.IsCreated`.

## Ground Setup

- Unity Plane primitive scaled to cover arena: `localScale = (ArenaHalfSize * 2 / 10, 1, ArenaHalfSize * 2 / 10)`
- URP/Unlit material (dark color, no lighting)
- `NavMeshSurface` on ground, `collectObjects = All`, `useGeometry = PhysicsColliders`
- Obstacles use `NavMeshObstacle.carving = true` for runtime NavMesh holes

## Light (Minimal)

Even with URP/Unlit materials, a directional light is needed for shadow-casting entities and health bars:

```csharp
light.type = LightType.Directional;
light.intensity = 1f;
lightGo.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
```
