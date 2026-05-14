---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Version-Tolerant Schema Evolution

## Problem: Default Mode Locks Schema

Default `GenerateType.Object` mode requires schema stability:
- Adding fields: OK (new field gets default)
- Removing fields: BREAKS deserialization
- Reordering fields: BREAKS deserialization

## Solution: GenerateType.VersionTolerant

Enables field addition, removal, and reordering:

```csharp
[MemoryPackable(GenerateType.VersionTolerant)]
public partial class FlexibleConfig
{
    [MemoryPackOrder(0)]
    public string Name { get; set; }

    [MemoryPackOrder(1)]
    public int Version { get; set; }

    [MemoryPackOrder(2)]
    public float Health { get; set; }
}

// Can now:
// - Add new fields (gets default value on old data)
// - Remove fields (old data ignored)
// - Reorder fields (order tracked by [MemoryPackOrder])
```

## Migration Patterns

### V1 → V2: Add Field

```csharp
// V1
[MemoryPackable(GenerateType.VersionTolerant)]
public partial class ConfigV1
{
    [MemoryPackOrder(0)]
    public string Name { get; set; }
}

// V2 (compatible with V1 data)
[MemoryPackable(GenerateType.VersionTolerant)]
public partial class ConfigV2
{
    [MemoryPackOrder(0)]
    public string Name { get; set; }

    [MemoryPackOrder(1)]
    public float Health { get; set; } = 100f;  // Default for missing V1 data
}
```

### V1 → V2: Remove Field

```csharp
// V1
[MemoryPackable(GenerateType.VersionTolerant)]
public partial class ConfigV1
{
    [MemoryPackOrder(0)]
    public string Name { get; set; }

    [MemoryPackOrder(1)]
    public int Deprecated { get; set; }  // Will be ignored
}

// V2 (compatible with V1 data, ignores Deprecated)
[MemoryPackable(GenerateType.VersionTolerant)]
public partial class ConfigV2
{
    [MemoryPackOrder(0)]
    public string Name { get; set; }
    // Deprecated field omitted
}
```

### V1 → V2: Reorder Fields

```csharp
// V1
[MemoryPackable(GenerateType.VersionTolerant)]
public partial class ConfigV1
{
    [MemoryPackOrder(0)]
    public string Name { get; set; }

    [MemoryPackOrder(1)]
    public int Level { get; set; }
}

// V2 (reordered, but [MemoryPackOrder] preserves mapping)
[MemoryPackable(GenerateType.VersionTolerant)]
public partial class ConfigV2
{
    [MemoryPackOrder(1)]
    public int Level { get; set; }

    [MemoryPackOrder(0)]
    public string Name { get; set; }
}

// Old V1 data deserializes correctly (order doesn't matter)
```

## Trade-offs

- **Speed**: ~5% slower than default mode (tag-based encoding)
- **Payload**: Slightly larger (field tags)
- **Complexity**: Requires [MemoryPackOrder] on every field

## When to Use

**Version-Tolerant**:
- Config persistence (may evolve over game updates)
- Save files (long-lived across versions)
- User-generated content

**Default Mode** (Faster):
- Entity snapshots (schema fixed per release)
- Network RPC commands (client/server always in sync)
- Session data (ephemeral, version-locked)

## Best Practices

1. Plan field order upfront (rarely change tag numbers)
2. Never reuse field order tags (add new instead of remove+reorder)
3. Default all new fields to allow old data migration
4. Test version migration in unit tests
5. Document breaking changes when removing fields
