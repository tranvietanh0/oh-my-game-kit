---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Cinemachine 3.x Camera Recipes

## Dolly / Spline Camera

```
1. Install com.unity.splines (Package Manager)
2. GameObject → Spline → Draw Spline
3. Add CinemachineCamera + CinemachineSplineDolly; assign SplineContainer
   CameraPosition: 0 (0–1) | AutomaticDolly: Off | SplineOffset: (0,0,0)
```

AutoDolly modes: `FixedSpeed` (constant) | `ClosestPointOnPath` (track Follow target).

```csharp
// Animate dolly along path:
[SerializeField] CinemachineSplineDolly _dolly;
[SerializeField] float _duration = 5f;

IEnumerator PlayCutscene()
{
    float t = 0f;
    while (t < 1f) { t += Time.deltaTime / _duration; _dolly.CameraPosition = t; yield return null; }
}
```

## State-Driven Camera

`CinemachineStateDrivenCamera`: AnimatedTarget=[Animator], DefaultBlend=EaseInOut 0.5s. Add child `CinemachineCamera` per state, map in Inspector (Layer 0: "Idle"→IdleCam etc.). State names case-sensitive.

## Cinematic Cutscene (Timeline)

```
1. Window → Sequencing → Timeline
2. Add CinemachineTrack
3. Add CinemachineShot clips per angle
4. Right-click clip edge → Ease In/Out to blend between shots
```

```csharp
cutsceneCam.Priority = 100;   // override gameplay
// restore:
cutsceneCam.Priority = 0;
```

## Split-Screen

```
Two Unity Cameras, each with CinemachineBrain
  Cam A: Viewport Rect (x=0,   w=0.5)
  Cam B: Viewport Rect (x=0.5, w=0.5)
```

```csharp
// ChannelMask isolates which CinemachineCameras each Brain listens to:
brainA.ChannelMask = 1;  brainB.ChannelMask = 2;
// Set matching OutputChannel on each CinemachineCamera
```

## Minimap Camera

```
CinemachineCamera + CinemachineFollow: Follow=[Player], FollowOffset=(0,50,0), BindingMode=WorldSpace
Unity Camera: Projection=Orthographic, Size=30, CullingMask=MinimapLayer
```

## Priority Reference

`0`=standby · `10`=gameplay · `15`=combat · `50–100`=cutscene · `1000`=debug. Equal priority = last-enabled wins.

Custom blends: Assets → Create → Cinemachine → Blend Settings → assign to `Brain.CustomBlends`

## DOTS Entity Follow (Simple Proxy)

```csharp
// Superseded by CinemachineCameraBridge for DOTS RPG projects
void LateUpdate() {
    var em = World.DefaultGameObjectInjectionWorld?.EntityManager ?? default;
    if (em.IsCreated && em.Exists(TargetEntity))
        transform.position = em.GetComponentData<LocalTransform>(TargetEntity).Position;
}
// Assign proxy Transform to CinemachineCamera.Follow
```

## DOTS CinemachineCameraBridge (Full Bridge)

```csharp
using CameraTarget = DOTSRPG.Core.CameraTarget;  // alias — avoids Unity.Cinemachine conflict

public class CinemachineCameraBridge : MonoBehaviour
{
    [SerializeField] CinemachineCamera _vcam;
    [SerializeField] CinemachineImpulseSource _impulseSource;
    [SerializeField] Transform _proxyTransform;
    [SerializeField] float _traumaThreshold = 0.05f;

    void LateUpdate()
    {
        var em = World.DefaultGameObjectInjectionWorld?.EntityManager ?? default;
        if (!em.IsCreated) return;
        // Follow
        if (em.TryGetSingletonEntity<CameraTarget>(out var t))
            _proxyTransform.position = em.GetComponentData<LocalTransform>(t).Position;
        _vcam.Follow = _proxyTransform;
        // Trauma → impulse (skip if ReduceMotion)
        if (em.HasSingleton<CameraTrauma>() && !em.GetSingleton<CameraAccessibility>().ReduceMotion)
            if (em.GetSingleton<CameraTrauma>().Value > _traumaThreshold)
                _impulseSource.GenerateImpulse(em.GetSingleton<CameraTrauma>().Value);
        // HitStop → timeScale
        if (em.HasSingleton<HitStopEvent>())
            Time.timeScale = em.GetSingleton<HitStopEvent>().TimeScale;
    }
}
```

## Confiner2D for ECS Battlefield

BoxCollider2D must be on **main scene** (NOT SubScene) — Confiner2D cannot reference SubScene objects.

```
1. Add empty "CameraConfiner" to main scene (not SubScene)
2. BoxCollider2D: isTrigger=true, size = arena bounds, offset = arena center
3. CinemachineConfiner2D on CinemachineCamera → BoundingShape2D = above collider
4. MaxWindowSize = 0 (no size limit)
```

## Trauma-based Impulse from ECS

```csharp
// In any ISystem — write trauma from combat events:
if (SystemAPI.HasSingleton<CameraTrauma>())
{
    ref var trauma = ref SystemAPI.GetSingletonRW<CameraTrauma>().ValueRW;
    trauma.Value = math.min(trauma.Value + damageRatio * 0.3f, 1f);
}
// CinemachineCameraBridge reads trauma each LateUpdate and fires GenerateImpulse()
```

## Boss Focus Priority Swap

```csharp
// Swap to boss focus camera when boss phase triggers:
_bossCam.Priority = 50;   // above gameplay (10) → Brain blends to boss cam
// Revert after phase ends:
_bossCam.Priority = 0;
```

Add `CinemachineImpulseListener` to both gameplay and boss cameras so shake persists during blend.
