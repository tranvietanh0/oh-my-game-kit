---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Animation Preset Catalog

## General Category

| Preset | Enum Value | Description |
|--------|-----------|-------------|
| None | `NONE` | No animation (passthrough) |
| Fade In | `FADE_IN` | UIOpacity 0 → 255 |
| Fade Out | `FADE_OUT` | UIOpacity 255 → 0 |
| Scale In | `SCALE_IN` | Scale 0 → 1 with backOut overshoot |
| Scale Out | `SCALE_OUT` | Scale 1 → 0 |
| Bounce | `BOUNCE` | Jump up and bounce down |
| Bounce In | `BOUNCE_IN` | Scale 0 → 1 with elastic bounce (end card entrance) |
| Pulse | `PULSE` | Continuous scale 1 → 1.1 → 1 loop |
| Slide Up | `SLIDE_UP` | Translate from below canvas into position |
| Slide Down | `SLIDE_DOWN` | Translate from above canvas into position |

## Tutorial Category

| Preset | Enum Value | Description |
|--------|-----------|-------------|
| Tap | `TAP` | Scale punch down + up (finger tap gesture) |
| Hold | `HOLD` | Slow scale-down held, then release |
| Swipe Left | `SWIPE_LEFT` | Translate left with fade out |
| Swipe Right | `SWIPE_RIGHT` | Translate right with fade out |
| Swipe Up | `SWIPE_UP` | Translate up with fade out |
| Swipe Down | `SWIPE_DOWN` | Translate down with fade out |
| Drag | `DRAG` | Looping translate from source to dest |

## Rich Text Category

| Preset | Enum Value | Description |
|--------|-----------|-------------|
| Typewriter | `TYPEWRITER` | Reveals label characters one-by-one |

## End Card Category

| Preset | Enum Value | Description |
|--------|-----------|-------------|
| Bounce In | `BOUNCE_IN` | Used for end card title/button entrance |
| Slide Up | `SLIDE_UP` | Used for end card subtitle entrance |

## JuiceKit Mapping

| Preset | JuiceKit Method |
|--------|----------------|
| `FADE_IN` | `JuiceKit.fadeIn` |
| `FADE_OUT` | `JuiceKit.fadeOut` |
| `SCALE_IN` | `JuiceKit.popIn` |
| `SCALE_OUT` | `JuiceKit.popOut` |
| `BOUNCE` | `JuiceKit.bounce` |
| `BOUNCE_IN` | `JuiceKit.popIn` (with elastic) |
| `PULSE` | `JuiceKit.scalePunch` (looping) |
| `TAP` | `JuiceKit.scalePunch` |

Non-JuiceKit presets (`SLIDE_UP/DOWN`, `SWIPE_*`, `DRAG`, `TYPEWRITER`) use raw Cocos `tween()` directly.
