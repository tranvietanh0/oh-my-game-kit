---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---

# Step 8 — Contribution Score Report (this run only)

After Step 7 verifies all items reached terminal state, render a contribution-score summary scoped strictly to **items handled during this triage run** — NOT the user's lifetime aggregate. Lifetime scores belong in `omg-my-score`; Step 8 answers "what did THIS triage earn me?"

## Source of truth — accumulate during the run, not after

Throughout Steps 1d, 6, 6a, and 6c, triage already POSTs each item to the contribution-score worker (`type=triage-backfill`, `type=cook-pr`, etc.) and receives a per-item score back. Maintain an in-memory list `runScores[]` with one entry per POST:

```
{
  ref_url: "https://github.com/<owner>/<repo>/issues/123",
  type: "triage-backfill" | "cook-pr" | "merge-action" | "close-action",
  decision: "merge" | "solve" | "close" | "defer",
  score: <number>,
  recorded: true | false  // true = newly recorded, false = already_recorded (idempotent)
}
```

## Rendering — table + delta only

```
## Contribution Score — This Triage Run ({GH_LOGIN})

**Items handled:** {len(runScores)}    **Newly recorded:** {sum(.recorded)}    **Score earned this run:** {sum(.score where .recorded)}

| Type | Repo | Ref | Decision | Score | Status |
|------|------|-----|----------|-------|--------|
| ... one row per runScores[] entry, sorted by score desc ...                  |
```

If `runScores` is empty (`--dry-run` or no items processed): print `No items scored this run.` and stop.

## Boundary rules

**Do NOT call `/api/contributors/me`.** That endpoint is for `omg-my-score`. Step 8 must NOT pull lifetime totals, weekly/monthly ranks, or "suggested next actions" — that's out of scope and would mislead the user about what this specific run produced.

## Failure handling — fail-silent

If a per-item POST during Steps 1d/6/6a/6c failed, the row still appears in the table with `score: null, status: "score-fetch-failed"` so the user sees the gap rather than a phantom zero. Triage's exit status MUST NOT depend on Step 8.

## Skip in --dry-run

`--dry-run` doesn't do real work; runScores is empty by definition; Step 8 prints nothing.

## Related skills (do not duplicate logic here)

- `omg-my-score` — for **lifetime** scores, ranks, and next-action suggestions. Different endpoint (`/api/contributors/me`), different scope. Step 8 deliberately does NOT call it
- `omg-contribution-score` — the SSOT POST contract that Steps 1d/6/6a/6c use. Step 8 just renders what those steps already collected into `runScores[]`
- `omg-issue` — invoked by the auto-lesson pipeline when Step 4a emits a `[omg-skill-bug ...]` marker