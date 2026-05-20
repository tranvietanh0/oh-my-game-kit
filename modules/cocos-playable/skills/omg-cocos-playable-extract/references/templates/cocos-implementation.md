---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Cocos Implementation Recipe — {{GAME_NAME}}

**Source:** {{SANITIZED_URL}}
**Analyzed:** {{ISO_DATE}}
**Slug:** `{{SLUG}}`
**Companion docs:** `./gameplay.md` (what the game is), `./code-structure.md` (how source was built)

## How to read this doc

This is a **rebuild recipe** for re-implementing the analyzed playable on Cocos Creator 3.8.x using the `oh-my-game-kit-cocos` `playable` module skills. It is NOT a port of the source — even when the source IS Cocos. The recipe maps observed gameplay to module skill invocations with concrete arguments.

Every section below MUST stay populated; mark `N/A — not applicable to this game` rather than deleting a section. The validator counts cited skills.

## 1. State machine ({{omg-cocos-playable-fsm}})

| State | Enter on | Exit on | Notes |
|---|---|---|---|
| `boot` | game start | assets ready | preload, decode base64 if inline |
| `loading` | `boot` exit | progress = 1.0 | optional progress bar |
| `tutorial` | `loading` exit (first run) | tutorial complete | finger / arrow hint per `omg-cocos-playable-tutorials` |
| `play` | tutorial complete | win / lose | main loop |
| `win` | `play` win condition | endcard show | optional juice + score reveal |
| `lose` | `play` lose condition | endcard show | optional retry CTA |
| `endcard` | `win` or `lose` | CTA click → `mraid.open` | fullscreen install panel |

**Skill invocation:**

```
Skill(skill="omg-cocos-playable-fsm", args="states=boot,loading,tutorial,play,win,lose,endcard transitions=...")
```

## 2. Signals ({{omg-cocos-playable-signalbus}})

Define one signal per inter-system event. Keep payloads minimal; never put view refs in payloads.

| Signal class | Payload | Emitted from | Subscribed by |
|---|---|---|---|
| `AssetsReadySignal` | (none) | `BootController` | `GameStateMachine` |
| `ScoreChangedSignal` | `{ value: number }` | `ScoreService` | `ScoreView` |
| `WinSignal` | `{ score: number, runtimeMs: number }` | `GameStateMachine` | `EndcardController`, analytics |
| `LoseSignal` | `{ reason: string }` | `GameStateMachine` | `EndcardController` |
| `CTAClickSignal` | (none) | `EndcardController` | `SDKBridge` |
| {{...add per game...}} | | | |

## 3. Lifecycle ({{omg-cocos-playable-lifecycle}})

Manager init order (each manager registers itself via `GameLifecycleManager`):

1. `ParameterService` — loads config from `parameter/` first; everything else reads from it
2. `SDKBridge` — listens for MRAID, ready signal
3. `SignalBus` — early so other managers can subscribe in `onLoad`
4. `AssetLoader` — preload via `cc.assetManager`
5. `ObjectPoolManager` — pre-warm pools listed in section 5
6. `AudioService` (if game has audio)
7. `GameStateMachine` — last; depends on everything above

## 4. Parameters ({{omg-cocos-playable-parameter}})

Variables observed in source; defaults are observed values (pre-filled by analyzer when readable).

| Param | Type | Default | Notes |
|---|---|---|---|
| `INITIAL_SPEED` | number | {{observed}} | applies to {{...}} |
| `MAX_LIVES` | number | {{observed}} | |
| `TUTORIAL_DURATION_MS` | number | {{observed}} | |
| `WIN_SCORE_TARGET` | number | {{observed}} | |
| {{...}} | | | |

## 5. Object pool ({{omg-cocos-playable-object-pool}})

Pre-warm pools at scene start sized for worst case:

| Prefab key | Worst-case count | Spawned by | Recycled by |
|---|---|---|---|
| `{{ObstaclePrefab}}` | {{N}} | `Spawner.spawnObstacle()` | on `OffscreenSignal` |
| `{{ParticleBurst}}` | {{N}} | `ScoreEffect.show()` | timer auto-recycle |
| {{...}} | | | |

If the game spawns no repeating entities, mark `N/A` and remove this skill from cited skills count.

## 6. UI layout ({{omg-cocos-playable-layout}})

- **Aspect target:** portrait 9:16 (default for most playables) or landscape 16:9 (chosen by source)
- **Safe areas:** notch handling on iOS, navbar on Android
- **Adaptive rules:** {{list per UI element — e.g. "score top-center, anchored to top safe area; CTA bottom-center, 80px above bottom safe area"}}

## 7. Animation & Feel ({{omg-cocos-playable-animation-presets}} + {{omg-cocos-playable-juice}})

Map source animations to preset names:

| Source moment | Preset | Trigger |
|---|---|---|
| Score increment | `pop-bounce` | every `ScoreChangedSignal` |
| Successful action | `confetti-burst` | win condition |
| Failed action | `screen-shake-sm` | lose condition |
| CTA appear | `slide-up-overshoot` | `endcard` state enter |
| {{...}} | | |

## 8. Tutorials ({{omg-cocos-playable-tutorials}})

Mark `N/A` if the source has no tutorial.

| Step | Hint type | Trigger | Dismiss on |
|---|---|---|---|
| 1 | finger-tap | scene enter | first tap anywhere |
| 2 | arrow-pointer | `Step1Complete` | target reached |
| {{...}} | | | |

## 9. SDK / CTA bridge ({{omg-cocos-playable-sdk-core}})

- **Ad-network host:** {{Mintegral | IronSource | AppLovin | Unity Ads | Meta | Vungle | unknown}} (from CDN hostname in `code-structure.md`)
- **Bridge entry point:** `mraid` (preferred) / `FbPlayableAd` / `playableSDK` / custom
- **Required calls at lifecycle moments:**
  - `boot` — register MRAID ready listener, call `getMRAIDEnv()` if Mintegral
  - `endcard` enter — call analytics event `engagement_complete`
  - CTA click — `mraid.open(STORE_URL)` (URL from `gameplay.md` "Target app")

## 10. Asset list

| Category | Name | Source equivalent | Est. size | Priority |
|---|---|---|---|---|
| sprite | `obstacle_01.png` | observed in source | {{N}} KB | high |
| sprite | `bg_sky.png` | observed | {{N}} KB | high |
| audio | `bgm.mp3` | observed | {{N}} KB | med |
| audio | `sfx_pop.mp3` | observed | {{N}} KB | med |
| font | `numeric.fnt` | observed | {{N}} KB | low |
| {{...}} | | | | |

## 11. Build size budget ({{omg-cocos-playable-build-size}})

- **Source total:** {{N}} KB
- **Target rebuild total:** {{N}} KB (typically aim for ≤ source × 1.1)
- **Per-category caps:**
  - Engine runtime (Cocos 3.8.x): ≤ 2.5 MB
  - Game scripts: ≤ {{N}} KB
  - Sprites/atlases: ≤ {{N}} KB
  - Audio: ≤ {{N}} KB

## 12. File scaffold

Suggested tree under `assets/scripts/{{ProjectName}}/`:

```
assets/scripts/{{ProjectName}}/
├── services/
│   ├── ParameterService.ts
│   ├── SDKBridge.ts
│   ├── AssetLoader.ts
│   ├── AudioService.ts
│   └── ScoreService.ts
├── parameter/
│   ├── GameConfig.ts          # constants tab from section 4
│   └── ParameterRegistry.ts
├── UI/
│   ├── EndcardController.ts
│   ├── ScoreView.ts
│   └── TutorialOverlay.ts
├── states/
│   ├── BootState.ts
│   ├── TutorialState.ts
│   ├── PlayState.ts
│   ├── WinState.ts
│   ├── LoseState.ts
│   └── EndcardState.ts
├── entities/
│   └── {{Obstacle.ts, Player.ts, etc.}}
├── Signal/
│   ├── signalBus.ts
│   ├── AssetsReadySignal.ts
│   ├── ScoreChangedSignal.ts
│   └── {{...}}
└── utils/
    └── (math/array helpers)
```

## 13. Open questions for product / design

List what the analyzer could NOT determine from source — these are real questions for the team before implementation kicks off:

- {{e.g. "Source has 3 obstacle prefabs. Do we keep 3 or expand to 6 for variety?"}}
- {{e.g. "No music in source — does our rebuild ship with music?"}}
- {{...}}

## Confidence + Caveats

**Overall confidence:** {{high | med | low}}

**Cited skills:** {{N}} (validator requires ≥ 5)

**Reason:** {{one sentence}}

**Verifiable claims:** {{bulleted list}}

**Inferred claims:** {{bulleted list}}

**Unverifiable:** {{anything you could not determine}}
