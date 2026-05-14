---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: audio
protected: false
---
# Unity Audio — Music Patterns & Sound Pooling

## Crossfade Pattern

```csharp
StartCoroutine(CrossfadeMusic(currentSource, nextSource, 1.5f));

IEnumerator CrossfadeMusic(AudioSource current, AudioSource next, float duration) {
    float elapsed = 0;
    while (elapsed < duration) {
        current.volume = Mathf.Lerp(1, 0, elapsed / duration);
        next.volume = Mathf.Lerp(0, 1, elapsed / duration);
        elapsed += Time.deltaTime;
        yield return null;
    }
    current.Stop();
    next.volume = 1;
}
```

## Dual Source / Layered Music

```csharp
// Dual source (smooth overlap without stop):
[SerializeField] AudioSource[] musicLayers = new AudioSource[2];

// Snapshot-based state (menu, combat, boss):
AudioMixerSnapshot[] stateSnapshots = new AudioMixerSnapshot[4];
stateSnapshots[(int)newState].TransitionToAtTime(1.0f);

// Layered music (drums/synth/guitar play independently):
// Separate AudioSource per layer → own mixer group → fade in/out by intensity
```

## Sound Pooling (Reuse Instances, Avoid GC)

```csharp
class SoundPool : MonoBehaviour {
    [SerializeField] AudioSource prefab;
    Queue<AudioSource> pool = new();

    public void Play(AudioClip clip, Vector3 pos, float volume = 1) {
        AudioSource source = pool.Count > 0 ? pool.Dequeue() :
                             Instantiate(prefab, transform);
        source.clip = clip;
        source.volume = volume;
        source.transform.position = pos;
        source.Play();
        StartCoroutine(ReturnToPoolWhen(source, clip.length));
    }

    IEnumerator ReturnToPoolWhen(AudioSource source, float delay) {
        yield return new WaitForSeconds(delay + 0.1f);
        source.Stop();
        pool.Enqueue(source);
    }
}
```

**Spatializer Pooling**: Pre-allocate HRTF/convolution instances to avoid frame drops.

## Performance Tips

- Pool short SFX (explosion, footstep, hit) — fewer allocations
- Limit simultaneous sources (e.g., max 32 SFX + 2 music)
- Compress clips (MP3/Vorbis, not WAV)
- Use streaming for music (>2 min clips)
- Disable unused AudioSources (disable component or GameObject)

## Common Gotchas

| Gotcha | Symptom | Fix |
|--------|---------|-----|
| Multiple Listeners | "exactly one listener" error | Audit scenes, ensure 1 per scene |
| Destroyed Source Playing | Memory leak, phantom sounds | Stop/pause before destroying |
| Wrong Mixer Group | Audio bypasses effects | Verify `outputAudioMixerGroup` |
| NaN Listener Position (WebGL) | Audio cuts out mid-game | Validate listener.transform.position is finite |
| Clip Not Compressed | High memory (WAV=100MB+) | Import as MP3/Vorbis |
| PlayOneShot on Stopped Source | Clip doesn't play | Ensure source not Stopped; use Play() |
| Doppler Pitch Extreme | Weird artifacts | Cap dopplerLevel to 1.0–1.5 |
| Streaming Clips in Cutscenes | Stutter/buffering | Pre-cache critical clips (non-streaming) |
