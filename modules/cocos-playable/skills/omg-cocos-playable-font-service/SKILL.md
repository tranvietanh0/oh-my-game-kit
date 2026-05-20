---
name: omg-cocos-playable-font-service
description: "FontService singleton for global and per-label font management in Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# FontService — Global & Per-Label Font Management

Static singleton at `PLAGameFoundation/ui/utils/FontService.ts`. Manages system fonts and custom TTF fonts loaded from `resources/font/`. See also: `omg-cocos-playable-parameter` (LabelParameter uses `applyFont`), `omg-cocos-playable-gameflow` (LoadingView, WinView).

Import: `db://assets/PLAGameFoundation/ui/utils/FontService`

## Architecture

```
FontService (static class)
├── _globalFont: string          — current global font value
├── _isCustomFont: boolean       — true when name is in CUSTOM_FONTS list
└── _customFontAsset: Font       — cached loaded Font asset

Custom font detection: CUSTOM_FONTS = ['Baloo Regular', 'Lilita One']
Font files live at: resources/font/{FontNameNoSpaces}.ttf (or .fnt)
```

**Two modes:**
- **System font** — `label.useSystemFont = true; label.fontFamily = name` (e.g., "Arial")
- **Custom font** — loads from `resources/font/`, sets `label.font = asset` with `useSystemFont = false`

## Key APIs

### Global font (applies to all scene labels)

```typescript
// Set globally — triggers applyToAllLabels() on completion
FontService.setGlobalFont("Arial, sans-serif");  // system font
FontService.setGlobalFont("Baloo Regular");       // custom — async loads from resources

// Read current value
const font = FontService.globalFont;

// Re-apply to all labels (if new labels spawned after setGlobalFont)
FontService.applyToAllLabels();
```

### Per-label application

```typescript
// Sync — uses already-loaded global font state
FontService.applyFontToLabel(label: Label): void

// Async — loads custom font if needed; handles both system and custom
await FontService.applyFont(label: Label, fontValue: string): Promise<void>
```

## Workflow: Integration Patterns

**With LabelParameter `onUpdate`:**
```typescript
// In ParameterController.SetUpOnUpdate()
labelParam.onUpdate = async (value) => {
    await FontService.applyFont(this.myLabel, value);
};
```

**Global font from parameter (e.g., font family selector):**
```typescript
fontFamilyParam.onUpdate = (value) => {
    FontService.setGlobalFont(value);
};
```

**Apply global font to a newly spawned label:**
```typescript
// After instantiating a prefab with labels
FontService.applyToAllLabels();  // or per-label for performance
FontService.applyFontToLabel(newLabel);
```

**Adding a new custom font:**
1. Place font file at `resources/font/BaloRegular.ttf` (name without spaces)
2. Add the display name to the `CUSTOM_FONTS` array in `FontService.ts`:
   ```typescript
   const CUSTOM_FONTS = ['Baloo Regular', 'Lilita One', 'My New Font'];
   ```
3. Call `FontService.setGlobalFont("My New Font")` — it strips spaces when loading path

## Common Mistakes

- Calling `applyFontToLabel` after the label's node is destroyed — `applyFont` guards with `label.isValid` check, `applyFontToLabel` does not. Check `label.isValid` before calling.
- Expecting `setGlobalFont` for a custom font to be synchronous — it's async (loads from resources). Labels created after the call but before load completes will not have the font applied. Call `applyToAllLabels()` after `await` completes if needed.
- Font file name must have no spaces: `"Baloo Regular"` → loads `font/BalooBRegular` (strips spaces). Match exactly.
- System font `fontFamily` accepts CSS font stack strings (`"Arial, sans-serif"`) — only the first token is used for custom-font detection.
- `applyFontToLabel` uses the cached `_customFontAsset`; if no global font has been set yet, it returns early silently.

## Gotchas

- **Web fonts via `@font-face` don't apply inside Cocos Label until manually registered with cc.assetManager**.
- **Bitmap fonts have a fixed glyph set** — non-Latin characters render as boxes; check glyph coverage before localizing.
