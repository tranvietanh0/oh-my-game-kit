---
name: omg-cocos-base-script-graph
description: "Cocos engine adapter: @ccclass class diagrams via ts-morph, TypeScript module graph via dependency-cruiser, scene hierarchy and prefab component diagrams via a custom JSON walker"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# omg-cocos-base-script-graph

Cocos Creator 3.x diagram adapter for the OMG diagram toolchain. Produces four diagram types from Cocos project sources:

1. **classes** — `@ccclass`-decorated class diagram via `ts-morph` (inheritance + `@property` cross-refs)
2. **modules** — TypeScript module import graph via `dependency-cruiser`
3. **scenes** — Scene node hierarchy from `assets/**/*.scene` JSON via a custom JSON walker
4. **prefabs** — Prefab component tree from `assets/**/*.prefab` JSON via the same walker

## Prerequisites

Install the full Cocos toolchain:
```
omg diagram install --preset cocos
```

Per-project tools (`ts-morph`, `dependency-cruiser`) are recorded as `npm i --save-dev` hints — version locks stay aligned with the project's TypeScript version.

Global tools (`mermaid-cli`, `graphviz`) render Mermaid diagrams into images.

## Usage

```bash
# Auto-detect and generate all diagrams
omg diagram refresh

# Generate a specific type
node scripts/generate.cjs --type classes  --out-dir /tmp/out
node scripts/generate.cjs --type modules  --out-dir /tmp/out
node scripts/generate.cjs --type scenes   --out-dir /tmp/out
node scripts/generate.cjs --type prefabs  --out-dir /tmp/out

# Does this adapter apply to the current project?
node scripts/detect.cjs   # exit 0 = match

# List supported capabilities
node scripts/list-capabilities.cjs

# Tool requirements (mermaid-cli global + ts-morph/dep-cruiser per project)
node scripts/requirements.cjs
```

## Output Files

| Capability | Output |
|---|---|
| `classes` | `classes.md` — Mermaid `classDiagram` of `@ccclass` components |
| `modules` | `modules.md` — Mermaid graph from `dependency-cruiser --output-type mermaid` |
| `scenes`  | `scenes.md`  — Mermaid `flowchart TD` of scene node hierarchy (one section per `.scene` file) |
| `prefabs` | `prefabs.md` — Mermaid `flowchart TD` of prefab component tree (one section per `.prefab` file) |

## Stereotypes and Edge Semantics

- `<<ccclass>>` stereotype on every detected `@ccclass` class.
- Inheritance edge: `class X extends Y` where Y is another `@ccclass`.
- Composition edge: `@property(...)` field labeled with the field name, pointing at the referenced class when resolvable.
- Scene/prefab nodes: hierarchy follows `_children`; component attachments come from `_components[]`.
- UUID cross-references in components: resolved to a readable path via a prebuilt UUID → file map when possible; otherwise the first 8 chars of the UUID are kept for traceability.

## MVP Scope (v1.0.0)

This initial release ships the **scene walker** (Layer B) as the core engine-specific capability — `classes`/`modules`/`prefabs` capabilities stub out with clear skip messages until the full Layer A/C extractors land in a follow-up release. The contract is already stable and the capability surface is final.

See `references/scene-prefab-walker.md` for the JSON walker design and `references/ts-morph-ccclass.md` for the class extractor spec (follow-up).

## Known Limitations

- Cocos Creator **2.x** scene JSON shape differs — this adapter targets **3.x only**. `detect.cjs` inspects `project.json`/`package.json` before accepting.
- `JSON.parse(fs.readFileSync)` reads whole-file (~50 MB upper bound documented).
- Deeply nested prefab variants are rendered as opaque leaves in v1 — variant-aware walking is a future enhancement.
- Unresolved UUIDs fall back to their first-8-char prefix; not a hard error.

## Gotchas

- **Cocos Creator class graphs depend on `@ccclass` decorator** — utility scripts without `@ccclass` are skipped silently.
- **Component dependency graph != class graph** — components reference each other through `@property(Type)`, which is editor-only metadata. Use a separate parser pass for runtime deps.
- **Scene graph diagrams from `.scene` JSON are large** — flat-collapse leaf transforms (`Sprite`, `Label` inside layout containers) before rendering.
- **Cocos 2.x is unsupported** — `detect.cjs` only matches 3.x scene JSON; running against a 2.x project no-ops with a warning.

## References

| File | Content |
|---|---|
| `references/scene-prefab-walker.md` | JSON shape notes for Cocos Creator 3.x + walker algorithm (~50 LOC) |
| `references/ts-morph-ccclass.md` | `@ccclass` decorator extraction spec |
| `references/dependency-cruiser-config.md` | Custom rule snippets for Cocos project layout |
