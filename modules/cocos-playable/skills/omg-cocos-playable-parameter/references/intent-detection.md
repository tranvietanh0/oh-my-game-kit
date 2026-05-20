---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Intent Detection Logic

Detect user intent and route to appropriate workflow mode.

## Detection Algorithm

```
FUNCTION detectMode(input):
  # Priority 1: Explicit flags (override all)
  IF input contains "--quick": RETURN "quick"
  IF input contains "--standard": RETURN "standard"
  IF input contains "--deep": RETURN "deep"
  IF input contains "--exhaustive": RETURN "exhaustive"
  IF input contains "--auto": COMBINE with other mode (e.g., "standard+auto")

  # Priority 2: Path detection
  IF input matches *.prefab path:
    RETURN "targeted" (scan specific prefab only)

  # Priority 3: Natural language parameter detection
  keywords = lowercase(input)

  IF keywords contains ["timer", "countdown", "clock"]:
    RETURN {mode: "smart", type: "LabelParameter", category: "Timer"}
  IF keywords contains ["score", "points", "combo"]:
    RETURN {mode: "smart", type: "LabelParameter", category: "GamePlayUI"}
  IF keywords contains ["cta", "install", "download", "button"]:
    RETURN {mode: "smart", type: "ButtonParameter", category: "CTA"}
  IF keywords contains ["logo", "icon", "brand"]:
    RETURN {mode: "smart", type: "SpriteParameter", category: "Logo"}
  IF keywords contains ["hand", "finger", "tutorial"]:
    RETURN {mode: "smart", type: "TutorialHandParameter", category: "Tutorial"}
  IF keywords contains ["hint", "instruction", "text"]:
    RETURN {mode: "smart", type: "RichTextParameter", category: "Tutorial"}
  IF keywords contains ["win", "victory", "success"]:
    RETURN {mode: "smart", type: "EndCardParameter", category: "EndCardWin"}
  IF keywords contains ["lose", "fail", "retry"]:
    RETURN {mode: "smart", type: "EndCardParameter", category: "EndCardLose"}
  IF keywords contains ["loading", "progress"]:
    RETURN {mode: "smart", type: "LoadingScreenParameter", category: "Loading"}

  # Priority 4: Quick verification keywords
  IF keywords contains ["verify", "check", "status"]:
    RETURN "quick"

  # Default: standard discovery
  RETURN "standard"
```

## Mode Combinations

| Base Mode | With --auto | Behavior |
|-----------|-------------|----------|
| quick | quick+auto | Verify only, no review gates |
| standard | standard+auto | Full discovery, no review gates |
| deep | deep+auto | All prefabs recursive, no review gates |
| exhaustive | exhaustive+auto | Full scan + component analysis, no review gates (low-confidence items flagged in report) |
| targeted | targeted+auto | Single prefab, no review gates |
| smart | smart+auto | NL-detected param, no review gates |

## Component Type Detection

From node structure in prefab JSON:

| Pattern | Detected Type | Depth |
|---------|---------------|-------|
| `cc.Camera` component | CameraParameter | standard+ |
| `cc.Sprite` + child `cc.Label` | ButtonParameter | standard+ |
| `cc.Sprite` only | SpriteParameter | standard+ |
| `cc.Label` only | LabelParameter | standard+ |
| Script: `LoadingView` | LoadingScreenParameter | standard+ |
| Script: `WinView`/`LoseView` | EndCardParameter | standard+ |
| Node name `Hand*` + Sprite | TutorialHandParameter | standard+ |
| Node name `Tut*` + Label | RichTextParameter | standard+ |
| `cc.ProgressBar` component | ProgressBarParameter | deep+ |
| `cc.UIOpacity` component | opacity field on parent param | deep+ |
| `cc.Slider` component | RangeParameter candidate | deep+ |
| `cc.Toggle` component | BooleanParameter candidate | deep+ |
| `cc.RichText` component | RichTextParameter | deep+ |
| Sprite + ProgressBar on same node/parent | NEW composite candidate | deep+ |
| Label + ProgressBar on same node/parent | NEW composite candidate | deep+ |
| Multiple Labels under same parent | NEW composite candidate (if related) | deep+ |
| Hardcoded hex color in script | ColorParameter (expansion) | exhaustive |
| Editor-only `@property` with tuning value | RangeParameter/NumberParameter (expansion) | exhaustive |

## Category Assignment

From node hierarchy context:

| Context Pattern | Category |
|-----------------|----------|
| Parent: LoadingView | Loading |
| Parent: WinView | EndCardWin |
| Parent: LoseView | EndCardLose |
| Name contains "CTA" | CTA |
| Name contains "Logo" | Logo |
| Name contains "Timer" | Timer |
| Name contains "Score" | GamePlayUI |
| Name contains "Hand" | Tutorial |
| Name contains "Hint" | Tutorial |

## Examples

```
"omg-cocos:playable:parameter"
-> Mode: standard (default)

"omg-cocos:playable:parameter --quick"
-> Mode: quick (verify only)

"omg-cocos:playable:parameter --deep --auto"
-> Mode: deep+auto (recursive, no review gates)

"omg-cocos:playable:parameter WinView.prefab"
-> Mode: targeted (scan WinView.prefab only)

"omg-cocos:playable:parameter add a timer label"
-> Mode: smart, Type: LabelParameter, Category: Timer

"omg-cocos:playable:parameter add score display"
-> Mode: smart, Type: LabelParameter, Category: GamePlayUI

"omg-cocos:playable:parameter verify all params are assigned"
-> Mode: quick (keyword "verify")
```

## Priority Resolution

When multiple signals detected:
1. Explicit flags (`--quick`, `--standard`, `--deep`)
2. `--auto` modifier (combines with base mode)
3. Path detection (.prefab files)
4. Natural language keywords
5. Default (standard)
