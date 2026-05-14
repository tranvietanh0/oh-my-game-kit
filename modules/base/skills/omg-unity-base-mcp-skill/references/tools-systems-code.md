---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# MCP Tools: Systems & Code

## manage_addressables
Actions: `list_groups`, `get_group`, `list_entries`, `get_entry`, `list_labels`, `build`, `analyze`
Key params: `group_name`, `address`, `guid`, `clean` (build), `page_size`, `cursor`
Requires: com.unity.addressables
Example: `manage_addressables(action="build", clean=True)` — clean build all Addressable content

## manage_build
Actions: `get_player_settings`, `set_player_settings`, `get_quality_settings`, `set_quality_level`, `get_build_settings`, `set_build_scenes`, `build`, `get_scripting_defines`, `set_scripting_defines`
Key params: `properties` (JSON), `target` (platform), `output_path`, `level`, `scenes` (JSON array), `platform`, `defines`
Example: `manage_build(action="set_scripting_defines", platform="StandaloneWindows64", defines="DOTS_DEBUG,ENABLE_PROFILER")`

## manage_input_system
Actions: `list_action_assets`, `get_action_map`, `get_action`, `list_devices`, `get_device`, `list_player_inputs`
Key params: `asset`, `map_name`, `action_name`, `device_name`, `page_size`, `cursor`
Requires: com.unity.inputsystem
Example: `manage_input_system(action="get_action_map", asset="PlayerInput", map_name="Gameplay")`

## manage_localization
Actions: `list_locales`, `get_active_locale`, `set_active_locale`, `list_tables`, `get_entry`, `set_entry`
Key params: `locale_code` (e.g. "en", "ja"), `table`, `key`, `locale`, `value`, `type` ("string"/"asset")
Requires: com.unity.localization
Example: `manage_localization(action="set_entry", table="UI", key="start_button", locale="ja", value="始める")`

## manage_netcode
Actions: `get_network_manager`, `list_network_objects`, `get_network_object`, `start_host`, `start_server`, `start_client`, `shutdown`
Key params: `target` (GameObject name/instance ID), `page_size`, `cursor`
Requires: com.unity.netcode.gameobjects
Example: `manage_netcode(action="get_network_manager")` — check transport, connection state, connected clients

## manage_script
Actions: apply small text edits to C# scripts by URI
Key params: URI (mcpforunity://path/Assets/..., file://, or plain path), precise line/column coordinates
Note: Always read script content first to verify exact positions; use anchors for safer pattern-based edits
Example: `manage_script` with `resources/read` first to verify line content, then apply edit at exact coords

## manage_scriptable_object
Actions: `create`, `modify`
Key params: `type_name` (namespace-qualified), `folder_path`, `asset_name`, `overwrite` (create); `target` ({guid|path}), `patches` (list), `dry_run` (modify)
Example: `manage_scriptable_object(action="create", type_name="GameKit.Combat.CombatConfig", folder_path="Assets/Config", asset_name="DefaultCombat")`

## manage_shader
Actions: `create`, `read`, `update`, `delete`
Key params: `name` (no extension), `path` (default "Assets/"), `contents` (HLSL source for create/update)
Note: contents are base64-encoded for transmission
Example: `manage_shader(action="read", name="UnitOutline", path="Assets/Shaders/")` — read existing shader source
