---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: testing
protected: false
---
# Common Failures & Gotchas

## Common Failures

| Symptom | Failed Check | Likely Root Cause |
|---------|-------------|-------------------|
| 0 entities | #2 Spawn | SubScene not loaded, prefabs missing authorings, spawner config wrong |
| 0 draw calls | #3 Rendering | Materials null/pink, camera culling, NaN bounds, Game view not visible |
| Entities invisible | #4 Bounds | Light baking corruption (NaN ChunkWorldRenderBounds). Fix: delete `Library/EntityScenes/` |
| No movement | #5 Movement | NavMesh not baked, DetectionRadius < spawn gap, BDP trees missing, AgentBody.IsStopped=true |
| Troops walk through obstacles | #5 Movement | Obstacles use `(StaticEditorFlags)8` + `SetNavMeshArea` instead of `NavMeshObstacle` with `carving = true`. Static flags only mark obstacle surface, don't carve ground NavMesh |
| No combat | #6 Combat | Aggro not triggering (detection range), attack range too small, TeamId not set |
| Camera sees nothing | #7 Camera | farClipPlane < camera height, orthographic size too small, wrong culling mask |
| Battle never ends | #8 Resolve | WinCondition system missing, all units invulnerable, respawn enabled without limit |

## Gotchas

1. **Entity cache stale data**: Always clear `Library/EntityScenes/` after SubScene or prefab changes. Stale cache causes missing/wrong entities at runtime
2. **Full namespace required**: `manage_dots` queries require FULL namespace — `DOTSCombat.Health`, not `Health`
3. **rendering_stats requires Game view**: Play mode alone is not enough — Game view tab must be visible/focused. If minimized, stats return 0
4. **manage_dots query_entities returns names only**: To read actual component VALUES (e.g., LocalTransform.Position), use `get_entity` with specific entity index
5. **Camera properties read-only in Play mode**: To fix camera settings, stop Play mode first, then modify
6. **DeadTag is EnableableComponent**: `query_count` for DeadTag only counts ENABLED instances (actually dead). Disabled DeadTag (alive units) are excluded
7. **MCP temp camera artifact**: Scene screenshots via MCP use a temp camera that bypasses frustum culling — entities may appear in screenshots but be invisible in actual Game view. Always validate via rendering_stats, not screenshots
8. **SubScene load delay**: Entities don't exist immediately on Play. Wait 2-5s after entering Play mode before querying entities
9. **Movement check false negative**: Units at patrol waypoints or in melee range may have near-zero velocity. Check >50% threshold, not 100%
10. **BDP tree missing**: Units with `AIAuthoring` but no `BehaviorTree` component will idle forever — check prefabs have both
11. **Prefab regeneration strips BDP trees**: `Create Unit Prefabs` builds from scratch, wiping BDP trees. Must run `Build Behavior Trees` menu item AFTER prefab creation. Scene setup scripts should call tree builder automatically
12. **DetectionRadius vs spawn gap**: If `DetectionRadius < (spawn distance between teams / 2)`, units can never detect enemies and will idle. This is the #1 cause of "troops don't move" bugs
13. **World not found after domain reload**: Editing C# while in Play mode triggers domain reload, destroying all ECS worlds. Always stop Play mode before editing code, then re-enter
14. **MCP test runner stuck state**: If PlayMode tests fail to initialize (editor unfocused), the MCP server may stay in `tests_running` state permanently. Fix: click Unity Editor to give focus, or restart Unity
15. **PlayMode tests require editor focus**: PlayMode tests enter Play mode — if Unity is minimized or unfocused, tests fail with "did not start within timeout"
16. **StatusEffect field names**: `StatusEffect` uses `Value` (not `DamagePerTick`), `Duration` (not `RemainingDuration`), `Elapsed` (not `Timer`). Always read the component struct before writing test code
17. **manage_dots is a DIRECT MCP tool**: Call `mcp__UnityMCP__manage_dots` directly — do NOT route it through `execute_custom_tool`. Only `rendering_stats` needs `execute_custom_tool`
18. **Pause does NOT affect MCP tools**: All MCP tools (manage_dots, rendering_stats, read_console) work correctly while the editor is paused. Use pause to freeze state for stable inspection
19. **Always start fresh**: If Play mode is already running when validation starts, STOP first and re-enter. Inherited play sessions may have completed battles, making all movement/combat checks invalid
