---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Gameplay — {{GAME_NAME}}

**Source:** {{SANITIZED_URL}}
**Analyzed:** {{ISO_DATE}}
**Slug:** `{{SLUG}}`
**Target app:** {{ANDROID_LINK}} | {{IOS_LINK}}

## Genre

{{GENRE}} — e.g. "endless runner", "merge-2", "match-3", "pipe-flow", "physics puzzle", "idle clicker". One line.

## Core loop

A single paragraph describing what the player does, in present tense, second person.

> Example: "You tap a sled at the top of a slope to make it descend, swiping left/right to dodge rocks. Each rock dodged adds 10 points; touching a rock ends the run and shows the install card."

## Session length

- **Target session:** {{SECONDS}}s (estimated from level/timer values or first-fail timing)
- **Forced end:** {{CONDITION}} (timer / lose state / completion flag)

## Win condition

- {{WIN_DESCRIPTION}}
- Triggered by: {{TRIGGER_PATTERN}} (e.g. `score >= 100`, `tile_count == 0`, `endcard_show()`)

## Lose / Fail condition

- {{LOSE_DESCRIPTION}}
- Triggered by: {{TRIGGER_PATTERN}}

## Tutorial / Onboarding

- {{HAS_TUTORIAL}} — yes/no/partial
- **Type:** {{FINGER_ARROW_VOICE_NONE}}
- **Sequence:** numbered steps if any (`tap here → drag this → release`)

## CTAs

| When | Visual | Action |
|---|---|---|
| {{trigger}} | {{button label/img}} | {{mraid call / external URL}} |

(e.g. "On lose: full-screen 'Play now!' button → `mraid.open(googlePlayLink)`")

## Monetization hooks

Bullet list of matched patterns from `references/monetization-hooks.md`:

- `mraid.open(...)` — {{count}} call sites
- `playableSDK.eventTrack(...)` — {{count}} call sites
- {{...}}

## Visual / Audio notes

- **Palette:** dominant colors observed in extracted PNGs (rough impression)
- **Music:** {{has-music}} — file name + duration if found
- **SFX:** count of audio assets in `raw/assets/audio/` and brief naming pattern

## Confidence + Caveats

**Overall confidence:** {{high | med | low}}

**Reason:** {{one sentence}}

**Verifiable claims:** bulleted list (concrete evidence — sprite X, function Y, asset Z)

**Inferred claims:** bulleted list (heuristic-driven; reader should verify)

**Unverifiable:** {{anything you could not determine}}
