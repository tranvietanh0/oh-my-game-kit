---
name: omg-find-skill
description: "Discover available skills by keyword search across all activation fragments and installed modules. Use when asking 'what skill handles X', 'how do I do Y', 'find skill for Z', or 'list all skills'."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Find-Skill — Skill Discovery

Search available skills by keyword when you need to know what capability exists. Critical as module count grows across kits.

## Usage

```
omg-find-skill "ECS batch processing"   # Find skills matching a query
omg-find-skill "auth"                   # All skills related to auth
omg-find-skill --all                    # List every available skill
omg-find-skill --all --installed-only   # Only installed skills
```

## Algorithm

1. **Load activation sources:**
   - Read ALL `.agents/omg-activation-*.json` fragments → collect keyword-to-skill mappings
   - Read ALL installed `module.json` files → collect `activation.keywords` per module
   - Read ALL `SKILL.md` frontmatter (`description` field) for richer matching

   Scan caps the first 30 lines per file (frontmatter only) and limits results to 50 matches by default; use `--all` to bypass.

2. **Fuzzy-match query:**
   - Tokenize user query into words
   - Match against: activation keywords, skill names, SKILL.md descriptions
   - Rank results:
     1. Exact keyword match (highest)
     2. Prefix match (query is prefix of keyword)
     3. Substring match (query appears inside keyword)
     4. Description match (query word appears in SKILL.md description)

3. **Resolve install status:**
   - Read `.agents/metadata.json` → `installedModules`
   - Mark each result: `[installed]` or `[not installed — module: {name}]`

4. **Output results** with install status, module, and description.

## Output Format

```
## Skills matching "ECS batch"

### Installed

| Skill | Module | Description |
|-------|--------|-------------|
| dots-ecs-core | dots-core (oh-my-game-kit-unity) | ECS system patterns, burst compilation, job scheduling |
| dots-ecs-batch | dots-core (oh-my-game-kit-unity) | Batch entity processing with IJobChunk and EntityQuery |

### Available (not installed)

| Skill | Module | Kit | Install Command |
|-------|--------|-----|-----------------|
| dots-ecs-advanced | dots-advanced | oh-my-game-kit-unity | omg-modules add dots-advanced |

### No match in uninstalled modules.
```

## --all Flag

Lists every available skill (no filtering). Output grouped by module:

```
## All Available Skills

### Core (always available)
- omg-cook — End-to-end feature implementation
- omg-fix — Bug fix workflow
- omg-plan — Planning and architecture
- ...

### Module: dots-core (oh-my-game-kit-unity) [installed v2.1.0]
- dots-ecs-core — ECS system patterns
- dots-physics — Physics simulation patterns
- ...

### Module: ui (oh-my-game-kit-unity) [installed v1.3.0]
- unity-ui — UI toolkit patterns
- ...

### Module: rendering (oh-my-game-kit-unity) [NOT INSTALLED]
  Install: omg-modules add rendering
- unity-rendering — SRP render pipeline patterns
- ...
```

## Uninstalled Module Suggestion

When results include uninstalled modules, offer installation:

```
2 results found in uninstalled module 'dots-advanced'.
Install it? Run: omg-modules add dots-advanced
```

Do NOT auto-install — always ask the user first.

## Category Browsing

When no query provided (or `--all`), group skills by category (from `module.json` → `category`):

```
omg-find-skill --all --category "Testing & QA"
```

Available categories: Core Workflows, Planning & Analysis, Backend, Frontend & Design, Game Engine, Testing & QA, DevOps & CI/CD, Security, Documentation, Git & VCS, Kit Management, Utilities

## Gotchas

- **Core skills are always available** — they live in `.agents/skills/` regardless of metadata
- **Fragment-only kits**: Some older kits may not have `module.json` — fall back to `omg-activation-*.json` only
- **Description quality varies**: SKILL.md descriptions may be short; keyword matching is more reliable
- **Cross-kit skills**: A skill installed from `oh-my-game-kit-designer` appears in results even in a Unity project
- **Activation refs accept BOTH bare and full-prefixed forms** — when resolving a `mappings[].skills[]` entry from a fragment to its skill dir, accept either `nakama-rpc` (bare slug) or `omg-nakama-rpc` (full-prefixed dir name). The CI prefixer self-heals legacy bare refs to canonical form at release time, but the SSOT in fragment files stays bare. If a ref doesn't resolve via either form, it's drift — surface to the user (consult `omg-doctor` check #47 or release-action `validate-activation-skill-resolution.cjs`).

## Auto-Activation Keywords

Triggers on: `find skill`, `search skill`, `what skill`, `available skills`, `discover`, `how do I`, `which skill`, `skill for`, `list skills`, `skill search`
