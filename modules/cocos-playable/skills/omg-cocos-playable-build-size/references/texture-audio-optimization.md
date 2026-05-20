---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Texture & Audio Optimization Guide

## Texture Compression

### Builder Config (`settings/v2/packages/builder.json`)

#### Mipmaps — MUST Disable

```json
"genMipmaps": false
```

Mipmaps generate 1/2, 1/4, 1/8... resolution copies. Adds ~33% to texture memory. Only useful for 3D scenes with depth variation. Playable ads are 2D — never need mipmaps.

#### Compression Preset — Recommended Settings

```json
"textureCompressConfig": {
  "userPreset": {
    "<preset-uuid>": {
      "name": "Sprites Compress Config",
      "options": {
        "web": {
          "png": { "quality": 80 },
          "webp": { "quality": 80 }
        },
        "ios": {
          "png": { "quality": 80 },
          "webp": { "quality": 80 }
        },
        "android": {
          "png": { "quality": 80 },
          "webp": { "quality": 80 }
        }
      }
    }
  }
}
```

#### Quality Guidelines

| Asset Type | PNG Quality | WebP Quality | Notes |
|------------|-------------|--------------|-------|
| UI sprites (flat) | 60–70 | 60–70 | Flat colors compress well at low quality |
| Character art | 80–90 | 75–85 | Visual quality matters |
| VFX textures | 70–80 | 70–80 | Additive blend hides compression |
| Backgrounds | 75–85 | 70–80 | Large area, quality visible |
| Icons (< 64px) | 50–60 | 50–60 | Too small to see artifacts |

**WARNING:** Quality `10` (current default) causes extreme visible artifacts on anything larger than tiny icons. Raise to at least 70.

### Per-Texture Meta Files

Each texture has a `.meta` file. Compression is applied via `compressSettings`:

```json
{
  "subMetas": {
    "<uuid>": {
      "userData": {
        "compressSettings": {
          "useCompressTexture": true,
          "presetId": "<preset-uuid-from-builder-json>"
        }
      }
    }
  }
}
```

#### How to Check Coverage

```bash
# Count textures WITH compression
grep -rl "compressSettings" --include="*.meta" assets/ | wc -l

# Count ALL texture metas (png, jpg, webp)
find assets/ -name "*.png.meta" -o -name "*.jpg.meta" -o -name "*.webp.meta" | wc -l

# Find textures WITHOUT compression
find assets/ \( -name "*.png.meta" -o -name "*.jpg.meta" \) -exec grep -L "compressSettings" {} \;
```

#### Applying Compression in Cocos Editor

1. Select texture(s) in Assets panel
2. Inspector → Compress Texture → check "Use Compress Texture"
3. Select preset ("Sprites Compress Config")
4. Click Apply

For bulk: Select folder → right-click → "Compress Textures" (applies to all textures in folder).

### WebP Format

WebP provides 25–35% better compression than PNG at equivalent quality. Cocos Creator 3.x supports WebP for web builds natively. Add `"webp"` alongside `"png"` in the compression preset.

**Browser support:** WebP is supported in all modern browsers (Chrome 32+, Firefox 65+, Safari 14+). All ad network webviews from 2020+ support it.

### Texture Atlas (Auto Atlas)

`packAutoAtlas: true` in cfgTemplate.json — Cocos automatically packs sprites into texture atlases at build time. This reduces draw calls and can improve texture compression efficiency.

For manual control, create SpriteAtlas assets in Cocos Editor.

## Audio Optimization

### Target Specifications for Playable Ads

| Type | Format | Bitrate | Channels | Sample Rate |
|------|--------|---------|----------|-------------|
| BGM | MP3 | 96–128 kbps | Mono | 44100 Hz |
| SFX (short) | MP3/OGG | 64–96 kbps | Mono | 22050–44100 Hz |
| UI sounds | MP3/OGG | 48–64 kbps | Mono | 22050 Hz |

### Using the optimize-size Tool

```bash
cd CocosPlayableAdsTemplate/tools/optimize-size
npm install  # first time only
npm start    # opens http://localhost:3456
```

Features:
- Browse all audio files by size
- Compress per-file or in bulk
- Adjust bitrate, channels, sample rate
- Preview before/after

### FFmpeg Manual Compression

```bash
# BGM: 96 kbps mono MP3
ffmpeg -i BGM.mp3 -b:a 96k -ac 1 BGM_optimized.mp3

# SFX: 64 kbps mono, lower sample rate
ffmpeg -i shoot.mp3 -b:a 64k -ac 1 -ar 22050 shoot_optimized.mp3

# Convert to OGG (often smaller than MP3 for short clips)
ffmpeg -i Win.mp3 -c:a libvorbis -b:a 64k -ac 1 Win.ogg
```

### Audio Duration Budget

For a 2 MB total build (Meta/TikTok), audio budget is typically 50–100 KB:
- BGM: 3–5 seconds loop, 96 kbps mono ≈ 36–60 KB
- SFX: 0.5–2 seconds each, 64 kbps mono ≈ 4–16 KB each
- Total 3–4 SFX + 1 BGM ≈ 60–120 KB

For a 5 MB build (Google/Unity/IronSource), audio budget is more flexible: 200–400 KB.
