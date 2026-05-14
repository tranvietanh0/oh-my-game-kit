---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Demo Detection Reference

## Known Demo → Menu Path Mapping

| Demo | Menu Prefix | Source Path |
|------|-------------|-------------|
| BattleDemo | `Tools/BattleDemo/` | `Assets/Demos/BattleDemo/` |
| BattleDemo2D | `Tools/BattleDemo2D/` | `Assets/Demos/BattleDemo2D/` |
| BattleDemoIso | `Tools/BattleDemoIso/` | `Assets/Demos/BattleDemoIso/` |
| BattleDemoSideView | `Tools/BattleDemoSideView/` | `Assets/Demos/BattleDemoSideView/` |
| BackpackCrawler | `Tools/BackpackCrawler/` | `Assets/Demos/BackpackCrawler/` |
| InventoryDemo | `Tools/InventoryDemo/` | `Assets/Demos/InventoryDemo/` |

## Auto-Detection Priority

1. **Explicit arg** — `omg-unity:editor:scene BattleDemo2D` → use directly
2. **Git diff** — `git diff --name-only HEAD` → match `Assets/Demos/{Demo}/`
3. **Recent file** — last modified `.cs` under `Assets/Demos/`
4. **Prompt fallback** — ask user if ambiguous

## Menu Items Per Demo

Each demo exposes (verified via Editor asmdef):
```
Tools/{Demo}/Create Unit Prefabs
Tools/{Demo}/Build Behavior Trees
Tools/{Demo}/Setup Scene
```

Not all demos have all three. BackpackCrawler and InventoryDemo may skip "Build Behavior Trees" (no BDP).

## Detection Script Pattern

```csharp
// Editor scripts register menu items via [MenuItem("Tools/{Demo}/...")]
// Located in: Assets/Demos/{Demo}/Editor/
// Pattern: {Demo}SceneSetup.cs, {Demo}UnitPrefabCreator.cs, {Demo}BDPTreeBuilder.cs
```

## Validation After Detection

Before running, verify menu item exists:
```
execute_menu_item — will error if path not found
Fallback: list menu items resource to confirm path
```
