---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# DOTS, Physics & Navigation MCP Tools

## manage_dots
Actions: `list_worlds` `query_entities` `get_entity` `list_systems` `get_system` `performance_snapshot` `toggle_system` `list_component_types` `create_entity` `destroy_entity` `set_component` `add_component` `remove_component` `query_count` `inspect_bdp_tree`
Key params: `action`, `component_types` (comma-sep), `entity_index`, `entity_version`, `system_name`, `component_name`, `field_name`, `field_value`, `world`, `group`, `filter`, `page_size`
Example: inspect entity components
```
manage_dots(action="get_entity", entity_index=42, component_types="Health,NavigationTarget")
```

## manage_dots_graphics
Actions: `get_render_stats` `list_rendered_entities` `get_entity_rendering` `list_registered_materials` `list_registered_meshes`
Key params: `action`, `entity_index` (for get_entity_rendering), `world`, `page_size`
Example: count rendered entities and LOD groups
```
manage_dots_graphics(action="get_render_stats")
```

## manage_dots_physics
Actions: `get_physics_world` `raycast` `overlap_aabb` `list_colliders` `get_body`
Key params: `action`, `origin` ('x,y,z'), `direction` ('x,y,z'), `max_distance`, `min`/`max` (AABB corners), `body_index`, `world`, `page_size`
Example: raycast to detect hit entities
```
manage_dots_physics(action="raycast", origin="0,1,0", direction="0,0,1", max_distance=50)
```

## manage_dots_subscene
Actions: `list_subscenes` `load_subscene` `unload_subscene` `get_subscene_status` `list_sections`
Key params: `action`, `scene_name` (SubScene or GameObject name)
Example: check streaming state of a subscene
```
manage_dots_subscene(action="get_subscene_status", scene_name="CombatZone")
```

## manage_physics
Classic 3D physics (UnityEngine.Physics, no package needed).
Actions: `raycast` `raycast_all` `overlap_sphere` `overlap_box` `list_rigidbodies` `get_rigidbody` `set_rigidbody` `list_colliders` `get_physics_settings` `set_physics_settings`
Key params: `action`, `origin`/`direction` ('x,y,z'), `max_distance`, `layer_mask`, `center`, `radius`, `half_extents`, `target` (GameObject name/ID), `properties` (JSON for set_rigidbody), `page_size`, `cursor`
Example: modify rigidbody mass at runtime
```
manage_physics(action="set_rigidbody", target="Player", properties='{"mass": 2.0}')
```

## manage_physics2d
Classic 2D physics (UnityEngine.Physics2D, no package needed).
Actions: `raycast` `raycast_all` `overlap_circle` `overlap_box` `list_rigidbodies` `get_rigidbody` `list_colliders` `get_physics2d_settings`
Key params: `action`, `origin`/`direction` ('x,y'), `max_distance`, `layer_mask`, `center`, `radius`, `size` ('x,y'), `angle`, `target`, `page_size`, `cursor`
Example: find 2D colliders in area
```
manage_physics2d(action="overlap_circle", center="0,0", radius=5.0)
```

## manage_navigation
Requires com.unity.ai.navigation.
Actions: `list_surfaces` `bake` `clear` `list_agents` `get_agent` `set_agent_destination` `list_obstacles` `sample_position` `calculate_path`
Key params: `action`, `target` (NavMeshSurface/Agent GameObject name/ID), `position` ('x,y,z'), `start`/`end` (for calculate_path), `max_distance`, `area_mask`, `page_size`, `cursor`
Example: move agent to position at runtime
```
manage_navigation(action="set_agent_destination", target="Enemy_01", position="10,0,5")
```

## manage_mesh
Actions: `inspect` `get_info` `get_attributes` `has_attribute` `sample_colors` `sample_vertices` `set_colors` `force_upload`
Key params: `action`, `target` (GameObject with MeshFilter), `attribute` (for has_attribute: Position/Normal/Color/TexCoord0/Tangent), `color` ('r,g,b,a' 0-1 for set_colors), `count` (sample count), `offset`
Note: `inspect` = info + attributes + color samples in one call — use first.
Example: paint all vertices red
```
manage_mesh(action="set_colors", target="TerrainChunk", color="1,0,0,1")
manage_mesh(action="force_upload", target="TerrainChunk")
```
