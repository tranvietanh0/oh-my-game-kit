---
name: omg-cocos-playable-object-pool
description: "ObjectPoolManager singleton for prefab pooling, spawn/recycle lifecycle, and category-based organization in playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# ObjectPoolManager

Static singleton for reusing `Node` instances. Avoids runtime `instantiate()`/`destroy()` overhead critical for playable ad performance. See `omg-cocos-playable-asset-management` for `AssetsManager` used by `LoadAsync`.

## Architecture

```
ObjectPools (scene root Node)
└── Pool_Enemies (category Node, key="Enemies/Goblin")
    └── Goblin_Pool
        ├── [inactive nodes]  ← pooledObjects[]
        └── [active nodes]    ← spawnedObjects Set
```

- Category extracted from key prefix: `"Enemies/Goblin"` → category `"Enemies"`
- Keys without `/` go into `"Default"` category
- `resetNode()` resets position/rotation/scale and calls `Reset()` on all components that implement it

## Key APIs

```typescript
const pool = ObjectPoolManager.instance;

// --- Initialization ---
// From prefab reference (sync)
pool.Load("Effects/Coin", coinPrefab, 20);
pool.Load(prefabRef);            // key = prefab.name, count = 10

// From resources/ folder (async, tries multiple path variants)
await pool.LoadAsync("Effects/Coin", 20);

// --- Spawn ---
const node = pool.Spawn("Effects/Coin");
const node = pool.Spawn("Effects/Coin", position, rotation, parentNode);

// --- Recycle ---
pool.Recycle(node);              // auto-finds pool by node membership
pool.Recycle("Effects/Coin", node); // explicit key (faster)

// --- Batch recycle ---
pool.RecycleAll("Effects/Coin");

// --- Cleanup (trim idle objects, keep retainCount) ---
pool.Cleanup("Effects/Coin", 5);  // destroy all but 5 idle instances

// --- Teardown ---
pool.Unload("Effects/Coin");      // destroy pool + container node
pool.UnloadAll();                 // destroy all pools

// --- Monitoring ---
const info = pool.GetPoolInfo("Effects/Coin");
// { available: 8, active: 2, total: 10 }
pool.HasPool("Effects/Coin");     // boolean
pool.GetAllPoolKeys();            // string[]
```

## Reset() Callback

Components on pooled nodes can implement `Reset()` to clean up state on recycle:

```typescript
export class CoinFX extends Component {
    private _velocity: Vec3 = new Vec3();

    public Reset(): void {
        // Called automatically by ObjectPoolManager.Recycle()
        this._velocity.set(0, 0, 0);
        this.node.setOpacity(255);
    }
}
```

## Workflow: Common Tasks

**One-time pool setup at game start:**
```typescript
// In a loading state or GameView.onLoad():
pool.Load("Coin", coinPrefab, 30);
pool.Load("HitFX", hitFxPrefab, 10);
```

**Async load from resources folder:**
```typescript
// Prefab must be at: assets/resources/Effects/Coin.prefab
// or assets/resources/prefab/Coin.prefab (LoadAsync tries variants)
await pool.LoadAsync("Effects/Coin", 20);
```

**Recycle from animation complete callback:**
```typescript
const node = pool.Spawn("Effects/Coin", startPos, null, canvas);
// ... animate ...
tween(node).then(() => pool.Recycle(node)).start();
```

**FlyingAnimationController pattern (Spawn → auto-Recycle on complete):**
```typescript
// FlyingAnimationController manages its own Spawn/Recycle internally.
// Preload via controller:
flyingController.preloadPool("Effects/Star", starPrefab, 10);
await flyingController.playAnimation({ poolKey: "Effects/Star", ... });
```

**AudioService pattern (AudioEmitter pooling):**
AudioService internally uses ObjectPoolManager with `AudioEmitter` prefab from `resources/prefab/AudioEmitter.prefab`. Do not manually pool audio nodes.

## Common Mistakes

- Calling `Spawn()` before `Load()`/`LoadAsync()` — returns `null` with a console warning
- Destroying a pooled node manually instead of calling `Recycle()` — leaves dangling entry in `spawnedObjects`
- Using the same key string for different prefabs — pools are keyed by string, collisions corrupt the pool
- Not implementing `Reset()` — node retains state (position, opacity, tween callbacks) from previous spawn
- Calling `LoadAsync()` twice for the same key concurrently — safe (second call skips if pool exists), but wasteful

## Gotchas

- **Pool prewarm must happen before first acquire** — first acquire on cold pool stutters; prewarm in `onLoad`.
- **Returned objects need state reset** — pooling a node with active tweens or active children leaks residual state into the next user.
- **Pool size cap is mandatory** — uncapped pools grow until OOM on long playable sessions.
