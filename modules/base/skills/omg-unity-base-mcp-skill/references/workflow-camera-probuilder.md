---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Workflow: Camera & ProBuilder

Camera setup with Cinemachine and ProBuilder scene building patterns.

> **Template warning:** Examples are skill templates. Validate against your project setup.

## Third-Person Camera Setup

```python
# 1. Check Cinemachine
manage_camera(action="ping")

# 2. Ensure Brain on main camera
manage_camera(action="ensure_brain")

# 3. Create follow camera
manage_camera(action="create_camera", properties={
    "name": "FollowCam", "preset": "third_person",
    "follow": "Player", "lookAt": "Player", "priority": 20
})

# 4. Fine-tune body
manage_camera(action="set_body", target="FollowCam", properties={
    "cameraDistance": 5.0, "shoulderOffset": [0.5, 0.5, 0]
})

# 5. Add camera shake
manage_camera(action="set_noise", target="FollowCam", properties={
    "amplitudeGain": 0.3, "frequencyGain": 0.8
})

# 6. Verify with screenshot
manage_camera(action="screenshot", camera="FollowCam",
    include_image=True, max_resolution=512)
```

---

## Multi-Camera Setup with Blending

```python
# Read mcpforunity://scene/cameras first
manage_camera(action="create_camera", properties={
    "name": "GameplayCam", "preset": "follow",
    "follow": "Player", "lookAt": "Player", "priority": 10
})
manage_camera(action="create_camera", properties={
    "name": "CinematicCam", "preset": "dolly",
    "lookAt": "CutsceneTarget", "priority": 5
})
manage_camera(action="set_blend",
    properties={"style": "EaseInOut", "duration": 2.0})
manage_camera(action="force_camera", target="CinematicCam")
manage_camera(action="release_override")
```

---

## Camera Without Cinemachine / Inspection

```python
# Tier 1 — no Cinemachine needed
manage_camera(action="create_camera", properties={"name": "MainCam", "fieldOfView": 50})
manage_camera(action="set_lens", target="MainCam",
    properties={"fieldOfView": 60, "nearClipPlane": 0.1, "farClipPlane": 1000})
manage_camera(action="set_target", target="MainCam", properties={"lookAt": "Player"})
manage_camera(action="screenshot", camera="MainCam", include_image=True, max_resolution=512)

# Inspection — Read mcpforunity://scene/cameras for full status

```python
# Read mcpforunity://scene/cameras — brain status, all cameras
manage_camera(action="get_brain_status")
manage_camera(action="list_cameras")
manage_camera(action="screenshot_multiview", max_resolution=480)
```

---

## ProBuilder: Basic Scene Build

```python
# 1. Check availability
manage_probuilder(action="ping")

# 2. Create shapes in batch
batch_execute(commands=[
    {"tool": "manage_probuilder", "params": {
        "action": "create_shape",
        "properties": {"shape_type": "Cube", "name": "Floor",
                       "width": 20, "height": 0.2, "depth": 20}
    }},
    {"tool": "manage_probuilder", "params": {
        "action": "create_shape",
        "properties": {"shape_type": "Cube", "name": "Wall1",
                       "width": 20, "height": 3, "depth": 0.3,
                       "position": [0, 1.5, 10]}
    }},
    {"tool": "manage_probuilder", "params": {
        "action": "create_shape",
        "properties": {"shape_type": "Cylinder", "name": "Pillar1",
                       "radius": 0.4, "height": 3, "position": [5, 1.5, 5]}
    }},
])

# 3. Edit — always get_mesh_info first!
info = manage_probuilder(action="get_mesh_info", target="Wall1",
    properties={"include": "faces"})

# 4. Apply materials per face
manage_probuilder(action="set_face_material", target="Floor",
    properties={"faceIndices": [0],
                "materialPath": "Assets/Materials/Stone.mat"})

# 5. Smooth
manage_probuilder(action="auto_smooth", target="Pillar1",
    properties={"angleThreshold": 45})

# 6. Verify
manage_scene(action="screenshot", include_image=True, max_resolution=512)
```

---

## ProBuilder: Edit-Verify Loop

Face indices change after every edit — always re-query:

```python
# WRONG: assume indices are stable
manage_probuilder(action="subdivide", target="Obj",
    properties={"faceIndices": [2]})
manage_probuilder(action="delete_faces", target="Obj",
    properties={"faceIndices": [5]})  # May be wrong!

# RIGHT: re-query after each edit
manage_probuilder(action="subdivide", target="Obj",
    properties={"faceIndices": [2]})
info = manage_probuilder(action="get_mesh_info", target="Obj",
    properties={"include": "faces"})
# Find correct face by direction/center, then delete
manage_probuilder(action="delete_faces", target="Obj",
    properties={"faceIndices": [correct_index]})
```

**Known limitations:** `set_pivot` broken (use `center_pivot`); `convert_to_probuilder` broken (use `create_shape`); `subdivide` uses ConnectElements not quad-subdivision.
