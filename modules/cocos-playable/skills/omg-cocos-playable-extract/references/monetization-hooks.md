---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Monetization Hooks Catalog

Regex patterns the analyzer uses to identify CTA, install button, store-redirect, and engagement-tracking calls inside playable-ad JS. Used in `gameplay.md` "Monetization hooks" section.

## CTA / Install patterns

| Regex | Meaning | Ad-network |
|---|---|---|
| `mraid\.open\(` | MRAID v2/v3 open-URL (install click) | IronSource / AppLovin / Mintegral / Unity Ads |
| `window\.mraid\.` | any MRAID host bridge | Generic MRAID |
| `getMRAIDEnv\(` | MRAID env probe | Mintegral |
| `playableSDK\.` | Mintegral SDK glue | Mintegral |
| `FbPlayableAd\.onCTAClick` | Meta Audience Network CTA | Meta |
| `gameReady\(\)` | Meta Audience Network ready signal | Meta |
| `goToStore\(` | generic redirect helper | Custom |
| `openStore\(` | generic redirect helper | Custom |
| `Android\.openApp\(` | Unity Ads Android bridge | Unity Ads |
| `webkit\.messageHandlers\.openStore` | Unity Ads iOS bridge | Unity Ads |
| `parent\.postMessage\(['"](?:cta|install)` | IFrame redirect (IronSource) | IronSource |
| `window\.openExternal` | Vungle bridge | Vungle |
| `vungleRedirect\(` | Vungle redirect | Vungle |

## End card patterns

| Regex | Meaning |
|---|---|
| `showEndCard\(` | explicit endcard call |
| `endCardShow\(` | endcard show |
| `endcard\.show\(` | endcard service |
| `isEndCardShown` | endcard state |
| `state\s*=\s*['"]endcard['"]` | FSM state |

## Tracking / analytics

| Regex | Meaning |
|---|---|
| `mraid\.useCustomClose` | MRAID custom-close |
| `event\(['"](?:level_complete|level_fail|cta_click|tutorial_step)` | engagement event |
| `track\(['"](?:engagement|click|impression)` | analytics call |
| `playableSDK\.eventTrack\(` | Mintegral analytics |

## Store URL extraction

| Regex | Meaning |
|---|---|
| `https://play\.google\.com/store/apps/details\?id=([a-z0-9_.]+)` | Google Play link |
| `https://apps\.apple\.com/[a-z]{2}/app/[^/"']+/id(\d+)` | App Store link |

Extract both URLs and put them in `gameplay.md` "Target app" section. These are the most reliable signal of what the game IS (sometimes the only signal when the bundle is heavily obfuscated).

## Empirical notes

- The Mintegral sample (Sled Surfers) had its store links in `inline-1.js` as a tiny JSON config — always check inline-script 0/1 before the main bundle.
- `window.network` value is not reliable for ad-network identification (creative reuse across networks).
- MRAID is the most common bridge; if you see no MRAID hooks at all in a bundle that's served from a major ad network, suspect that the bridge is loaded dynamically via `mraid.js` (the 404 in our smoke test was this — MRAID is injected by the host at runtime).
