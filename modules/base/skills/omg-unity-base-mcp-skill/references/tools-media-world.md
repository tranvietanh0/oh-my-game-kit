---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Unity MCP Tools: Media & World

## manage_animation
Actions: `animator_get_info`, `animator_get_parameter`, `animator_play`, `animator_crossfade`, `animator_set_parameter`, `animator_set_speed`, `animator_set_enabled`, `controller_create`, `controller_add_state`, `controller_add_transition`, `controller_add_parameter`, `controller_get_info`, `controller_assign`, `controller_add_layer`, `controller_remove_layer`, `controller_set_layer_weight`, `controller_create_blend_tree_1d`, `controller_create_blend_tree_2d`, `controller_add_blend_tree_child`, `clip_create`, `clip_get_info`, `clip_add_curve`, `clip_set_curve`, `clip_set_vector_curve`, `clip_create_preset`, `clip_assign`, `clip_add_event`, `clip_remove_event`
Key params: `action`, `target` (GameObject name/path/id), `search_method`, `clip_path`, `controller_path`, `properties` (dict)
Example: Play walk animation — `action="animator_play", target="Player", properties={"stateName":"Walk","layer":0}`

## manage_audio
Actions: `list_sources`, `get_source`, `set_source`, `play`, `stop`, `pause`, `list_clips`, `get_clip_info`, `list_mixers`, `get_mixer`, `set_mixer_param`
Key params: `action`, `target` (GameObject name/id or asset path), `properties` (JSON), `param_name`, `value` (float for mixer), `filter`, `page_size`, `cursor`
Example: Set mixer volume — `action="set_mixer_param", target="MasterMixer", param_name="MasterVolume", value=-10.0`

## manage_video
Actions: `list_players`, `get_player`, `set_player`, `play`, `pause`, `stop`, `set_time`
Key params: `action`, `target` (GameObject name/id), `properties` (JSON: source, playbackSpeed, loop, audioOutput), `time` (seconds), `page_size`, `cursor`
Example: Seek video — `action="set_time", target="CutscenePlayer", time=12.5`

## manage_vfx
Actions: `particle_create/get_info/set_main/set_emission/set_shape/set_color_over_lifetime/set_size_over_lifetime/set_velocity_over_lifetime/set_noise/set_renderer/enable_module/play/stop/pause/restart/clear/add_burst/clear_bursts`, `vfx_create_asset/assign_asset/list_templates/list_assets/get_info/set_float/set_int/set_bool/set_vector2/set_vector3/set_vector4/set_color/set_gradient/set_texture/set_mesh/set_curve/send_event/play/stop/pause/reinit/set_playback_speed/set_seed`, `line_get_info/set_positions/add_position/set_position/set_width/set_color/set_material/set_properties/clear/create_line/create_circle/create_arc/create_bezier`, `trail_get_info/set_time/set_width/set_color/set_material/set_properties/clear/emit`
Key params: `action`, `target`, `search_method`, `properties` (dict)
Example: Play explosion — `action="particle_play", target="ExplosionVFX"`

## manage_timeline
Actions: `list_directors`, `get_director`, `play`, `pause`, `stop`, `set_time`, `list_tracks`, `get_bindings`
Key params: `action`, `target` (GameObject with PlayableDirector), `time` (seconds), `page_size`, `cursor`
Note: Requires `com.unity.timeline` package.
Example: Seek cutscene — `action="set_time", target="CutsceneDirector", time=5.0`

## manage_terrain
Actions: `get_info`, `get_height`, `set_heights`, `flatten`, `get_splat_weights`, `paint_texture`, `get_heightmap_sample`
Key params: `action`, `target` (defaults to active terrain), `x`/`z` (world coords), `radius`, `height` (normalized 0-1), `mode` (set/raise/lower/smooth), `layer_index`, `strength`, `size` (patch NxN, max 64)
Example: Raise terrain — `action="set_heights", x=100, z=50, radius=10, height=0.6, mode="raise"`

## manage_tilemap
Actions: `list_tilemaps`, `get_info`, `get_tile`, `set_tile`, `clear_tile`, `clear_all`, `get_bounds`, `fill_area`
Key params: `action`, `target` (GameObject with Tilemap), `position` ("x,y,z"), `tile_asset` (asset path), `min`/`max` ("x,y,z" for fill_area), `page_size`, `cursor`
Note: Requires `com.unity.2d.tilemap` package.
Example: Place tile — `action="set_tile", target="GroundTilemap", position="3,2,0", tile_asset="Assets/Tiles/Grass.asset"`

## manage_splines
Actions: `list_splines`, `get_spline`, `get_knot`, `add_knot`, `remove_knot`, `set_knot`, `evaluate`
Key params: `action`, `target` (GameObject with SplineContainer), `spline_index` (default 0), `knot_index`, `position` ("x,y,z"), `rotation` ("x,y,z,w"), `t` (0-1 for evaluate), `page_size`, `cursor`
Note: Requires `com.unity.splines` package.
Example: Sample path point — `action="evaluate", target="RoadSpline", t=0.5`

## manage_lighting
Actions: `list_lights`, `get_light`, `set_light`, `bake`, `cancel_bake`, `get_bake_status`, `list_probes`, `get_probe`, `get_environment`, `set_environment`, `get_lightmap_settings`
Key params: `action`, `target` (GameObject name/id), `properties` (JSON: color, intensity, range, shadows), `type_filter` (Directional/Point/Spot/Area), `page_size`, `cursor`
Example: Dim point light — `action="set_light", target="TorchLight", properties={"intensity":0.5,"range":8}`
