---
name: omg-cocos-playable-layout
description: "ResponsiveLayoutService Component for aspect ratio detection, safe area insets, and adaptive node positioning in Cocos Creator playable ads"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# ResponsiveLayoutService

Cocos Component singleton that detects device aspect ratio on load and on every canvas resize, categorizes it into NARROW/STANDARD/WIDE, fires `ScreenResizedSignal` via SignalBus, and provides helpers for adaptive node positioning and scaling. Attach to a persistent node in the scene (e.g. Canvas root). See also: `omg-cocos-playable-signalbus`.

Import paths:
- `db://assets/PLAGameFoundation/layout/ResponsiveLayoutService`

## Details

- [API reference: categories, signal, properties, methods](references/api-reference.md)
- [Usage examples: signal subscription, adjustForAspectRatio, scaleToFit, getSafeArea](references/usage-examples.md)

## Integration Points

- `ScreenResizedSignal` fires once on `onLoad` immediately after detection — subscribe before `onLoad` completes if you need the initial value, or read `service.category` directly in `start()`.
- Plays well with the parameter system: subscribe to `ScreenResizedSignal` in `ParameterController` to re-apply layout-sensitive parameter values when the device rotates or the browser is resized.
- `getSafeArea()` returns zeros on web — safe to call unconditionally.
- Only one `ResponsiveLayoutService` instance is allowed; a second `onLoad` call destroys the newer component.

## Common Mistakes

- Reading `ResponsiveLayoutService.instance` before the component's `onLoad` has run — returns null. Always guard with a null check or access in `start()` / after a frame delay.
- Calling `adjustForAspectRatio` without subscribing to `ScreenResizedSignal` — positions only set once and will not update if browser is resized.
- Using `scaleToFit` on a node whose `UITransform.contentSize` is zero — method early-returns silently. Set `contentSize` explicitly.
- ES2017 target: do not use optional chaining (`?.`) or nullish coalescing (`??`) in game code.

## Gotchas

- **Cocos `Widget` aligns relative to parent at layout time** — animating the parent breaks the widget unless `alignFlags` are reapplied per frame (or `Widget.target` is locked).
- **Safe-area inset on iOS in-app webview is not always reported** — provide a manual fallback inset of 24px top, 12px bottom.
