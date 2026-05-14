---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Workflow: Batch Operations & Multi-Instance

Mass operations, multi-instance routing, and error recovery patterns.

> **Template warning:** Examples are skill templates. Validate against your project setup.

## Mass Property Update

```python
# Find all enemies
enemies = find_gameobjects(search_term="Enemy", search_method="by_tag")

# Build commands
commands = []
for enemy_id in enemies["ids"]:
    commands.append({
        "tool": "manage_components",
        "params": {
            "action": "set_property",
            "target": enemy_id,
            "component_type": "EnemyHealth",
            "property": "maxHealth",
            "value": 100
        }
    })

# Execute in batches of 25
for i in range(0, len(commands), 25):
    batch_execute(commands=commands[i:i+25], parallel=True)
```

---

## Mass Object Creation with Variations

```python
import random

commands = []
for i in range(20):
    commands.append({
        "tool": "manage_gameobject",
        "params": {
            "action": "create",
            "name": f"Tree_{i}",
            "primitive_type": "Capsule",
            "position": [random.uniform(-50, 50), 0, random.uniform(-50, 50)],
            "scale": [1, random.uniform(2, 5), 1]
        }
    })

batch_execute(commands=commands, parallel=True)
```

---

## Cleanup Pattern

```python
# Find all temporary objects
temps = find_gameobjects(search_term="Temp_", search_method="by_name")

commands = [
    {"tool": "manage_gameobject", "params": {"action": "delete", "target": id}}
    for id in temps["ids"]
]

batch_execute(commands=commands, fail_fast=False)
```

---

## Multi-Instance Workflow

```python
# 1. List available instances
# Read mcpforunity://instances

# 2. Route to specific instance
set_active_instance(instance="ProjectName@abc123")

# 3. Execute commands on that instance
manage_scene(action="get_active")

# 4. Switch to another instance
set_active_instance(instance="OtherProject@def456")
```

---

## Input System Patterns

### Old Input Manager

```csharp
void Update()
{
    float h = Input.GetAxis("Horizontal");
    float v = Input.GetAxis("Vertical");
    transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime);
    if (Input.GetKeyDown(KeyCode.Space)) Jump();
    if (Input.GetMouseButtonDown(0)) Fire();
}
```

### New Input System (PlayerInput component)

```csharp
using UnityEngine.InputSystem;
public class PlayerController : MonoBehaviour
{
    public float speed = 5f;
    private Vector2 moveInput;

    public void OnMove(InputValue value)
        => moveInput = value.Get<Vector2>();

    public void OnJump(InputValue value)
    { if (value.isPressed) Jump(); }

    void Update()
    {
        Vector3 move = new Vector3(moveInput.x, 0, moveInput.y);
        transform.Translate(move * speed * Time.deltaTime);
    }
}
```

### When activeInputHandler is "Both"

Both systems active simultaneously. For UI: prefer `InputSystemUIInputModule`. For gameplay: `Input.GetAxis()` still works.

---

## Pagination Pattern

```python
cursor = 0
all_items = []
while True:
    result = manage_scene(action="get_hierarchy", page_size=100, cursor=cursor)
    all_items.extend(result["data"]["items"])
    cursor = result.get("next_cursor")
    if not cursor:
        break
```
