---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Workflow: Scene & GameObjects

Find, create, modify, and arrange scene objects via MCP.

> **Template warning:** Examples are skill templates. Validate against your project setup.

## Fresh Scene for Generated Builds

**Always start with `manage_scene(action="create")`** to avoid conflicts with existing default objects.

```python
# Step 0: Create empty scene
manage_scene(action="create", name="MyGeneratedScene", path="Assets/Scenes/")
# Phase 1: Environment (camera, lights) — no conflicts
# Phase 2: Objects, Phase 3: Materials, etc.
```

---

## Create Complete Scene from Scratch

```python
# 1. Create new scene
manage_scene(action="create", name="GameLevel", path="Assets/Scenes/")

# 2. Batch create environment
batch_execute(commands=[
    {"tool": "manage_gameobject", "params": {
        "action": "create", "name": "Ground", "primitive_type": "Plane",
        "position": [0,0,0], "scale": [10,1,10]
    }},
    {"tool": "manage_gameobject", "params": {
        "action": "create", "name": "Light", "primitive_type": "Cube"
    }},
    {"tool": "manage_gameobject", "params": {
        "action": "create", "name": "Player", "primitive_type": "Capsule",
        "position": [0,1,0]
    }}
])

# 3. Add directional light (remove cube mesh, add Light)
manage_components(action="remove", target="Light", component_type="MeshRenderer")
manage_components(action="remove", target="Light", component_type="MeshFilter")
manage_components(action="remove", target="Light", component_type="BoxCollider")
manage_components(action="add", target="Light", component_type="Light")
manage_components(action="set_property", target="Light",
    component_type="Light", property="type", value="Directional")

# 4. Position camera
manage_gameobject(action="modify", target="Main Camera",
    position=[0,5,-10], rotation=[30,0,0])

# 5. Verify and save
manage_scene(action="screenshot")
manage_scene(action="save")
```

---

## Grid of Objects

```python
commands = []
for x in range(5):
    for z in range(5):
        commands.append({
            "tool": "manage_gameobject",
            "params": {
                "action": "create",
                "name": f"Cube_{x}_{z}",
                "primitive_type": "Cube",
                "position": [x * 2, 0, z * 2]
            }
        })
batch_execute(commands=commands[:25], parallel=True)
```

---

## Clone and Arrange Objects

```python
result = find_gameobjects(search_term="Template", search_method="by_name")
template_id = result["ids"][0]
for i in range(10):
    manage_gameobject(action="duplicate", target=template_id,
        new_name=f"Instance_{i}", offset=[i * 2, 0, 0])
```

---

## Physics for Trigger-Based Interactions

`OnTriggerEnter`/`Stay`/`Exit` require at least one `Rigidbody` on colliding objects:

```python
batch_execute(commands=[
    {"tool": "manage_components", "params": {
        "action": "add", "target": "Bee_1", "component_type": "Rigidbody"
    }},
    {"tool": "manage_components", "params": {
        "action": "set_property", "target": "Bee_1",
        "component_type": "Rigidbody",
        "properties": {"useGravity": False, "isKinematic": True}
    }}
])
```

---

## Debugging: Investigate Missing References

```python
# 1. Find the GameObject
result = find_gameobjects(search_term="Player", search_method="by_name")

# 2. Get components
# Read mcpforunity://scene/gameobject/{id}/components

# 3. Find referenced object and wire it
result2 = find_gameobjects(search_term="Target", search_method="by_name")
manage_components(
    action="set_property", target="Player",
    component_type="PlayerController",
    property="target",
    value={"instanceID": result2["ids"][0]}
)
```

---

## Check Scene State

```python
hierarchy = manage_scene(action="get_hierarchy", page_size=100, include_transform=True)
for item in hierarchy["data"]["items"]:
    if item.get("transform", {}).get("position", [0,0,0])[1] < -100:
        print(f"Object {item['name']} fell through floor!")
manage_scene(action="screenshot")
```
