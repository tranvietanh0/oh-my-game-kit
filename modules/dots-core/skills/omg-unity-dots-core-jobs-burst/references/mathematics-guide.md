---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Mathematics Guide — float2/3/4, quaternion, math.*, Random, Noise

## Vector Types

```csharp
using Unity.Mathematics;

float3 pos = new float3(1f, 2f, 3f);
float3 up  = float3(0, 1, 0);       // implicit static factory
float2 uv  = new float2(0.5f, 0.5f);
int3 grid  = new int3(2, 4, 6);

// Swizzle (HLSL-style)
float2 xz  = pos.xz;
float4 pos4 = pos.xyzz;
```

---

## Math Operations (All Burst-Optimized)

```csharp
float3 a = float3(1, 2, 3);
float3 b = float3(4, 5, 6);

float3 sum    = a + b;
float3 prod   = a * b;                   // component-wise
float  dot    = math.dot(a, b);
float3 cross  = math.cross(a, b);
float  len    = math.length(a);
float3 norm   = math.normalize(a);
float  dist   = math.distance(a, b);
float3 lerp   = math.lerp(a, b, 0.5f);
float3 clamped = math.clamp(a, float3(0), float3(1));
float  sat    = math.saturate(0.7f);     // clamp to [0,1]
```

---

## Quaternion and Rotation

```csharp
quaternion rot      = quaternion.identity;
quaternion axisRot  = quaternion.AxisAngle(math.up(), math.radians(45f));
quaternion euler    = quaternion.EulerXYZ(0, math.PI * 0.5f, 0);
quaternion lookRot  = quaternion.LookRotation(forward, up);

quaternion combined = math.mul(rotA, rotB);
float3     rotated  = math.rotate(rot, direction);
quaternion slerped  = math.slerp(rotA, rotB, t);
quaternion nlerped  = math.nlerp(rotA, rotB, t); // faster, slightly less accurate

float3x3 mat3 = new float3x3(rot);
float4x4 mat4 = new float4x4(rot, position);
```

---

## float4x4 Transform Matrix

```csharp
float4x4 trs       = float4x4.TRS(position, rotation, scale);
float4x4 translate = float4x4.Translate(float3(1, 0, 0));
float4x4 scaleM    = float4x4.Scale(2f);
float4x4 inv       = math.inverse(trs);
float4x4 transposed = math.transpose(trs);

float3 worldPos = math.transform(trs, localPos);  // transforms point
float3 worldDir = math.rotate(trs, localDir);      // transforms direction (no translation)
```

---

## Interpolation and Smoothing

```csharp
float lerp   = math.lerp(0f, 10f, t);          // linear
float smooth = math.smoothstep(0f, 1f, t);      // cubic ease
float unlerp = math.unlerp(min, max, value);    // inverse lerp → [0,1]
float remap  = math.remap(inMin, inMax, outMin, outMax, value);
float3 sel   = math.select(a, b, condition);    // branchless ternary
```

---

## Random (Seeded, Burst-Compatible)

Must be a struct field in jobs — NOT a static field.

```csharp
public struct SpawnJob : IJob
{
    public Random Rng; // Unity.Mathematics.Random

    public void Execute()
    {
        float      val = Rng.NextFloat(0f, 1f);
        float3     dir = Rng.NextFloat3Direction();  // unit sphere
        float2     uv  = Rng.NextFloat2();           // [0,1]
        int        idx = Rng.NextInt(0, 100);
        quaternion r   = Rng.NextQuaternionRotation();
    }
}

// Unique seed per entity/chunk index
var rng = new Random((uint)(unfilteredChunkIndex * 1000 + 1));
```

---

## Noise

```csharp
float  n1 = noise.cnoise(float2(x, y));            // classic perlin [-1, 1]
float  n2 = noise.snoise(float3(x, y, z));          // simplex [-1, 1]
float2 n3 = noise.psrdnoise(float2(x, y), float2(period), alpha, out float2 gradient);

// Scale to [0, 1]
float terrain = math.unlerp(-1f, 1f, noise.cnoise(uv * scale));
```

---

## Common Patterns

```csharp
// Safe normalize (avoid on near-zero vector)
float3 dir = velocity;
if (math.lengthsq(dir) > 0.0001f)
    dir = math.normalize(dir);

// Angle between vectors
float angle = math.acos(math.clamp(math.dot(a, b), -1f, 1f));

// Project point onto plane
float3 projected = pos - math.dot(pos, normal) * normal;

// Move toward target (clamped)
float3 delta = target - current;
float  dist  = math.length(delta);
float3 moved = dist > speed * dt
    ? current + (delta / dist) * speed * dt
    : target;

// Conversion: UnityEngine <-> Unity.Mathematics (avoid in jobs)
float3  f3 = (float3)unityVector3;
Vector3 v3 = (Vector3)mathFloat3;
```
