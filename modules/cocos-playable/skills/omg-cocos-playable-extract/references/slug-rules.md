---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Slug Rules

Slug derivation for output directory naming. SSOT implementation: `scripts/lib/cache-check.cjs` → `buildSlug(url)`.

## Format

```
{8-char-sha256-prefix}-{guessedName}
```

Examples:

| URL | Slug |
|---|---|
| `https://creative-ag-global.umcdn.cn/html/35/ba/cb/35bacb1193b3f0bbabcba1c962abd867.html` | `f552e78d-creativeagglobal` |
| `https://playable.ironsrc.mobi/games/merge-cars-v3.html` | `1a2b3c4d-merge-cars-v3` |
| `https://cdn.applovin.com/preview/match3-saga.html` | `9f8e7d6c-match3-saga` |

## guessedName algorithm

1. Take URL pathname, split on `/`, drop file extension
2. For each segment, split on `-` and `_`
3. Drop tokens:
   - Length < 3
   - Pure digits
   - Pure hex of length ≥ 16 (looks like a hash)
   - In `STOPWORD_TOKENS` (html, creative, ad, ads, preview, mraid, index, cdn, mintegral, ironsource, applovin, unity, vungle, global, asia, us, eu, umcdn, static)
4. Keep up to 3 tokens, join with `-`
5. **Fallback:** if no semantic tokens survive (Mintegral case where path is just `/html/{2hex}/{2hex}/{2hex}/{long-hex}.html`), use the hostname's first label, alphanumeric-cleaned.

## Why these rules

- 8-char hash makes the slug unique even when the same game is served from multiple URLs (e.g. A/B versions, regional CDNs)
- guessedName helps humans find the right folder when reviewing `plans/research/` — recognizing `merge-cars` is faster than recognizing `1a2b3c4d`
- Stopword filter avoids "creative-ag-html-mraid" — those are infra-noise, not game identity
- Hash-only fallback is acceptable but discouraged — directory listing becomes opaque

## Collision behavior

- **Same URL** → same slug → cache hit (`scripts/lib/cache-check.cjs` → `isCacheValid`). Skill skips fetch.
- **Different URL but same `guessedName`** → different hash prefix, so different folder.
- **Different URL, hash collision (first 8 chars)** — astronomically rare; if it happens, the second invocation will overwrite the first. Acceptable trade-off for human-readable slugs.

## When the user wants a custom slug

Currently unsupported. If needed in a future revision, add `--slug=<custom>` flag to the skill body — the slug becomes informational, the URL-hash check still gates cache validity.
