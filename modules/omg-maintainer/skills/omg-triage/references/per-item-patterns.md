---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---

# Per-item triage patterns

Apply to EVERY item, regardless of single-agent or team-fanout mode. Lessons from the 2026-05-08 21-item brainstorm.

## Verdict vocabulary (5-verdict format)

Classify each item into ONE of:

| Verdict | Meaning | Maps to action language |
|---|---|---|
| `merge` | Ready to merge — CI green OR only infra failures; content correct; no blockers | `decision=merge` |
| `close-superseded` | Another open PR contains/supersedes this content. Reasoning MUST name survivor PR# | `decision=close` (comment: "Superseded by #N") |
| `close-obsolete` | Claim is stale, fixed elsewhere, or no longer applicable. Reasoning MUST cite current state | `decision=close` (comment: cite the SHA/file) |
| `needs-fix` | Content has a real issue (CI fail, missing field, conflict, broken claim) — list findings | `decision=solve` (cook) OR leave-open-for-author per `infoStatus` |
| `defer` | Cannot decide without more context — list missing fields | `decision=defer` |

## Dup-cluster pattern (3+ PRs touching same skill/file)

If Step 1's open-PR set contains 3+ PRs touching the SAME skill or file path:

1. **Treat as ONE cluster** — assign to a SINGLE agent (avoid split-brain dedup across agents)
2. **Compare diffs** — identify which PR is a SUPERSET
3. **Pick winner** by: (a) most recent timestamp, (b) most-complete content, (c) cleanest commit history. Tie-break on (a).
4. **Verdict winner** = `merge`; others = `close-superseded` with reasoning naming the winner PR#
5. **If diffs are ORTHOGONAL** (each adds different non-overlapping content), all stand → all `merge` (cluster framing was wrong; say so explicitly)

## CI failure classification (infra-vs-real)

Before deferring on a failed PR check, classify:

- **Real failure** — test/build/lint exit code 1 from PR's content → `needs-fix`
- **Infra failure** — runner-shutdown, "operation was canceled", 24h-timeout, offline runner, 502 Bad Gateway, network error → does NOT block `merge` if real checks pass; admin-bypass acceptable

Detection grep: `runner has received a shutdown signal`, `operation was canceled`, `1d0h0m0s`, `502 Bad Gateway`. The conclusion is `failure`/`cancelled` but cause is environment, not code.

## Tracker-issue verification (for `[gate-missing]` / `[TODO]` / `[deferred]` issues)

For each tracker issue naming an unimplemented artifact (e.g. `validate-X.cjs`, `feature-Y`):

1. Grep relevant directory (`scripts/`, `src/`, `lib/`) for the named file OR renamed equivalent
2. **If found** → `close-obsolete`; evidence: `scripts/{file} at SHA {ref}`
3. **If similarly-named alternative exists** → `close-obsolete`; evidence: actual filename
4. **If neither exists** → `defer` (tracker still relevant)
5. Also grep issue body for "Implemented by:" / "Closed by:" hints contradicting code state

## Adversarial evidence requirement

Every verdict line in the report MUST cite evidence in ONE of these forms:

- `file:line` — e.g., `descriptive-name.cjs:18-32`
- Commit SHA — e.g., `head=bcc92760`
- 1-line excerpt — e.g., `+11. **Static events retain destroyed objects**...`
- Workflow run/job ID — e.g., `run 25378480490 log: '[origin-coverage] FAIL ...'`

Reasoning ≤ 2 sentences. **No verdict without evidence** — if you can't cite, the verdict is `defer`.