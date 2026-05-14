---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Isometric Camera Guide

## Camera Configuration

Isometric uses a **perspective** camera (not orthographic) tilted at ~30 degrees for a classic 3/4 view.

```csharp
// Editor scene setup
camGo.transform.position = new Vector3(0, CameraHeight, -CameraBackOffset);
camGo.transform.rotation = Quaternion.Euler(CameraTiltAngle, 0f, 0f);

cam.orthographic = false;
cam.fieldOfView = 60f;
cam.nearClipPlane = 0.1f;
cam.farClipPlane = 200f;
cam.clearFlags = CameraClearFlags.SolidColor;
cam.backgroundColor = new Color(0.15f, 0.15f, 0.2f);
```

### Why Perspective Instead of Orthographic

- Perspective provides natural depth cue without coordinate remapping
- Billboard shader works identically with both projection types
- Perspective FOV-based framing is simpler than orthographic size calculation for iso views
- True isometric (orthographic) flattens depth perception, making unit differentiation harder

## Auto-Zoom Camera Controller

MonoBehaviour that adjusts camera distance based on battle extents and FOV.

### Algorithm

1. Query alive entities (same pattern as 2D)
2. Compute AABB in XZ plane
3. Derive target distance from extents and camera FOV
4. Smooth lerp distance and position

### FOV-Based Distance Calculation

```csharp
float fovRad = cam.fieldOfView * Mathf.Deg2Rad * 0.5f;
float aspect = cam.aspect;

// Distance needed to fit X extents
float sizeX = (extents.x + Padding) / (Mathf.Tan(fovRad) * aspect);
// Distance needed to fit Z extents
float sizeZ = (extents.z + Padding) / Mathf.Tan(fovRad);

float targetDist = math.max(sizeX, sizeZ);
targetDist = math.clamp(targetDist, MinDistance, MaxDistance);
```

### Position from Distance and Tilt

```csharp
float tiltRad = TiltAngle * Mathf.Deg2Rad;
float height = currentDistance * Mathf.Sin(tiltRad);
float backOffset = currentDistance * Mathf.Cos(tiltRad);

float3 targetPos = new float3(center.x, height, center.z - backOffset);

// Smooth lerp
float3 smoothPos = math.lerp(currentPos, targetPos, dt * PanSmooth);
transform.position = smoothPos;
transform.rotation = Quaternion.Euler(TiltAngle, 0f, 0f);
```

## Typical Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| TiltAngle | 30 | Classic isometric tilt |
| FOV | 60 | Standard perspective |
| MinDistance | 20 | Close-up view |
| MaxDistance | 60 | Full arena view |
| Padding | 8 | Extra space around bounds |
| ZoomSmooth | 2 | Distance lerp speed |
| PanSmooth | 3 | Position lerp speed |

## Ground and Lighting

### Visible Ground
Unlike 2D perspectives, the isometric ground plane is visible and uses URP/Lit:

```csharp
var groundMat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
groundMat.color = new Color(0.25f, 0.35f, 0.2f);  // Green-brown terrain
groundMat.SetFloat("_Smoothness", 0.1f);
```

### Directional Light
Warm directional light for 3D-like feel:

```csharp
light.type = LightType.Directional;
light.intensity = 1.2f;
light.color = new Color(1f, 0.95f, 0.9f);  // Warm
lightGo.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
```

## Obstacles

Visible 3D cubes with URP/Lit materials (unlike invisible obstacles in 2D perspectives):

```csharp
var obs = GameObject.CreatePrimitive(PrimitiveType.Cube);
obs.transform.localScale = new Vector3(sizeXZ, sizeY, sizeXZ);  // Variable height

var obstacleMat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
obstacleMat.color = new Color(0.4f, 0.35f, 0.3f);  // Brown-grey rock
obstacleMat.SetFloat("_Smoothness", 0.2f);

// NavMesh carving (same as other perspectives)
GameObjectUtility.SetStaticEditorFlags(obs, (StaticEditorFlags)8 /* NavigationStatic */);
GameObjectUtility.SetNavMeshArea(obs, 1);  // Not Walkable
var navObstacle = obs.AddComponent<NavMeshObstacle>();
navObstacle.carving = true;
```

## Arena Dimensions

Isometric arenas are moderate size (larger than side-view, smaller than 2D top-down):

| Parameter | Value |
|-----------|-------|
| ArenaHalfSize | 30 (60x60 total) |
| Army per side | ~50 (30 melee, 12 ranger, 6 mage, 2 boss) |
| ObstacleCount | 10 |

## EntityQuery Pattern

Same `World.DefaultGameObjectInjectionWorld` bridge as other perspectives. Query `GameEntityTag + LocalTransform`, exclude `DeadTag`. Dispose in `OnDestroy`, check `World.IsCreated`.
