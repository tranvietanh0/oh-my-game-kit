---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# MemoryPack: Gotchas 6–10 (Extended)

## Gotcha 6: .csproj Editing Disabled in Unity

**Problem**: MemoryPack can generate TypeScript schema definitions, but requires `.csproj` edits. Unity auto-generates `.csproj` files — edits are ignored on reimport.

**Impact**: Can't auto-generate schema documents or TypeScript definitions from the Unity Editor.

**Workaround**: Extract serializable types to a non-Unity .NET library:

```
Solution/
├── GameTypes/              # Non-Unity .NET library (.csproj editable)
│   └── Config.cs           # [MemoryPackable] types here
└── GameClient/             # Unity project
    └── References GameTypes.dll
```

Generate schemas from `GameTypes` project, use compiled DLL in Unity.

---

## Gotcha 7: Union Formatters Have No Runtime Generation

**Problem**: Dynamically adding union implementations at runtime is impossible — formatters are compile-time only.

```csharp
// All union types MUST be declared at compile time
[MemoryPackUnion(0, typeof(Cat))]
[MemoryPackUnion(1, typeof(Dog))]
public interface IAnimal { }

// Cannot add at runtime: no API to register new union subtypes dynamically
```

**Fix**: Plan the complete union type list upfront. If extensibility is needed, consider a manual discriminator pattern with `byte[] Payload`.

---

## Gotcha 8: Circular References — Partial Support

**Problem**: Circular object graphs cause infinite serialization recursion.

```csharp
public class Node { public Node Parent; public List<Node> Children; }
// A → B → C → A (cycle) → stack overflow
```

MemoryPack detects some cycles but performance impact is undefined.

**Fix**: Replace object references with IDs:

```csharp
[MemoryPackable]
public partial class NodeSnapshot
{
    public int Id { get; set; }
    public int? ParentId { get; set; }      // ID reference, not object ref
    public List<int> ChildIds { get; set; }
}
```

---

## Gotcha 9: Can't Serialize IComponentData Directly

**Problem**: `IComponentData` is an unmanaged struct. MemoryPack requires properties; unmanaged structs use fields only.

```csharp
// WON'T WORK
[MemoryPackable]
public partial struct Health : IComponentData { public float HP { get; set; } }
```

**Fix**: Wrapper bridge pattern (see SKILL.md § DOTS section).

**Performance note**: Adds one managed allocation per entity snapshot. Acceptable for save/load, not suitable for per-frame RPC.

---

## Gotcha 10: NativeArray Requires Conversion

**Problem**: `NativeArray<T>` cannot be serialized directly.

```csharp
// FAILS: no formatter for NativeArray<float>
byte[] data = MemoryPackSerializer.Serialize(nativeArray);
```

**Fix**: Convert to managed array before serializing:

```csharp
[MemoryPackable]
public partial class BulkData { public float[] Values { get; set; } }

// Serialize
byte[] bytes = MemoryPackSerializer.Serialize(new BulkData { Values = nativeArray.ToArray() });

// Deserialize + restore
var loaded = MemoryPackSerializer.Deserialize<BulkData>(bytes);
var restored = new NativeArray<float>(loaded.Values, Allocator.Persistent);
```

`nativeArray.ToArray()` allocates one managed array — acceptable for save/load, not per-frame.
