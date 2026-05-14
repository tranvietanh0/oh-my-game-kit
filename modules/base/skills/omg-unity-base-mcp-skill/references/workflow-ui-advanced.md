---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Workflow: UI Advanced Components

Slider, Toggle, Input Field, Layout Group, and complete menu example.

> **Template warning:** Examples are skill templates. Validate against your project setup.

## Slider (With Reference Wiring)

Slider requires wiring `fillRect` and `handleRect` — won't function otherwise.

```python
# Step 1: Create hierarchy
batch_execute(fail_fast=True, commands=[
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "HealthSlider", "parent": "MainCanvas"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "HealthSlider", "component_type": "Slider"}},
    {"tool": "manage_components", "params": {"action": "set_property", "target": "HealthSlider",
        "component_type": "RectTransform",
        "properties": {"anchorMin": [0.5,0.5], "anchorMax": [0.5,0.5], "sizeDelta": [400,30]}}},
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "FillArea", "parent": "HealthSlider"}},
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "SliderFill", "parent": "FillArea"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "SliderFill", "component_type": "Image"}},
    {"tool": "manage_components", "params": {"action": "set_property", "target": "SliderFill",
        "component_type": "Image", "property": "color", "value": [0.2,0.8,0.2,1.0]}},
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "HandleArea", "parent": "HealthSlider"}},
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "SliderHandle", "parent": "HandleArea"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "SliderHandle", "component_type": "Image"}},
])

# Step 2: Wire references (CRITICAL)
batch_execute(fail_fast=True, commands=[
    {"tool": "manage_components", "params": {"action": "set_property", "target": "HealthSlider",
        "component_type": "Slider", "property": "fillRect", "value": {"name": "SliderFill"}}},
    {"tool": "manage_components", "params": {"action": "set_property", "target": "HealthSlider",
        "component_type": "Slider", "property": "handleRect", "value": {"name": "SliderHandle"}}}
])
```

---

## Toggle (With Reference Wiring)

Toggle requires wiring `graphic` to the checkmark Image.

```python
batch_execute(fail_fast=True, commands=[
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "SoundToggle", "parent": "MenuPanel"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "SoundToggle", "component_type": "Toggle"}},
    {"tool": "manage_components", "params": {"action": "set_property", "target": "SoundToggle",
        "component_type": "RectTransform",
        "properties": {"anchorMin": [0.5,0.5], "anchorMax": [0.5,0.5], "sizeDelta": [200,30]}}},
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "ToggleBG", "parent": "SoundToggle"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "ToggleBG", "component_type": "Image"}},
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "ToggleCheckmark", "parent": "ToggleBG"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "ToggleCheckmark", "component_type": "Image"}},
])
# Wire graphic (CRITICAL)
manage_components(action="set_property", target="SoundToggle",
    component_type="Toggle", property="graphic",
    value={"name": "ToggleCheckmark"})
```

---

## Input Field (With Reference Wiring)

TMP_InputField requires wiring `textViewport`, `textComponent`, and `placeholder`.

```python
# Step 1: Create hierarchy (abbreviated)
batch_execute(fail_fast=True, commands=[
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "NameInput", "parent": "MenuPanel"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "NameInput", "component_type": "TMP_InputField"}},
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "InputTextArea", "parent": "NameInput"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "InputTextArea", "component_type": "RectMask2D"}},
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "InputPlaceholder", "parent": "InputTextArea"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "InputPlaceholder", "component_type": "TextMeshProUGUI"}},
    {"tool": "manage_gameobject", "params": {"action": "create", "name": "InputText", "parent": "InputTextArea"}},
    {"tool": "manage_components", "params": {"action": "add", "target": "InputText", "component_type": "TextMeshProUGUI"}},
])

# Step 2: Wire references (CRITICAL)
batch_execute(fail_fast=True, commands=[
    {"tool": "manage_components", "params": {"action": "set_property", "target": "NameInput",
        "component_type": "TMP_InputField", "property": "textViewport", "value": {"name": "InputTextArea"}}},
    {"tool": "manage_components", "params": {"action": "set_property", "target": "NameInput",
        "component_type": "TMP_InputField", "property": "textComponent", "value": {"name": "InputText"}}},
    {"tool": "manage_components", "params": {"action": "set_property", "target": "NameInput",
        "component_type": "TMP_InputField", "property": "placeholder", "value": {"name": "InputPlaceholder"}}}
])
```

---

## Layout Group

Auto-arranges children — skip manual RectTransform positioning on children.

```python
batch_execute(fail_fast=True, commands=[
    {"tool": "manage_components", "params": {"action": "add", "target": "MenuPanel",
        "component_type": "VerticalLayoutGroup"}},
    {"tool": "manage_components", "params": {"action": "set_property", "target": "MenuPanel",
        "component_type": "VerticalLayoutGroup",
        "properties": {"spacing": 10, "childAlignment": 4,  # 4=MiddleCenter
                       "childForceExpandWidth": True, "childForceExpandHeight": False,
                       "padding": {"left": 20, "right": 20, "top": 20, "bottom": 20}}}},
    {"tool": "manage_components", "params": {"action": "add", "target": "MenuPanel",
        "component_type": "ContentSizeFitter"}},
    {"tool": "manage_components", "params": {"action": "set_property", "target": "MenuPanel",
        "component_type": "ContentSizeFitter",
        "properties": {"verticalFit": 2}}}  # 2=PreferredSize
])
```

> **childAlignment:** 0=UpperLeft, 1=UpperCenter, 2=UpperRight, 3=MiddleLeft, 4=MiddleCenter, 5=MiddleRight, 6-8=Lower*
> **ContentSizeFitter fit:** 0=Unconstrained, 1=MinSize, 2=PreferredSize

---

## TextMeshPro Alignment Values

257=TopLeft, 258=TopCenter, 260=TopRight, 513=MiddleLeft, 514=MiddleCenter, 516=MiddleRight, 1025=BottomLeft, 1026=BottomCenter, 1028=BottomRight
