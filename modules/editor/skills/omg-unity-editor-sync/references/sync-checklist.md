---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# Skill Sync Checklist

## Per-Skill Sync Process

### Step 1 — Read Baseline
```
~/.agents/skills/{skill-name}/CK-BASELINE.md
```
Contains: last synced CK version, date, summary of what was adopted/skipped.

If `CK-BASELINE.md` missing → this skill has never been synced. Create it after first sync.

### Step 2 — Compare Upstream
```
diff ~/.agents/skills/{skill-name}/SKILL.md \
     {projectPath}/.agents/skillsomg-{name}/SKILL.md
```
Or read both files and identify structural differences.

### Step 3 — Identify Changes

Categorize each upstream change:

| Category | Description | Action |
|----------|-------------|--------|
| New feature | CK added a new capability | Evaluate: adopt or skip |
| Bug fix | CK corrected wrong behavior | Almost always adopt |
| Architectural change | CK restructured workflow | Adapt to game context |
| Web/app-specific | CK change only relevant to web/SaaS | Skip |
| Removed feature | CK deprecated something GK uses | Keep in GK, note divergence |

### Step 4 — Classify Each Change

**Adopt** (universal improvement — copy directly):
- New reference file that applies to Unity
- Bug fix in workflow steps
- Improved description or argument hints

**Skip** (web/SaaS-specific — irrelevant to game dev):
- Next.js, React, Docker, CI/CD references
- Database or API endpoint patterns
- Frontend component patterns

**Adapt** (good idea, needs game routing):
- Generic "run tests" → GK equivalent: `gk:test` with Unity test runner specifics
- Generic "check console" → GK equivalent: `read_console` MCP call
- Generic "commit" → GK equivalent: `gk:commit` with Unity scopes

### Step 5 — Update GK Skill

Edit the GK skill SKILL.md with adopted/adapted changes.
Create or update reference files as needed.
Do NOT lose GK-specific additions (Unity MCP calls, DOTS context, demo routing).

### Step 6 — Update CK-BASELINE.md

```markdown
# CK Baseline Record

## Last Synced
- Date: 2026-03-21
- CK Version: {commit hash or version tag}

## Changes This Sync
- Adopted: [list]
- Adapted: [list with notes]
- Skipped: [list with reason]

## GK Divergences (intentional)
- [List features GK has that CK doesn't, or vice versa]
```

## Sync Frequency

- **Reactive**: sync when CK releases a new version affecting a skill you're about to use
- **Periodic**: quarterly audit of all GK skills vs CK baseline
- **Trigger**: before starting any major feature that relies heavily on a GK skill
