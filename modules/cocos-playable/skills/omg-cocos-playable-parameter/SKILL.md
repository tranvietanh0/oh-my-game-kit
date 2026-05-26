---
name: omg-cocos-playable-parameter
description: "Cocos Creator 3.8.7 playable-ad parameter discovery + implementation. Scans project config files (constant.ts, *Config.ts) AND all Canvas UI nodes via MCP, reads scene values for defaults, wires bindings, auto-assigns. Modes: --quick, --standard, --deep, --exhaustive, --auto."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Cocos Playable Parameter System (v4)

End-to-end parameter discovery, implementation, and wiring for Cocos Creator playable ads.

**Principles:** YAGNI, KISS, DRY | Full field coverage by default | Actual scene values as defaults

## Modes

| Mode | Scan | Implements | Review Gates |
|------|------|-----------|--------------|
| `--quick` | Existing only | None | No |
| `--standard` | Scene hierarchy + config files | NEW discoveries | Yes |
| `--deep` | **ALL Canvas nodes** (batch component check) + prefabs + active composites | NEW + composites | Yes |
| `--exhaustive` | Deep + hardcoded value scan + @property expansion | Deep + suggestions | Yes (strict) |
| `--auto` | **Modifier** — combines with any mode (quick/standard/deep/exhaustive) | Per base mode | No (disables all gates) |

See `references/intent-detection.md` for detection logic.

## Workflow

```
Step 0: Intent + MCP → Step 1: Scan → [R] → Step 2: Analyze → Step 2.5: Report → [R] → Step 3: Implement → [R] → Step 4: MCP Assign → Step 5: Review → Step 6: Finalize
```

`[R]` = Review gate (skipped in auto mode). Details: `references/workflow-steps.md`

## Critical Rules (v4)

### 0. Project Config Scan FIRST (standard/deep/exhaustive) — MANDATORY

**Run BEFORE scene scan** to surface hardcoded tunables outside `PlayableConfig.ts` (camera/physics tuning, gameplay knobs, color constants used by code not nodes):

```bash
node .agents/skills/omg-cocos-playable-parameter/scripts/scan-project-configs.cjs <project-root> --json
```

Scans `assets/scripts/**/{constant*,*Config*,GameConfig*}.ts` (skips submodules), classifies each exported constant, dedupes against PlayableConfig keys.

**MUST** produce a `## Project Config Candidates` section in the Step 2.5 report — even if zero candidates ("No project-config candidates found."). Never silently drop. See `references/project-config-discovery.md`.

### 1. Thorough Canvas Scanning (deep+)
- **Batch-check components** for ALL Canvas descendants — do NOT pre-filter by name
- Any node with `cc.Sprite`, `cc.Label`, `cc.Button`, `cc.Camera`, `cc.ProgressBar`, `cc.UIOpacity`, `cc.RichText`, or custom script is parameterizable
- See `references/scan-strategy.md`

### 2. Full Field Coverage by Default
- **Every parameter gets ALL fields** unless clear code-control evidence exists
- Only EXCLUDE a field when you can point to specific code managing it
- See `references/field-coverage.md`

### 3. Read Actual Scene Values for Defaults
- **MANDATORY when MCP connected:** Call `manage_component get_all` per node
- Use actual values in PlayableConfig — NOT generic placeholders
- See `references/field-coverage.md` → "Reading Scene Values"

### 4. Active Composite Grouping
- Group related nodes into `ObjectParameter<CompositeType>` for dashboard management
- Composites go in `scripts/parameter/config/CustomParameter.ts` (NEVER in submodule)
- See `references/composite-grouping.md`

### 5. Typed @property (Match Project Pattern)
- Use typed `@property(Sprite)`, `@property(Label)`, NOT `@property(Node)`
- Direct component refs in binder: `() => this.timerLabel` (no getComponent)
- See `references/code-templates.md`

## Type Hierarchy

```
NodeParameter (position, rotation, scale)
  +-- UINodeParameter (+enable, contentSize)
  |     +-- SpriteParameter (+spriteFrame, color)
  |     |     +-- ButtonParameter (+label* prefix fields)
  |     +-- LabelParameter (+string, color, fontSize, outline, shadow)
  +-- CameraParameter (+fov)
RedirectParameter (active, count) — standalone
```

Base types: `NumberParameter`, `BooleanParameter`, `ColorParameter`, `TextParameter`, `ImageParameter`, `AudioParameter`, `RangeParameter`, `CoordinatesParameter`, `ObjectParameter<T>`

Composite types (submodule): `TutorialHandParameter`, `RichTextParameter`, `EndCardParameter`, `LoadingScreenParameter`

See `references/type-hierarchy.md` for full details, config interfaces, and migration table.

## ParameterBinder (Fluent API)

```typescript
this.binder
    .camera(PlayableConfig.MainCamera, () => this.mainCamera)
    .sprite(PlayableConfig.Logo, () => this.logoSprite)
    .button(PlayableConfig.CTA, () => this.ctaButton)
    .endCard(PlayableConfig.EndCardWin, () => this.winView);
await this.binder.waitForAsync();
```

See `references/binder-templates.md` for all methods, LoadingScreen mapping, and async handling.

## Discovery Scripts

```bash
# MANDATORY first scan — project-specific config tunables (Rule 0)
node .agents/skills/omg-cocos-playable-parameter/scripts/scan-project-configs.cjs <project-root> --json
```

## Naming / Baseline / Categories

See `references/code-templates.md` → Naming, Baseline (6 required), Categories list.

## MCP (Cocos Editor)

Endpoint: `http://127.0.0.1:3000/mcp` | Health: `curl -s http://127.0.0.1:3000/health`
**Windows:** Single-line curl only, use `$TEMP` not `/tmp/`, no `\` continuations.
See `references/mcp-assignment.md`

## Anti-Patterns

- **Skip the project config scanner** (Rule 0) — without it, hardcoded tunables in `*Config.ts` and `constant.ts` are silently omitted from the plan
- Filter Canvas nodes by name before checking components
- Use "style-only" fields by default (ALL fields by default)
- Use generic defaults when MCP can read actuals
- Use `@property(Node)` when project uses typed refs
- Leave related nodes as separate params instead of composites
- Modify `PlayableParamterTool/` submodule for project-specific types
- Generate store link parameters (SDK-managed)
- Skip MCP scene value reading when MCP is connected
- Nest ObjectParameter inside ObjectParameter
- Report properties as null without checking TargetOverrideInfo

## References

- `references/project-config-discovery.md` — **Rule 0 / Step 1a** — project-specific config file scanning (constant.ts, *Config.ts, GameConfig.ts), classification table, wiring patterns
- `references/type-hierarchy.md` — Types, composites, config interfaces, migration
- `references/binder-templates.md` — ParameterBinder API, @property, async, LoadingScreen mapping
- `references/code-templates.md` — PlayableConfig + ParameterController templates, naming, baseline
- `references/scan-strategy.md` — Batch Canvas scanning approach
- `references/field-coverage.md` — Full field tables + reading actual scene values
- `references/composite-grouping.md` — Composite creation patterns
- `references/workflow-steps.md` — Detailed step definitions
- `references/intent-detection.md` — Mode detection rules
- `references/mcp-assignment.md` — MCP assignment workflow
- `references/discovery-helpers.md` — Context extraction, comparison, data params, scene JSON resolution

## Gotchas

- **Parameter names must match the host's macro replacement** — case-sensitive; a single-letter typo means the slot ships at the default forever.
- **`--auto` disables review gates on every mode, not just `--quick`** — if you wanted a gate, do not combine `--auto` with `--standard`/`--deep`/`--exhaustive`.
- **Scene values become defaults; placeholder Canvas values pollute the parameter list** — clean up demo Canvas values BEFORE running the deep scan.
- **Composite parameters (e.g., color = R/G/B/A) expand into 4 slots** — count slot quota carefully against the network's parameter cap.
- **Project config scanner is MANDATORY (Rule 0).** Failure mode (recurring before May 2026): model jumps straight to scene scan, skips `*Config.ts` / `constant*.ts`, misses tunables like `DEFAULT_PADDING_FACTOR` in `CameraFramingConfig.ts`. Fix: run `scripts/scan-project-configs.cjs --json` as the first action in Step 1a; include summary in Step 2.5 report.
- **`AUDIO_NAME` / `EFFECT_NAME` are asset registries, not parameters** — scanner skips them; if dashboard audio control needed, use `AudioParameter` against BGM/SFX slot.
- **Module-level `export const` -> `export let`** when wired via onUpdate (services import live binding); static class members on `Constant` accept direct assignment. See `project-config-discovery.md` -> "Wiring Pattern".
