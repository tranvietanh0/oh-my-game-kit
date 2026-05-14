---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Protobuf Gotchas Guide for Unity

## 1. IL2CPP Code Stripping (CRITICAL)

IL2CPP strips unused types. Protobuf reflection-based deserialization may fail silently.

**Fix**: Add `Assets/link.xml`:
```xml
<linker>
  <assembly fullname="Google.Protobuf" preserve="all"/>
  <assembly fullname="protobuf-net" preserve="all"/>
  <assembly fullname="protobuf-net.Core" preserve="all"/>
  <!-- Your generated proto assembly -->
  <assembly fullname="Assembly-CSharp" preserve="all">
    <type fullname="YourNamespace.YourProtoMessage" preserve="all"/>
  </assembly>
</linker>
```

Or set **Managed Stripping Level → Medium** in Player Settings.

## 2. protobuf-net Reflection Mode Fails on IL2CPP

Default protobuf-net uses runtime reflection to build serializers. IL2CPP strips reflection metadata.

**Fix**: Use `protobuf-net.Core` (reflection-free) or source generator:
```xml
<!-- In .csproj or asmdef -->
<PackageReference Include="protobuf-net.BuildTools" Version="3.*" PrivateAssets="all" />
```

Or pre-compile the serialization model:
```csharp
var model = RuntimeTypeModel.Default;
model.Add(typeof(GameSave), true);
model.CompileInPlace(); // Call once at startup
```

## 3. Proto Field Number Reuse (DATA CORRUPTION)

**NEVER** reuse or change field numbers after data has been serialized.

```protobuf
// Version 1
message Config {
  string name = 1;
  int32 level = 2;
  float speed = 3;  // removed in v2
}

// Version 2 — WRONG
message Config {
  string name = 1;
  int32 level = 2;
  string description = 3;  // REUSES field 3 — corrupts old data!
}

// Version 2 — CORRECT
message Config {
  string name = 1;
  int32 level = 2;
  reserved 3;              // Mark removed field as reserved
  string description = 4;  // New field gets new number
}
```

protobuf-net equivalent:
```csharp
[ProtoContract]
public class Config
{
    [ProtoMember(1)] public string Name { get; set; }
    [ProtoMember(2)] public int Level { get; set; }
    // [ProtoMember(3)] was Speed — REMOVED, never reuse 3
    [ProtoMember(4)] public string Description { get; set; }
}
```

## 4. Default Values Not Serialized (Proto3)

Proto3 does NOT serialize default values: `0`, `""`, `false`, `null`.

```csharp
// If Health is 0, it won't be in the wire data
// On deserialization, it will be 0 (default) — usually fine
// But if you need to distinguish "not set" from "explicitly 0":

// Option A: Use wrapper types
message UnitState {
  google.protobuf.FloatValue health = 1;  // null = not set, 0 = explicitly zero
}

// Option B: Use has_* field tracking (proto3 optional)
message UnitState {
  optional float health = 1;  // generates HasHealth property
}
```

## 5. DateTime/TimeSpan Not Native

Protobuf has no built-in DateTime. Options:

```csharp
// Option A: Well-known types (Google.Protobuf)
import "google/protobuf/timestamp.proto";
import "google/protobuf/duration.proto";

message Event {
  google.protobuf.Timestamp created_at = 1;
  google.protobuf.Duration cooldown = 2;
}

// Option B: Long ticks (protobuf-net)
[ProtoContract]
public class Event
{
    [ProtoMember(1)] public long CreatedAtTicks { get; set; }

    [ProtoIgnore]
    public DateTime CreatedAt
    {
        get => new DateTime(CreatedAtTicks, DateTimeKind.Utc);
        set => CreatedAtTicks = value.Ticks;
    }
}
```

## 6. Nested Message vs Flat — Performance

Deeply nested messages = more allocations on deserialize. For hot-path data (network state snapshots), prefer flat messages — one field per scalar rather than nested sub-messages. Each nested message is a separate heap allocation.

## 7. Thread Safety

- `Serializer.Serialize/Deserialize` (protobuf-net) — thread-safe for reads
- `RuntimeTypeModel.Default` — NOT thread-safe for mutation; add types at startup only
- `MessageParser.ParseFrom` (Google.Protobuf) — thread-safe
- Generated message classes — NOT thread-safe; don't share mutable instances across threads

## Quick Diagnostics

| Symptom | Cause | Fix |
|---------|-------|-----|
| `TypeLoadException` on IL2CPP | Code stripping | Add `link.xml` |
| Silent data loss | Field number reuse | Never reuse numbers |
| Missing fields on deserialize | Default value = 0 | Use `optional` or wrapper types |
| `InvalidOperationException` | Reflection mode on AOT | Use `protobuf-net.Core` |
| Wrong DateTime values | Timezone mismatch | Always UTC + ticks |
