---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Tools: Scripts & Assets

Complete reference for script creation, editing, and asset management tools.

> **Template warning:** Examples are skill templates. Validate against active tool schema and runtime behavior.

## create_script

Create a new C# script.

```python
create_script(
    path="Assets/Scripts/MyScript.cs",
    contents='''using UnityEngine;
public class MyScript : MonoBehaviour
{
    void Start() { }
    void Update() { }
}''',
    script_type="MonoBehaviour",
    namespace="MyGame"
)
```

## script_apply_edits

Apply structured edits to C# scripts (safer than raw text edits).

```python
script_apply_edits(
    name="MyScript", path="Assets/Scripts",
    edits=[
        {"op": "replace_method", "methodName": "Update",
         "replacement": "void Update() { transform.Rotate(Vector3.up); }"},
        {"op": "insert_method", "afterMethod": "Start",
         "code": "void OnEnable() { Debug.Log(\"Enabled\"); }"},
        {"op": "delete_method", "methodName": "OldMethod"},
        {"op": "anchor_insert", "anchor": "void Start()",
         "position": "before",  # "before" | "after"
         "text": "// Called before Start\n"},
        {"op": "regex_replace", "pattern": "Debug\\.Log\\(",
         "text": "Debug.LogWarning("},
        {"op": "prepend", "text": "// File header\n"},
        {"op": "append", "text": "\n// File footer"}
    ]
)
```

## apply_text_edits

Apply precise character-position edits (1-indexed).

```python
apply_text_edits(
    uri="mcpforunity://path/Assets/Scripts/MyScript.cs",
    edits=[{"startLine": 10, "startCol": 5, "endLine": 10,
            "endCol": 20, "newText": "replacement text"}],
    precondition_sha256="abc123...",
    strict=True
)
```

## validate_script / get_sha / delete_script

```python
validate_script(uri="mcpforunity://path/Assets/Scripts/MyScript.cs",
    level="standard", include_diagnostics=True)

get_sha(uri="mcpforunity://path/Assets/Scripts/MyScript.cs")
# Returns: {"sha256": "...", "lengthBytes": 1234, "lastModifiedUtc": "..."}

delete_script(uri="mcpforunity://path/Assets/Scripts/OldScript.cs")
```

---

## manage_asset

Asset operations: search, import, create, modify, delete.

```python
# Search (paginated)
manage_asset(action="search", path="Assets",
    search_pattern="*.prefab", filter_type="Prefab",
    page_size=25, page_number=1, generate_preview=False)

manage_asset(action="get_info", path="Assets/Prefabs/Player.prefab")

# Create
manage_asset(action="create", path="Assets/Materials/NewMaterial.mat",
    asset_type="Material", properties={"color": [1,0,0,1]})

manage_asset(action="duplicate", path="Assets/A.prefab", destination="Assets/B.prefab")
manage_asset(action="move", path="Assets/A.prefab", destination="Assets/Prefabs/A.prefab")
manage_asset(action="rename", path="Assets/A.prefab", destination="Assets/B.prefab")
manage_asset(action="create_folder", path="Assets/NewFolder")
manage_asset(action="delete", path="Assets/OldAsset.asset")
```

## manage_prefabs

Headless prefab operations.

```python
manage_prefabs(action="get_info", prefab_path="Assets/Prefabs/Player.prefab")
manage_prefabs(action="get_hierarchy", prefab_path="Assets/Prefabs/Player.prefab")
manage_prefabs(action="create_from_gameobject", target="Player",
    prefab_path="Assets/Prefabs/Player.prefab", allow_overwrite=False)
manage_prefabs(action="modify_contents", prefab_path="Assets/Prefabs/Player.prefab",
    target="ChildObject", position=[0,1,0], components_to_add=["AudioSource"])
```

## refresh_unity

Refresh asset database and trigger script compilation.

```python
refresh_unity(
    mode="if_dirty",   # "if_dirty" | "force"
    scope="all",       # "assets" | "scripts" | "all"
    compile="none",    # "none" | "request"
    wait_for_ready=True
)
```

---

## Material & Texture Tools

```python
manage_material(action="create", material_path="Assets/Materials/Red.mat",
    shader="Standard", properties={"_Color": [1,0,0,1]})
manage_material(action="set_material_shader_property",
    material_path="Assets/Materials/Red.mat", property="_Metallic", value=0.8)
manage_material(action="assign_material_to_renderer",
    target="MyCube", material_path="Assets/Materials/Red.mat", slot=0)
# set_renderer_color modes: "create_unique"(persistent), "property_block"(default),
# "shared"(mutates shared—avoid primitives), "instance"(runtime only)
manage_material(action="set_renderer_color", target="MyCube",
    color=[1,0,0,1], mode="create_unique")
manage_texture(action="create", path="Assets/Textures/Checker.png",
    width=64, height=64, fill_color=[255,255,255,255])
manage_texture(action="apply_pattern", path="Assets/Textures/Checker.png",
    pattern="checkerboard", palette=[[0,0,0,255],[255,255,255,255]], pattern_size=8)
manage_texture(action="apply_gradient", path="Assets/Textures/Gradient.png",
    gradient_type="linear", gradient_angle=45,
    palette=[[255,0,0,255],[0,0,255,255]])
```
