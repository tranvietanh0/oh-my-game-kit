---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: audio
protected: false
---
# Unity Audio API Reference

## AudioSource Component

**Core Methods**:
```csharp
audioSource.Play();              // Start playback
audioSource.Stop();              // Stop immediately
audioSource.Pause();             // Pause/resume with Play()
audioSource.PlayOneShot(clip);   // Play single clip without stopping current
AudioSource.PlayClipAtPoint(clip, position); // 3D static position playback
```

**Essential Properties**:
- `volume` (0–1) — Linear volume control
- `pitch` (0.5–2) — Playback speed/frequency shift
- `loop` — Repeats indefinitely if true
- `time` — Seek position in seconds (read/write)
- `spatialBlend` (0–1) — 0=2D panning, 1=full 3D spatial
- `outputAudioMixerGroup` — Route to mixer for post-processing

**Spatial Settings**:
- `minDistance` (default 1m) — Closest point for attenuation
- `maxDistance` (default 500m) — Sound stops decreasing past this
- `rolloffMode` — `Logarithmic` (large/long range), `Linear` (precise), `Custom` (curve)
- `dopplerLevel` — Pitch shift from relative velocity (0=none)
- `spread` (0–360°) — Spatial distribution; keep ≤45° for ambient

## AudioListener

**Critical Rule**: Exactly one listener per scene (usually on main camera).

```csharp
AudioListener.volume = 0.8f;      // Master volume (0–1)
AudioListener.pause = true;       // Pause all audio
listener.velocityUpdateMode = AudioVelocityUpdateMode.Dynamic;

// Spectrum analysis (visualizers, rhythm detection):
float[] spectrum = new float[256];
AudioListener.GetSpectrumData(spectrum, 0, FFTWindow.Blackman);
```

## AudioMixer & Groups

```csharp
// Route source to group:
audioSource.outputAudioMixerGroup = sfxGroup;

// Exposed parameters (dB scale: -80 to 0):
mixer.SetFloat("SFXVolume", -10f);
mixer.SetFloat("MusicVolume", 0f);

// Snapshots (capture state, smooth transition):
paused.TransitionToAtTime(0.5f);  // 0.5s blend
```

**Ducking**: Add `Attenuation` effect to quiet group, link to loud group parameter.
**Effects**: Reverb, distortion, echo, parametric EQ, chorus, compressor.

## AudioClip Loading

```csharp
// Inspector assignment:
[SerializeField] AudioClip clip;
audioSource.clip = clip; audioSource.Play();

// Runtime (Resources):
AudioClip clip = Resources.Load<AudioClip>("Sounds/explosion");

// Addressables (scalable):
var handle = Addressables.LoadAssetAsync<AudioClip>("SFX/footstep");
AudioClip clip = await handle.Task;

// Streaming (large files/music):
// Set Compression Format = Streaming (VAD) in AudioClip importer
// Reduces memory, increases CPU — use for music/long dialogue
```

## Doppler Effect

```csharp
audioSource.dopplerLevel = 1.0f; // 1=realistic, 0=disabled
// Frequency shifts as source moves toward/away (velocity-based)
```
