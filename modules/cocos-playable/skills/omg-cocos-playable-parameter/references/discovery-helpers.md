---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Discovery Helpers — Context, Comparison, Data Params, Scene JSON

## Context Extraction

### Semantic Purpose Keywords

| Purpose | Keywords |
|---------|----------|
| score | score, point, pts |
| timer | timer, time, clock, countdown |
| combo | combo, multiplier, streak |
| tutorial | tut, hint, help, guide |
| hand | hand, finger, pointer, tap |
| cta | cta, install, download, play |
| logo | logo, icon, brand |
| background | bg, background, backdrop |
| loading | loading, progress, load |
| win | win, victory, success |
| lose | lose, fail, retry |

### Context-to-Category Matrix

| Context Pattern | Category | Type |
|-----------------|----------|------|
| Parent: LoadingView | Loading | LoadingScreenParameter |
| Parent: WinView/LoseView | EndCard Win/Lose | EndCardParameter |
| Name: "CTA*", "Button*" | CTA | ButtonParameter |
| Name: "Logo*", "Icon*" | Logo | SpriteParameter |
| Name: "Hand*", "Finger*" | Tutorial | TutorialHandParameter |
| Name: "Tut*", "Hint*" + Label | Tutorial | RichTextParameter |
| Name: "Score*", "Point*" | GamePlayUI | LabelParameter |
| Name: "Timer*", "Clock*" | Timer | LabelParameter |

When context is unclear, ASK the user.

## Comparison Workflow

After scanning, ALWAYS compare against existing `PlayableConfig.ts`:

| Status | Condition | Action |
|--------|-----------|--------|
| COVERED | Exact match in PlayableConfig | Skip |
| PARTIAL | Similar exists, missing fields | Update |
| NEW | No matching param | Add |
| INTERNAL | Debug/wiring property | Skip |

Output includes `uuid` and `nodeId` for MCP assignment — pass directly to Step 4.

## Data Parameter Discovery

**Use the scanner — do NOT do this manually.** See
`project-config-discovery.md` for the full process. Quick reference:

```bash
node .agents/skillsomg-cocos-playable-parameter/scripts/scan-project-configs.cjs <project-root> --json
```

Scanner classifies each constant into:

| Value Type | Parameter Type | Example |
|-----------|----------------|---------|
| `number` (0..10 bounded) | `RangeParameter` | `DEFAULT_PADDING_FACTOR: 2` |
| `number` (out of range) | `NumberParameter` | `MAX_LIVES: 100` |
| `boolean` | `BooleanParameter` | `useGlobalInput: true` |
| `string` (color hex) | `ColorParameter` | `SLOT_DEFAULT: '#2b3747'` |
| `string` (other) | `TextParameter` | `LEVEL_NAME: 'L1'` |

**Auto-skipped by scanner:** `STORE_LINK`, `AUDIO_NAME`, `EFFECT_NAME`,
private fields (`_*`), `PIVOT_NODE_NAME`. Also skips `PlayableConfig.ts`
itself and its plumbing files.

**Wiring rule:** Scene nodes use `@property` refs. Runtime singletons use direct access.

```typescript
// CORRECT: @property ref for scene node
@property(WinView) winView: WinView = null;
PlayableConfig.FullScreenCTA.onUpdate = (data) => { if (this.winView) this.winView.fullScreenCTA = data.default; };

// WRONG: Singleton may not exist yet
PlayableConfig.FullScreenCTA.onUpdate = (data) => { WinView.instance.fullScreenCTA = data.default; };
```

## Scene JSON Property Resolution

When parsing `.scene` JSON, `null` properties do NOT always mean unassigned.

Cocos uses a layered resolution:
1. **Base component data** — shows `null` initially
2. **`cc.TargetOverrideInfo` entries** — apply actual references at load time

### Verification Before Reporting Unassigned

1. Find component by `__type__` hash
2. Note properties showing `null`
3. Search for `cc.TargetOverrideInfo` with matching `source.__id__` + `propertyPath`
4. Only report unassigned if NO override entry found

```json
// Step 1: Component (shows null)
{ "__type__": "6c3baoxxThE...", "ctaButton": null }

// Step 2: Override (means it IS assigned)
{ "__type__": "cc.TargetOverrideInfo", "source": {"__id__": 134}, "propertyPath": ["ctaButton"], "target": {"__id__": 26} }
```

## Discovery Anti-Patterns

- Don't parameterize layout containers (Canvas, SafeArea) or manager/controller nodes
- Don't create parameters for static, unchanging elements or debug/test flags
- Don't duplicate existing parameters or parameterize inactive nodes
- Don't use singleton access for scene nodes in onUpdate — use @property refs
- Don't report properties as null without checking TargetOverrideInfo entries
