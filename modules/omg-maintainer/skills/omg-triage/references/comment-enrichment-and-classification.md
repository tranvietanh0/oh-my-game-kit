---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---

# Comment enrichment + classification (Step 1c through Step 2d)

Detail for the enrichment + classification stages of triage. SKILL.md keeps a 1-line summary per step; this file keeps the full procedural detail.

## Step 1c — per-item comment enrichment

For every issue and PR from Step 1, fetch comments and (for PRs) reviews:

```bash
gh issue view {n} --repo {REPO} --json number,title,body,comments,labels,createdAt,author
gh pr view    {n} --repo {REPO} --json number,title,body,comments,labels,createdAt,files,author,reviews
```

**Throttling:**
- Run in parallel **batches of 5** items
- Throttle **100ms between batches** (prevents secondary rate limits on repos with 50+ open items)
- Per-item failure → log `OMG_DEBUG_TRIAGE` entry, skip comments for that item, continue triage (do NOT abort full run)

**Cap:** slice client-side `item.comments = (item.comments ?? []).slice(-20)` — keep the **last 20** (newest) only. Same cap applies to PR `reviews`.

**Privacy invariant — NEVER persist comment bodies to telemetry.** Comments live only in classifier RAM during a single triage run. Do not write them to `plans/reports/triage-*.md`, D1 telemetry, or any file that leaves the classifier's memory. Report output may cite a comment author + permalink, never the comment body.

**Credential sanitization** — if an issue/PR body or comment contains what looks like a credential (API key, bearer token, JWT, AWS key id, private key fragment), redact it before quoting in the triage report or any downstream artifact. The `omg-issue` template's `SENSITIVE_PATTERNS` regex set is the reference; mirror it here.

**Debug:** set `OMG_DEBUG_TRIAGE=1` to log per-item enrichment fetches + classifier inputs to stderr.

## Step 1d — contribution score backfill (optional)

For each enriched issue/PR from Step 1c (cap at first **20 items per triage run** to bound AI cost), invoke `omg-contribution-score` with `type=triage-backfill`, the item's `html_url` as `ref_url`, and the title + body already in classifier RAM. The contribution-score skill is the SSOT — do NOT inline rubric or POST logic here.

The worker idempotency on `(user, ref_url)` makes this safe: items already scored at filing time (via `omg-issue` / `omg-sync-back`) return `already_recorded` and are not double-counted. Backfill catches items that pre-date the AI scoring path or were filed manually on GitHub.

Failures are silent — backfill is fire-and-forget; never block triage. Skip backfill entirely when no endpoint resolves from env or config (`readTelemetryEndpoint` returns null).

## Step 2 — classify each item

| Field | Values |
|---|---|
| Type | `bug`, `enhancement`, `gotcha`, `sync-needed`, `new-skill` |
| Effort | `trivial` (<30min), `small` (1-2h), `medium` (half-day), `large` (1+ day) |
| Priority | `P0` (broken), `P1` (important), `P2` (nice-to-have), `P3` (backlog) |
| InfoStatus | `complete` (all required fields), `partial` (some fields missing, can infer rest), `insufficient` (core repro/version data missing — NOT cookable) |
| Decision | `close` (not-a-bug / dup / superseded), `merge` (PR ready), `solve` (cookable), `defer` (insufficient info — bounce back to reporter) |

## Step 2b — effort estimation heuristics

Use these signals to determine S/M/L per issue:

| Signal | S (< 1hr) | M (1-4hr) | L (> 4hr) |
|--------|-----------|-----------|-----------|
| Files affected | 1-2 | 3-5 | 6+ |
| Issue type | typo, config, gotcha | logic, API change | architecture, new-skill |
| Cross-module | no | maybe | yes |
| Tests needed | existing pass | modify existing | new suite required |

Output per issue: `Effort: S — {brief justification}` or `M — touches 3 modules` etc.

## Step 2c — classify with comments

Comments from Step 1c are first-class classifier input alongside title/body. See `references/comment-classifier-prompt.md` for the full prompt skeleton. Signals the classifier must weigh:

| Signal | Source | Weight rule |
|---|---|---|
| Author authority | `comment.authorAssociation` | `OWNER` > `MEMBER` > `COLLABORATOR` > `CONTRIBUTOR` > `NONE`. Authoritative authors override earlier body content on conflict. |
| Status markers | regex `/(fixed in\|see #\|blocked on\|resolved by\|root cause\|wontfix)\s*#?\d+/i` on `comment.body` | Match → flag item as `superseded`, `blocked`, or emit explicit `rootCause` field. |
| Community priority | sum `THUMBS_UP` users across `comment.reactionGroups` | High thumbs-up count → priority boost (P2 → P1). |
| Recency | `comment.createdAt` | Prefer newer signals on conflict (repo state may have evolved). |

**Root-cause extraction:** when an authoritative comment (OWNER/MEMBER) states a cause different from the issue body, classifier output MUST include a `rootCause` field summarizing the comment's stated cause. This is the #37 fix — title says "Problem A" but the OWNER comment says "actually B" → triage surfaces B.

## Step 2d — InfoStatus completeness check (MANDATORY)

After Step 2c, evaluate **each issue** against the required-fields list. Do the same for sync-back PRs against `omg-sync-back`'s required PR-body sections.

**Required fields for issues (per `omg-issue` template):**
- `kit` + `kitVersion`
- `module` + `moduleVersion` (when module is set)
- `cliVersion`, `platform` (Environment block)
- `reproductionCommand` (exact command)
- `expected`, `actual`
- `logs` (verbatim stderr/stdout, or explicit "no logs" note)

**Required fields for sync-back PRs (per `omg-sync-back` PR format):**
- Versions block (kit+version, module+version, cli, platform)
- Plan link (or explicit "ad-hoc")
- Rationale (why generic)
- Changed files list

**Classification rule:**

| Missing fields | InfoStatus | Consequence |
|---|---|---|
| None | `complete` | Eligible for `solve` / `merge` decision |
| Non-critical (logs only, or moduleVersion when "kit-wide") | `partial` | Still cookable, but flag in report |
| Any of {kitVersion, reproductionCommand, expected, actual} missing | `insufficient` | **Decision MUST be `defer`** — never `solve` or `merge` |

**When InfoStatus is `insufficient`:**
1. Triage posts a comment on the item listing the exact missing fields (use `gh issue comment` / `gh pr comment` — non-destructive).
2. Report lists the item under "Defer — needs more info" with the missing fields enumerated.
3. `--auto` mode SKIPS these items entirely — they are NOT passed to `omg-cook`.
4. Human maintainer can override by re-classifying after the reporter fills the gaps.