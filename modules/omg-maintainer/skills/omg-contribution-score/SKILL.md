---
name: omg-contribution-score
description: "Internal SSOT skill: AI-score a contribution artifact (issue/PR) and POST to telemetry worker. Invoked by omg-issue, omg-sync-back, omg-triage — not user-facing. Use only when an existing skill needs to record a contribution score."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# omg-contribution-score — Score a Contribution Artifact (SSOT)

Single source of truth for AI scoring of contributions (issues, PRs).
Invoked by `omg-issue`, `omg-sync-back`, and `omg-triage` — never user-facing
directly. Owns: rubric, endpoint resolution, POST contract, error handling.

## When to use

Call this skill from another skill **after** that skill has successfully created
or identified a GitHub artifact (issue or PR) that should be scored as a
contribution. Examples:

- `omg-issue` — after `gh issue create` succeeds, score the just-filed issue
- `omg-sync-back` — after `gh pr create` succeeds, score the just-opened PR
- `omg-triage` — when iterating open issues/PRs, backfill score for unscored items

This skill is **fire-and-forget** for callers: any failure is logged to stderr
and never blocks the caller's primary workflow (issue creation, PR opening).

## Rubric — 1-to-5 generic quality scale

Apply this same rubric to issues AND PRs AND triage backfill — single rubric, no drift.

| Score | Meaning | Issue example | PR / sync-back example |
|---|---|---|---|
| **5** | Novel & well-evidenced | First-of-its-kind insight; full repro steps; logs/screenshots; identifies root cause | Cross-cutting fix with new test; documents a non-obvious gotcha; improves multiple skills/agents |
| **4** | Clear & actionable | Specific problem described; what was expected vs observed; environment listed | Targeted fix to one skill/agent; clear rationale; minimal collateral edits |
| **3** | Valid but routine | Real bug or improvement, but minimal context; reader has to infer details | Single-line fix or doc tweak; correct but unremarkable |
| **2** | Low-effort | Vague description; missing key context; needs follow-up to be useful | Cosmetic-only or wraparound; doesn't change behavior; could be combined with other PRs |
| **1** | Spam / duplicate / noise | Already known; off-topic; unactionable; AI-test/throwaway content | Reverts useful work; bypasses linting; pure formatting churn |

When uncertain between two adjacent tiers, pick the **lower** tier — it is
harder to inflate scores than to deflate them, and the rubric is meant to
reward effort, not enthusiasm.

## Invocation contract

Caller provides via skill arguments OR via in-context variables:

| Field | Required | Notes |
|---|---|---|
| `type` | yes | One of `issue`, `sync-back-pr`, `triage-backfill` |
| `ref_url` | yes | Canonical GitHub URL: `https://github.com/<owner>/<repo>/(issues\|pull)/<n>` |
| `kit` | yes | Kit short-name, e.g., `oh-my-game-kit-core`, `oh-my-game-kit-unity` |
| `repo` | yes | `<owner>/<repo>` form, e.g., `The1Studio/oh-my-game-kit-core` |
| `title` | yes | Artifact title (issue title or PR title) |
| `body` | yes | Artifact body — issue body, PR description, or PR diff summary |
| `evidence_excerpt` | optional | Short excerpt (logs, repro snippet) supporting the score |

## Workflow

### Step 0 — OMG repo gate

Skip non-OMG repos so callers (`omg-git pr`, `omg-ship`, `omg-cook`, `omg-babysit-pr`) are safe from customer apps. Uniform; no per-skill gate.

```bash
case "$REPO" in
  The1Studio/oh-my-game-kit-*|The1Studioomg-*) ;;
  *) echo "[contribution-score] skipped: not a OMG repo ($REPO)" >&2; exit 0 ;;
esac
```

### Step 1 — AI scores the artifact

Read the rubric above. Score the provided `title + body` against it. Output:

```
score: <1..5>
rationale: <one sentence explaining the score, ≤300 chars>
```

Be conservative — when in doubt, pick the lower tier.

### Step 2 — Resolve telemetry endpoint

Endpoint resolution order (first match wins):

1. `$OMG_TELEMETRY_ENDPOINT` env var
2. `<project>/.agents/omg-config-core.json` → `telemetry.cloud.endpoint`, then strip trailing `/ingest` if present
3. `~/.agents/omg-config-core.json` (global) — same field
4. **No endpoint configured → log to stderr and return success-with-skip; do NOT block caller**

```bash
# Reference resolver — Linux/macOS only. On Windows, run inside WSL or git-bash;
# Codex's hook runner uses Node.js for cross-platform code (per AGENTS.md
# requirement #3), but skill bodies are instruction text and assume a POSIX
# shell. If running on a non-POSIX host, port the same logic to Node.js.
EP="${OMG_TELEMETRY_ENDPOINT:-}"
if [ -z "$EP" ] && [ -f .agents/omg-config-core.json ]; then
  EP=$(jq -r '.telemetry.cloud.endpoint // empty' .agents/omg-config-core.json | sed 's,/ingest$,,')
fi
if [ -z "$EP" ] && [ -f "$HOME/.agents/omg-config-core.json" ]; then
  EP=$(jq -r '.telemetry.cloud.endpoint // empty' "$HOME/.agents/omg-config-core.json" | sed 's,/ingest$,,')
fi
[ -z "$EP" ] && { echo "[contribution-score] no endpoint — skipping" >&2; exit 0; }
```

### Step 3 — POST to worker

```bash
TOKEN=$(gh auth token 2>/dev/null) || {
  echo "[contribution-score] no gh token — skipping" >&2; exit 0
}

USER=$(gh api user --jq .login 2>/dev/null) || {
  echo "[contribution-score] cannot resolve gh user — skipping" >&2; exit 0
}

curl -sS --max-time 8 -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg u "$USER" --arg k "$KIT" --arg r "$REPO" --arg t "$TYPE" \
        --arg url "$REF_URL" --argjson s "$SCORE" --arg ra "$RATIONALE" \
        --arg ev "$EVIDENCE" \
        '{user:$u, kit:$k, repo:$r, type:$t, ref_url:$url, ai_score:$s,
          ai_rationale:$ra} + (if $ev == "" then {} else {evidence_excerpt:$ev} end)')" \
  "$EP/api/contributions" || true
```

### Step 4 — Report outcome to caller (one line)

```
[contribution-score] score=<n> recorded ref=<short-url>      # success
[contribution-score] score=<n> already_recorded ref=<url>    # idempotent
[contribution-score] skipped: <reason>                        # missing config
[contribution-score] failed: <reason>                         # any other error
```

Always exit 0 — the caller is fire-and-forget. Errors are observability, not blockers.

## POST body schema (for reference — worker enforces)

```json
{
  "user": "<gh-login>",            // MUST equal authenticated user (worker rejects mismatch)
  "kit": "oh-my-game-kit-core",
  "repo": "The1Studio/oh-my-game-kit-core",
  "type": "issue",                 // issue | sync-back-pr | triage-backfill
  "ref_url": "https://github.com/<owner>/<repo>/(issues|pull)/<n>",
  "ai_score": 4,                   // integer 1..5
  "ai_rationale": "<≤500 chars>",
  "evidence_excerpt": "<optional, ≤500 chars>"
}
```

Worker responses:

| HTTP | Body | Meaning |
|---|---|---|
| 201 | `{status:"recorded", id, ref_url}` | New contribution row |
| 200 | `{status:"already_recorded", ref_url}` | Idempotency — same `(user, ref_url)` already scored |
| 400 | `{error:"..."}` | Bad body (validation failure, score range, URL shape, user mismatch) |
| 401 | `{error:"Missing Authorization header"}` | No token |
| 403 | `{error:"..."}` | Token invalid or not in The1Studio org |

## Gotchas

- **Worker idempotency is `(user, ref_url)`** — re-running scoring on the same
  artifact is safe; the second POST returns 200 instead of duplicating.
- **`gh auth token` failure is non-fatal** — skill exits 0 with a stderr note.
  Caller workflow proceeds normally.
- **No retries** — if the POST fails (network, 5xx), DO NOT retry. The next
  call to the caller skill will re-score and the worker will deduplicate.
- **Endpoint MUST NOT include `/ingest`** — the resolver strips it. The
  contributors API is at `/api/contributions`, not `/ingest/api/contributions`.
- **Conservative scoring** — when between tiers, pick the lower one. The rubric
  rewards quality, not enthusiasm.

## Security

- The skill never logs the GitHub token, the full POST body, or `ai_rationale`
  contents. Only short status lines go to stderr.
- The worker re-runs secret-redaction on `ai_rationale` and `evidence_excerpt`
  defensively (defense-in-depth), but this skill SHOULD also avoid passing
  raw command output that may contain credentials.
