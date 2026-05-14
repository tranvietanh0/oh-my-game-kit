---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# MemoryPack: Gotchas 1–5 (Core)

## Gotcha 1: ModuleInitializer Not Supported in Unity

**Problem**: Union formatters auto-register via `[ModuleInitializer]` in .NET, but Unity strips this.

**Symptom**: Union deserialization throws `MemoryPackSerializationException` or can't find formatter.

**Fix**: Manual registration:

```csharp
#if UNITY_EDITOR
[InitializeOnLoad]
public static class FormatterRegistry
{
    static FormatterRegistry()
    {
        IUnitFormatter.RegisterFormatter();
        IActionFormatter.RegisterFormatter();
    }
}
#endif
```

Create one central registry class listing all union types.

---

## Gotcha 2: Default Mode Breaks on Field Removal/Reorder

**Problem**: `GenerateType.Object` (default) fails if fields are removed or reordered.

```csharp
// V1 → V2: BREAKS (reorder)
[MemoryPackable] public partial class Config { public float Health; public string Name; }
// Was: public string Name; public float Health;
```

**Safe**: Adding fields with defaults is OK.

**Fix**: Use `GenerateType.VersionTolerant` for evolving schemas:

```csharp
[MemoryPackable(GenerateType.VersionTolerant)]
public partial class Config
{
    [MemoryPackOrder(0)] public string Name { get; set; }
    [MemoryPackOrder(1)] public float Health { get; set; } = 100f;
}
// Now safe to add/remove/reorder. Trade-off: ~5% slower.
```

---

## Gotcha 3: StructLayout(Auto) Differs Between Mono and IL2CPP

**Problem**: Struct memory layout differs between Editor (Mono) and Android/iOS (IL2CPP).

```csharp
[StructLayout(LayoutKind.Auto)]
public struct Mixed { public byte A; public int B; }
// Padding may differ → save in Editor, corrupt on device
```

**Fix**: Use explicit layout:

```csharp
[StructLayout(LayoutKind.Sequential)]
public struct Mixed { public byte A; public int B; }
// Or use LayoutKind.Explicit with [FieldOffset(N)] for precise control
```

---

## Gotcha 4: No Stream Support (ReadOnlySpan Only)

**Problem**: API only accepts `ReadOnlySpan<byte>` or `IBufferWriter<byte>`, not `Stream`.

```csharp
MemoryPackSerializer.Serialize(fileStream, obj); // COMPILE ERROR
```

**Fix**:

```csharp
// Write to file
byte[] data = MemoryPackSerializer.Serialize(obj);
File.WriteAllBytes("file.bin", data);

// Write via writer (avoids intermediate array)
var writer = new ArrayBufferWriter<byte>();
MemoryPackSerializer.Serialize(writer, obj);
File.WriteAllBytes("file.bin", writer.WrittenSpan.ToArray());
```

---

## Gotcha 5: Readonly Properties Not Supported

**Problem**: MemoryPack requires settable properties.

```csharp
[MemoryPackable]
public partial class Immutable
{
    public string Name { get; }  // FAILS: readonly property
}
```

**Fix**: Make properties writable:

```csharp
[MemoryPackable]
public partial class Mutable
{
    public string Name { get; set; }  // OK
}
```

---

## Quick Diagnostic

| Error | Cause | Fix |
|-------|-------|-----|
| `Formatter not found for IUnit` | Union not registered | Add `[InitializeOnLoad]` registry |
| `SerializationException: Unexpected token` | Schema mismatch (v1→v2) | Use `GenerateType.VersionTolerant` |
| `Cannot find formatter` | Type not `[MemoryPackable]` | Add attribute + `partial` |
| `Compile error: readonly property` | Property not writable | Change to `{ get; set; }` |
| Save/load works in Editor, fails on device | StructLayout differs | Use `LayoutKind.Sequential` |
