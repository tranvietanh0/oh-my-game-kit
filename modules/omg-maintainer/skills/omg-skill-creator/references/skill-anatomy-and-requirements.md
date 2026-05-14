---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Skill Anatomy & Requirements

## Directory Structure

```
$HOME/.agents/skills/
└── skill-name/
    ├── SKILL.md          (required, <300 lines)
    │   ├── YAML frontmatter (name, description required)
    │   └── Markdown instructions
    └── Bundled Resources (optional)
        ├── scripts/      Executable code (Python/Node.js)
        ├── references/   Docs loaded into context as needed
        ├── agents/       Eval agent templates (grader, comparator, analyzer)
        └── assets/       Files used in output (templates, etc.)
```

## Core Requirements

- **SKILL.md:** <300 lines. Concise quick-reference guide.
- **References:** <300 lines each. Split by logical boundaries.
- **Scripts:** No length limit. Must have tests. Must work cross-platform.
- **Description:** <200 chars. Specific triggers, not generic.
- **Consolidation:** Related topics combined (e.g., cloudflare+docker → devops)
- **No duplication:** Info lives in ONE place (SKILL.md OR references, not both)

## SKILL.md Frontmatter

```yaml
---
name: omg-kebab-case-name      # required — `omg-` prefix for core, `{kit}:` for kit skills
description: <200 chars, trigger-optimized
effort: low | medium | high    # required
context: fork                   # required when effort: high (heavy multi-subagent skills share parent prefix)
keywords: [optional, list]
argument-hint: "[hint]"         # recommended
# DO NOT hand-author: version, origin, repository, module, protected — CI/CD-injected only
---
```

**`context: fork` rule:** required for `effort: high` skills, recommended for skills that fork 3+ subagents or process large inputs. Without it, every sibling subagent pays the full input price (cache fragmentation). Canonical examples: `omg-doctor`, `omg-cook`, `omg-plan`, `omg-debug`, `omg-review`, `omg-security`, `omg-ship`, `omg-graphify`, `omg-xia`.

**Metadata quality** determines auto-activation. See `references/metadata-quality-criteria.md`.

## Scripts (`scripts/`)

- Deterministic code for repeated tasks
- **Prefer:** Python or Node.js (Windows-compatible)
- **Avoid:** Bash scripts
- **Required:** Tests that pass, `.env.example`, `requirements.txt`/`package.json`
- **Env hierarchy:** `process.env` > skill `.env` > shared `.env` > global `.env`
- Token-efficient: executed without loading into context

See `references/script-quality-criteria.md` for full criteria.

## References (`references/`)

- Documentation loaded as-needed into context
- Use cases: schemas, APIs, workflows, cheatsheets, domain knowledge
- **Best practice:** Split >300 lines into multiple files
- Include grep patterns in SKILL.md for discoverability
- Practical instructions, not educational documentation

## Assets (`assets/`)

- Files used in output, NOT loaded into context
- Use cases: templates, images, icons, boilerplate, fonts
- Separates output resources from documentation

## Progressive Disclosure

Three-level loading for context efficiency:
1. **Metadata** (~200 chars) — always in context
2. **SKILL.md body** (<300 lines) — when skill triggers
3. **Bundled resources** — as needed (scripts: unlimited, execute without loading)

## Writing Style

- **Imperative form:** "To accomplish X, do Y"
- **Third-person metadata:** "This skill should be used when..."
- **Concise:** Sacrifice grammar for brevity in references
- **Practical:** Teach *how* to do tasks, not *what* tools are
