---
name: omg-cocos-playable-async-utilities
description: "AsyncTask and CancellationToken async utilities for Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# AsyncTask & CancellationToken — Async Utilities

UniTask-inspired async helpers for Cocos Creator. All methods are static on `AsyncTask`. See also: `omg-cocos-playable-signalbus` (for `waitFor`), `omg-cocos-playable-lifecycle`.

Import paths:
- `db://assets/PLAGameFoundation/async/AsyncTask`
- `db://assets/PLAGameFoundation/async/CancellationToken`

## Key APIs

### Timing

```typescript
await AsyncTask.Delay(1000);               // ms
await AsyncTask.DelaySeconds(1.5);         // seconds (wraps Delay)
await AsyncTask.Yield();                   // next rAF frame
await AsyncTask.WaitForFrames(3);          // N frames
await AsyncTask.WaitForFixedUpdate();      // ~0.02s fixed step approximation
await AsyncTask.FromSchedule(this, 0.5);  // uses Cocos scheduleOnce (seconds)
```

### Condition Polling (checked every rAF frame)

```typescript
await AsyncTask.WaitUntil(() => this.isReady);
await AsyncTask.WaitWhile(() => this.isLoading);  // inverse of WaitUntil
```

### Concurrency

```typescript
// All complete (typed overload for mixed types)
await AsyncTask.WhenAll([loadA(), loadB(), loadC()]);
await AsyncTask.WhenAllTyped([loadSprite(), loadAudio()] as const);

// First wins
await AsyncTask.WhenAny([attempt1(), attempt2()]);

// Sequential — one after another, collects results
const results = await AsyncTask.Sequence([() => step1(), () => step2()]);

// Parallel with concurrency cap (default 5)
const results = await AsyncTask.Parallel([() => fetch(a), () => fetch(b)], 3);
```

### Retry with Exponential Backoff

```typescript
// Attempts: 0..maxRetries. Delays: 1s, 2s, 4s, ...
const data = await AsyncTask.Retry(() => this.fetchData(), 3, 1000, cts.token);
```

### Deferred

```typescript
// External resolve/reject — useful as an async gate
const deferred = AsyncTask.Deferred<boolean>();
someCallback = () => deferred.resolve(true);
const result = await deferred.promise;
```

## CancellationToken

```typescript
const cts = new CancellationTokenSource();

// Pass token into cancellable ops
await AsyncTask.Delay(5000, cts.token);
await AsyncTask.WaitUntil(() => ready, cts.token);
await AsyncTask.Retry(() => load(), 3, 1000, cts.token);

// Cancel from anywhere
cts.cancel();          // triggers rejection in all registered ops
cts.dispose();         // same as cancel(), call when done

// Manual check inside a loop
for (const item of items) {
    cts.token.throwIfCancelled();   // throws if cancelled
    if (cts.token.isCancelled) break;
    await process(item);
}

// Register teardown callback
cts.token.register(() => cleanupResources());
```

## Workflow: Common Patterns in Playable Ads

**Loading gate — wait for parameters then animate in:**
```typescript
async onLoad() {
    await AsyncTask.WaitUntil(() => PlayableConfig.isReady);
    await AsyncTask.DelaySeconds(0.3);
    this.playIntroAnimation();
}
```

**Cancellable tutorial sequence:**
```typescript
private _cts: CancellationTokenSource;

async startTutorial() {
    this._cts = new CancellationTokenSource();
    try {
        await AsyncTask.DelaySeconds(1, this._cts.token);
        this.showHand();
        await AsyncTask.DelaySeconds(2, this._cts.token);
        this.hideHand();
    } catch { /* cancelled */ }
}

onFirstInteraction() {
    this._cts?.cancel();
}
```

**Component-safe delay (avoids rAF after destroy):**
```typescript
// Prefer FromSchedule inside Cocos Components — respects component lifecycle
await AsyncTask.FromSchedule(this, 1.0);
```

## Common Mistakes

- Using `Delay`/`WaitUntil` inside a destroyed Component — rAF keeps running. Use `FromSchedule` or cancel via `CancellationToken`.
- Not catching cancellation — `Delay` rejects with `"Operation was cancelled"`. Wrap in try/catch.
- `WaitUntil` with an expensive condition — runs every frame. Keep the lambda fast.
- `Parallel` default concurrency is 5 — lower it for network-bound operations.

## Gotchas

- **Promises survive scene unload** — outstanding `setTimeout`/`Promise` callbacks fire after the scene is gone unless explicitly cancelled. Tie all timers to a CancellationToken bound to component lifecycle.
- **`async`/`await` in Cocos `update()` deopts** — use coroutine-like primitives (Tween chains) for per-frame work.
- **Unhandled rejections silently disappear in playable runtime** — wrap top-level `.catch(reportToHost)`.
