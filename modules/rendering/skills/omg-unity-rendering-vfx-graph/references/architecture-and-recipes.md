---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# VFX Graph — Architecture, Recipes & Performance

## Architecture

```
VFX Graph Asset (.vfx)
├── Spawn Context        → How many particles per frame/burst
│   └── Spawn Rate, Burst, Periodic Burst
├── Initialize Context   → Set initial state (position, velocity, size, color, lifetime)
│   └── Set Position (Shape: Sphere, Box, Mesh, etc.)
│   └── Set Velocity (Random, Direction, Speed)
│   └── Set Lifetime (Random Between Two Constants)
├── Update Context       → Per-frame simulation (forces, collision, turbulence)
│   └── Turbulence, Gravity, Drag, Collision
│   └── Conform to Sphere/SDF
│   └── Age Over Lifetime (Size, Color, Alpha)
└── Output Context       → How to render (Quad, Mesh, Line, etc.)
    └── Set Size/Color/Orientation Over Life
    └── Orient: Face Camera, Along Velocity
```

## Events

```
Built-in:
  OnPlay      → Triggered when Play() called
  OnStop      → Triggered when Stop() called

Custom (create in graph):
  "OnHit"     → SendEvent("OnHit", eventAttributes)
  "OnExplode" → Trigger burst spawn

Event flow: Event → Spawn Context (GPU Event → Initialize)
```

## Property Binders

Add `VFXPropertyBinder` component to auto-bind properties:
- **Transform Binder**: Binds position/rotation/scale from a Transform
- **Property Binder**: Binds any serializable field
- **Multiple Binder**: Bind to array of transforms

```csharp
// Manual binding alternative:
void Update() {
    vfx.SetVector3("TargetPosition", target.position);
}
```

## Common Effect Recipes

```
Fire:     Spawn(Rate=200) → Init(Sphere r=0.1, Vel Up 2-4, Life 0.5-1.5)
          → Update(Turbulence, Size↓) → Output(Quad, Color Orange→Red→Black, Additive)

Rain:     Spawn(Rate=1000) → Init(Box wide, Vel Down 10-15, Life 1-2)
          → Update(Gravity) → Output(Line, Color White α=0.3)

Explosion: Event("Explode") → Spawn(Burst=200) → Init(Sphere r=0.5, Vel Outward 5-15)
           → Update(Drag 2, Size↓ Color↓α) → Output(Quad, Additive)

Magic:    Spawn(Rate=50) → Init(Circle r=1, Vel Tangent 2)
          → Update(Turbulence, Orbit) → Output(Quad, Color Gradient, Additive)
```

## Performance Tips

1. **Capacity**: Set max particle count in Initialize context. Lower = less VRAM
2. **Output complexity**: Lit Mesh output > Unlit Quad. Use simplest that looks good
3. **Strip count**: For ribbon/trail effects, limit strip capacity
4. **LOD**: Use `VisualEffect.SetFloat("LOD", distance)` to reduce spawn rate at distance
5. **Culling**: VFX auto-culls when off-screen. Set bounds correctly
6. **Instancing**: Multiple VFX instances share GPU resources if same graph

## Common Gotchas

1. **Requires compute shaders**: Won't work on low-end mobile GPUs (OpenGL ES 3.0 minimum)
2. **Exposed properties must be explicitly exposed**: Right-click property → "Expose" in graph
3. **Event attributes not cached**: Create `VFXEventAttribute` once, reuse
4. **SRP only**: VFX Graph requires URP or HDRP — won't work with Built-in RP
5. **Particle System prefab warning**: VFX Graph assets are `.vfx`, not `.prefab`
