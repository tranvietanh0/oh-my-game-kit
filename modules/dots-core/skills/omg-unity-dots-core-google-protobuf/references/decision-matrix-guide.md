---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Protobuf vs MemoryPack — Decision Matrix

| Criteria | Protobuf | MemoryPack |
|----------|----------|------------|
| **Speed (C#-only)** | Slower (2-5x) | **10x faster** |
| **Cross-language** | **Yes** (10+ langs) | No (C# only) |
| **Schema evolution** | **Excellent** (built-in) | Limited (VersionTolerant mode) |
| **Payload size** | **Smaller** (varint encoding) | Larger (fixed-width) |
| **Unity IL2CPP** | Needs care | Source-gen safe |
| **DOTS IComponentData** | Same wrapper needed | Same wrapper needed |
| **Best for** | Network RPC, cross-lang | Save/load, C#-only perf |

**Rule**: MemoryPack for C#-only speed, Protobuf for cross-language or bandwidth.

---

## DOTS Integration Pattern

Unmanaged `IComponentData` structs need a managed wrapper bridge for serialization:

```csharp
// Unmanaged ECS component
public readonly struct Health : IComponentData { public readonly float HP; }

// Managed protobuf-net snapshot wrapper
[ProtoContract]
public class HealthSnapshot
{
    [ProtoMember(1)] public float HP { get; set; }
    public static HealthSnapshot From(in Health h) => new() { HP = h.HP };
    public Health ToComponent() => new() { HP = HP };
}
```

Same pattern applies to Google.Protobuf generated classes — convert to/from IComponentData at system boundaries.

### Serialization Flow

```
ISystem.OnUpdate
  → extract component values into managed snapshot
  → Serializer.Serialize(stream, snapshot)     // protobuf-net
  → UnitState.Parser.ParseFrom(bytes)           // Google.Protobuf
  → snapshot.ToComponent() → SetComponent(entity, component)
```

### Batch Serialization (protobuf-net)

```csharp
// Serialize all entities in one pass
using var ms = new MemoryStream();
foreach (var (health, transform) in query)
{
    var snap = new UnitSnapshot
    {
        HP = health.HP,
        X = transform.Position.x,
        Z = transform.Position.z
    };
    Serializer.SerializeWithLengthPrefix(ms, snap, PrefixStyle.Base128);
}
File.WriteAllBytes("state.bin", ms.ToArray());
```
