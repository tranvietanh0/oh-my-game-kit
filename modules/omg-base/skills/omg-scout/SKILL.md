---
name: omg-scout
description: "Explore codebase with context-aware skill injection. Use for 'find where X is implemented', 'how is Y used', 'show all places that call Z' across source, skills, and docs."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Scout — Codebase Exploration

Context-aware codebase search using the `Explore` agent with skill context injection.

## Skill Activation
Read ALL kit-level `.agents/omg-activation-*.json` files PLUS module-level fragments under `.agents/modules/<module>/` matching the same glob.
Match query keywords against ALL fragments. Activate all matching skills before exploring.

When resolving a `mappings[].skills[]` entry to a skill dir, accept BOTH the bare-slug form (`nakama-rpc`) and the full-prefixed form (`omg-nakama-rpc`) — the CI prefixer self-heals legacy bare refs at release time but the SSOT in fragment files stays bare. Refs that don't resolve via either form are drift; surface to the user (consult `omg-doctor` check #47).

## Module-Aware Search (if `installedModules` or `modules` present in metadata.json)

Follow protocol: `.agents/skills/omg-modules/references/module-detection-protocol.md`

1. Read `.agents/metadata.json` → installed modules
2. Annotate each finding with its module: "Found in module: dots-core" or "Found in: kit-wide"
3. If searching for a pattern, prioritize skills from the relevant module
4. Include module ownership in result labels

## Default Search Paths

Read `.omg-manifest.json` to determine installed kit paths, then search:

| Path | What it Contains |
|---|---|
| Source code root | Project implementation files |
| `.agents/skills/` | Encoded knowledge base |
| `docs/` | Technical documentation |

## Process

1. **Activate skills** — match query keywords via activation fragments
2. **Scope query** — map keywords to relevant source paths
3. **Run `Explore` agent** with scoped paths + query
4. **Annotate results** — label each finding as Source / Skill / Doc
5. **Reuse check** — if query is about implementing something, flag existing code first

## Cross-Repo Search (--cross-repo flag)

```
omg-scout --cross-repo <query>
```

**Requires:** `gh` CLI authenticated. Default scope is current project only.

1. Read `.agents/metadata.json` → `installedModules` → collect unique `repository` values
2. For each repo: `gh search code --repo {owner}/{repo} "{query}" --json path,repository,textMatches`
3. Results format per match:
   ```
   [{repo}] {file-path}
   > {match context — 3 lines around match}
   ```
4. Rank: exact match > partial match. Cap at 10 results per repo.
5. If `gh` unavailable: warn and fall back to local search only

## Agent

Uses `Explore` subagent — built-in, no registry delegation needed.

## Scope

Codebase exploration only — does NOT implement, modify, or plan.
