---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Side-View Navigation & Camera Guide

## XZ NavMesh with XY Display

Simulation operates on the XZ plane. The side-view camera shows X (horizontal) and remapped-Y (from Z depth). Navigation, pathfinding, and AI never know about the visual transform.

### Invisible Ground Plane

```csharp
// Ground plane covers XZ arena (e.g. 40x20)
groundGo.transform.localScale = new Vector3(ArenaHalfX * 2f / 10f, 1f, ArenaHalfZ * 2f / 10f);

// Invisible — camera sees edge of plane
groundGo.GetComponent<MeshRenderer>().enabled = false;

// NavMeshSurface for pathfinding
var navSurface = groundGo.AddComponent<NavMeshSurface>();
navSurface.collectObjects = CollectObjects.All;
navSurface.useGeometry = NavMeshCollectGeometry.PhysicsColliders;
navSurface.BuildNavMesh();
```

### Invisible Obstacles

Side-view obstacles are invisible cubes that carve NavMesh holes:

```csharp
var obs = GameObject.CreatePrimitive(PrimitiveType.Cube);
obs.GetComponent<MeshRenderer>().enabled = false;  // Invisible

// NavMesh carving
GameObjectUtility.SetStaticEditorFlags(obs,
    GameObjectUtility.GetStaticEditorFlags(obs) | (StaticEditorFlags)8 /* NavigationStatic */);
GameObjectUtility.SetNavMeshArea(obs, 1); // 1 = Not Walkable

var navObstacle = obs.AddComponent<NavMeshObstacle>();
navObstacle.carving = true;
```

Units navigate around obstacles on XZ even though the player only sees X movement.

## Camera Setup

### Orthographic Along -Z

```csharp
camGo.transform.position = new Vector3(0, 0, -100);
camGo.transform.rotation = Quaternion.identity;  // Looking +Z

cam.orthographic = true;
cam.orthographicSize = 15f;
cam.nearClipPlane = 0.1f;
cam.farClipPlane = 250f;  // Must reach backdrop layers
cam.clearFlags = CameraClearFlags.SolidColor;
cam.backgroundColor = new Color(0.5f, 0.7f, 0.9f);  // Sky blue

// Depth sorting: higher Z renders behind lower Z
cam.transparencySortAxis = new Vector3(0, 0, 1);
```

### Auto-Zoom (X-Axis Only)

Side-view only tracks X extents (not Z — Z is depth, shown as Y).

```csharp
// Compute X range of alive units
float minX = transforms[0].Position.x;
float maxX = transforms[0].Position.x;
for (int i = 1; i < transforms.Length; i++) {
    float x = transforms[i].Position.x;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
}

float centerX = (minX + maxX) * 0.5f;
float extentX = (maxX - minX) * 0.5f;

// Ortho size based on X extents and aspect ratio
float targetSize = (extentX + Padding) / cam.aspect;
targetSize = math.clamp(targetSize, MinOrthoSize, MaxOrthoSize);

// Pan X only — Y and Z fixed
float smoothX = math.lerp(pos.x, centerX, dt * PanSmooth);
transform.position = new Vector3(smoothX, pos.y, pos.z);
```

## Parallax Backdrop

Multiple quad layers at increasing Z depths, between camera (Z=-100) and entities (Z~0).

### Layer Setup

| Layer | Z | Size | Parallax Factor |
|-------|---|------|-----------------|
| Sky | 50 | 60x40 | 0.0 (static) |
| Mountains | 40 | 60x20 | 0.1 |
| Trees | 30 | 60x16 | 0.3 |
| Ground | 10 | 60x8 | 0.8 |

### UV Scrolling

```csharp
// In camera controller LateUpdate
float dx = transform.position.x - _lastCamX;
_lastCamX = transform.position.x;

for (int i = 0; i < Layers.Length; i++) {
    var mat = Layers[i].Quad.sharedMaterial;
    var offset = mat.mainTextureOffset;
    offset.x += dx * Layers[i].Factor * 0.1f;  // ParallaxUVScale
    mat.mainTextureOffset = offset;
}
```

### Backdrop Materials

Use transparent (not cutout) for backdrop layers with alpha. Render queue offset by Z:
```csharp
mat.renderQueue = (int)RenderQueue.Transparent - 100 + (int)z;
```

Sky layer is opaque (no alpha). Other layers use `_SURFACE_TYPE_TRANSPARENT`.

## Arena Dimensions

Side-view arenas are typically wider than deep:
- `ArenaHalfX = 20` (40 units wide)
- `ArenaHalfZ = 10` (20 units deep)

Spawn armies on left/right sides:
- Red: `spawnCenter = (-12, 0, 0)`, facing `(1, 0, 0)`
- Blue: `spawnCenter = (12, 0, 0)`, facing `(-1, 0, 0)`

## Typical Camera Settings

| Parameter | Value |
|-----------|-------|
| CameraZ | -100 |
| CameraOrthoSize | 15 |
| CameraFarClip | 250 |
| MinOrthoSize | 8 |
| MaxOrthoSize | 20 |
| ZoomSmooth | 2 |
| PanSmooth | 3 |
