---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Burst Guide — BurstCompile, Restrictions, SharedStatic, FunctionPointer, BurstDiscard

## [BurstCompile] Attribute

```csharp
// On job struct
[BurstCompile]
public struct MyJob : IJob { ... }

// With parameters
[BurstCompile(
    FloatMode       = FloatMode.Fast,          // allows reordering float ops
    FloatPrecision  = FloatPrecision.Low,      // less precise, faster
    OptimizeFor     = OptimizeFor.Performance, // vs FastCompilation, Size, Balanced
    CompileSynchronously = false               // true = compile on Schedule (editor only)
)]
public struct PrecisionJob : IJob { ... }

// On static method
[BurstCompile]
public static class MathUtils
{
    [BurstCompile]
    public static void ProcessArray(ref NativeArray<float> data, float scale)
    {
        for (int i = 0; i < data.Length; i++)
            data[i] *= scale;
    }
}

// Assembly-wide default
[assembly: BurstCompile(OptimizeFor = OptimizeFor.FastCompilation)]
```

---

## Burst Restrictions

```csharp
// BAD — managed types
class MyData { }                          // classes
string message = "hello";                 // string fields
object[] arr = new object[10];            // managed arrays
Action callback;                          // delegates — use FunctionPointer instead
List<int> list;                           // System.Collections generics
try { } catch (Exception e) { }           // no try-catch / finally
object boxed = someInt;                   // no boxing
IInterface iface = new ConcreteType();
iface.Method();                           // no virtual dispatch through interface

// GOOD alternatives
NativeArray<float> arr;                   // native containers
FixedString32Bytes msg;                   // fixed strings
FunctionPointer<MyDelegate> fp;           // function pointers
Unity.Mathematics.math.*;                 // Burst-optimized math
```

---

## BurstDiscard — Exclude from Burst, Keep in Managed

`[BurstDiscard]` methods cannot have return values. Use `ref`/`out` for output.

```csharp
// WRONG: return value causes compile error
[BurstDiscard]
static string GetDebugString() => "debug";

// CORRECT
[BurstDiscard]
static void GetDebugString(out FixedString32Bytes result) => result = "debug";
[BurstDiscard]
static void DebugLog(ref bool logged, string message)
{
    UnityEngine.Debug.Log(message);
    logged = true;
}
// Profile markers work inside Burst
static readonly ProfilerMarker s_Marker = new ProfilerMarker("MyJob.Execute");
public void Execute() { s_Marker.Begin(); /* work */ s_Marker.End(); }
```

---

## SharedStatic — Mutable Static Data Shared Between C# and Burst
```csharp
public abstract class GameConfig
{
    public static readonly SharedStatic<float> GravityScale =
        SharedStatic<float>.GetOrCreate<GameConfig, GravityScaleKey>();
    public static readonly SharedStatic<int> MaxEntities =
        SharedStatic<int>.GetOrCreate<GameConfig, MaxEntitiesKey>();

    private class GravityScaleKey { }
    private class MaxEntitiesKey  { }

    // Initialize from C# before any Burst code runs
    static GameConfig() { GravityScale.Data = 9.81f; MaxEntities.Data = 10000; }
}

// Access from Burst job
float g = GameConfig.GravityScale.Data;
// WRONG: leaving SharedStatic uninitialized — undefined value in Burst
```

---

## FunctionPointer — Burst-Compatible Callbacks

```csharp
// 1. Define unmanaged delegate
[UnmanagedFunctionPointer(CallingConvention.Cdecl)]
public delegate float ProcessDelegate(float a, float b);

// 2. Implement — must be static, [BurstCompile] on containing type
[BurstCompile]
public static class Processors
{
    [BurstCompile]
    [MonoPInvokeCallback(typeof(ProcessDelegate))]
    public static float Multiply(float a, float b) => a * b;
}

// 3. Compile once and cache (compilation is expensive)
FunctionPointer<ProcessDelegate> _fp;
void OnCreate() =>
    _fp = BurstCompiler.CompileFunctionPointer<ProcessDelegate>(Processors.Multiply);

// 4. Invoke from job
public struct UsePointerJob : IJob
{
    public FunctionPointer<ProcessDelegate> Processor;
    public NativeArray<float> Data;
    public void Execute()
    {
        for (int i = 0; i < Data.Length; i++)
            Data[i] = Processor.Invoke(Data[i], 2f);
    }
}
// Restrictions: no generic delegates; no NativeContainer params in delegate signature
// Prefer jobs over function pointers for large data — better vectorization
```

---

-> See [burst-advanced-guide.md](burst-advanced-guide.md) for FunctionPointer batching pattern, CompileSynchronously, and unresolved questions.

