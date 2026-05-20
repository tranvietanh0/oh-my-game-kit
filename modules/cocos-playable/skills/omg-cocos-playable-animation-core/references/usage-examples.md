---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# FlyingAnimation — Usage Examples

## Collect coins flying to UI

```typescript
await FlyingAnimationController.instance.createCollectEffect(
    spawnWorldPos, coinIconNode, 'coin-fx', 8, coinPrefab,
    (node) => { /* tint node if needed */ }
);
```

## Burst explosion on win

```typescript
await FlyingAnimationController.instance.createExplosion(
    node.worldPosition, 'star-fx', 12, starPrefab
);
```

## Float-up score text

```typescript
await FlyingAnimationController.instance.playAnimation({
    poolKey: 'score-label',
    prefab: scoreLabelPrefab,
    animationType: FlyingAnimationType.FLOAT_UP,
    startPosition: hitPosition,
    duration: 0.8,
    onNodeSpawned: (n) => n.getComponent(Label).string = `+${points}`
});
```
