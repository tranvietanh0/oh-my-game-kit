---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Tools: Editor Control & Testing

Complete reference for editor control, console, and test execution tools.

> **Template warning:** Examples are skill templates. Validate against active tool schema and runtime behavior.

## manage_editor

Control Unity Editor state.

```python
manage_editor(action="play")               # Enter play mode
manage_editor(action="pause")              # Pause play mode
manage_editor(action="stop")               # Exit play mode

manage_editor(action="set_active_tool", tool_name="Move")  # Move/Rotate/Scale/etc.

manage_editor(action="add_tag", tag_name="Enemy")
manage_editor(action="remove_tag", tag_name="OldTag")

manage_editor(action="add_layer", layer_name="Projectiles")
manage_editor(action="remove_layer", layer_name="OldLayer")
```

---

## execute_menu_item

Execute any Unity menu item by path.

```python
execute_menu_item(menu_path="File/Save Project")
execute_menu_item(menu_path="GameObject/3D Object/Cube")
execute_menu_item(menu_path="Window/General/Console")
```

---

## read_console

Read or clear Unity console messages.

```python
# Get recent messages
read_console(
    action="get",
    types=["error", "warning", "log"],  # or ["all"]
    count=10,
    filter_text="NullReference",
    page_size=50,
    cursor=0,
    format="detailed",           # "plain"|"detailed"|"json"
    include_stacktrace=True
)

# Clear console
read_console(action="clear")
```

---

## run_tests

Start async test execution. Returns a `job_id` — poll with `get_test_job`.

```python
result = run_tests(
    mode="EditMode",             # "EditMode"|"PlayMode"
    test_names=["MyTests.TestA", "MyTests.TestB"],
    group_names=["Integration*"],  # regex patterns
    category_names=["Unit"],
    assembly_names=["Tests"],
    include_failed_tests=True,
    include_details=False
)
# Returns: {"job_id": "abc123", ...}
```

---

## get_test_job

Poll test job status until complete.

```python
result = get_test_job(
    job_id="abc123",
    wait_timeout=60,             # wait up to N seconds
    include_failed_tests=True,
    include_details=False
)
# Returns: {"status": "complete"|"running"|"failed", "results": {...}}
```

**Async test pattern:**
```python
result = run_tests(mode="EditMode")
final = get_test_job(job_id=result["job_id"], wait_timeout=60,
    include_failed_tests=True)
if final["status"] == "complete":
    for test in final.get("failed_tests", []):
        print(f"FAILED: {test['name']}: {test['message']}")
```

---

## Search & Custom Tools

### find_in_file

Search file contents with regex.

```python
find_in_file(
    uri="mcpforunity://path/Assets/Scripts/MyScript.cs",
    pattern="public void \\w+",
    max_results=200,
    ignore_case=True
)
# Returns: line numbers, content excerpts, match positions
```

### execute_custom_tool

Execute project-specific custom tools.

```python
execute_custom_tool(
    tool_name="my_custom_tool",
    parameters={"param1": "value", "param2": 42}
)
```

Discover available tools via `mcpforunity://custom-tools` resource.
