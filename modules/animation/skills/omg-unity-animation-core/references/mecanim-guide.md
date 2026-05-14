---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: animation
protected: false
---
# Mecanim — Animator Controller & State Machine Guide

## Core Concepts

**AnimatorController** — Asset managing AnimationClips, States, Transitions, Parameters, Layers, BlendTrees.

**State Machine Structure:**
- **Entry state** — Implicit entry point (no clip)
- **States** — Each holds one AnimationClip or BlendTree
- **Transitions** — Define blending duration, exit time, conditions
- **Parameters** — bool, int, float, trigger (shared between C# and FSM)
- **Layers** — Independent state machines (default full-body, optional upper-body overlay)
- **Sub-State Machines** — Nested FSMs for organization

## Animator API (C# Control)

```csharp
Animator anim = GetComponent<Animator>();

// Parameter setting (queues transition)
anim.SetBool("grounded", true);
anim.SetFloat("moveSpeed", 3.5f, dampTime: 0.1f, deltaTime: Time.deltaTime);  // Smooth damping
anim.SetTrigger("jump");  // Auto-reset; use once per input event

// Direct playback (bypass FSM)
anim.Play("IdleState", layer: 0, normalizedTime: 0.5f);  // Jump to 50%
anim.CrossFade("RunState", duration: 0.2f);              // Blend over 0.2s
anim.CrossFadeInFixedTime("RunState", duration: 0.1f);   // Blend time in seconds

// Query state
bool inRun = anim.GetCurrentAnimatorStateInfo(0).shortNameHash == Animator.StringToHash("Run");
float clipLen = anim.GetCurrentAnimatorStateInfo(0).length;
float progress = anim.GetCurrentAnimatorStateInfo(0).normalizedTime;

// Layer control
anim.SetLayerWeight(1, 0.5f);  // Blend upper-body overlay at 50%
```

## BlendTree Types

| Type | Parameters | Use Case |
|------|-----------|----------|
| **1D** | 1 float | idle → walk → run (speed) |
| **2D Simple Directional** | 2 floats (X/Y) | directional movement (forward/strafe) |
| **2D Freeform Cartesian** | 2 floats | arbitrary 2D blending |
| **2D Freeform Polar** | 2 floats | speed + direction (angle-based) |

## Root Motion

**Concept** — Animation drives GameObject position/rotation via curves baked into clip.

**Setup:**
1. In clip Inspector: enable **Root Transform Position (XZ)** + **Root Transform Rotation** → uncheck "Bake into Pose"
2. Set `animator.applyRootMotion = true`
3. Disable CharacterController/Rigidbody motion during root-motion clips

**Trade-off:**
- **Root motion** — Animation-driven, precise (cinematics, attacking); complex multi-state sync
- **Velocity-based** — Physics-driven (NavMesh, CharacterController); responsive to input
- **Best practice** — Hybrid: locomotion via NavMesh, root motion for skills (charge attack, knockback)

## AnimationEvents & StateMachineBehaviour

### AnimationEvent — Callback at specific frame in clip

```csharp
// Right-click clip timeline → Add Event → assign function
void OnSlashHit()  { audioSource.PlayOneShot(slashSFX); }   // Called at frame 12
void OnFootstep(float volume) { /* footstep at landing frame */ }
```

### StateMachineBehaviour — Lifecycle callbacks on state

```csharp
public class AttackStateBehaviour : StateMachineBehaviour
{
    public override void OnStateEnter(Animator anim, AnimatorStateInfo info, int layer)
    {
        // Enter attack → enable hitbox
    }
    public override void OnStateUpdate(Animator anim, AnimatorStateInfo info, int layer)
    {
        // Per-frame → check for cancel input
    }
    public override void OnStateExit(Animator anim, AnimatorStateInfo info, int layer)
    {
        // Exit attack → disable hitbox, apply cooldown
    }
}
// Attach script to state node in Animator window
```

## Animation Rigging (IK Constraints)

### TwoBoneIK — Limb solver (arm/leg)

```csharp
var ikConstraint = GetComponent<TwoBoneIKConstraint>();
ikConstraint.data.tip = handBone;
ikConstraint.data.target = handTargetTransform;
ikConstraint.data.hint = elbowHintTransform;
ikConstraint.data.targetPositionWeight = 1f;
ikConstraint.data.targetRotationWeight = 0.5f;
```

### MultiAim — Head look-at / weapon aim

```csharp
var aimConstraint = GetComponent<MultiAimConstraint>();
aimConstraint.data.constrainedObject = headBone;
aimConstraint.data.sourceObjects[0] = targetTransform;
aimConstraint.data.sourceObjectsWeight[0] = 1f;
```

**Other constraints**: OverrideTransform, Parent, RotationLimit.

**Best practice** — Use for post-bake pose adjustments (aiming after locomotion, head tracking). Avoid heavy per-frame solves (30+ bones); bake IK into clips when possible.

## Performance Tips

**Culling:**
```csharp
animator.cullingMode = AnimatorCullingMode.CullUpdateTransforms;  // Skip when off-screen
```

**State complexity:**
- Keep state count < 50 per layer (FSM search cost)
- Use BlendTrees instead of per-speed states
- Organize with Sub-State Machines

**Memory:**
- Reuse via `AnimatorOverrideController` (swap clips, keep FSM structure)
- Unload unused `AnimationClip`s via Addressables
- Avoid cloning Animator; share controller across instances

**Synchronize multiple animators:**
```csharp
float t = sourceAnimator.GetCurrentAnimatorStateInfo(0).normalizedTime;
targetAnimator.Play(Animator.StringToHash("IdleState"), 0, t);
```

**Avoid**: `Rebind()` per frame; disabling GameObject (use `Component.enabled`); dense FSMs (200+ states).

## Gotchas
1. **Trigger reset** — `SetTrigger()` auto-resets; call once per input event
2. **Parameter hashing** — use `Animator.StringToHash("paramName")` for per-frame reads
3. **normalizedTime wraparound** — looping clips: use `time % 1f`
4. **Animator.Rebind() spike** — avoid in gameplay; Instantiate prefab instead
5. **Root motion conflict** — disable NavMesh/CharacterController when `applyRootMotion = true`
6. **Rigging per-frame cost** — heavy IK (30+ bones) spikes frame time; evaluate less frequently
