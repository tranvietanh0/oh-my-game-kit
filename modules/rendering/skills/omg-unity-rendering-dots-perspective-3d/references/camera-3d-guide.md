---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# 3D Camera Guide

## Camera Patterns for 3D DOTS

### Fixed-Angle Battle Camera

Most common for auto-battler games. Similar to isometric but with full 3D meshes.

```csharp
// Scene setup
camGo.transform.position = new Vector3(0, 40, -35);
camGo.transform.rotation = Quaternion.Euler(30f, 0f, 0f);

cam.orthographic = false;
cam.fieldOfView = 60f;
cam.nearClipPlane = 0.3f;
cam.farClipPlane = 200f;
```

### Auto-Zoom (FOV-Based Framing)

Same algorithm as isometric — compute distance from AABB extents and camera FOV.

```csharp
// Query alive entities
var transforms = aliveQuery.ToComponentDataArray<LocalTransform>(Allocator.Temp);

// Compute AABB
float3 min = transforms[0].Position;
float3 max = transforms[0].Position;
for (int i = 1; i < transforms.Length; i++) {
    min = math.min(min, transforms[i].Position);
    max = math.max(max, transforms[i].Position);
}

float3 center = (min + max) * 0.5f;
float3 extents = (max - min) * 0.5f;

// FOV-based distance
float fovRad = cam.fieldOfView * Mathf.Deg2Rad * 0.5f;
float sizeX = (extents.x + Padding) / (Mathf.Tan(fovRad) * cam.aspect);
float sizeZ = (extents.z + Padding) / Mathf.Tan(fovRad);
float targetDist = math.max(sizeX, sizeZ);
targetDist = math.clamp(targetDist, MinDistance, MaxDistance);

// Position from distance and tilt
float tiltRad = TiltAngle * Mathf.Deg2Rad;
float height = targetDist * Mathf.Sin(tiltRad);
float backOffset = targetDist * Mathf.Cos(tiltRad);
float3 targetPos = new float3(center.x, height, center.z - backOffset);
```

### Orbit Camera (Interactive)

For games with player-controlled camera rotation:

```csharp
public class OrbitCameraController : MonoBehaviour {
    public float Distance = 30f;
    public float Yaw = 0f;
    public float Pitch = 30f;
    public float RotateSpeed = 120f;
    public float ZoomSpeed = 5f;
    public Transform Target;

    void LateUpdate() {
        // Input
        if (Input.GetMouseButton(1)) {
            Yaw += Input.GetAxis("Mouse X") * RotateSpeed * Time.deltaTime;
            Pitch -= Input.GetAxis("Mouse Y") * RotateSpeed * Time.deltaTime;
            Pitch = Mathf.Clamp(Pitch, 10f, 80f);
        }
        Distance -= Input.mouseScrollDelta.y * ZoomSpeed;
        Distance = Mathf.Clamp(Distance, 10f, 100f);

        // Position
        var rotation = Quaternion.Euler(Pitch, Yaw, 0f);
        var offset = rotation * new Vector3(0, 0, -Distance);
        transform.position = Target.position + offset;
        transform.LookAt(Target);
    }
}
```

For spring arm (collision avoidance) and Cinemachine 3.x integration, see `unity-cinemachine` skill.

## Camera Comparison Across Perspectives

| Property | 2D Top-Down | 2D Side-View | Isometric | 3D |
|----------|-------------|--------------|-----------|-----|
| Projection | Orthographic | Orthographic | Perspective | Perspective |
| Axis | -Y | -Z | Tilted (~30) | Tilted (variable) |
| Pan axes | XZ | X only | XZ | XZ |
| Zoom | orthoSize | orthoSize | distance | distance |
| Rotation | Fixed | Fixed | Fixed | Fixed or orbit |
| farClipPlane | Height + 50 | 250 | 200 | 200 |

## Ground and Lighting (3D)

### Ground Plane
Visible URP/Lit ground with shadow receiving:

```csharp
var groundMat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
groundMat.color = new Color(0.3f, 0.4f, 0.25f);  // Green terrain
groundMat.SetFloat("_Smoothness", 0.15f);
groundGo.GetComponent<MeshRenderer>().receiveShadows = true;
```

### Directional Light
Full lighting for 3D scene:

```csharp
light.type = LightType.Directional;
light.intensity = 1.5f;
light.shadows = LightShadows.Soft;
light.shadowResolution = UnityEngine.Rendering.LightShadowResolution.High;
```

## Typical 3D Battle Settings

| Parameter | Value |
|-----------|-------|
| ArenaSize | 100x100 (halfSize=50) |
| Units per side | ~112 (70 melee, 20 ranger, 15 mage, 7 boss) |
| CameraHeight | 40 |
| CameraBackOffset | 35 |
| TiltAngle | 30 |
| FOV | 60 |
| MinDistance | 20 |
| MaxDistance | 80 |
| DetectionRadius | 60 |
