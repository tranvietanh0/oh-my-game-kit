---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# File Issue from Skill-Bug Marker

Use this when: a `type=skill-bug` entry arrives from `lesson-queue-processor.cjs` via a system-reminder. The parent spawns this sub-agent via the `Agent` tool with `run_in_background: true`.

## Input (from queue entry)

The queue entry provides: `kit`, `skill`, `bug` (description), `evidence` (logs/context), `fingerprint`.

```
kit=<kit-name>  skill=<skill-name>  bug="<description>"  evidence="<logs>"
```

## Workflow

1. **Pre-flight** — confirm GitHub MCP or `gh auth status`. If neither: respond to parent with `submitted: false, error: "no-gh-auth"`.
2. **Resolve repo** — read `repository` from target skill's YAML frontmatter. Fallback: `.omg-resolved-config.json` → `omg-config-*.json` → `repos.primary`.
3. **Dedup** — search existing open issues. See `references/dedup-existing.md`. If duplicate found: comment instead of creating.
4. **Create issue** (if no duplicate):
   - MCP: `issue_write(method="create", owner, repo, title, body, labels)`
   - gh CLI: `gh issue create --repo {REPO} --title "..." --body "..." --label "skill-bug"`
5. **Writeback** — see `references/queue-writeback.md`.

## Title format

```
fix({kit}): {bug description, first 60 chars}
fix({kit}/{module}): {bug description}   ← when module is set
```

## Issue body template

```markdown
## Skill/Agent Issue

**Affected**: `{skill-name}`
**Type**: bug
**Module**: `{module-name}` (or "kit-wide")

### Environment
- **Kit**: `{kit-name}` v`{kit-version}` (from `.agents/metadata.json`)
- **Module**: `{module-name}` v`{module-version}` (or "kit-wide")
- **OMG CLI**: `{cli-version}`

### Description
{bug}

### Evidence
```
{evidence — sanitized, relative paths, no $HOME}
```

### Fingerprint
`{fingerprint}`
```

## Labels

Apply `skill-bug`. If local fix was applied, also add `sync-needed`.

## Security

- Relative paths only in body — never `$HOME` or absolute paths
- Redact secrets, API keys, tokens before including any log evidence
