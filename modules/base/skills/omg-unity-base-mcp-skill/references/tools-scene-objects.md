---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Tools: Scene & GameObjects

Complete reference for scene management and GameObject tools.

> **Template warning:** Examples are skill templates. Validate against active tool schema and runtime behavior.

## Project Info Resource

Read `mcpforunity://project/info` to detect project capabilities before making assumptions.

| Field | Type | Description |
|-------|------|-------------|
| `unityVersion` | string | e.g. `"2022.3.20f1"` |
| `renderPipeline` | string | `"BuiltIn"`, `"Universal"`, `"HighDefinition"`, or `"Custom"` |
| `activeInputHandler` | string | `"Old"`, `"New"`, or `"Both"` |
| `packages.ugui` | bool | `com.unity.ugui` installed |
| `packages.textmeshpro` | bool | `com.unity.textmeshpro` installed |
| `packages.inputsystem` | bool | `com.unity.inputsystem` installed |
| `packages.uiToolkit` | bool | Always `true` for Unity 2021.3+ |
| `packages.screenCapture` | bool | Screen capture module enabled |

**Key decisions:** Use `renderPipeline` for shader names, `activeInputHandler` for EventSystem module, `packages.*` for UI system choice.

---

## manage_scene

Scene CRUD, hierarchy, screenshots, scene view control.

```python
# Get hierarchy (paginated)
manage_scene(action="get_hierarchy", page_size=50, cursor=0,
    parent=None, include_transform=False)

# Screenshot — file only (saves to Assets/Screenshots/)
manage_scene(action="screenshot")

# Screenshot with inline image
manage_scene(action="screenshot", camera="MainCamera",
    include_image=True, max_resolution=512)

# Surround contact sheet (6 fixed angles)
manage_scene(action="screenshot", batch="surround",
    look_at="Player", max_resolution=256)

# Orbit grid
manage_scene(action="screenshot", batch="orbit", look_at="Player",
    orbit_angles=8, orbit_elevations=[0, 30],
    orbit_distance=10, orbit_fov=60, max_resolution=256)

# Positioned screenshot (temp camera, no file saved)
manage_scene(action="screenshot", look_at="Enemy",
    view_position=[0, 10, -10], view_rotation=[45, 0, 0], max_resolution=512)

# Frame scene view on target
manage_scene(action="scene_view_frame", scene_view_target="Player")

# Other actions
manage_scene(action="get_active")
manage_scene(action="get_build_settings")
manage_scene(action="create", name="NewScene", path="Assets/Scenes/")
manage_scene(action="load", path="Assets/Scenes/Main.unity")
manage_scene(action="save")
```

---

## find_gameobjects

Search GameObjects — returns instance IDs only.

```python
find_gameobjects(
    search_term="Player",
    search_method="by_name",  # by_name|by_tag|by_layer|by_component|by_path|by_id
    include_inactive=False,
    page_size=50, cursor=0
)
# Returns: {"ids": [12345, 67890], "next_cursor": 50, ...}
```

---

## manage_gameobject

Create, modify, delete, duplicate GameObjects.

```python
# Create
manage_gameobject(action="create", name="MyCube",
    primitive_type="Cube",  # Cube|Sphere|Capsule|Cylinder|Plane|Quad
    position=[0,1,0], rotation=[0,45,0], scale=[1,1,1],
    components_to_add=["Rigidbody", "BoxCollider"])

# Modify
manage_gameobject(action="modify", target="Player",
    search_method="by_name", position=[10,0,0],
    layer="Player", set_active=True,
    components_to_add=["AudioSource"],
    components_to_remove=["OldComponent"],
    component_properties={"Rigidbody": {"mass": 10.0, "useGravity": True}})

manage_gameobject(action="delete", target="OldObject")
manage_gameobject(action="duplicate", target="Player",
    new_name="Player2", offset=[5,0,0])
manage_gameobject(action="move_relative", target="Player",
    reference_object="Enemy", direction="left",  # left|right|up|down|forward|back
    distance=5.0, world_space=True)
manage_gameobject(action="look_at", target="MainCamera",
    look_at_target="Player", look_at_up=[0,1,0])
```

---

## manage_components

Add, remove, or set properties on components.

```python
manage_components(action="add", target=12345,
    component_type="Rigidbody", search_method="by_id")
manage_components(action="remove", target="Player",
    component_type="OldScript")

# Set single property
manage_components(action="set_property", target=12345,
    component_type="Rigidbody", property="mass", value=5.0)

# Set multiple properties
manage_components(action="set_property", target=12345,
    component_type="Transform",
    properties={"position": [1,2,3], "localScale": [2,2,2]})

# Object reference formats:
# {"name": "ObjectName"}   → scene name lookup
# {"instanceID": 12345}    → direct instance ID
# {"guid": "abc123..."}    → asset GUID
# {"path": "Assets/..."}   → asset path
manage_components(action="set_property", target="GameManager",
    component_type="GameManagerScript", property="targetObjects",
    value=[{"name": "Flower_1"}, {"name": "Flower_2"}])
```
