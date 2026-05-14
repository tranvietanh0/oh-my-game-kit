---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Tools: Batch & Packages

Complete reference for `batch_execute`, `query_packages`, `manage_packages`, and multi-instance tools.

> **Template warning:** Examples are skill templates. Validate against active tool schema and runtime behavior.

## batch_execute

Execute multiple MCP commands in a single batch (10–100x faster than sequential calls).

```python
batch_execute(
    commands=[                    # list[dict], required, max 25 (configurable up to 100)
        {"tool": "tool_name", "params": {...}},
        ...
    ],
    parallel=False,              # advisory only — Unity may still run sequentially
    fail_fast=False,             # stop on first failure
    max_parallelism=None         # max parallel workers
)
```

**Important:** Not transactional — earlier commands are NOT rolled back if a later command fails.

**⚠️ Python-only tools cannot be batched:** `debug_request_context`, `manage_tools`, `manage_editor/telemetry_status`, `manage_editor/telemetry_ping` are handled Python-side and will return "Unknown command type" in batch_execute. Call these directly instead.

**C# handlers added for batch compatibility:** `find_in_file`, `get_sha`, `validate_script`, `manage_script_capabilities` now have C# implementations that batch_execute can dispatch.

**Pattern for >25 commands:**
```python
# Split into batches of 25
for i in range(0, len(commands), 25):
    batch_execute(commands=commands[i:i+25], parallel=True)
```

---

## set_active_instance

Route commands to a specific Unity instance (multi-instance workflows).

```python
set_active_instance(
    instance="ProjectName@abc123"  # Name@hash or hash prefix
)

# Read mcpforunity://instances to list available instances
```

---

## query_packages

Read-only package registry queries.

```python
# List installed packages
query_packages(action="list_installed")

# Search registry
query_packages(action="search", search_term="cinemachine")

# Get package info
query_packages(action="get_info", package_id="com.unity.cinemachine")

# Check if installed
query_packages(action="is_installed", package_id="com.unity.probuilder")
```

---

## manage_packages

Mutating package operations (install/remove/update). May trigger domain reload.

```python
# Install package
manage_packages(action="install", package_id="com.unity.cinemachine",
    version="3.1.2")  # optional — omit for latest

# Remove package
manage_packages(action="remove", package_id="com.unity.probuilder")

# Update package to latest
manage_packages(action="update", package_id="com.unity.cinemachine")

# Add from git URL
manage_packages(action="install",
    git_url="https://github.com/example/package.git")
```

**After installing packages:** always call `refresh_unity(mode="force", wait_for_ready=True)` and check console for errors.

---

## UI Tools: manage_ui

Manage UI Toolkit elements (UXML/USS). For uGUI (Canvas), use `batch_execute` + `manage_gameobject` + `manage_components`.

```python
# Create UXML or USS file
manage_ui(action="create", path="Assets/UI/MainMenu.uxml",
    contents='<ui:UXML xmlns:ui="UnityEngine.UIElements"><ui:Label text="Hello" /></ui:UXML>')

# Read file
manage_ui(action="read", path="Assets/UI/MainMenu.uxml")

# Update file
manage_ui(action="update", path="Assets/UI/Styles.uss",
    contents=".title { font-size: 48px; color: yellow; }")

# Attach UIDocument to a GameObject
manage_ui(action="attach_ui_document", target="UICanvas",
    source_asset="Assets/UI/MainMenu.uxml",
    panel_settings="Assets/UI/Panel.asset",  # auto-created if omitted
    sort_order=0)

# Create PanelSettings asset
manage_ui(action="create_panel_settings",
    path="Assets/UI/Panel.asset",
    scale_mode="ScaleWithScreenSize",
    reference_resolution={"width": 1920, "height": 1080})

# Inspect visual tree
manage_ui(action="get_visual_tree", target="UICanvas", max_depth=10)
```

**UI Toolkit workflow:** Create UXML (structure) + USS (styling) → Create PanelSettings → Attach UIDocument to GameObject → Verify with `get_visual_tree`.

→ See `references/workflow-ui-creation.md` for complete Canvas/uGUI and UI Toolkit workflows.
