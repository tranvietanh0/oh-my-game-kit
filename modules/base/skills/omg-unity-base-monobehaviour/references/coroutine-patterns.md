---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Coroutine Patterns

```csharp
IEnumerator FadeOut(float duration) {
    float t = 0;
    while (t < duration) {
        t += Time.deltaTime;
        SetAlpha(1f - t / duration);
        yield return null;                    // Wait one frame
    }
}

// Yield options:
yield return null;                            // Next frame
yield return new WaitForSeconds(1f);          // Real time
yield return new WaitForSecondsRealtime(1f);  // Unscaled time
yield return new WaitForFixedUpdate();        // Next FixedUpdate
yield return new WaitForEndOfFrame();         // After rendering
yield return new WaitUntil(() => ready);      // Until condition true
yield return StartCoroutine(Other());         // Chain coroutines

// Start/Stop:
Coroutine c = StartCoroutine(FadeOut(1f));
StopCoroutine(c);
StopAllCoroutines();
```

**Gotcha**: Coroutines stop when GameObject is disabled or destroyed. Use `async/await` with `UniTask` for fire-and-forget operations that must survive across scene transitions or object deactivation.
