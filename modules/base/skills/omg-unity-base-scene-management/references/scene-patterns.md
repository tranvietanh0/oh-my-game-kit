---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Unity Scene Management — Code Patterns

## Basic Loading

```csharp
using UnityEngine.SceneManagement;

// By name (must be in Build Settings):
SceneManager.LoadScene("GameLevel");

// By build index:
SceneManager.LoadScene(1);

// Additive (keeps current scene):
SceneManager.LoadScene("UI_Overlay", LoadSceneMode.Additive);
```

## Async Loading with Progress

```csharp
IEnumerator LoadSceneWithProgress(string sceneName) {
    AsyncOperation op = SceneManager.LoadSceneAsync(sceneName);
    op.allowSceneActivation = false;  // Don't switch until ready

    while (op.progress < 0.9f) {     // 0.9 = loaded, waiting for activation
        loadingBar.fillAmount = Mathf.Clamp01(op.progress / 0.9f);
        yield return null;
    }

    loadingBar.fillAmount = 1f;
    yield return new WaitForSeconds(0.5f);  // Brief UX pause
    op.allowSceneActivation = true;
}
```

## Additive Scene Patterns

```csharp
// Load additive:
var op = SceneManager.LoadSceneAsync("EnemyWave_03", LoadSceneMode.Additive);
op.completed += _ => {
    SceneManager.SetActiveScene(SceneManager.GetSceneByName("EnemyWave_03"));
};

// Unload:
SceneManager.UnloadSceneAsync("EnemyWave_03");
```

Use additive for: UI layers, audio, lighting, gameplay zones.

## Scene Event Callbacks

```csharp
void OnEnable() {
    SceneManager.sceneLoaded += OnSceneLoaded;
    SceneManager.sceneUnloaded += OnSceneUnloaded;
    SceneManager.activeSceneChanged += OnActiveSceneChanged;
}

void OnDisable() {
    SceneManager.sceneLoaded -= OnSceneLoaded;
    SceneManager.sceneUnloaded -= OnSceneUnloaded;
    SceneManager.activeSceneChanged -= OnActiveSceneChanged;
}

void OnSceneLoaded(Scene scene, LoadSceneMode mode) {
    Debug.Log($"Loaded: {scene.name} ({mode})");
}
```

## DontDestroyOnLoad Pattern

```csharp
public class AudioManager : MonoBehaviour {
    public static AudioManager Instance { get; private set; }
    void Awake() {
        if (Instance != null) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }
}
```

**Alternative**: Use additive "Persistent" scene loaded once at boot, never unloaded.

## Bootstrap Architecture

```
Scenes/
├── Bootstrap.unity        ← Entry point (Build Index 0)
├── MainMenu.unity
├── Gameplay.unity
├── Persistent.unity       ← Additive, never unloaded (managers)
└── UI_Overlay.unity       ← Additive UI layer
```

```csharp
public class Bootstrap : MonoBehaviour {
    async void Start() {
        await SceneManager.LoadSceneAsync("Persistent", LoadSceneMode.Additive);
        await SceneManager.LoadSceneAsync("MainMenu", LoadSceneMode.Additive);
        SceneManager.UnloadSceneAsync("Bootstrap");
    }
}
```

## Scene Transition with Fade

```csharp
public class SceneTransition : MonoBehaviour {
    [SerializeField] CanvasGroup fadePanel;

    public IEnumerator TransitionTo(string scene) {
        yield return Fade(0f, 1f, 0.5f);

        var op = SceneManager.LoadSceneAsync(scene);
        op.allowSceneActivation = false;
        while (op.progress < 0.9f) yield return null;
        op.allowSceneActivation = true;

        yield return null; // Wait one frame for scene activation
        yield return Fade(1f, 0f, 0.5f);
    }

    IEnumerator Fade(float from, float to, float duration) {
        float t = 0;
        while (t < duration) {
            t += Time.unscaledDeltaTime;
            fadePanel.alpha = Mathf.Lerp(from, to, t / duration);
            yield return null;
        }
        fadePanel.alpha = to;
    }
}
```

## Common Gotchas

1. **Scene not in Build Settings**: `LoadScene` fails silently — add all scenes via File → Build Settings
2. **progress caps at 0.9**: When `allowSceneActivation=false`, progress stops at 0.9 (loaded, not activated)
3. **Static references survive**: Static variables persist across scene loads — reset manually
4. **Additive scene lighting**: Each scene bakes its own lightmaps — use one dedicated lighting scene
5. **Object.FindObjectOfType across scenes**: Searches ALL loaded scenes — be explicit with scene roots
6. **Async await**: Use `AsyncOperation` with `await` (Unity 6 supports it natively)
