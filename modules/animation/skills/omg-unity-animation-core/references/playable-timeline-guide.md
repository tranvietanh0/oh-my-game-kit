---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: animation
protected: false
---
# Playable API & Timeline Guide

## Playable API

**PlayableGraph** — Directed acyclic graph of Playables feeding into PlayableOutputs. Use when:
- Mixing multiple animation clips without AnimatorController
- Procedural blend trees (weight staggering, layering)
- Custom playable nodes (state machines, procedural animation)
- Runtime-driven blending logic too complex for AnimatorController

### Basic Graph Setup

```csharp
PlayableGraph graph = PlayableGraph.Create();

// Create clip playables
var clipA = AnimationClipPlayable.Create(graph, clipWalk);
var clipB = AnimationClipPlayable.Create(graph, clipRun);

// Mix them
var mixer = AnimationMixerPlayable.Create(graph, 2);  // 2 inputs
graph.Connect(clipA, 0, mixer, 0);
graph.Connect(clipB, 0, mixer, 1);

// Output to Animator component
var output = AnimationPlayableOutput.Create(graph, "Animation", animator);
output.SetSourcePlayable(mixer);

// Play
graph.Play();

// Set blend weights
mixer.SetInputWeight(0, 0.7f);  // clipA = 70%
mixer.SetInputWeight(1, 0.3f);  // clipB = 30%

// CRITICAL: Always destroy when done
graph.Destroy();
```

### Custom Playable Behaviour

```csharp
public class ProceduralWalkPlayable : PlayableBehaviour
{
    public override void ProcessFrame(Playable playable, FrameData info, object playerData)
    {
        // Generate pose each frame (procedural leg IK, locomotion)
    }
}

var playable = ScriptPlayable<ProceduralWalkPlayable>.Create(graph);
```

### When to Use Playable API vs AnimatorController

| Situation | Use |
|-----------|-----|
| Standard character locomotion + state logic | AnimatorController |
| Dynamic blend weights at runtime | Playable API |
| Multiple independent animation sources | Playable API |
| Cutscene-driven clips | Timeline (Playable backend) |
| Procedural animation (no clips) | Playable API + custom PlayableBehaviour |

## Timeline

**PlayableDirector** — Component that drives a Timeline asset. Tracks → Clips → Playables.

### PlayableDirector Control

```csharp
PlayableDirector director = GetComponent<PlayableDirector>();
director.Play();
director.Pause();
director.time = 5f;   // Jump to 5 seconds
director.Stop();      // Reset to time=0
director.playableAsset;  // Reference to Timeline asset
```

### Track Types

| Track | Purpose |
|-------|---------|
| Animation Track | Plays AnimationClips with Override/Additive/Mix blend modes |
| Audio Track | Timed audio clips |
| Signal Track | Emits events at timeline markers |
| Control Track | Activates/deactivates GameObjects at specific times |
| Cinemachine Track | Camera cuts/blends (requires Cinemachine) |
| Custom Script Track | Run C# logic at specific times |

### Signal Track — Event Callbacks

```csharp
public class MySignalReceiver : MonoBehaviour, INotificationReceiver
{
    public void OnNotify(Playable origin, INotification notification, object context)
    {
        if (notification is SignalEmitter sig)
        {
            // Handle signal (e.g., trigger VFX, spawn enemy)
        }
    }
}
```

### Binding Animators at Runtime

Timeline Animation Tracks require an Animator binding. Set via:

```csharp
// Bind an Animator to a track at runtime
director.SetGenericBinding(animationTrack, myAnimator);
```

**Limitation** — Timeline animation is separate from AnimatorController. Use `ExposedReference<Animator>` in custom tracks to sync between them.

## Animation Clip Playback Modes

| Mode | API | Use |
|------|-----|-----|
| AnimatorController (FSM) | `animator.SetTrigger()` etc. | Standard character animation |
| Direct play (bypass FSM) | `animator.Play()` / `CrossFade()` | One-shot animations |
| Playable graph | `AnimationClipPlayable` | Complex runtime blending |
| Timeline | `PlayableDirector.Play()` | Cinematic sequences |

## File Organization

```
Assets/
├── Animations/
│   ├── Controllers/       # AnimatorController assets (.controller)
│   ├── Clips/             # AnimationClip assets (.anim)
│   ├── Rigging/           # RigBuilder, constraint prefabs
│   └── Behaviors/         # StateMachineBehaviour scripts
└── Timeline/              # Timeline assets (.timeline)
```

## Gotchas

1. **graph.Destroy() CRITICAL** — Not destroying the graph leaks GPU/CPU resources. Always destroy in `OnDisable()` or `OnDestroy()`
2. **Timeline vs Animator conflict** — Playing both simultaneously causes flickering. Pause AnimatorController when Timeline takes over
3. **Signal Track timing** — Signals fire on the frame they're reached; use a small offset if you need the signal to fire before visual state
4. **ExposedReference serialization** — Custom Timeline tracks using `ExposedReference<T>` require the PlayableDirector to hold the reference table; don't bypass the director
5. **Mixer weight sum** — AnimationMixerPlayable inputs should sum to 1.0; mismatched weights cause pose blending artifacts
