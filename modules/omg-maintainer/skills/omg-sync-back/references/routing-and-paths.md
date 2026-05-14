---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Routing and Paths

Use this when: resolving which files to sync, where they live in the target kit repo, and grouping them into PRs.

## Step 0: Pick the scan roots (BOTH user-scope AND project-scope)

Sync-back content can live in either install location, and both must be scanned:

| Scope | Root | When it has sync candidates |
|-------|------|----------------------------|
| **User-scope** | `$HOME/.agents/` | Global install — edits via consumer projects propagate here via `omg self-update` |
| **Project-scope** | `<cwd>/.agents/` | Project install — modules/skills authored in a consumer repo that ship with that repo |

**Rules:**
- ALWAYS walk both roots when collecting candidate files. Do NOT default to user-scope only.
- If only one root exists on disk, walk just that one.
- If a file with the same relative path exists in BOTH roots, prefer project-scope (the user is actively editing in the project).
- The consumer detection (`.omg.json` or `.agents/metadata.json` in cwd) only affects the consumer-guard refusal logic — it does NOT gate which roots get scanned.

**Why both:** new modules and skills are sometimes authored in project-scope by design (e.g., a wiki repo shipping a `design-game-wiki` module). Scanning only user-scope makes those edits invisible to sync-back and forces a manual git fallback against the origin kit. See The1Studio/oh-my-game-kit-core#168 (2026-05-10) for the originating incident.

## Step 1: Identify file origin

For each changed file under either scan root (`$HOME/.agents/` OR `<cwd>/.agents/`), read origin from in-file metadata:

| File type | Metadata location | Fields |
|-----------|------------------|--------|
| `.md` | YAML frontmatter | `origin`, `module`, `repository` |
| `.json` | `_origin` key | `kit`, `module`, `repository` |
| `.cjs`/`.js`/`.sh`/`.py` | `omg-origin:` comment | `kit=`, `repo=`, `module=` |

If no metadata → treat as user-created, **skip with warning** (not an error).

## Step 2: Compute target path in kit repo

All kits use `.agents/` prefix uniformly (updated v1.2.0). **Layout depends on the kit:**

### Kit layout matrix

| Kit | Layout | Where module-owned skills live in the kit repo |
|---|---|---|
| `oh-my-game-kit-core` | **kit-flat** | `.agents/skills/{skill-name}/` — module fronmatter is an ownership tag only |
| `oh-my-game-kit-unity` | modular | `.agents/modules/{module}/skills/{skill-name}/` |
| `oh-my-game-kit-cocos` | modular | `.agents/modules/{module}/skills/{skill-name}/` |
| `oh-my-game-kit-rn` / `oh-my-game-kit-web` / `oh-my-game-kit-nakama` / `oh-my-game-kit-marketing` | check repo before assuming | inspect `.agents/modules/{module}/` for a `skills/` subdir → modular; else kit-flat |
| `oh-my-game-kit-designer` | modular | `.agents/modules/{module}/skills/{skill-name}/` |

### Path resolution

- **Kit-wide file** (`module=null`): `.agents/{relative-path-from-.agents}` — e.g., `.agents/skills/{skill}/SKILL.md`, `.agents/agents/{agent}.md`, `.agents/rules/{rule}.md`
- **Module file in a MODULAR kit** (`module` set, kit is modular per matrix above): `.agents/modules/{module}/skills/{skill-name}/{filename}`
- **Module file in a KIT-FLAT kit** (`module` set, kit is kit-flat — currently `oh-my-game-kit-core`): `.agents/skills/{skill-name}/{filename}` — the `module:` frontmatter is an ownership tag, not a path component

### How to detect kit-flat vs modular at runtime

Before computing the final path, probe the kit repo:

1. `get_file_contents(owner, repo, ".agents/modules/{module}", ref="main")` — list contents
2. If listing contains a `skills/` subdirectory → **modular** layout, use `.agents/modules/{module}/skills/{skill-name}/{filename}`
3. If listing contains only `.omg-manifest.json` (no `skills/`) → **kit-flat** layout, use `.agents/skills/{skill-name}/{filename}`
4. If the modules dir doesn't exist at all → kit-flat (or modules not yet introduced); use `.agents/skills/{skill-name}/{filename}` and surface a warning in the PR body

Use `.agents/modules/{module}/.omg-manifest.json` to confirm ownership if unclear.

## Path verification (MANDATORY before writing)

1. `get_file_contents(owner, repo, computed_path, ref="main")` — verify target exists
2. If `404 Not Found`:
   - Try sibling path with/without `.agents/` prefix (defensive fallback)
   - If still 404: this is a NEW file. Confirm with user before proceeding — unexpected new-file creation is the signature of a path-resolution bug (see unity#7 incident, 2026-04-09 — all-additions PR at wrong path)
3. If module set but path doesn't exist → HARD-FAIL: `"Target path {path} does not exist on {owner}/{repo}. Did you mean .agents/{path}?"`

## Red flag signatures

- **All-additions / zero-deletions diff** for a file that exists locally → path-resolution bug. Abort.
- **Branch name matches a file but remote path differs** → path computation bug. Abort.

## Step 3: Group by repo

- One PR per repo (may contain multiple modules/skills)
- Branch naming: `omg-sync/{kit}/{module}/{skill-name}` or `omg-sync/{kit}/kit-wide/{name}`

## What gets synced / excluded

**Include:** `.agents/skills/`, `.agents/agents/`, `.agents/rules/`

**Exclude (project-specific, never sync):**
- `AGENTS.md`, `.agents/memory/`, `.agents/settings.*`
- Any file with absolute project-specific paths
- `.omg-manifest.json`, `omg-config-*.json`, `omg-routing-*.json`
- `omg-modules-keywords-*.json`, `.agents/metadata.json`
- `.omg-module-summary.txt`, `.omg-resolved-config.json`
