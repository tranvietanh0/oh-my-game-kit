---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Workflow: Assets & Prefabs

Create, organize, and apply materials, textures, and prefabs via MCP.

> **Template warning:** Examples are skill templates. Validate against your project setup.

## Create and Apply Material

```python
# 1. Create material
manage_material(
    action="create",
    material_path="Assets/Materials/PlayerMaterial.mat",
    shader="Standard",
    properties={
        "_Color": [0.2, 0.5, 1.0, 1.0],
        "_Metallic": 0.5,
        "_Glossiness": 0.8
    }
)

# 2. Assign to renderer
manage_material(
    action="assign_material_to_renderer",
    target="Player",
    material_path="Assets/Materials/PlayerMaterial.mat",
    slot=0
)

# 3. Verify visually
manage_scene(action="screenshot")
```

---

## Create Procedural Texture

```python
# 1. Create base texture
manage_texture(
    action="create",
    path="Assets/Textures/Checkerboard.png",
    width=256, height=256,
    fill_color=[255, 255, 255, 255]
)

# 2. Apply checkerboard pattern
manage_texture(
    action="apply_pattern",
    path="Assets/Textures/Checkerboard.png",
    pattern="checkerboard",
    palette=[[0,0,0,255],[255,255,255,255]],
    pattern_size=32
)

# 3. Create material for texture
manage_material(
    action="create",
    material_path="Assets/Materials/CheckerMaterial.mat",
    shader="Standard"
)
# Then assign texture via set_material_shader_property
```

---

## Organize Assets into Folders

```python
# 1. Create folder structure
batch_execute(commands=[
    {"tool": "manage_asset", "params": {"action": "create_folder", "path": "Assets/Prefabs"}},
    {"tool": "manage_asset", "params": {"action": "create_folder", "path": "Assets/Materials"}},
    {"tool": "manage_asset", "params": {"action": "create_folder", "path": "Assets/Scripts"}},
    {"tool": "manage_asset", "params": {"action": "create_folder", "path": "Assets/Textures"}}
])

# 2. Move existing assets
manage_asset(action="move", path="Assets/MyMaterial.mat",
    destination="Assets/Materials/MyMaterial.mat")
manage_asset(action="move", path="Assets/MyScript.cs",
    destination="Assets/Scripts/MyScript.cs")
```

---

## Search and Process Assets

```python
# Find all prefabs
result = manage_asset(
    action="search", path="Assets",
    search_pattern="*.prefab",
    page_size=50, generate_preview=False
)

# Process each
for asset in result["assets"]:
    prefab_path = asset["path"]
    info = manage_prefabs(action="get_info", prefab_path=prefab_path)
    print(f"Prefab: {prefab_path}, Children: {info['childCount']}")
```

---

## Prefab Workflows

```python
# Create prefab from scene GameObject
manage_prefabs(
    action="create_from_gameobject",
    target="Player",
    prefab_path="Assets/Prefabs/Player.prefab",
    allow_overwrite=False
)

# Modify prefab headlessly (no scene open needed)
manage_prefabs(
    action="modify_contents",
    prefab_path="Assets/Prefabs/Player.prefab",
    target="ChildObject",
    position=[0, 1, 0],
    components_to_add=["AudioSource"]
)

# Inspect prefab hierarchy
manage_prefabs(action="get_hierarchy",
    prefab_path="Assets/Prefabs/Player.prefab")
```

---

## Batch Asset Operations

```python
# Mass create materials for multiple objects
commands = []
for obj_name in ["Tree_1", "Tree_2", "Tree_3"]:
    commands.append({
        "tool": "manage_material",
        "params": {
            "action": "set_renderer_color",
            "target": obj_name,
            "color": [0.2, 0.6, 0.2, 1.0],
            "mode": "create_unique"
        }
    })
batch_execute(commands=commands, parallel=True)
```
