---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: ui
protected: false
---
# DOTS ECS Bridge & Canvas Performance

## Pattern 1: MonoBehaviour Reads ECS (Recommended)

MonoBehaviour in `LateUpdate` reads ECS data and updates Canvas UI. Simple, no race conditions.

```csharp
public class StatsHUD : MonoBehaviour
{
    [SerializeField] private TMP_Text _hpText;
    [SerializeField] private Image _hpFill;

    private EntityManager _em;
    private EntityQuery _query;

    void Start()
    {
        _em = World.DefaultGameObjectInjectionWorld.EntityManager;
        _query = _em.CreateEntityQuery(
            ComponentType.ReadOnly<Health>(),
            ComponentType.ReadOnly<PlayerTag>());
    }

    void LateUpdate()
    {
        if (_query.IsEmpty) return;
        var entity = _query.GetSingletonEntity();
        var hp = _em.GetComponentData<Health>(entity);
        _hpText.text = $"{hp.Current}/{hp.Max}";
        _hpFill.fillAmount = (float)hp.Current / hp.Max;
    }

    void OnDestroy() => _query.Dispose();
}
```

## Pattern 2: ECS Writes to Shared Static (High-Frequency)

For data updated every frame by Burst jobs, use a shared static buffer.

```csharp
// Shared container (thread-safe for single writer)
public static class UIDataBridge
{
    public static int ItemCount;
    public static NativeArray<FixedString32Bytes> SlotNames;
    // Write from ISystem, read from MonoBehaviour
}

// ISystem writes (Burst-safe via static)
[BurstCompile]
public partial struct UIDataWriterSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        int count = 0;
        foreach (var _ in SystemAPI.Query<RefRO<Item>>()
            .WithAll<InventorySlot>())
            count++;
        UIDataBridge.ItemCount = count;
    }
}

// MonoBehaviour reads
void LateUpdate()
{
    _itemCountText.text = $"Items: {UIDataBridge.ItemCount}";
}
```

## Pattern 3: Event-Driven Updates (Best Perf)

Only update UI when data changes, not every frame.

```csharp
public class InventoryUI : MonoBehaviour
{
    private EntityManager _em;
    private EntityQuery _dirtyQuery;

    void Start()
    {
        _em = World.DefaultGameObjectInjectionWorld.EntityManager;
        // Query for dirty tag — only rebuild when inventory changes
        _dirtyQuery = _em.CreateEntityQuery(
            ComponentType.ReadOnly<PlayerTag>(),
            ComponentType.ReadOnly<EquipmentDirtyTag>());
    }

    void LateUpdate()
    {
        if (_dirtyQuery.IsEmpty) return; // no change → skip
        RebuildGrid();
    }

    private void RebuildGrid()
    {
        var entity = _dirtyQuery.GetSingletonEntity();
        var cells = _em.GetBuffer<InventoryGridCell>(entity, true);
        for (int i = 0; i < cells.Length; i++)
        {
            bool occupied = cells[i].ItemEntity != Entity.Null;
            _slots[i].color = occupied ? _occupiedColor : _emptyColor;
        }
    }

    void OnDestroy() => _dirtyQuery.Dispose();
}
```

## Canvas Performance Rules

### Split Canvases
```
Canvas (Static)       → background, borders, labels that never change
Canvas (Dynamic)      → health bars, timers, counters that update often
Canvas (Overlay/HUD)  → always-on-top elements
```
Dirty elements only rebuild their own Canvas batch — isolating dynamic from static avoids full rebuild.

### Batching Rules
- Same material + same texture atlas = **1 draw call** (batch)
- Different materials or textures = batch break
- **Use Sprite Atlas** for UI icons to maximize batching
- Overlapping elements with different materials break batches

### Disable raycastTarget
```csharp
// On EVERY decorative Image/Text that doesn't need clicks
image.raycastTarget = false;
text.raycastTarget = false;
// Saves GraphicRaycaster processing per pointer event
```

### Pooling & Text Updates
- **Pool UI elements** — `SetActive(false)` to return, scan for inactive to reuse, `Instantiate` only if none free
- **Skip unchanged text** — cache last value, only set `_text.text` when value actually changes

## Gotchas
- **EntityQuery.Dispose()** — must dispose in `OnDestroy` to avoid leak
- **World may be null** — check `World.DefaultGameObjectInjectionWorld != null` in `Start`
- **LateUpdate not Update** — read ECS after systems finish
- **World-space Canvas** — set `renderMode = WorldSpace`, assign `worldCamera`, scale `rt.localScale = 0.01f`; billboard via `transform.forward = Camera.main.transform.forward` in LateUpdate
- **NativeArray in static** — `Allocator.Persistent`, dispose on quit
- **ForceUpdateCanvases()** — avoid; only use for immediate size queries
