---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Workflow: Script Lifecycle

Create, edit, attach, and validate C# scripts via MCP.

> **Template warning:** Examples are skill templates. Validate against your project setup.

## Setup & Verification

```python
# Quick readiness check before any operation
editor_state = read_resource("mcpforunity://editor/state")
if not editor_state["ready_for_tools"]:
    # Check blocking_reasons, wait recommended_retry_after_ms
    pass
if editor_state["is_compiling"]:
    # Wait for compilation to complete
    pass
```

---

## Create New Script and Attach

```python
# 1. Create script
create_script(
    path="Assets/Scripts/EnemyAI.cs",
    contents='''using UnityEngine;
public class EnemyAI : MonoBehaviour
{
    public float speed = 5f;
    public Transform target;
    void Update()
    {
        if (target != null)
        {
            Vector3 direction = (target.position - transform.position).normalized;
            transform.position += direction * speed * Time.deltaTime;
        }
    }
}'''
)

# 2. CRITICAL: Refresh and compile
refresh_unity(mode="force", scope="scripts", compile="request", wait_for_ready=True)

# 3. Check for errors
console = read_console(types=["error"], count=10)
if console["messages"]:
    print("Compilation errors:", console["messages"])
else:
    # 4. Attach to GameObject
    manage_gameobject(action="modify", target="Enemy",
        components_to_add=["EnemyAI"])
    # 5. Set properties
    manage_components(action="set_property", target="Enemy",
        component_type="EnemyAI", properties={"speed": 10.0})
```

---

## Edit Existing Script Safely

```python
# 1. Get current SHA (prevents stale edits)
sha_info = get_sha(uri="mcpforunity://path/Assets/Scripts/PlayerController.cs")

# 2. Find the method
matches = find_in_file(
    uri="mcpforunity://path/Assets/Scripts/PlayerController.cs",
    pattern="void Update\\(\\)"
)

# 3. Apply structured edit
script_apply_edits(
    name="PlayerController", path="Assets/Scripts",
    edits=[{
        "op": "replace_method",
        "methodName": "Update",
        "replacement": '''void Update()
    {
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");
        transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime);
    }'''
    }]
)

# 4. Validate
validate_script(
    uri="mcpforunity://path/Assets/Scripts/PlayerController.cs",
    level="standard"
)

# 5. Refresh and check console
refresh_unity(mode="force", scope="scripts", compile="request", wait_for_ready=True)
read_console(types=["error"], count=10)
```

---

## Add Method to Existing Class

```python
script_apply_edits(
    name="GameManager", path="Assets/Scripts",
    edits=[
        {
            "op": "insert_method",
            "afterMethod": "Start",
            "code": '''
    public void ResetGame()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }'''
        },
        {
            "op": "anchor_insert",
            "anchor": "using UnityEngine;",
            "position": "after",
            "text": "\nusing UnityEngine.SceneManagement;"
        }
    ]
)
```

---

## Wiring Object References / Stale File Recovery

```python
# Wire cross-references after attaching components
manage_components(action="set_property", target="BeeManager",
    component_type="BeeManagerScript", property="targetObjects",
    value=[{"name": "Flower_1"}, {"name": "Flower_2"}])

# Stale file recovery
try:
    apply_text_edits(uri=script_uri, edits=[...], precondition_sha256=old_sha)
except Exception as e:
    if "stale_file" in str(e):
        new_sha = get_sha(uri=script_uri)
        apply_text_edits(uri=script_uri, edits=[...],
            precondition_sha256=new_sha["sha256"])
```
