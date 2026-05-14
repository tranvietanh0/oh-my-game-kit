---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Tools: Camera & Graphics

Complete reference for `manage_camera` and `manage_graphics` tools.

> **Template warning:** Examples are skill templates. Validate against active tool schema and runtime behavior.

## manage_camera

Unified camera management (Unity Camera + Cinemachine). Use `ping` first.

**Parameters:** `action` (required), `target` (camera name/path/ID), `search_method`, `properties` (dict)

**Screenshot parameters:** `camera`, `include_image` (bool), `max_resolution` (int), `batch` ("surround"/"orbit"), `look_at`, `view_position`, `view_rotation`

### Actions by Category

**Setup:** `ping`, `ensure_brain`, `get_brain_status`

**Creation:** `create_camera` — Properties: `name`, `preset` (follow/third_person/freelook/dolly/static/top_down/side_scroller), `follow`, `lookAt`, `priority`, `fieldOfView`

**Configuration:** `set_target`, `set_priority`, `set_lens` (fieldOfView/nearClip/farClip/orthographicSize/dutch), `set_body` (bodyType + component props), `set_aim` (aimType + props), `set_noise` (amplitudeGain/frequencyGain)

**Extensions (Cinemachine):** `add_extension` / `remove_extension` — `extensionType`: CinemachineConfiner2D, CinemachineDeoccluder, CinemachineImpulseListener, CinemachineFollowZoom, CinemachineRecomposer

**Control:** `list_cameras`, `set_blend` (style/duration), `force_camera`, `release_override`

**Capture:** `screenshot`, `screenshot_multiview` (shorthand for batch="surround" + include_image=true)

### Tier System

- **Tier 1** (no Cinemachine needed): ping, create_camera, set_target, set_lens, set_priority, list_cameras, screenshot, screenshot_multiview
- **Tier 2** (requires `com.unity.cinemachine`): ensure_brain, get_brain_status, set_body, set_aim, set_noise, add/remove_extension, set_blend, force_camera, release_override

### Examples

```python
# Check Cinemachine availability
manage_camera(action="ping")

# Create third-person camera
manage_camera(action="create_camera", properties={
    "name": "FollowCam", "preset": "third_person",
    "follow": "Player", "lookAt": "Player", "priority": 20
})

# Ensure Brain on main camera
manage_camera(action="ensure_brain")

# Configure body
manage_camera(action="set_body", target="FollowCam", properties={
    "bodyType": "CinemachineThirdPersonFollow",
    "cameraDistance": 5.0, "shoulderOffset": [0.5, 0.5, 0]
})

# Set aim
manage_camera(action="set_aim", target="FollowCam", properties={
    "aimType": "CinemachineRotationComposer"
})

# Camera shake
manage_camera(action="set_noise", target="FollowCam", properties={
    "amplitudeGain": 0.5, "frequencyGain": 1.0
})

# Priority / force / release
manage_camera(action="set_priority", target="FollowCam", properties={"priority": 50})
manage_camera(action="force_camera", target="CinematicCam")
manage_camera(action="release_override")

# Blend transitions
manage_camera(action="set_blend", properties={"style": "EaseInOut", "duration": 2.0})

# Add extension
manage_camera(action="add_extension", target="FollowCam", properties={
    "extensionType": "CinemachineDeoccluder"
})

# Screenshots
manage_camera(action="screenshot", camera="FollowCam",
    include_image=True, max_resolution=512)
manage_camera(action="screenshot_multiview", max_resolution=480)

# List all cameras
manage_camera(action="list_cameras")
```

**Resource:** Read `mcpforunity://scene/cameras` before modifying cameras.

---

## manage_graphics

Manage URP volumes, baking, rendering stats, pipeline features.

```python
# Get rendering stats (FPS, draw calls, triangles)
manage_graphics(action="rendering_stats")

# Manage URP global volume
manage_graphics(action="get_volume_info", target="GlobalVolume")
manage_graphics(action="set_volume_property", target="GlobalVolume",
    override="Bloom", property="intensity", value=1.5)

# Trigger light baking
manage_graphics(action="bake_lighting")
manage_graphics(action="get_bake_status")

# Pipeline feature toggle
manage_graphics(action="set_pipeline_feature",
    feature="SSAO", enabled=True)
```
