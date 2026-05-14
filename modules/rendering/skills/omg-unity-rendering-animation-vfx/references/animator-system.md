---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Animator System

## Animator Controller Setup

### Layer Architecture
```
Layer 0: Base Layer (locomotion, idle, jump)
Layer 1: Upper Body (attack, aim) — Avatar Mask: UpperBody
Layer 2: Facial (expressions) — Avatar Mask: Head
```

### State Machine Best Practices
```
Entry → Idle → Locomotion (BlendTree) → Jump
                    ↓
              Attack → BackToIdle
                    ↓
              Hit → Recovery → Idle

Rules:
- Use parameters, not direct transitions
- Use AnyState sparingly (only for interrupts like Death, Hit)
- Add Exit Time only for non-interruptible animations
- Use sub-state machines for complex flows (combat, dialogue)
```

### Blend Trees
```
1D Blend: Walk/Run speed
  Parameter: Speed (0=idle, 0.5=walk, 1=run)

2D Freeform: Directional movement
  Parameters: MoveX, MoveY
  Positions: (0,0)=idle, (0,1)=forward, (1,0)=strafe-right, etc.

2D Simple Directional: Aim direction
  Parameters: AimX, AimY
```

### Animator Service (VContainer)
```csharp
public sealed class AnimatorService
{
    // Use hashed IDs (avoid string lookups)
    static readonly int Speed = Animator.StringToHash("Speed");
    static readonly int IsGrounded = Animator.StringToHash("IsGrounded");
    static readonly int AttackTrigger = Animator.StringToHash("Attack");
    static readonly int HitTrigger = Animator.StringToHash("Hit");

    readonly Animator _animator;

    public void SetSpeed(float speed) => _animator.SetFloat(Speed, speed);
    public void SetGrounded(bool grounded) => _animator.SetBool(IsGrounded, grounded);
    public void TriggerAttack() => _animator.SetTrigger(AttackTrigger);
    public void TriggerHit() => _animator.SetTrigger(HitTrigger);

    // Cross-fade for smooth transitions
    public void PlayState(string state, float fadeTime = 0.15f) =>
        _animator.CrossFadeInFixedTime(state, fadeTime);
}
```

## Animation Events

```csharp
// Called from animation clip at specific frames
// Add via Animation window > Add Event

public sealed class AnimationEventReceiver : MonoBehaviour
{
    [Inject] readonly SignalBus _signalBus; // VContainer field inject (MonoBehaviour exception)

    // Called from attack animation at impact frame
    void OnAttackHit() => _signalBus.Fire(new AttackHitSignal());

    // Called at footstep frames
    void OnFootstep() => _signalBus.Fire(new FootstepSignal(transform.position));

    // Called at end of death animation
    void OnDeathComplete() => _signalBus.Fire(new DeathCompleteSignal());
}
```

## Performance Tips

| Optimization | Impact | How |
|-------------|--------|-----|
| Culling Mode | High | Set to Cull Completely for off-screen |
| Update Mode | Medium | Use Animate Physics for physics-driven |
| Apply Root Motion | Low | Disable if controlling via code |
| Optimize Transform | Medium | Enable in Animation Import |
| Use hashed IDs | Low | `Animator.StringToHash()` |
| Reduce layers | Medium | Remove unused animation layers |

### Animator Culling
```csharp
// Objects off-screen don't animate
animator.cullingMode = AnimatorCullingMode.CullCompletely; // Full cull
animator.cullingMode = AnimatorCullingMode.CullUpdateTransforms; // Still updates state
```

### LOD-Based Animation
```csharp
// Reduce animation quality for distant objects
void UpdateAnimationQuality(float distToCamera)
{
    animator.speed = distToCamera switch
    {
        < 10f => 1f,      // Full speed
        < 30f => 0.5f,    // Half updates
        _ => 0f,          // Freeze
    };
}
```
