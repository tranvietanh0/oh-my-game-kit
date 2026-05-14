---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Burst Advanced Guide — FunctionPointer Batching, CompileSynchronously

## FunctionPointer Batching (High-Performance Pattern)

Process data in batches via function pointers for better vectorization (from Unity Burst docs):

```csharp
[BurstCompile]
public class MyFunctionPointers
{
    public unsafe delegate void BatchProcessDelegate(int count, float* input, float* output);

    [BurstCompile]
    public static unsafe void SqrtBatch(int count, float* input, float* output)
    {
        for (int i = 0; i < count; i++)
            output[i] = math.sqrt(input[i]);
    }
}

[BurstCompile]
struct BatchJob : IJobParallelForBatch
{
    public FunctionPointer<MyFunctionPointers.BatchProcessDelegate> Processor;
    [ReadOnly] public NativeArray<float> Input;
    [WriteOnly] public NativeArray<float> Output;

    public unsafe void Execute(int index, int count)
    {
        var inputPtr = (float*)Input.GetUnsafeReadOnlyPtr() + index;
        var outputPtr = (float*)Output.GetUnsafePtr() + index;
        Processor.Invoke(count, inputPtr, outputPtr);
    }
}
```

**Rule:** Prefer batched function pointers over per-element invocation — enables SIMD vectorization within each batch.

---

## CompileSynchronously

```csharp
// Force synchronous compilation on first schedule (editor debugging only)
[BurstCompile(CompileSynchronously = true)]
public struct DebugJob : IJob { ... }
```

**Warning:** `CompileSynchronously = true` blocks the main thread on first schedule. Use only for editor debugging — never in production builds.

---

## Unresolved Questions

- `OptimizeFor.Balanced` vs `Performance` in Unity 6 — docs sparse
- `[BurstCompile]` on generic methods — partial support, edge cases undocumented
- `v128`/`v256` SIMD intrinsics — platform-specific, needs separate deep-dive
