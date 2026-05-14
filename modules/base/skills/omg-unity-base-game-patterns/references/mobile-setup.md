---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Mobile Project Setup

## Project Hierarchy (Recommended)

```
Assets/
├── _Project/
│   ├── Art/
│   │   ├── Sprites/            # 2D sprites
│   │   ├── UI/                 # UI sprites (atlased per screen)
│   │   ├── Models/             # 3D models
│   │   ├── Materials/
│   │   ├── Shaders/
│   │   └── Animations/
│   ├── Audio/
│   │   ├── Music/              # Streaming, Vorbis 70%
│   │   ├── SFX/                # Decompress on load, ADPCM
│   │   └── UI/                 # Decompress on load, PCM
│   ├── Prefabs/
│   ├── Scenes/
│   │   ├── Bootstrap.unity     # Entry point, loads Persistent
│   │   ├── Persistent.unity    # Never unloaded (managers)
│   │   ├── MainMenu.unity
│   │   └── Gameplay.unity
│   ├── ScriptableObjects/
│   │   ├── Config/
│   │   ├── Database/
│   │   └── Events/
│   ├── Scripts/
│   │   ├── Core/
│   │   ├── DI/                 # VContainer installers
│   │   ├── Features/
│   │   ├── Models/
│   │   └── Services/
│   └── Settings/
│       ├── URP-Low.asset
│       ├── URP-Medium.asset
│       └── URP-High.asset
├── Plugins/
└── StreamingAssets/
```

## Scene Architecture

```
Bootstrap (index 0) → loads Persistent → loads MainMenu additively

Persistent (never unloaded):
  VContainerLifetimeScope, EventSystem, AudioListener
  Main Camera, CinemachineBrain
  MusicSource, SFXPoolParent
  Canvas_Persistent (FadePanel, LoadingScreen, Toast)

Gameplay (additive):
  VContainerLifetimeScope (child scope)
  Environment, SpawnPoints, Lighting
  Canvas_HUD (HealthBar, Score, Joystick)
  Canvas_Popups (Pause, GameOver, Settings)
```

## Canvas Configuration

```
Canvas Scaler:
  UI Scale Mode: Scale With Screen Size
  Reference Resolution: 1080x1920 (portrait) / 1920x1080 (landscape)
  Screen Match Mode: Match Width Or Height
  Match: 0.5 (balanced) or 1.0 (portrait, match height)
```

### Common Mobile UI Sizes (1080x1920 reference)
| Element | Size | Notes |
|---------|------|-------|
| Button (primary) | 300x80 | Min 48dp touch target |
| Button (icon) | 80x80 | With 20px padding |
| Header bar | 1080x100 | Full width |
| Bottom nav | 1080x150 | Full width, safe area |
| Font (body) | 28-32 | TMP SDF |
| Font (header) | 40-48 | TMP SDF |

## VContainer Root Setup

```csharp
public sealed class RootLifetimeScope : LifetimeScope
{
    [SerializeField] AudioMixer _audioMixer = null!;
    [SerializeField] GameConfig _gameConfig = null!;

    protected override void Configure(IContainerBuilder builder)
    {
        builder.RegisterEntryPoint<GameService>();
        builder.RegisterEntryPoint<AudioService>();
        builder.RegisterEntryPoint<SaveService>();
        builder.RegisterEntryPoint<InputService>();
        builder.RegisterEntryPoint<SceneService>();
        builder.RegisterInstance(_audioMixer);
        builder.RegisterInstance(_gameConfig);
        builder.RegisterSignalBus();
    }
}

public sealed class GameplayLifetimeScope : LifetimeScope
{
    protected override void Configure(IContainerBuilder builder)
    {
        builder.RegisterEntryPoint<SpawnService>();
        builder.RegisterEntryPoint<CombatService>();
        builder.Register<PoolService>(Lifetime.Singleton);
    }
}
```
