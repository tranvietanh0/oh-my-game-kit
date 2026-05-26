---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Workflow Steps (v4)

## Step 0: Intent Detection & Setup

1. Parse input with `intent-detection.md` rules
2. Activate required skill: `omg-cocos-playable-parameter`
3. MCP health check: `curl -s http://127.0.0.1:3000/health`
4. If MCP offline: warn user, continue in fallback mode (skip Step 4)

**Output:** `-> Step 0: Mode [X] - MCP: [connected/offline]`

## Step 1: Scan

### Step 1a: Existing Parameters + Project Config Scan (all modes except quick) — MANDATORY

**Order matters.** Run sub-steps in this exact order:

1. Read `PlayableConfig.ts` → extract existing parameter keys (passed to scanner for dedup)
2. Read `ParameterController.ts` → extract existing @property refs
3. **Run project config scanner (Critical Rule 0):**
   ```bash
   node .agents/skills/omg-cocos-playable-parameter/scripts/scan-project-configs.cjs <project-root> --json
   ```
   This scans `assets/scripts/**/{constant*,*Config*,GameConfig*}.ts`
   (excluding submodules), classifies each exported constant, and dedupes
   against PlayableConfig keys. See `project-config-discovery.md`.
4. Capture scanner output in memory — every entry where `covered: false` is a
   NEW data candidate. Entries where `covered: true` are surfaced under
   "Existing" in the report.
5. **MUST include in Step 2.5 report:** a `## Project Config Candidates`
   section with the scanner summary (files scanned, total/new/covered counts)
   plus a per-file table. If `newCandidates === 0`, the section still appears
   stating "No project-config candidates found." — never silently omit.
6. Exclude store links (SDK-managed) — scanner already filters `STORE_LINK`
   and `*_LINK` keys.

### Step 1b: Visual Node Scan — Thorough Canvas Scanning

**CRITICAL v4 CHANGE:** Do NOT filter by node name. Check components for ALL Canvas descendants.

**Deep mode procedure:**
1. Get hierarchy via MCP `manage_scene get_hierarchy`
2. Collect ALL nodes under Canvas/BGCanvas into flat list (uuid + path)
3. For EACH node, call `manage_component get_all` to check component types
4. Include node if it has ANY parameterizable component (Sprite, Label, Button, Camera, ProgressBar, UIOpacity, RichText, or custom script)
5. For included nodes: parse actual property values (color, fontSize, position, contentSize, etc.) from the get_all response
6. Cache ParameterController node UUID + component type hash for Step 4

**Standard mode:** Same as deep but only check nodes under known View nodes (GameView, Win, Lose, Loading) + nodes with suggestive names.

**Quick mode:** Skip — only verify existing params.

### Step 1c: Also Scan 3D Nodes

Check Camera nodes, DirectionalLight, and custom script nodes outside Canvas tree.

**Output:** `-> Step 1: Scan complete - [N] parameterizable nodes, [K] existing params, [D] data candidates`

### [Review Gate 1] (skip if auto/quick)
Present scan summary. Ask: proceed / adjust / abort.

## Step 2: Analyze & Interactive Review

### 2a. Classify Nodes

| Status | Condition | Action |
|--------|-----------|--------|
| COVERED | Already in PlayableConfig | Silent — Existing table only |
| NEW | No matching param | Implement with ALL fields |
| PARTIAL | Param exists but missing fields | Update to add fields |
| CANDIDATE_SKIP | Not covered, might skip | Ask user to confirm |

### 2b. Present to User

Show tables:
1. **Existing Parameters** — already implemented
2. **New Parameters** — will be added, with ALL fields by default
3. **Nodes to Skip** — ask user to confirm each

For each NEW parameter, show:
- Node path, suggested name, type, fields (ALL by default)
- Actual scene values that will be used as defaults
- Only mark fields as excluded if code-control evidence exists

### 2c. Field Coverage (v4: ALL fields default)

**Default: include ALL fields.** Only present exclusions for review:

```markdown
| Name | Type | Excluded | Evidence |
|------|------|----------|----------|
| TimerLbl | Label | string | Updated by countdown code in TimerController.ts:42 |
```

If no exclusions: "All fields included (full coverage)."

### 2d. Composite Grouping Review

For deep mode, identify composite candidates:
- Parent + children forming logical group → suggest ObjectParameter composite
- Present grouping decision to user

### 2e. Iterate

Repeat 2b-2d until user says "proceed" or "looks good".

**Output:** `-> Step 2: Analysis finalized - [N] NEW, [M] COVERED, [K] SKIPPED`

## Step 2.5: Generate Final Report

**Only after user confirms.** Write to `plans/reports/playable-param-analysis-{YYMMDD}-{HHMM}-{slug}.md`

**Required sections:**

1. `## Summary` — totals (existing / new / skipped / project-config candidates)
2. `## Baseline Status` — 6-baseline checklist
3. `## Existing Parameters` — already in PlayableConfig
4. `## New Parameters (Scene)` — from scene scan, with actual scene values as defaults
5. `## Project Config Candidates` — **MANDATORY, never omit** — from
   `scan-project-configs.cjs` output. See
   `project-config-discovery.md` -> "Report Format Addendum" for the table
   schema. If zero candidates, the section still appears stating
   "No project-config candidates found."
6. `## Skipped Nodes` — with reasons
7. `## Field Exclusions` — with code-evidence references

**Output:** `-> Step 2.5: Final report saved - {path}`

### [Review Gate 2] (skip if auto/quick)
Ask: proceed to implement / reopen review / abort.

## Step 3: Implement Code

1. Add missing Categories to PlayableConfig.ts
2. Add missing imports
3. Add parameter definitions with **actual scene values** as defaults
4. Add typed @property refs to ParameterController.ts (match existing pattern)
5. Wire onUpdate callbacks with `typeof PlayableConfig.X` type annotation
6. Track async promises for sprites/buttons

**v4 rules:**
- ALL fields by default (see `field-coverage.md`)
- Actual scene values for defaults (see `field-coverage.md` → "Reading Scene Values")
- Typed @property matching project pattern (see `code-templates.md`)
- `(data: typeof PlayableConfig.X)` on every onUpdate

**Output:** `-> Step 3: Implemented - [N] params, [M] @property, [K] onUpdate callbacks`

### [Review Gate 3] (skip if auto)
Ask: proceed to MCP assignment / request changes / abort.

## Step 4: MCP Assignment

See `mcp-assignment.md` for full details.

1. Get ParameterController component type hash (cached from Step 1)
2. For each new @property, set_property with target node UUID
3. Save scene
4. Verify assignments via get_all

**Output:** `-> Step 4: MCP assigned - [N]/[M] properties set, scene saved`

## Step 5: Code Review (MANDATORY)

Spawn `code-reviewer` subagent. Check: type hierarchy, binder patterns, async promises, naming, actual values match scene.

Auto-approve if score >= 9.5 and 0 criticals.

**Output:** `-> Step 5: Review [score]/10 - [status]`

## Step 6: Finalize

Spawn project-manager and docs-manager if applicable. Ask user about git commit.

**Output:** `-> Step 6: Finalized`

## Windows Compatibility (ALL steps)

- Single-line curl only (no `\` continuations)
- Use `$TEMP` not `/tmp/`
- No `/dev/stdin`, no Python piping
- Use temp files for large payloads: `echo '...' > "$TEMP/mcp.json" && curl -d @"$TEMP/mcp.json" ...`
