---
name: omg-find-issue
description: "Surface high-impact GitHub issues across kit repos ranked by your contribution history. Use for 'find issue', 'what should i work on', 'good first issue'."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# omg-find-issue — Find High-Impact Issues

Surfaces GitHub issues across tracked OMG repos ranked by potential score × match with your contribution history.

## Usage

```
omg-find-issue
omg-find-issue --kit oh-my-game-kit-unity
omg-find-issue --difficulty easy
omg-find-issue --kit oh-my-game-kit-core --difficulty medium
```

## Flags

| Flag | Values | Default |
|------|--------|---------|
| `--kit` | any kit name substring | all tracked repos |
| `--difficulty` | `easy`, `medium`, `hard` | all difficulties |

**Difficulty mapping:**
- `easy` → issues with labels `good first issue`, `easy`, `beginner friendly`
- `hard` → issues with labels `help wanted`, `complex`, `hard`
- `medium` → all other issues (default fallback)

## Workflow

### Step 1 — Parse flags

Extract `--kit` and `--difficulty` from the user's command arguments.

### Step 2 — Fetch ranked issues

```bash
TOKEN=$(gh auth token)
PARAMS="user=$(gh api user --jq .login)"
[ -n "$KIT" ]        && PARAMS="${PARAMS}&kit=${KIT}"
[ -n "$DIFFICULTY" ] && PARAMS="${PARAMS}&difficulty=${DIFFICULTY}"

curl -sf -H "Authorization: Bearer $TOKEN" \
  "${OMG_TELEMETRY_ENDPOINT}/api/contributors/find-issue?${PARAMS}"
```

If `OMG_TELEMETRY_ENDPOINT` is not set, output:
```
Error: OMG_TELEMETRY_ENDPOINT is not configured.
Set it via: export OMG_TELEMETRY_ENDPOINT=https://your-worker.workers.dev
```

### Step 3 — Render issues table

```
## Issues for You to Work On

| # | Repo | Title | Difficulty | Score | Labels |
|---|------|-------|------------|-------|--------|
| 1 | {repo_short} | [{title}]({url}) | {difficulty} | {score} | {labels} |
...
```

Show at most 10 rows. If no issues returned, show:
```
No matching issues found. Try removing --difficulty or --kit filters.
```

### Step 4 — Pick an issue

After rendering the table, ask the user:
> "Want me to open one of these issues in the browser, or start working on a specific one?"

If they say yes / pick a number:
- Open URL: `gh browse {url}` (or just output the URL for them to click)
- Optionally start `omg-cook` workflow if they want to begin implementation

## Scoring Formula (reference)

The server ranks by `potential_score × match_weight`:
- `potential_score`: 1–3 based on priority labels + reaction bonus
- `match_weight`: 1.5× if issue repo/body matches user's recent kit history, else 1.0×

## Gotchas

- Requires `gh auth login` for token. Endpoint requires The1Studio org membership.
- GitHub API is queried live; rate limits apply without `GITHUB_TOKEN` on the worker side.
- Issues list refreshes from GitHub on each call (60s cache on the worker).
- PRs are excluded (GitHub issues API returns both; server filters them out).
