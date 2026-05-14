---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-combat
protected: false
---
# Cascade & Scoring Reference

## Cascade State Machine

```
Idle -> SwapRequested -> Swapping -> Matching ->
  -> MatchFound: Exploding -> Falling -> Refilling -> Matching (loop)
  -> NoMatch: Idle (revert swap)
```

`CascadeControlSystem` drives transitions. `CascadeState.Phase` (enum):
`Idle | SwapRequested | Swapping | Matching | Exploding | Falling | Refilling`

`CascadeState.IterationCount` tracks chain depth — drives combo multiplier in `ScoringSystem`.

## Scoring Formula

```
BasePoints = MatchSize * PiecePoints[pieceType]
ChainBonus = IterationCount * ChainMultiplierConfig.Value
ComboBonus = ComboMultiplier * BasePoints
TotalPerMatch = (BasePoints + ChainBonus) * ComboBonus
```

Constants in `PuzzleConstants`: `MinMatchSize` (3), `BaseMatchPoints`, `ChainMultiplierBase`.

## Special Piece Types

| SpecialType | Trigger | Effect |
|-------------|---------|--------|
| `None` | Normal match | Destroyed |
| `Bomb` | Match 5 in L/T shape | 3x3 area explosion on use |
| `RowClear` | Match 5 in line | Clears entire row |
| `ColClear` | Match 5 in column | Clears entire column |
| `Rainbow` | Match 6+ any | Matches all pieces of tapped type |

Special piece creation: `SpecialPieceSpawnSystem` runs after `MatchDetectionSystem`.

## Gotchas

- Do NOT query `MatchedTag` with `.WithAll<>` — use `.WithPresent<>` (starts disabled)
- `CascadeControlSystem` uses `SystemBase` (not ISystem) — reads and writes `CascadeState` with ECB in same frame
- `BoardRefillSystem` must run AFTER `PieceFallSystem` settles — use `[UpdateAfter(PieceFallSystem)]`
- Never write to `BoardCell` outside `SwapExecutionSystem`, `PieceFallSystem`, `BoardRefillSystem`
- Scoring always reads from `ScoreEvent` buffer — never inline score math in match system
