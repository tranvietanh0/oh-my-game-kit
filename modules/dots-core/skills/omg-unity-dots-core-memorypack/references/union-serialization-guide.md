---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Union Serialization (Polymorphism) Guide

## Overview

Union serialization enables serializing interface/abstract class references polymorphically. Tag-based discriminated union format.

## Basic Pattern

```csharp
// Interface + union tags
[MemoryPackUnion(0, typeof(Warrior))]
[MemoryPackUnion(1, typeof(Mage))]
[MemoryPackUnion(2, typeof(Archer))]
public interface IUnit { }

// Implementations
[MemoryPackable]
public partial class Warrior : IUnit
{
    public int Armor { get; set; }
}

[MemoryPackable]
public partial class Mage : IUnit
{
    public int Mana { get; set; }
}

[MemoryPackable]
public partial class Archer : IUnit
{
    public int Accuracy { get; set; }
}

// Serialize
IUnit unit = new Warrior { Armor = 50 };
byte[] data = MemoryPackSerializer.Serialize(unit);

// Deserialize (auto-detects type via tag)
var loaded = MemoryPackSerializer.Deserialize<IUnit>(data);  // Returns Warrior
```

## Tag Numbering

- **0-249**: Direct tag values
- **250**: Next tag as unsigned short (16-bit)
- **255**: Union is null

Use sequential tags (0, 1, 2, ...) for simplicity.

## Unity Editor Registration (Critical)

Union formatters must be registered manually (no `[ModuleInitializer]` in Unity):

```csharp
#if UNITY_EDITOR
[InitializeOnLoad]
public static class UnionFormatterRegistry
{
    static UnionFormatterRegistry()
    {
        IUnitFormatter.RegisterFormatter();
    }
}
#endif
```

Generated class name: `{InterfaceName}Formatter`.

## Abstract Class Unions

```csharp
[MemoryPackUnion(0, typeof(Cat))]
[MemoryPackUnion(1, typeof(Dog))]
public abstract class Animal { }

[MemoryPackable]
public partial class Cat : Animal { public int Whiskers { get; set; } }

[MemoryPackable]
public partial class Dog : Animal { public int Teeth { get; set; } }

// Serialize base reference
Animal pet = new Cat { Whiskers = 20 };
byte[] data = MemoryPackSerializer.Serialize(pet);
var loaded = MemoryPackSerializer.Deserialize<Animal>(data);  // Returns Cat
```

## Null Handling

```csharp
IUnit? unit = null;
byte[] data = MemoryPackSerializer.Serialize(unit);

var loaded = MemoryPackSerializer.Deserialize<IUnit?>(data);  // Returns null
```

## Nested Unions

```csharp
[MemoryPackUnion(0, typeof(Attack))]
[MemoryPackUnion(1, typeof(Defend))]
[MemoryPackUnion(2, typeof(Flee))]
public interface IAction { }

[MemoryPackable]
public partial class Attack : IAction { public IUnit Target { get; set; } }

[MemoryPackable]
public partial class Defend : IAction { public int Durability { get; set; } }

[MemoryPackable]
public partial class Flee : IAction { public Vector3 Direction { get; set; } }
```

## Gotchas

1. Union tag values must be unique per interface
2. Derived classes must be `[MemoryPackable] partial`
3. Must manually register formatter in Unity Editor
4. Tag reuse across different unions OK (tags are interface-specific)
5. Null handled automatically (tag 255)

## Performance

Union serialization adds 1-3 bytes overhead (tag byte, or 2-byte tag if >250 types).
Deserialization uses tag to dispatch to correct formatter (O(1) lookup).
