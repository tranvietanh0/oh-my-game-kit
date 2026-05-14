---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Network Serialization Patterns

## Pattern 1: Command Union Serialization

```csharp
[MemoryPackable] public partial class MoveCommand { public int UnitId; public Vector3 Target; public float Speed; }
[MemoryPackable] public partial class AttackCommand { public int AttackerId; public int TargetId; public float Damage; }

[MemoryPackUnion(0, typeof(MoveCommand))]
[MemoryPackUnion(1, typeof(AttackCommand))]
public interface IGameCommand { }

// Send
byte[] data = MemoryPackSerializer.Serialize((IGameCommand)new MoveCommand { UnitId = 42, Target = new Vector3(10, 0, 20) });
networkManager.SendToServer(data);

// Receive
var cmd = MemoryPackSerializer.Deserialize<IGameCommand>(receivedBytes);
if (cmd is MoveCommand move) MoveUnit(move.UnitId, move.Target);
```

## Pattern 2: Batch Commands (Per Network Tick)

```csharp
[MemoryPackable]
public partial class CommandBatch
{
    public int FrameNumber { get; set; }
    public List<IGameCommand> Commands { get; set; }
}

var batch = new CommandBatch
{
    FrameNumber = Time.frameCount,
    Commands = new List<IGameCommand>
    {
        new MoveCommand { UnitId = 1, Target = new Vector3(0, 0, 10) },
        new AttackCommand { AttackerId = 2, TargetId = 3, Damage = 50f }
    }
};
networkManager.SendBatch(MemoryPackSerializer.Serialize(batch));
```

## Pattern 3: Delta Updates (Partial State)

```csharp
[MemoryPackable]
public partial class EntityDelta
{
    public int EntityId { get; set; }
    public Vector3? Position { get; set; }   // null = unchanged
    public float? Health { get; set; }
}

[MemoryPackable]
public partial class WorldStateDelta
{
    public List<EntityDelta> UpdatedEntities { get; set; }
    public List<int> DestroyedEntityIds { get; set; }
}

// Receive and apply partial updates
var delta = MemoryPackSerializer.Deserialize<WorldStateDelta>(received);
foreach (var update in delta.UpdatedEntities)
{
    var entity = FindEntityById(update.EntityId);
    if (update.Position.HasValue) SetPosition(entity, update.Position.Value);
    if (update.Health.HasValue) SetHealth(entity, update.Health.Value);
}
```

## Performance Guidelines

1. **Batch commands**: send multiple commands per tick to reduce overhead
2. **Delta updates**: send only changed fields to reduce payload size
3. **Compression**: use `GZipStream` for large payloads (50-90% reduction)
4. **Avoid allocation**: use `ArrayBufferWriter<byte>` for repeated sends
5. **Union formatters**: register once in static constructor, not per-message
6. **Binary size**: MemoryPack ~20% larger than MessagePack for integers, but 10x faster decode

## Network Handler Pattern

```csharp
public class NetworkMessageHandler
{
    private readonly ArrayBufferWriter<byte> _writer = new();

    public void SendCommand(IGameCommand cmd)
    {
        _writer.Clear();
        MemoryPackSerializer.Serialize(_writer, cmd);
        transport.Send(_writer.WrittenSpan.ToArray());
    }

    public void OnMessageReceived(byte[] data)
    {
        var cmd = MemoryPackSerializer.Deserialize<IGameCommand>(data);
        commandQueue.Enqueue(cmd);
    }
}
```
