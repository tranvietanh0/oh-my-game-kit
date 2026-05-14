---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# ZLinq API Patterns Guide

## Entry Points

Every ZLinq chain starts with `.AsValueEnumerable()`:

```csharp
using ZLinq;

// Arrays
int[] numbers = { 1, 2, 3, 4, 5 };
var even = numbers.AsValueEnumerable().Where(x => x % 2 == 0).ToArray();

// Lists
List<string> names = new() { "Alice", "Bob" };
var first = names.AsValueEnumerable().First();

// NativeArray (Unity)
NativeArray<float3> positions = new(100, Allocator.Temp);
int count = positions.AsValueEnumerable().Where(p => p.y > 0).Count();
positions.Dispose();

// NativeList (requires ZLINQ_UNITY_COLLECTIONS_SUPPORT define)
NativeList<int> ids = new(50, Allocator.Temp);
bool hasTarget = ids.AsValueEnumerable().Any(id => id == targetId);
ids.Dispose();
```

## Aggregation Patterns

```csharp
// Sum damage from filtered sources
float totalDamage = damageEvents
    .AsValueEnumerable()
    .Where(e => e.DamageType == DamageType.Physical)
    .Sum(e => e.Amount);

// Find closest entity
var closest = entityDistances
    .AsValueEnumerable()
    .Where(d => d.Distance < detectionRadius)
    .OrderBy(d => d.Distance)
    .FirstOrDefault();

// Check conditions
bool allDead = units
    .AsValueEnumerable()
    .All(u => u.Health <= 0);

bool anyAlive = units
    .AsValueEnumerable()
    .Any(u => u.Health > 0);
```

## Grouping & Lookup

```csharp
// Group by team
var byTeam = units
    .AsValueEnumerable()
    .GroupBy(u => u.TeamId)
    .ToArray();

// ToDictionary
var lookup = units
    .AsValueEnumerable()
    .ToDictionary(u => u.EntityId, u => u.Health);

// ToLookup (one-to-many)
var teamLookup = units
    .AsValueEnumerable()
    .ToLookup(u => u.TeamId);
```

## Chaining Best Practices

```csharp
// GOOD: Short chain, clear intent
var result = items.AsValueEnumerable()
    .Where(i => i.Rarity >= Rarity.Rare)
    .OrderByDescending(i => i.Value)
    .Take(3)
    .ToArray();

// AVOID: Chain > 6 operators — split for readability
var filtered = items.AsValueEnumerable()
    .Where(i => i.Level >= minLevel)
    .Where(i => i.Type == ItemType.Weapon)
    .ToArray(); // Materialize intermediate

var sorted = filtered.AsValueEnumerable()
    .OrderByDescending(i => i.DPS)
    .Take(topN)
    .ToArray();
```

## NativeArray-Specific Patterns

```csharp
// Convert to NativeArray result (if available)
// Note: ToArray() returns managed T[] — for NativeArray output, use manual copy
NativeArray<int> source = ...;
var filtered = source.AsValueEnumerable()
    .Where(x => x > 0)
    .ToArray(); // Returns int[], not NativeArray<int>

// For NativeArray output, count first then copy
int count = source.AsValueEnumerable().Where(x => x > 0).Count();
var result = new NativeArray<int>(count, Allocator.Temp);
int idx = 0;
foreach (var item in source.AsValueEnumerable().Where(x => x > 0))
    result[idx++] = item;
```

## Unity Editor Tool Patterns

```csharp
// Prefab validation
public static void ValidatePrefabs(GameObject[] prefabs)
{
    var missing = prefabs.AsValueEnumerable()
        .Where(p => p.GetComponent<HealthAuthoring>() == null)
        .Select(p => p.name)
        .ToArray();

    foreach (var name in missing)
        Debug.LogWarning($"Missing HealthAuthoring: {name}");
}

// Asset search filtering
public static T[] FindAssetsOfType<T>(string folder) where T : UnityEngine.Object
{
    return AssetDatabase.FindAssets($"t:{typeof(T).Name}", new[] { folder })
        .AsValueEnumerable()
        .Select(guid => AssetDatabase.GUIDToAssetPath(guid))
        .Select(path => AssetDatabase.LoadAssetAtPath<T>(path))
        .Where(asset => asset != null)
        .ToArray();
}
```

## Performance Notes

| Operation | Allocation |
|-----------|-----------|
| Chain operators (.Where, .Select, etc.) | **Zero** — struct-based |
| .Count(), .Any(), .All(), .Sum(), .Min(), .Max() | **Zero** — evaluated inline |
| .First(), .FirstOrDefault() | **Zero** — short-circuits |
| .ToArray(), .ToList() | Single result allocation |
| .OrderBy(), .Distinct(), .GroupBy() | Internal buffer(s) allocated |

## Children

Traverse the immediate children of a Transform (depth = 1 only).

```csharp
using ZLinq;

// All immediate children — zero allocation iteration
foreach (var child in transform.Children())
    Debug.Log(child.name);

// Chain operators after Children()
Transform[] activeChildren = transform.Children()
    .Where(t => t.gameObject.activeSelf)
    .ToArray();
```

## Descendants

Traverse all descendants depth-first (all levels below the origin, excluding itself).

```csharp
// Find every Renderer in the subtree
foreach (var t in transform.Descendants())
{
    if (t.TryGetComponent<Renderer>(out var r))
        r.enabled = false;
}

// Count all nodes in a prefab hierarchy
int nodeCount = transform.Descendants().Count();
```

## Ancestors

Walk up the parent chain from the origin toward the root (origin excluded).

```csharp
// Print all parents up to the scene root
foreach (var ancestor in transform.Ancestors())
    Debug.Log(ancestor.name); // e.g. "Container", "Root"

// Check if any ancestor has a specific tag
bool underCanvas = transform.Ancestors().Any(t => t.CompareTag("Canvas"));
```

## BeforeSelf

Enumerate siblings that appear before this transform in the parent's child list.

```csharp
// All siblings preceding this one
foreach (var sibling in transform.BeforeSelf())
    Debug.Log(sibling.name); // e.g. "C1", "C2"

// Count preceding siblings
int precedingCount = transform.BeforeSelf().Count();
```

## AfterSelf

Enumerate siblings that appear after this transform in the parent's child list.

```csharp
// All siblings following this one
foreach (var sibling in transform.AfterSelf())
    Debug.Log(sibling.name); // e.g. "C3", "C4"

// Activate every sibling that comes after
foreach (var sibling in transform.AfterSelf())
    sibling.gameObject.SetActive(true);
```

## DescendantsAndSelf

Traverse self first, then all descendants depth-first (equivalent to `Descendants()` with the origin prepended).

> **Note:** `DescendantsAndSelf()` follows the same `***AndSelf` naming pattern confirmed in upstream docs (`ChildrenAndSelf`, `AncestorsAndSelf`). Verify the exact name against the installed ZLinq Unity package version if compilation fails.

```csharp
// Disable this object and all children
foreach (var t in transform.DescendantsAndSelf())
    t.gameObject.SetActive(false);

// Collect all names in subtree including root
string[] allNames = transform.DescendantsAndSelf()
    .Select(t => t.name)
    .ToArray();
```

## OfComponent<T>()

Filter any traversal result to only nodes that carry a specific component, returning the component instances directly.

```csharp
// All Renderer components anywhere in the subtree
foreach (Renderer r in transform.Descendants().OfComponent<Renderer>())
    r.material.color = Color.red;

// Immediate children (and self) that have a Collider
foreach (Collider c in transform.ChildrenAndSelf().OfComponent<Collider>())
    c.enabled = false;

// Walk ancestors to find the first Canvas
Canvas canvas = transform.Ancestors()
    .OfComponent<Canvas>()
    .FirstOrDefault();
```

## FindByHierarchyPath()

> **Note:** `FindByHierarchyPath()` is not part of the ZLinq public API as of the upstream docs. Use `Descendants()` + `Where(t => t.name == "...")` chaining to replicate path-based lookup.

```csharp
// Finding "UI/Canvas/HealthBar" by path segments — ZLinq pattern
// Split the path and walk down segment by segment
static Transform FindByPath(Transform root, string path)
{
    var segments = path.Split('/');
    Transform current = root;
    foreach (var segment in segments)
    {
        current = current.Children()
            .FirstOrDefault(t => t.name == segment);
        if (current == null) return null;
    }
    return current;
}

// Usage
Transform healthBar = FindByPath(transform, "UI/Canvas/HealthBar");
```

## Comparison Table

| Method | Allocations | Speed | Use Case |
|---|---|---|---|
| `GameObject.Find("name")` | Zero (search) | Slow — full scene scan | One-off editor tooling only; never in hot paths |
| `FindObjectsByType<T>()` | One array | Slow — full scene scan + type filter | Startup/editor; avoid per-frame |
| Manual recursion | Stack frames + list | Medium — handwritten DFS | Acceptable for simple one-off traversal |
| `zlinq LINQ-to-Tree` | **Zero** — struct enumerators | Fast — inline, short-circuits | Production runtime traversal, burst-compatible pipelines |
