---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Particles & VFX

## Performance Budgets (Mobile)

| Tier | Max Systems | Max Particles/System | Total Active |
|------|------------|---------------------|-------------|
| Low | 3 | 30 | 100 |
| Medium | 5 | 50 | 250 |
| High | 8 | 100 | 500 |

## Common VFX Configs

**Hit Effect** — Duration: 0.3s, Max 20 particles, Burst 15 at t=0, Billboard Additive, Color: White→Yellow→transparent, Size over Lifetime: 1→0

**Coin Collect** — Duration: 0.5s, Max 8, Burst 8 at t=0, Cone shape 30°, Gravity 2, Mesh renderer GPU Instancing ON

**Dust Trail** — Continuous loop, Max 15, Rate 10/s, Lifetime 0.5-1.0, Billboard Alpha Blended, Noise Strength 0.2

## VFX Pool Service

```csharp
public sealed class VfxService : IInitializable, IDisposable
{
    readonly Dictionary<string, ObjectPool<ParticleSystem>> _pools = new();
    readonly Transform _poolParent;

    public void RegisterVfx(string id, ParticleSystem prefab, int warmUp = 5)
    {
        var pool = new ObjectPool<ParticleSystem>(
            createFunc: () => { var ps = Object.Instantiate(prefab, _poolParent); ps.gameObject.SetActive(false); return ps; },
            actionOnGet: ps => ps.gameObject.SetActive(true),
            actionOnRelease: ps => { ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear); ps.gameObject.SetActive(false); },
            defaultCapacity: warmUp, maxSize: warmUp * 3
        );
        _pools[id] = pool;
    }

    public async UniTask PlayAt(string id, Vector3 position, Quaternion? rotation = null)
    {
        if (!_pools.TryGetValue(id, out var pool)) return;
        var ps = pool.Get();
        ps.transform.SetPositionAndRotation(position, rotation ?? Quaternion.identity);
        ps.Play();
        await UniTask.Delay(TimeSpan.FromSeconds(ps.main.duration + ps.main.startLifetime.constantMax));
        pool.Release(ps);
    }

    public void Dispose() { foreach (var p in _pools.Values) p.Dispose(); _pools.Clear(); }
}
```

## Optimization Rules

- Render Mode: Billboard (cheapest); Max Particle Size: 0.5
- Fewer, larger particles beats many small ones — reduces overdraw
- Use Additive blending when possible (cheaper than Alpha Blended)
- Avoid overlapping particle systems; use simple unlit materials

### LOD for VFX
```csharp
void Update() {
    float dist = Vector3.Distance(transform.position, Camera.main!.transform.position);
    var e = _ps.emission;
    e.rateOverTimeMultiplier = dist < 10f ? 1f : dist < 25f ? 0.5f : dist < 50f ? 0.2f : 0f;
}
```

## VFX Graph (Unity 6, High-End Only)

Use when: 10,000+ particles, GPU-driven simulation, Vulkan/Metal only.
Do NOT use when: low-end devices, simple effects, OpenGL ES needed.
