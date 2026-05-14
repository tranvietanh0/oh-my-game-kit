---
name: omg-unity-architecture-assembly-graph
description: "Unity engine adapter: .asmdef graph, Roslyn class diagrams with Unity stereotypes (MonoBehaviour, ScriptableObject, DOTS), UPM package deps, and C4 architecture views"
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# unity-assembly-graph

Unity diagram adapter for the OMG diagram toolchain. Produces four diagram types from Unity project sources:

1. **modules** — Assembly-to-assembly reference graph from `.asmdef` files (no external tools required)
2. **classes** — Per-assembly Roslyn class diagrams with Unity stereotypes via `Cs2Mermaid`
3. **packages** — UPM dependency graph from `Packages/manifest.json`
4. **c4** — C4 architecture view inferred from asmdef prefix groupings

## Prerequisites

Install the full Unity toolchain:
```
omg diagram install --preset unity
```

Or install `cs2mermaid` only (if mermaid-cli already present):
```
omg diagram install cs2mermaid
```

The `modules`, `packages`, and `c4` capabilities work without `cs2mermaid`. Only `classes` requires `.NET 8 SDK` + `Cs2Mermaid`.

## Usage

```bash
# Auto-detect and generate all diagrams
omg diagram refresh

# Generate specific type
node scripts/generate.cjs --type modules --out-dir /tmp/out
node scripts/generate.cjs --type classes --out-dir /tmp/out
node scripts/generate.cjs --type packages --out-dir /tmp/out
node scripts/generate.cjs --type c4 --out-dir /tmp/out

# Check if this adapter applies to current project
node scripts/detect.cjs   # exit 0 = match

# List available capabilities
node scripts/list-capabilities.cjs

# Show tool requirements
node scripts/requirements.cjs
```

## Output Files

| Capability | Output |
|---|---|
| `modules` | `modules.md` — Mermaid graph LR of assembly dependencies |
| `classes` | `classes.md` (index) + `classes-{asmdef}.md` per assembly |
| `packages` | `packages.md` — UPM dependency graph |
| `c4` | `architecture.md` — C4 container/component view |

## Stereotypes Injected

See `references/unity-stereotypes.md` for the full detection rules. Key annotations:

- MonoBehaviour / ScriptableObject — inheritance-based
- {serialized} — fields with [SerializeField]
- ..> requires — [RequireComponent(typeof(X))] edges
- IComponentData / ISystem / IAspect — DOTS interfaces
- {asset} — [CreateAssetMenu] classes

## Known Limitations

- Roslyn syntactic analysis (no cross-file type resolution for ~30% of signatures)
- Generated .cs files excluded by default — use --include-generated to include
- GameObject hierarchies and scene references are runtime-only and cannot be represented from C# source
- Semantic (DLL-based) class analysis is deferred to v2 (dll2mmd path)

## References

| File | Content |
|---|---|
| references/unity-stereotypes.md | Detection rules + regex patterns for Unity annotations |
| references/asmdef-guid-resolution.md | How GUID: refs are resolved via .asmdef.meta files |
| references/cs2mermaid-integration.md | Cs2Mermaid wrapper design, security review, fallback |
