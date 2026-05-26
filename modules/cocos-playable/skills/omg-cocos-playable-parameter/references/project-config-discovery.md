---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Project Config Discovery (MANDATORY for standard/deep/exhaustive)

Project-specific config files (constants, GameConfig, `*Config.ts`) routinely
contain hardcoded values that belong on the ad dashboard — camera tuning,
difficulty knobs, animation timings, colors. Failing to discover them produces
incomplete implementation plans where the user has to re-tune the project
manually after every dashboard change.

**This step is NOT optional.** It runs in Step 1a alongside reading
`PlayableConfig.ts` and `ParameterController.ts`.

## Deterministic Discovery — Use The Scanner Script

```bash
node .agents/skills/omg-cocos-playable-parameter/scripts/scan-project-configs.cjs \
  <project-root> [--json] [--include-covered]
```

The script enumerates `assets/scripts/**/*` (excluding `PLAGameFoundation/` and
`PlayableParamterTool/` submodules), matching:

| Pattern | Examples |
|---------|----------|
| `**/constant*.ts` | `constant.ts`, `Constants.ts` |
| `**/*Config*.ts` | `CameraFramingConfig.ts`, `LevelConfig.ts` |
| `**/GameConfig*.ts` | `GameConfig.ts` |

For each match the scanner extracts:
- `export const NAME = value;`
- `static NAME = value;` (inside classes like `Constant`)
- Classifies value -> `NumberParameter`, `RangeParameter` (0..10 bounded),
  `BooleanParameter`, `ColorParameter`, `TextParameter`
- Captures preceding JSDoc as description hint
- Cross-checks against existing `PlayableConfig.ts` keys and marks `covered: true`
  for likely duplicates (normalized case-insensitive compare)

## Skip Rules (Built Into Scanner)

The scanner automatically filters:
- `STORE_LINK`, `*_LINK` — SDK-managed
- `AUDIO_NAME`, `EFFECT_NAME` — asset registries (resource name maps, not tunables)
- `PIVOT_NODE_NAME` — internal node naming
- Private fields (starting with `_`)
- `PlayableConfig.ts`, `CustomParameter.ts`, `ParameterConfig.ts`,
  `ParameterController.ts`, `ParameterUtils.ts`, `ParameterManager.ts`,
  `ParameterRegister.ts` — these ARE the SSOT or its plumbing, not sources

If a value the scanner emitted should not be parameterized (e.g., engine
constant, internal magic), **mark it SKIPPED in the analysis report with
evidence**. Do not silently drop.

## Output Schema (`--json` mode)

```json
{
  "projectRoot": "...",
  "scriptsDir": "...",
  "playableConfigPath": "...",
  "playableConfigKnownKeys": 18,
  "configFiles": [
    {
      "path": "assets/scripts/services/camera/CameraFramingConfig.ts",
      "candidateCount": 3,
      "candidates": [
        {
          "key": "DEFAULT_PADDING_FACTOR",
          "line": 18,
          "valueType": "number",
          "paramType": "RangeParameter",
          "defaultValue": 2,
          "doc": "Multiplier applied to the cube's diagonal half-extent...",
          "covered": false
        }
      ]
    }
  ],
  "summary": { "filesScanned": 2, "totalCandidates": 3, "newCandidates": 3, "coveredCandidates": 0 }
}
```

## Classification -> Parameter Mapping

| Scanner emits | PlayableConfig type | Notes |
|---------------|---------------------|-------|
| `valueType: "number"`, range 0..10 | `RangeParameter` with `{min, max, step}` | Use 0..N where N is 2-3x default, step = default/10 |
| `valueType: "number"`, out-of-range | `NumberParameter` | Plain number input |
| `valueType: "boolean"` | `BooleanParameter` | |
| `valueType: "color"` (hex) | `ColorParameter` | |
| `valueType: "string"` | `TextParameter` | Verify it isn't a code-managed asset name |

## Wiring Pattern for Project Config Values

Project configs are typically `export const X` modules imported by a service.
The onUpdate callback should write back to the same module's export so the
service picks up dashboard changes.

```typescript
// In CameraFramingConfig.ts — change `const` to `let` to allow runtime override
export let DEFAULT_PADDING_FACTOR = 2.0;

// In PlayableConfig.ts
PaddingFactor: new RangeParameter("Camera Padding Factor", 2.0,
    {min: 0.5, max: 5, step: 0.1}, Categories.Default),

// In ParameterController.ts
import * as CameraFramingConfig from "db://assets/scripts/services/camera/CameraFramingConfig";

PlayableConfig.PaddingFactor.onUpdate = (data: typeof PlayableConfig.PaddingFactor) => {
    (CameraFramingConfig as any).DEFAULT_PADDING_FACTOR = data.default;
};
```

For `Constant.X = value` (static class member), assign directly:

```typescript
import { Constant } from "db://assets/scripts/constant/constant";

PlayableConfig.MaxLives.onUpdate = (data) => { Constant.GAMEPLAY.MAX_LIVES = data.default; };
```

When the service reads its config every frame / on every call, no extra wiring
needed. When the service caches the value at init, also re-fire the affected
service or signal.

## Report Format Addendum (Step 2.5)

The analysis report at `plans/reports/playable-param-analysis-{timestamp}.md`
MUST include a `## Project Config Candidates` section:

```markdown
## Project Config Candidates

Source files scanned: 2 | New candidates: 3 | Covered: 0

### assets/scripts/services/camera/CameraFramingConfig.ts
| Key | Type | Default | Suggested Parameter | Action |
|-----|------|---------|---------------------|--------|
| DEFAULT_PADDING_FACTOR | RangeParameter | 2.0 | `PaddingFactor` (Camera) | NEW |
| DEFAULT_MIN_RADIUS_FACTOR | RangeParameter | 0.75 | `MinRadiusFactor` (Camera) | NEW |
| DEFAULT_MAX_RADIUS_FACTOR | RangeParameter | 3.0 | `MaxRadiusFactor` (Camera) | NEW |

Wiring: change `const` to `let` in CameraFramingConfig.ts; reassign in onUpdate.
```

If the scanner reports zero candidates, the report MUST still include the
section saying `No project-config candidates found.` so the user can verify
the scan ran.

## Anti-Patterns

- Globbing config files manually with Glob tool instead of running the scanner
  (scanner has dedup against PlayableConfig + skip rules baked in)
- Skipping the scan when MCP is offline (scan is filesystem-only, not MCP)
- Treating `AUDIO_NAME`/`EFFECT_NAME` resource registries as parameter
  candidates (these are asset names; if you want a dashboard music picker use
  `AudioParameter` in PlayableConfig directly)
- Reporting "no candidates" without proof the scanner ran — always include
  the scanner summary in the report
