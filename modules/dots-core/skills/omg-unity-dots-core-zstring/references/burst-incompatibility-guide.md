---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# ZString & Burst Incompatibility Guide

**TL;DR**: ZString uses `ThreadStatic` managed buffers. Burst requires blittable, static-math-only code. They cannot coexist in the same method.

## Why ZString Can't Be Used in Burst

Burst constraints:
- Only blittable types (float, int, struct of blittables)
- No reference types, managed collections, ThreadStatic, or threading APIs
- No reflection, LINQ, or dynamic code

ZString's `ThreadLocal<char[]>` buffer violates all of these. Error: `BC1064: ThreadStatic field access not supported`.

## Correct DOTS Pattern: Hybrid Computation

```
Burst System (compute)        →  Managed Presenter (display)
[BurstCompile]OnUpdate()         Update() { SetTextFormat() }
No strings                       Uses ZString
```

### Example: Combat Floating Text

```csharp
// 1. Data Component (no strings, blittable)
public struct DamageDealt : IComponentData { public float Amount; public float3 Position; }

// 2. Burst System (no strings)
[BurstCompile]
public partial struct DamageSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state) { new ApplyDamageJob().ScheduleParallel(); }
}

// 3. Managed Presenter (uses ZString)
public partial class CombatPresenter : MonoBehaviour
{
    private void Update()
    {
        foreach (var evt in GetDamageThisFrame())
        {
            var text = ZString.Format("{0} → {1} ({2:F0} dmg)",
                GetEntityName(evt.Attacker), GetEntityName(evt.Target), evt.Amount);
            floatingTextUI.ShowAt(text, evt.Position);
        }
    }
}
```

## Anti-Pattern (FAILS)

```csharp
[BurstCompile]
public partial struct BadSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var msg = ZString.Format("x={0}", x); // BC1064: ThreadStatic not supported
    }
}
```

## Workarounds (If Strings Needed in Burst)

**Option A: Pre-allocated string constant**
```csharp
string msg = attackHit ? "HIT" : "MISS"; // Burst OK — no ZString involved
```

**Option B: FixedString (Burst-native, 256 char limit)**
```csharp
var sb = new FixedString256Bytes();
sb.Append("x=");
sb.Append(x); // Burst-safe
```

**Option C: Move building outside Burst entirely**
```csharp
// Burst job computes, managed loop formats
public partial class DisplaySystem : MonoBehaviour
{
    private void Update()
    {
        foreach (var r in GetComputeResults())
            Debug.Log(ZString.Format("Result: {0}", r)); // OK
    }
}
```

## Decision Tree

```
Need string formatting?
├─ In [BurstCompile]? → YES → Use FixedString or pre-allocated literals
└─ In managed code?  → YES → Use ZString (zero allocs, TMP integration)
```

## Summary

| Context | Tool |
|---------|------|
| Burst system (IJobEntity, IJobChunk) | FixedString |
| Managed OnUpdate / MonoBehaviour | ZString |
| Pre-format once | String literal |
| Hybrid (compute + display) | ZString in presenter |
