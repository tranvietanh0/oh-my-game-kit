---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: testing
protected: false
---
# Validation Protocol & Workflow

## Pause/Resume Strategy (CRITICAL)

**Problem:** Battles can resolve in ~30s. Without pausing, the agent may miss the movement and combat phases entirely — checking only the post-battle state.

**Solution:** Use `manage_editor(action="pause")` at strategic moments to freeze the simulation and inspect entity state.

### Timing Windows

```
Play mode start (T=0)
  |
  +- T+5s:  PAUSE — Check spawn, rendering, bounds, console
  |         (entities should be spawned but not yet fighting)
  |         Resume after checks
  |
  +- T+10s: Snapshot positions (T1) — DON'T pause yet
  |
  +- T+15s: PAUSE — Snapshot positions (T2), compare with T1
  |         (troops should have moved toward enemies)
  |         Check: position delta > 0.1 for >50% sampled entities
  |         Resume after checks
  |
  +- T+25s: PAUSE — Check combat
  |         (some entities should be dead by now)
  |         Check: DeadTag enabled count > 0
  |         Check: Health.Current < Health.Max on some entities
  |         Resume after checks
  |
  +- T+90s: Poll BattleState for resolution (or timeout)
  |
  +- STOP play mode
```

### Why Pause?

1. **Freezes simulation state** — entity positions, HP, dead counts are stable during pause
2. **Prevents missing windows** — without pause, entities may die between query_count and query_entities calls
3. **Allows detailed inspection** — can query multiple entities without state changing between queries
4. **MCP tools work in pause** — all manage_dots, rendering_stats, read_console work while paused

## Phase 1: Pre-flight (Edit Mode)

```
1. read_console(types=["error"]) → must be 0 errors
2. manage_editor → confirm NOT in play mode. If playing, STOP first.
3. Camera check: find_gameobjects("Camera") → manage_components → farClipPlane > position.y
4. NavMesh check: find_gameobjects("NavMeshSurface") → must exist
5. Config sanity checks (see below)
```

## Phase 2: Early Spawn (Play Mode, T+5s)

**If `validation_snapshot` is available:** Use `validation_snapshot(action="capture")` instead of separate manage_dots + rendering_stats calls — gets entity counts, rendering stats, bounds, and positions in one response.

```
6. manage_editor(action="play") → enter play mode
7. Wait 5s for SubScene load + entity spawn
8. manage_editor(action="pause") → FREEZE state
9. Check #1: read_console(types=["error"]) → 0 runtime errors
10. Check #2: manage_dots(action="query_count", component="DOTSCombat.Health") → count > 0
11. Check #3: rendering_stats(action="get_stats") → drawCalls > 10
12. Check #4: manage_dots(action="query_entities") → no NaN in ChunkWorldRenderBounds
13. manage_editor(action="play") → RESUME
```

## Phase 3: Movement Check (T+10s to T+15s)

**If `validation_snapshot` is available:** Use `validation_snapshot(action="capture")` at T+10s and T+15s, then `validation_snapshot(action="compare")` to compute movement deltas automatically.

```
14. Wait 5s (running, T~10s total)
15. Snapshot T1: manage_dots(action="query_entities") → record LocalTransform.Position for 5-10 entities
16. Wait 5s (running, T~15s total)
17. manage_editor(action="pause") → FREEZE state
18. Snapshot T2: manage_dots(action="query_entities") → record positions again
19. Check #5: Compare T1 vs T2 — position delta > 0.1 for >50% sampled entities
20. manage_editor(action="play") → RESUME
```

## Phase 4: Combat Check (T+25s)

**If `validation_snapshot` is available:** Use `validation_snapshot(action="capture")` to get dead counts, HP values, and combat state in one call.

```
21. Wait 10s (running, T~25s total)
22. manage_editor(action="pause") → FREEZE state
23. Check #6: manage_dots(action="query_count", component="DOTSCore.DeadTag") → count > 0
24. Optional: manage_dots(action="query_entities") → verify Health.Current < Health.Max on living entities
25. manage_editor(action="play") → RESUME
```

## Phase 5: Battle Resolution (up to T+90s)

```
26. Poll every 10s: manage_dots(action="query_entities") → check BattleState.BattleOver or WinnerTeam
27. Check #8: Battle resolves within 90s
28. manage_editor(action="stop") → EXIT play mode
```

## Phase 6: Report

```
29. Generate pass/fail summary table
30. List failed checks with likely root cause (see troubleshooting-guide.md)
31. Save report to plans/reports/ directory
```

## Optimized Workflow (with validation_snapshot)

When `validation_snapshot` tool is available (check via `ToolSearch("validation_snapshot")`), the entire 8-check protocol reduces to 3-4 MCP calls:

```
1. Pre-flight: read_console(types=["error"]) → 0 errors
2. manage_editor(action="play") → enter Play mode
3. Wait 5s → manage_editor(action="pause")
4. SNAPSHOT-1: validation_snapshot(action="capture")
   → Returns: entity counts, rendering stats, bounds check, positions, dead count, HP samples
   → Covers checks #2, #3, #4, #6 in ONE call
5. manage_editor(action="play") → RESUME
6. Wait 10s → manage_editor(action="pause")
7. SNAPSHOT-2: validation_snapshot(action="capture")
   → Second position snapshot for movement comparison
8. COMPARE: validation_snapshot(action="compare")
   → Computes position deltas automatically → covers check #5
9. manage_editor(action="play") → RESUME
10. Wait for battle resolution → manage_editor(action="stop")
```

**Result**: ~6 MCP calls total vs 15-20 with individual tools. Same 8 checks, same pass/fail criteria.

## Config Sanity Checks (Pre-flight, No Play Mode)

Run these BEFORE entering Play mode to catch configuration issues:

1. **DetectionRadius** > (spawn gap between teams / 2) — otherwise teams never detect each other
2. **Camera farClipPlane** > camera Y position — otherwise ground/units clipped
3. **NavMeshSurface** exists in scene hierarchy — otherwise no pathfinding
4. **Prefab materials** not null — check via `manage_prefabs` or `manage_components`
5. **SubScene exists** and contains spawner entities — check via `manage_scene`
6. **TeamId** values differ between opposing spawner groups (typically 0 vs 1)
