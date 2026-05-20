---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Field Coverage — Full Fields by Default

## Core Principle (v4)

**Every parameter gets ALL fields of its type by default.** Only exclude a field when you have specific code evidence that it's managed programmatically.

## Complete Field Tables

### SpriteParameter — ALL fields

| Field | Config Key | Type | Description |
|-------|-----------|------|-------------|
| enable | `enable` | BooleanParameter | Show/hide node |
| position | `position: {x, y}` | CoordinatesParameter | 2D position |
| contentSize | `contentSize: {x, y}` | CoordinatesParameter | Width/height |
| scale | `scale: {x, y}` | CoordinatesParameter | Scale factor |
| spriteFrame | `spriteFrame: ""` | ImageParameter | Image asset (empty = keep current) |
| color | `spriteColor: "#FFFFFF"` | ColorParameter | Tint color |

### LabelParameter — ALL fields

| Field | Config Key | Type | Description |
|-------|-----------|------|-------------|
| enable | `enable` | BooleanParameter | Show/hide |
| position | `position: {x, y}` | CoordinatesParameter | 2D position |
| contentSize | `contentSize: {x, y}` | CoordinatesParameter | Text box size |
| string | `string: "text"` | TextParameter | Display text |
| color | `labelColor: "#FFFFFF"` | ColorParameter | Text color |
| fontSize | `fontSize: 48` | NumberParameter | Font size |
| lineHeight | `lineHeight: 0` | NumberParameter | Line spacing |
| isBold | `isBold: false` | BooleanParameter | Bold style |
| isItalic | `isItalic: false` | BooleanParameter | Italic style |
| isUnderline | `isUnderline: false` | BooleanParameter | Underline |
| outlineColor | `outlineColor: "#000000"` | ColorParameter | Outline color |
| outlineWidth | `outlineWidth: 0` | NumberParameter | Outline thickness (0 = no outline) |
| shadowColor | `shadowColor: "#000000"` | ColorParameter | Shadow color |
| shadowOffset | `shadowOffset: {x: 2, y: 2}` | CoordinatesParameter | Shadow offset |

### ButtonParameter — ALL fields (extends SpriteParameter + label prefix)

ALL SpriteParameter fields PLUS:

| Field | Config Key | Type | Description |
|-------|-----------|------|-------------|
| labelString | `string: "Play"` | TextParameter | Button text |
| labelColor | `labelColor: "#FFFFFF"` | ColorParameter | Button text color |
| labelFontSize | `fontSize: 36` | NumberParameter | Button text size |
| labelLineHeight | `lineHeight: 0` | NumberParameter | Text line spacing |
| labelBold | `isBold: false` | BooleanParameter | Bold |
| labelOutlineColor | `outlineColor: "#000"` | ColorParameter | Text outline |
| labelOutlineWidth | `outlineWidth: 0` | NumberParameter | Outline width |

### CameraParameter — ALL fields

| Field | Config Key | Type | Description |
|-------|-----------|------|-------------|
| position | `position: {x, y, z}` | CoordinatesParameter | 3D position |
| rotation | `rotation: {x, y, z}` | CoordinatesParameter | 3D rotation |
| fov | `fov: 45` | NumberParameter | Field of view |

### UINodeParameter — ALL fields

| Field | Config Key | Type | Description |
|-------|-----------|------|-------------|
| enable | `enable` | BooleanParameter | Show/hide |
| position | `position: {x, y}` | CoordinatesParameter | 2D position |
| scale | `scale: {x, y}` | CoordinatesParameter | Scale |
| contentSize | `contentSize: {x, y}` | CoordinatesParameter | Size |

## When to Exclude Fields

**Only exclude when you have SPECIFIC evidence:**

| Evidence | Exclude | Keep |
|----------|---------|------|
| Timer countdown code updates `label.string` | `string` | ALL style fields |
| Score logic updates `label.string` | `string` | ALL style fields |
| Code swaps spriteFrame at runtime | `spriteFrame` | ALL other fields |
| Code sets color programmatically per-frame | `color` | ALL other fields |

**When in doubt, INCLUDE the field.** The dashboard user can choose not to change it.

## Reading Actual Scene Values (MANDATORY when MCP connected)

### Why

Generic defaults like `{x: 0, y: 0}` or `"#FFFFFF"` don't match what's in the scene. This forces the user to manually set every value. Instead, read the actual values.

### How to Read Values from MCP

After `manage_component get_all` for a node, parse the response to extract:

```javascript
// From cc.Label component properties:
const label = components.find(c => c.type === 'cc.Label');
const sceneValues = {
    string: label.properties._string?.value || label.properties.string?.value,
    fontSize: label.properties._fontSize?.value || label.properties.fontSize?.value,
    lineHeight: label.properties._lineHeight?.value,
    color: formatColor(label.properties._color?.value),
    isBold: label.properties._isBold?.value,
    isItalic: label.properties._isItalic?.value,
    isUnderline: label.properties._isUnderline?.value,
};

// From cc.Sprite component properties:
const sprite = components.find(c => c.type === 'cc.Sprite');
const spriteValues = {
    color: formatColor(sprite.properties._color?.value || sprite.properties.color?.value),
};

// From UITransform component:
const transform = components.find(c => c.type === 'cc.UITransform');
const layoutValues = {
    contentSize: {
        x: transform.properties._contentSize?.value?.width,
        y: transform.properties._contentSize?.value?.height,
    },
};
```

### Color Format Conversion

MCP returns colors as `{r: 255, g: 255, b: 255, a: 255}`. Convert to hex:

```javascript
function formatColor(rgba) {
    if (!rgba) return "#FFFFFF";
    const r = (rgba.r || 0).toString(16).padStart(2, '0');
    const g = (rgba.g || 0).toString(16).padStart(2, '0');
    const b = (rgba.b || 0).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
}
```

### Example: Complete Default Value Extraction

For a Label node at path `Canvas/GameView/SafeArea/TimerComponent/timeTxt`:

1. Call `manage_component get_all` with node UUID
2. Parse Label → fontSize: 40, color: {r:255,g:255,b:255,a:255}, string: "00:30"
3. Parse UITransform → contentSize: {width: 200, height: 60}
4. Read node position from hierarchy → {x: 0, y: 500}

Result in PlayableConfig:
```typescript
TimerLbl: new ObjectParameter<LabelParameter>("Timer Label", new LabelParameter({
    enable: true,
    position: {x: 0, y: 500},        // actual scene value
    contentSize: {x: 200, y: 60},     // actual scene value
    // string omitted — code-managed timer
    labelColor: "#FFFFFF",             // actual scene value
    fontSize: 40,                      // actual scene value
    outlineWidth: 0,
    outlineColor: "#000000",
}), Categories.GamePlayUI),
```

## Field Exclusion Documentation

When excluding a field, document WHY in the analysis report:

```markdown
| Name | Type | Excluded Fields | Reason |
|------|------|----------------|--------|
| TimerLbl | LabelParameter | string | Updated by GameplayTimerController countdown |
| ScoreLbl | LabelParameter | string | Updated by ScoreTracker |
| BulletSpr | SpriteParameter | spriteFrame | Swapped by BulletIndicator code |
```
