---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Workflow: UI Creation

UI Toolkit (UXML/USS) and uGUI (Canvas) creation patterns.

> Always read `mcpforunity://project/info` first to detect UI packages and input handler.

## Step 0: Detect Project UI Capabilities

```python
# Read mcpforunity://project/info
# activeInputHandler: "Old" | "New" | "Both"
# packages.uiToolkit: true (always Unity 2021.3+)
# packages.ugui: true/false
# packages.textmeshpro: true/false
```

| Field | Value | Use |
|---|---|---|
| `packages.uiToolkit` | `true` | Preferred: `manage_ui` (UXML/USS) |
| `packages.ugui` | `true` | Canvas UI via `batch_execute` |
| `packages.textmeshpro` | `true` | `TextMeshProUGUI`; else `UnityEngine.UI.Text` |
| `activeInputHandler` | `"Old"` | `StandaloneInputModule` for EventSystem |
| `activeInputHandler` | `"New"/"Both"` | `InputSystemUIInputModule` |

> **Gotcha:** Adding `StandaloneInputModule` when handler is `"New"` causes a runtime error.

---

## UI Toolkit: Complete Screen

```python
# 1. UXML (structure)
manage_ui(action="create", path="Assets/UI/MainMenu.uxml",
    contents='''<ui:UXML xmlns:ui="UnityEngine.UIElements">
    <ui:Style src="Assets/UI/MainMenu.uss" />
    <ui:VisualElement name="root" class="root-container">
        <ui:Label text="My Game" class="title" />
        <ui:Button text="Play" name="play-btn" class="menu-button" />
        <ui:Button text="Quit" name="quit-btn" class="menu-button" />
    </ui:VisualElement>
</ui:UXML>''')

# 2. USS (styling)
manage_ui(action="create", path="Assets/UI/MainMenu.uss",
    contents='''.root-container { flex-grow: 1; justify-content: center;
    align-items: center; background-color: rgba(0,0,0,0.8); }
.title { font-size: 48px; color: white; -unity-font-style: bold; }
.menu-button { width: 300px; height: 60px; font-size: 24px;
    background-color: rgb(50,120,200); color: white; border-radius: 8px; }
.menu-button:hover { background-color: rgb(70,140,220); }''')

# 3. Create GO + attach UIDocument
manage_gameobject(action="create", name="UIRoot")
manage_ui(action="attach_ui_document", target="UIRoot",
    source_asset="Assets/UI/MainMenu.uxml")

# 4. Verify
manage_ui(action="get_visual_tree", target="UIRoot", max_depth=5)
```

---

## uGUI: Canvas Foundation

```python
batch_execute(fail_fast=True, commands=[
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "MainCanvas"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "MainCanvas", "component_type": "Canvas"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "MainCanvas", "component_type": "CanvasScaler"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "MainCanvas", "component_type": "GraphicRaycaster"}},
    # renderMode: 0=ScreenSpaceOverlay, 1=ScreenSpaceCamera, 2=WorldSpace
    {"tool": "manage_components", "params": {"action": "set_property", "target": "MainCanvas",
        "component_type": "Canvas", "property": "renderMode", "value": 0}},
    # uiScaleMode 1=ScaleWithScreenSize
    {"tool": "manage_components", "params": {"action": "set_property", "target": "MainCanvas",
        "component_type": "CanvasScaler",
        "properties": {"uiScaleMode": 1, "referenceResolution": [1920, 1080]}}}
])
```

---

## uGUI: RectTransform Sizing (Critical)

Without sizing, UI elements default to zero size and won't be visible.

```python
# Stretch to fill parent
{"action": "set_property", "component_type": "RectTransform",
 "properties": {"anchorMin": [0,0], "anchorMax": [1,1],
                "sizeDelta": [0,0], "anchoredPosition": [0,0]}}

# Fixed-size centered (300x50)
{"action": "set_property", "component_type": "RectTransform",
 "properties": {"anchorMin": [0.5,0.5], "anchorMax": [0.5,0.5],
                "sizeDelta": [300,50], "anchoredPosition": [0,0]}}
```

---

## uGUI: EventSystem

```python
# New Input System ("New" or "Both"):
batch_execute(fail_fast=True, commands=[
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "EventSystem"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "EventSystem",
        "component_type": "UnityEngine.EventSystems.EventSystem"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "EventSystem",
        "component_type": "UnityEngine.InputSystem.UI.InputSystemUIInputModule"}}
])

# Old Input Manager ("Old"):
# Use UnityEngine.EventSystems.StandaloneInputModule instead
```

---

## UI Component Quick Reference

| Element | Required Components | Notes |
|---|---|---|
| Canvas | Canvas + CanvasScaler + GraphicRaycaster | Root for all UI |
| EventSystem | EventSystem + input module | One per scene |
| Panel | Image + RectTransform sizing | Container |
| Text | TextMeshProUGUI (or UI.Text) | Check packages.textmeshpro |
| Button | Image + Button + child(TMP) + RectTransform | Image=visual, Button=click |
| Slider | Slider + children + wire fillRect/handleRect | Won't work without wiring |
| Toggle | Toggle + children + wire graphic | Wire checkmark Image |
| Input Field | Image + TMP_InputField + wire textViewport/textComponent/placeholder | Won't work without wiring |

→ See `references/workflow-ui-advanced.md` for Slider, Toggle, Input Field, and Layout Group patterns.
