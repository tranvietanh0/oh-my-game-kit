---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# MCP Tools: Performance, AI & Misc

## manage_profiler
Actions: `get_counters`, `list_categories`, `start_recording`, `stop_recording`, `get_frame_data`, `get_memory_snapshot`
Key params: `counters` (comma-separated names), `path` (recording output), `count` (frames for get_frame_data)
No package dependency — uses built-in Unity.Profiling
Example: `manage_profiler(action="get_frame_data", count=60)` — last 60 frames timing data

## rendering_stats
Actions: `get_stats`, `get_memory`, `get_profiler`, `get_stats_aggregated`, `get_system_stats`, `get_session_report`, `list_sessions`, `load_session`, `analyze_session`
Key params: `frames` (aggregated frame count, 0=all), `top_n` (systems to return), `include_timeline`, `include_csv`, `filename` (session JSON)
Note: aggregated/system/session actions require Play mode; list/load/analyze work anytime
Example: `rendering_stats(action="get_stats_aggregated", frames=120)` — min/max/avg/p50/p95 for FPS, CPU, draw calls over 120 frames
Example: `rendering_stats(action="get_system_stats", top_n=10)` — top 10 DOTS systems by CPU cost

**IMPORTANT — `rendering_stats` is NOT a directly callable MCP tool.** It's a C# `[McpForUnityTool]` with `AutoRegister=true` but has no tool group, so it doesn't appear in `ToolSearch` or deferred tools. **Call it via `batch_execute`:**
```
batch_execute(commands=[{"tool": "rendering_stats", "params": {"action": "get_system_stats", "top_n": 15}}])
```
`get_system_stats` returns per-DOTS-system CPU breakdown: `avg_ms`, `max_ms`, `p95_ms`, `pct_of_frame` for each system, sorted by cost. Auto-records during Play mode via `PerformanceSessionRecorder`.

## manage_cinemachine
Actions: `list_vcams`, `get_vcam`, `set_vcam`, `get_brain`, `set_priority`, `list_blends`
Key params: `target` (GameObject name/ID), `properties` (JSON), `priority` (int), `page_size`, `cursor`
Requires: com.unity.cinemachine
Example: `manage_cinemachine(action="set_priority", target="BattleCam", priority=20)` — raise camera priority

## manage_render_pipeline
Actions: `get_pipeline_info`, `list_volumes`, `get_volume`, `set_volume_override`, `list_renderer_features`, `get_render_pipeline_asset`, `list_post_processing`, `toggle_volume_override`
Key params: `target` (Volume GameObject), `override_type` (e.g. "Bloom"), `property`, `value`, `enabled`
No package dependency — uses built-in GraphicsSettings
Example: `manage_render_pipeline(action="set_volume_override", target="GlobalVolume", override_type="Bloom", property="intensity", value="0.5")`

## manage_behavior
Actions: `list_agents`, `get_agent`, `list_variables`, `get_variable`, `set_variable`
Key params: `target` (GameObject with BehaviorGraphAgent), `variable_name`, `value` (string), `page_size`, `cursor`
Requires: com.unity.behavior
Example: `manage_behavior(action="set_variable", target="Enemy_01", variable_name="AlertLevel", value="2")` — set blackboard var

## manage_asset_hunter
Actions: `scan_unused`, `get_duplicates`, `get_dependencies`, `get_build_report`, `get_settings`
Key params: `asset_path` (for dependencies), `direction` ("references"/"referenced_by"), `filter_type` (e.g. "Texture2D"), `page_size`, `cursor`
Requires: HeurekaGames Asset Hunter PRO; build report actions need prior Unity build with AHP enabled
Example: `manage_asset_hunter(action="get_dependencies", asset_path="Assets/Sprites/hero.png", direction="referenced_by")` — what uses this asset

## validation_snapshot
Actions: `capture`, `compare`
Key params: `sample_size` (entity positions to sample, default 20 max 100); `snapshot_a`, `snapshot_b` (JSON, for compare)
Requires: com.unity.entities + DOTSRPG components; Play mode required for entity data
Note: replaces 15-20 individual MCP calls — captures entity counts, health, positions, NaN check, rendering stats, battle state, console errors in one call
Example: `validation_snapshot(action="capture", sample_size=50)` then `validation_snapshot(action="compare", snapshot_a=prev, snapshot_b=curr)`

## manage_ui_toolkit
Actions: `list_documents`, `get_document`, `query_elements`, `get_element`, `set_style`, `list_uxml_assets`
Key params: `target` (UIDocument GameObject), `query` (USS selector e.g. ".my-class", "#my-id", "Button"), `property`/`value` (for set_style), `filter`
No package dependency — uses built-in UIElements
Example: `manage_ui_toolkit(action="query_elements", target="MainHUD", query=".health-bar")` — find all health bar elements
