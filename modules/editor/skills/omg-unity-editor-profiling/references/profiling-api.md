---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Unity Profiling — API & Tools Reference

## Profiler Window

**Window → Analysis → Profiler** (Ctrl+7)

| Module | Shows | Key Metrics |
|--------|-------|-------------|
| CPU Usage | System/script time per frame | Main Thread ms, GC Alloc |
| GPU Usage | Rendering time | Draw calls, GPU ms |
| Rendering | Batches, triangles, overdraw | SetPass calls, batches |
| Memory | Heap, texture, mesh, audio | Total allocated, GC |
| Physics | Contacts, rigidbodies | Active bodies, contacts |
| Audio | Channels, DSP, clips | Playing sources, CPU % |

## Custom Markers (ProfilerMarker)

```csharp
using Unity.Profiling;

public class GameSystem : MonoBehaviour {
    // Static marker (zero alloc):
    static readonly ProfilerMarker s_UpdateMarker = new("GameSystem.Update");
    static readonly ProfilerMarker s_PhysicsMarker = new("GameSystem.Physics");

    void Update() {
        // Auto-dispose scope:
        using (s_UpdateMarker.Auto()) { DoGameLogic(); }

        // Manual begin/end:
        s_PhysicsMarker.Begin();
        DoPhysics();
        s_PhysicsMarker.End();
    }
}

// Legacy API (allocates on first call — avoid in hot paths):
Profiler.BeginSample("MySection");
// ... code ...
Profiler.EndSample();
```

## ProfilerRecorder — Custom Counters

```csharp
public class StatsDisplay : MonoBehaviour {
    ProfilerRecorder _mainThreadTime;
    ProfilerRecorder _drawCallsRecorder;
    ProfilerRecorder _gcAllocRecorder;

    void OnEnable() {
        _mainThreadTime = ProfilerRecorder.StartNew(ProfilerCategory.Internal, "Main Thread");
        _drawCallsRecorder = ProfilerRecorder.StartNew(ProfilerCategory.Render, "Draw Calls Count");
        _gcAllocRecorder = ProfilerRecorder.StartNew(ProfilerCategory.Memory, "GC Allocated In Frame");
    }

    void OnDisable() {
        _mainThreadTime.Dispose();
        _drawCallsRecorder.Dispose();
        _gcAllocRecorder.Dispose();
    }

    void OnGUI() {
        GUI.Label(new Rect(10, 10, 300, 20),
            $"Main: {_mainThreadTime.LastValue * 1e-6:F1}ms | " +
            $"Draw: {_drawCallsRecorder.LastValue} | " +
            $"GC: {_gcAllocRecorder.LastValue / 1024}KB");
    }
}

// Custom counter (visible in Profiler window):
static readonly ProfilerCounterValue<int> s_EnemyCount =
    new(ProfilerCategory.Scripts, "Enemy Count", ProfilerMarkerDataUnit.Count);
void Update() { s_EnemyCount.Value = activeEnemies.Count; }
```

## Memory Profiler Package

Install `com.unity.memoryprofiler`. **Window → Analysis → Memory Profiler**

```
1. Take Snapshot (in Play mode or connected device)
2. Compare two snapshots to find leaks
3. Check:
   - Objects tab → sort by size → find unexpected large objects
   - All Objects → filter by type → check reference count
   - Tree Map → visual overview of memory distribution
```

## Frame Debugger

**Window → Analysis → Frame Debugger** → Enable

```
Shows every draw call in order:
1. Click draw calls to see: mesh, shader, properties, textures
2. Identify: redundant draws, broken batching, overdraw
3. Check: why SRP Batcher breaks (different shader variants)
```

## Profiling on Device

```
1. Build Settings:
   - Development Build: ON
   - Autoconnect Profiler: ON
   - Deep Profiling Support: ON (optional, adds overhead)

2. Connect:
   - USB: Auto-detected in Profiler window
   - WiFi: Profiler → Target Selection → IP address

3. Android ADB:
   adb forward tcp:34999 localabstract:Unity-<packagename>
   // Then connect to localhost:34999 in Profiler
```

## Automated Profiling (Save to File)

```csharp
Profiler.logFile = Application.persistentDataPath + "/profiler_log";
Profiler.enableBinaryLog = true;
Profiler.enabled = true;
// Load in Profiler window: Profiler → Load → select .raw file
```

## Deep Profiling vs Instrumented

| Mode | Overhead | Coverage | When |
|------|----------|----------|------|
| Instrumented | Low | Marked code only | Production, regular use |
| Deep | High (10–50x slower) | Every method call | Finding hidden costs |

## Common Bottleneck Patterns

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| CPU spike every few frames | GC collection | Reduce allocations (pool, structs) |
| High "Scripts" time | Expensive Update() | Cache components, reduce GetComponent |
| High "Rendering" time | Too many draw calls | Batch, atlas textures, reduce objects |
| High "Physics" time | Too many colliders | Simplify, use layers, reduce frequency |
| GPU bound (CPU idle) | Complex shaders/overdraw | Simplify shaders, reduce transparency |
| Memory grows over time | Leak (unreleased refs) | Memory Profiler snapshots, check events |

## Common Gotchas

1. **Profiler overhead**: Costs 1–3ms — subtract from measurements
2. **Editor vs Build**: Editor 2–10x slower; GC.Alloc in Update = red flag; first frame spike = not representative
3. **Burst code**: Shows as single block — use `ProfilerMarker` inside Burst jobs
4. **async/await**: Shows as coroutine — wrap `await` with `ProfilerMarker`
