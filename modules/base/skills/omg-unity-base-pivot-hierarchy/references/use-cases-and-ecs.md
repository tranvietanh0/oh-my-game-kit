---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Unity Pivot & Hierarchy — Use Cases & ECS Details

## Use Cases

### A. Visual Pivot Offset (Bottom-Pivot for Center-Pivot Meshes)

Fix units sinking into terrain. Root at feet, mesh child offset up.

```csharp
var root = new GameObject("Unit");
var meshGO = GameObject.CreatePrimitive(PrimitiveType.Capsule);
meshGO.name = "Mesh";
meshGO.transform.SetParent(root.transform);
meshGO.transform.localScale = scale;
float offsetY = 1.0f * scale.y; // Capsule halfHeight=1.0
meshGO.transform.localPosition = new Vector3(0f, offsetY, 0f);
```

### B. Rotation Pivot

Parent at hinge/rotation center. Rotating parent rotates child around that point.

```csharp
// Door: parent at hinge edge, door mesh offset to center
var hinge = new GameObject("DoorHinge");
hinge.transform.position = hingeWorldPos;
doorMesh.transform.SetParent(hinge.transform);
doorMesh.transform.localPosition = new Vector3(doorWidth * 0.5f, 0f, 0f);
hinge.transform.Rotate(0f, openAngle, 0f); // door swings around hinge
```

### C. Orbit System

Parent at orbit center, child at radius. Rotate parent → child orbits.

```csharp
var orbitPivot = new GameObject("OrbitPivot");
orbitPivot.transform.position = planetPos;
moon.transform.SetParent(orbitPivot.transform);
moon.transform.localPosition = new Vector3(orbitRadius, 0f, 0f);
// In Update: orbitPivot.transform.Rotate(0f, speed * dt, 0f);
```

### D. Weapon / Attachment Socket

Empty socket at bone position. Swap child weapons freely.

```csharp
var socket = new GameObject("HandSocket");
socket.transform.SetParent(handBone);
socket.transform.localPosition = Vector3.zero;
weaponMesh.transform.SetParent(socket.transform);
weaponMesh.transform.localPosition = gripOffset;
weaponMesh.transform.localRotation = gripRotation;
```

### E. Scale / Hit Flash Isolation

Animate child scale for VFX; root stays stable for physics/nav.

```csharp
// Scale pulse on child only — collider on root unaffected
meshChild.transform.localScale = Vector3.one * (1f + Mathf.Sin(t) * 0.1f);
```

### F. Detachable Parts

Reparent child to world on event (destruction, drop).

```csharp
detachablePart.transform.SetParent(null); // detach to world
detachablePart.AddComponent<Rigidbody>();  // physics takeover
```

## DOTS ECS Specifics

### Baking Behavior
- Child GO → child entity with `Parent` component + own `LocalTransform`
- Parent entity gets `DynamicBuffer<Child>` + `LinkedEntityGroup`
- `EntityManager.Instantiate(prefab)` clones full hierarchy
- Use `TransformUsageFlags.Dynamic` on root for hierarchy participation

### Gotchas (CRITICAL)

| Problem | Wrong Fix | Correct Fix |
|---------|-----------|-------------|
| Center-pivot mesh sinks into terrain | `+= halfHeight` in system | Prefab: mesh child with Y offset |
| Rotation around wrong point | Modify rotation math in code | Parent at rotation center + child offset |
| `PostTransformMatrix` in baker | Add to baker for pivot offset | Use child entity hierarchy instead |
| Scale animation affects collider | Scale root entity | Scale only child mesh entity |
| `+= offset` accumulates per frame | Use `+=` in system Update | Use `=` (absolute) or fix in prefab |
| SubScene breaks after baker change | Delete Library/EntityScenes/ | Fix baker code; EntityScenes auto-rebuilds |

**PostTransformMatrix conflicts with Unity's built-in TransformBaker** — adding it manually in a custom baker causes entity count drops and broken SubScene loading. Only use it via `TransformUsageFlags.NonUniformScale` (which Unity manages automatically).

**"Fix the data, not the code"** — when meshes have wrong pivot conventions, restructure the prefab hierarchy rather than compensating in runtime systems.

### ECS Parent-Child Setup (Runtime)

```csharp
// Attach child entity to parent via ECB
ecb.AddComponent(childEntity, new Parent { Value = parentEntity });
// Unity.Transforms systems auto-propagate LocalTransform → LocalToWorld
// Remove Parent component to detach
```

## Decision Framework

| Situation | Approach |
|-----------|----------|
| Mesh has wrong pivot (center vs feet) | Child mesh with Y offset in prefab |
| Need rotation around non-center point | Empty parent at rotation center |
| Object orbits another | Parent at orbit center + child at radius |
| Visual-only animation (scale, flash) | Animate child; root stays stable |
| Runtime attachment (weapons, items) | Empty socket parent + child swap |
| Bounds-based terrain placement (Editor) | `renderer.bounds.min.y` offset at placement time |
| ECS entity needs pivot adjustment | Restructure prefab before baking (NOT PostTransformMatrix) |
