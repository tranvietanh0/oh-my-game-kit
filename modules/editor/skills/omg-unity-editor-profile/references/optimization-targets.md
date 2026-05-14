---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Optimization Targets Reference

## Rendering Thresholds

| Metric | Mobile Target | Desktop Target | Critical (Stop Ship) |
|--------|--------------|----------------|----------------------|
| Draw Calls | < 100 | < 300 | > 500 |
| Batches | > 5 | > 10 | = 0 |
| Triangles | < 200K | < 1M | > 2M |
| FPS | > 30 | > 60 | < 20 |
| Memory (MB) | < 512 | < 2048 | > 3000 |

## DOTS Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Chunk utilization | > 75% | Per archetype. Low = too many small archetypes |
| System time/frame | < 2ms | Per system. Burst-compiled + Jobs required |
| Job thread usage | > 4 threads | On 8+ core machines |
| GC alloc/frame | 0 B | Must be zero in hot path |

## Common Fixes by Symptom

### draw_calls too high (> 300 desktop)
1. Enable GPU instancing on materials
2. Use `MeshRenderer.sharedMaterial` (not `.material`)
3. Add impostor LOD for distant units — see `amplify-impostors` skill
4. Combine static meshes (ProBuilder)

### batches = 0 or very low
1. SRP Batcher must be enabled: Graphics Settings → SRP Batcher = On
2. All materials must be SRP-compatible (URP/Lit or URP/Unlit)
3. Mixed shader variants break batching — standardize shaders per unit type

### FPS < 30 on target hardware
1. Profile system timing — find the > 2ms offender
2. Ensure `[BurstCompile]` on ISystem + OnUpdate
3. Move to IJobEntity for parallel processing
4. Check FixedTimestep rate (60Hz can be reduced to 30Hz for physics-light demos)

### Chunk utilization < 75%
1. Increase `[InternalBufferCapacity(N)]` to reduce DynamicBuffer overflow chunks
2. Consolidate archetypes — fewer optional components per entity
3. Use IEnableableComponent instead of add/remove for toggling

### System > 2ms
1. Add `[BurstCompile]` if missing
2. Narrow EntityQuery with additional `WithAll<>` filters
3. Split into two systems: read-only (parallel) + write (single-threaded)
4. Use `ScheduleParallel()` instead of `Schedule()`
