---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# 3-Tier Architecture: DOTS vs MonoBehaviour Decision Framework

## Quick Decision Rule

```
Does it process 10+ entities per frame? → Tier 1 (Pure DOTS)
Is it a singleton driving a managed Unity API? → Tier 2 (Bridge)
No ECS data at all? → Tier 3 (MonoBehaviour)
```

## Tier 1: Pure DOTS

**When**: Per-entity systems — combat, AI, navigation, stats, spawning, buffs.
**Why**: Burst/Jobs give 5-100x speedup. Entity count scales.
**Pattern**: `ISystem` + `[BurstCompile]` + `IJobEntity` or `foreach SystemAPI.Query`.

| Signal | Example |
|--------|---------|
| 100+ entities | DamageProcessingSystem (2K entities) |
| Parallel work | ProjectileCollisionSystem (IJobEntity) |
| Burst-critical path | TargetSelectionSystem (math-heavy) |
| ECS-native package | AgentNavigationBridgeSystem (Agents Nav) |
| State machine per-entity | WaveManagerSystem (foreach) |

**Current count**: ~120 systems. All correct placement.

## Tier 2: DOTS Data + MonoBehaviour Bridge

**When**: Singleton that reads ECS data and drives external managed API.
**Why**: External API is MonoBehaviour-only (Cinemachine, AudioSource, UI Toolkit, VFX Graph). No Burst benefit (runs 1x/frame on 1 entity).
**Pattern**: ECS singleton stores data → MonoBehaviour reads in `LateUpdate` → calls managed API.

| Signal | Example |
|--------|---------|
| 1 entity (singleton) | CameraTarget → CinemachineCameraBridge |
| Managed API needed | AudioSource.Play(), Time.timeScale |
| No Burst benefit | 1x/frame, no parallelism |
| External package | Unity.Cinemachine, Unity.Audio |

### Bridge Code Pattern
```csharp
public class FooBridge : MonoBehaviour
{
    EntityQuery _query;
    void LateUpdate()
    {
        if (_query.TryGetSingleton<FooData>(out var data))
            ExternalApi.Apply(data.Value);
    }
}
```

### Current Tier 2 Systems
| Bridge | ECS Data | External API |
|--------|----------|-------------|
| CinemachineCameraBridge | CameraTarget, CameraTrauma | Cinemachine impulse, proxy |
| CinemachineAutoZoom | CameraAutoZoomTarget | Cinemachine orthoSize |
| BossFocusTrigger | CameraFocusRequest | Cinemachine priority |
| BattleDebugUI | BattleState, CameraAccessibility | OnGUI |

### Future Tier 2 Candidates
| System | ECS Data | External API |
|--------|----------|-------------|
| Audio Manager | AudioPlayEvent (IEnableableComponent) | AudioSource.PlayOneShot() |
| VFX Events | VFXTriggerEvent (IEnableableComponent) | VisualEffect.SendEvent() |
| Production UI | HP, Mana, Cooldown singletons | UI Toolkit data binding |
| Input Manager | InputState singleton | InputSystem.actions |

## Tier 3: Pure MonoBehaviour

**When**: No ECS data. Pure Unity managed systems.
**Why**: Adding ECS adds complexity with zero benefit.
**Pattern**: Standard MonoBehaviour. May snapshot ECS state for serialization.

| Signal | Example |
|--------|---------|
| No entity data | SceneManager.LoadSceneAsync |
| File I/O | Save/Load (JsonUtility, PlayerPrefs) |
| Platform services | Analytics, Ads, IAP |
| Configuration | Settings menu, quality presets |

### Future Tier 3 Candidates
| System | Why MonoBehaviour |
|--------|------------------|
| Save/Load | File I/O, JsonUtility — managed |
| Scene Transitions | SceneManager API — managed |
| Localization | LocalizedString — managed |
| Analytics | HTTP calls — managed |
| Settings | PlayerPrefs, UI — managed |

## Anti-Pattern: Over-DOTSification

**WRONG**: Building a full ISystem + Baker + singleton component pipeline for something that:
- Has 1 entity
- Runs 1x/frame
- Needs Time.timeScale or AudioSource.Play()
- Was already done better by an external package (Cinemachine)

**RIGHT**: Let ECS own the DATA (CameraTarget position, trauma level). Let MonoBehaviour own the BRIDGE (read data → call managed API).

**Lesson learned**: Camera system was 5 ECS systems + 8 components + 25 tests. Replaced by 3 MonoBehaviour bridges (~200 lines total) + Cinemachine. Less code, more features, better UX.

## Decision Checklist

Before creating a new system, answer:
1. How many entities? → <10 consider Tier 2/3
2. Does it need Burst? → No? Consider Tier 2/3
3. Does it call managed API? → Yes? Tier 2 bridge
4. Is there an external package that does this better? → Use it (Tier 2)
5. Does ECS add any value here? → No? Tier 3
