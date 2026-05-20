---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Composite Grouping — Active Composite Creation

## Core Principle

Group related nodes into a single `ObjectParameter<CompositeType>` for easier dashboard management. One composite = one logical UI element.

## When to Create Composites

| Pattern | Example | Composite? |
|---------|---------|------------|
| Parent with Sprite + child Label | Button with text | Yes — ButtonParameter |
| Container with multiple visual children | HP bar (bg + fill + text) | Yes — custom composite |
| View with bg + title + action button | Win screen | Yes — or use individual params grouped by Category |
| Single visual node | Standalone label | No — use base type directly |
| Already covered by existing type | Tutorial hand sprite | No — use SpriteParameter |

## Decision Rules

1. **2+ related visual nodes under same parent** → Consider composite
2. **Nodes that are always configured together** → Create composite
3. **Single node** → Use base parameter type (SpriteParameter, LabelParameter, etc.)
4. **Existing composite covers it** → Reuse (ButtonParameter, etc.)

## Composite File Location

Project-specific composites go in `scripts/parameter/config/CustomParameter.ts` (NOT in the submodule).
Config interfaces go in `scripts/parameter/config/ParameterConfig.ts`.

## Creating a New Composite

### Step 1: Define Config Interface (in ParameterConfig.ts)

```typescript
export interface HPBarUIConfig {
    mainColor?: string;
    indicatorColor?: string;
    backgroundColor?: string;
    position?: { x: number; y: number };
    scale?: { x: number; y: number };
}
```

### Step 2: Create Composite Class (in CustomParameter.ts)

```typescript
export class HPBarUIParameter {
    mainColor: ColorParameter;
    indicatorColor: ColorParameter;
    backgroundColor: ColorParameter;
    position?: CoordinatesParameter;
    scale?: CoordinatesParameter;

    constructor(config: HPBarUIConfig) {
        this.mainColor = new ColorParameter("Main Color", config.mainColor || "#00FF00");
        this.indicatorColor = new ColorParameter("Indicator Color", config.indicatorColor || "#FF0000");
        this.backgroundColor = new ColorParameter("BG Color", config.backgroundColor || "#333333");
        this.position = config.position && new CoordinatesParameter("Position", config.position, POS_RANGE, POS_RANGE);
        this.scale = config.scale && new CoordinatesParameter("Scale", config.scale, SCALE_RANGE, SCALE_RANGE);
    }
}
```

### Step 3: Use in PlayableConfig.ts

```typescript
HPBarPlayer: new ObjectParameter<HPBarUIParameter>("HP Bar Player", new HPBarUIParameter({
    mainColor: "#00FF00",     // actual scene value
    indicatorColor: "#FF0000",
    backgroundColor: "#333333",
    position: {x: -200, y: 400},
    scale: {x: 1, y: 1},
}), Categories.UI),
```

### Step 4: Wire in ParameterController.ts

```typescript
PlayableConfig.HPBarPlayerColor.onUpdate = (data: typeof PlayableConfig.HPBarPlayerColor) => {
    this.playerHPBar?.setBarColor(data.parameters.mainColor.default);
    this.playerHPBar?.setIndicatorColor(data.parameters.indicatorColor.default);
    this.playerHPBar?.setBackgroundColor(data.parameters.backgroundColor.default);
    if (data.parameters.position && this.playerHPBarNode) {
        applyUINodeParams(this.playerHPBarNode, data.parameters);
    }
};
```

## Grouping by Category (Alternative to Composites)

When nodes don't share a parent but relate logically, group via Category instead:

```typescript
WinBgOpacity: new RangeParameter(..., Categories.EndCard),
WinButton: new ObjectParameter<SpriteParameter>(..., Categories.EndCard),
WinButtonText: new ObjectParameter<LabelParameter>(..., Categories.EndCard),
```

Use composites for tightly coupled nodes (same parent). Use categories for loosely related params.

## Naming Composites

| Pattern | Name | Examples |
|---------|------|---------|
| Color set | `{Thing}ColorParameter` | `HPBarColorParameter` |
| UI group | `{Thing}UIParameter` | `BattleUIParameter` |
| Config group | `{Thing}Parameter` | `DamageParameter`, `EnvironmentParameter` |

## Anti-Patterns

- **WRONG:** Create composite for a single node (just use SpriteParameter/LabelParameter)
- **WRONG:** Nest ObjectParameter inside ObjectParameter (flatten fields)
- **WRONG:** Put project composites in `PlayableParamterTool/` submodule
- **WRONG:** Duplicate fields that already exist in base parameter types
- **WRONG:** Create composite when Category grouping suffices
