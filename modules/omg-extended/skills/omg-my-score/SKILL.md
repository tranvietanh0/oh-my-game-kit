---
name: omg-my-score
description: "Show your contribution score, rank, and 3 next-action suggestions. Use for 'what's my score', 'my rank', 'how am i doing', 'leaderboard'."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# omg-my-score — Contribution Score & Rank

Shows your weekly/monthly contribution score, rank, recent contributions, and 3 suggested next actions.

## Usage

```
omg-my-score
omg-my-score --user alice
```

## Workflow

### Step 1 — Resolve user

```bash
# If --user flag provided, use it directly.
# Otherwise resolve from gh CLI:
gh api user --jq .login
```

Store result as `GH_LOGIN`.

### Step 2 — Fetch score data

```bash
TOKEN=$(gh auth token)
curl -sf -H "Authorization: Bearer $TOKEN" \
  "${OMG_TELEMETRY_ENDPOINT}/api/contributors/me?user=${GH_LOGIN}"
```

If `OMG_TELEMETRY_ENDPOINT` is not set, output:
```
Error: OMG_TELEMETRY_ENDPOINT is not configured.
Set it via: export OMG_TELEMETRY_ENDPOINT=https://your-worker.workers.dev
```

If curl fails or returns non-200, output:
```
Could not fetch score for {GH_LOGIN}. Check your GitHub token and org membership.
```

### Step 3 — Render response

Parse the JSON response and render as markdown:

```
## Contribution Score — {user}

| Period  | Score | Rank  |
|---------|-------|-------|
| Weekly  | {weekly_score} | #{weekly_rank ?? 'N/A'} |
| Monthly | {monthly_score} | #{monthly_rank ?? 'N/A'} |

### Recent Contributions (last 5)
| Type | Repo | Date | Score |
...

### Suggested Next Actions
1. {suggestion[0].reason}
2. {suggestion[1].reason}  
3. {suggestion[2].reason}
```

If `recent` is empty, show: "No contributions recorded yet. Start contributing to climb the leaderboard!"

If `suggestions` is empty, show: "Great work — no specific suggestions right now. Keep it up!"

## Notes

- Suggestions are generated server-side from static MVP rules (score vs median, recent activity patterns).
  Future versions will use AI-enriched recommendations.
- Scores update weekly (Mon 01:00 UTC) and monthly (1st 00:00 UTC) via aggregate cron.
- Only The1Studio org members can query this endpoint.

## Gotchas

- `gh auth token` fails if `gh` is not authenticated. Run `gh auth login` first.
- If `weekly_rank` is null, the user has no contributions in the current weekly window.
- The endpoint caches responses for 60s — very recent contributions may not appear immediately.
