---
name: omg-preview
description: "View files/directories OR generate visual explanations, slides, or diagrams (Markdown/HTML). Use for explain visually, diagram, slides, diff, or HTML report."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Preview — Visual Output Skill

Universal viewer + visual generator. View existing content OR generate new visual explanations.

## Modes Quick Reference

| Flag / Input | Mode | Output |
|---|---|---|
| `<file.md>` | View | Rendered in novel-reader UI |
| `<directory/>` | Browse | Directory listing |
| `--explain <topic>` | Generate | Mermaid + code + prose |
| `--slides <topic>` | Generate | Step-by-step walkthrough |
| `--diagram <topic>` | Generate | Architecture or data flow |
| `--ascii <topic>` | Generate | Terminal-friendly ASCII |
| `--html --explain` | HTML Generate | Self-contained HTML explanation |
| `--html --slides` | HTML Generate | Magazine-quality HTML deck |
| `--html --diagram` | HTML Generate | HTML diagram with zoom controls |
| `--html --diff [ref]` | HTML Generate | Visual diff review |
| `--html --plan-review` | HTML Generate | Plan vs codebase comparison |
| `--html --recap` | HTML Generate | Project context snapshot |
| `--refresh [--engine auto]` | Orchestration | Multi-file regeneration into `docs/diagrams/` |
| `--stop` | Control | Stop preview server |

If invoked without arguments, ask user which operation they want.

## Argument Resolution Priority

1. `--stop` — stop server and exit
2. `--refresh` — delegate to `scripts/refresh-orchestrator.cjs`; short-circuit all other generation modes
3. `--html` flag — set HTML output mode flag
4. Generation flags (`--explain`, `--slides`, `--diagram`, `--ascii`) — load `references/generation-modes.md`
5. HTML-only flags (`--diff`, `--plan-review`, `--recap`) — auto-set HTML, load `references/generation-modes.md`
6. Argument is a path — view mode, load `references/view-mode.md`
7. Unresolvable — ask user to clarify

## Generation Flags

| Flag | Mode | Behaviour |
|---|---|---|
| `--syntax <mermaid\|plantuml\|d2\|c4\|dot>` | Modifier for `--diagram` | Selects diagram syntax. Default: `mermaid` (unchanged). |
| `--from-file <path>` | Source | Consume pre-generated diagram (SVG/DOT/Mermaid source); auto-detect syntax from extension; render only. |
| `--engine <auto\|<name>\|none>` | Adapter | `auto` → invoke `scripts/adapter-discovery.cjs`; named engine → use that adapter; `none` → generic analyzer. Default: `none` (unchanged). |
| `--refresh [--out-dir <path>]` | Orchestration | Thin wrapper: delegates to `scripts/refresh-orchestrator.cjs`. Same code path as `omg diagram refresh`. Default `out-dir = docs/diagrams/`. |
| `--out-dir <path>` | Modifier for `--refresh` | Override output directory for refresh. Default: `docs/diagrams/`. |
| `--force` | Modifier for `--refresh` | Bypass SHA-256 protection when user-modified files exist. Use with caution. |

**Backwards compatibility:** existing `--diagram` behaviour is unchanged when no `--syntax` flag is passed (defaults to mermaid).

## Adapter Discovery

When `--engine auto` or `--refresh` is used, discovery reads `.agents/metadata.json` → `installedModules[*].skills[]` (SSOT). For the full algorithm and global-only mode behaviour, see `references/adapter-contract.md`.

## Refresh Mode

`--refresh` delegates entirely to `scripts/refresh-orchestrator.cjs`. This is the same execution path invoked by `omg diagram refresh` (CLI). For the full algorithm, SHA-256 protection, sandbox rules, and failure modes, see `references/refresh-orchestrator.md`.

## Output Path

1. **Active plan** (from `## Plan Context` hook): `{plan_dir}/visuals/{mode}-{slug}-{date}.{ext}`
2. **Fallback:** `plans/visuals/{mode}-{slug}-{date}.{ext}`

Topic-to-slug: lowercase, hyphens, alphanumeric only, max 80 chars.

## HTML Mode

When `--html` is added:
- Self-contained single HTML file (no external dependencies except Mermaid CDN)
- Embedded CSS with dark/light theme toggle (MANDATORY)
- Mermaid diagrams render interactively
- Auto-opens via `xdg-open` (Linux) or `open` (macOS)

Before generating HTML, read: `references/html-design-guidelines.md`

Reference loading by mode: `references/generation-modes.md`

## Error Handling

| Error | Action |
|-------|--------|
| Invalid/empty topic | Ask user to provide a topic |
| File write failure | Report error, check disk space and permissions |
| `--diff` without git context | Explain: "No git repo detected." |
| `--plan-review` without plan | Explain: "Provide plan file path or active plan." |
| `--html --ascii` combination | Not supported — suggest `--html --diagram` instead |

Full error table and gotchas: `references/preview-gotchas.md`

## Reference Loading Rules

| Condition | Load |
|---|---|
| `--syntax` or `--diagram` | `references/tool-selection.md` |
| `--refresh` | `references/refresh-orchestrator.md` + `references/adapter-contract.md` |
| `--from-file` with non-Mermaid content (extension `.puml`, `.dot`, `.d2`) | Relevant section of `references/source-code-diagrams.md` |

## Auto-Activation Keywords

Triggers on: `preview`, `visualize`, `diagram`, `explain visually`, `slides`, `html output`, `visual diff`, `plan review`, `recap`, `ascii diagram`, `generate html`, `make slides`, `show diagram`, `refresh diagrams`, `regenerate diagrams`, `update my class diagram`, `rebuild diagrams`, `sync diagrams`
