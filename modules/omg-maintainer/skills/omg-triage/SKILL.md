---
name: omg-triage
description: "Triage GitHub issues and PRs across all kit repos. Fetches, classifies, and auto-implements actionable items. Use for 'review open issues', 'what needs fixing', 'process PR backlog'."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Triage — Issue and PR Review

Structured triage workflow across all repos registered in kit configs.

## Usage (compressed)

**Default behavior is AUTO.** Bare `omg-triage` runs the action phase end-to-end without prompting per item.

| Invocation | Behavior |
|---|---|
| `omg-triage` | AUTO (default) — report, act, verify per item |
| `omg-triage --ask` | Interactive — `AskUserQuestion` per partition |
| `omg-triage --dry-run` | Report only, no action |
| `omg-triage --ecosystem` | Maintainer mode — scan ALL OMG repos |
| `omg-triage --yolo` | Maximum autonomy — investigate deeply, decide, MERGE in-session |

Full mode matrix, safety contracts, and `--ecosystem` discovery algorithm: `references/usage-modes.md`.

## Routing

1. Read ALL `omg-config-*.json` → collect all `repoUrl` values
2. Deduplicate repo URLs
3. Fetch issues/PRs from ALL repos in parallel
4. Label each item with source repo

## Scaling — when to hand off

Single-agent triage works for small backlogs. Past these triggers, delegate to `omg-team`:

- **> 20 items total**, OR
- **> 15 items in any single repo**, OR
- Items split into clearly-orthogonal categories (dependabot batch, sync-back PRs, bug fixes, tracker issues), OR
- Same skill/file appears in 3+ open PRs (likely-duplicate cluster)

Full hand-off pattern + partition rules: `references/scaling-handoff.md`.

## Per-item triage patterns

Apply to EVERY item, regardless of single-agent or team-fanout mode. Full pattern detail: `references/per-item-patterns.md`.

**5-verdict vocabulary:** `merge` / `close-superseded` / `close-obsolete` / `needs-fix` / `defer`

**Adversarial evidence requirement:** every verdict line MUST cite evidence in one of: `file:line` / commit SHA / 1-line excerpt / workflow run-job ID. **No verdict without evidence — if you can't cite, the verdict is `defer`.**

Other patterns covered in the reference: dup-cluster handling (3+ PRs on same skill), CI failure classification (infra-vs-real), tracker-issue verification (grep for the named artifact), and reasoning rules.

## Workflow

```
[Fetch] → [Classify] → [Analyze] → [Review PRs] → [Report] → [Cook] → [Verify]
```

### Step 1 — Fetch (parallel per repo)

```bash
gh issue list --repo {REPO} --state open --json number,title,labels,createdAt,body --limit 50
gh pr list --repo {REPO} --state open --json number,title,labels,createdAt,body,files,author --limit 50
```

### Step 1b — Repo discovery (module-aware)

Read ALL `omg-config-*.json` → collect repos. For modular kits, note which modules exist per kit.

### Step 1c-pre — High-impact candidates (optional)

If telemetry endpoint resolves and `gh auth token` works, fetch top-5 score-ranked candidates and render at the top of Step 5 report (heading: `## 🎯 High-Impact Candidates`). On any failure, skip silently — never fail triage.

```bash
T=$(gh auth token 2>/dev/null); U=$(gh api user --jq .login 2>/dev/null)
ENDPOINT="${OMG_TELEMETRY_ENDPOINT:-$(jq -r '.telemetry.cloud.endpoint // empty' "$HOME/.agentsomg-config-core.json" 2>/dev/null | sed 's,/ingest$,,')}"
[ -n "$T" ] && [ -n "$U" ] && [ -n "$ENDPOINT" ] && curl -sf -H "Authorization: Bearer $T" \
  "${ENDPOINT}/api/contributors/find-issue?priority=high&limit=5&user=${U}"
```

**Critical override:** issues labeled `critical`/`P0`/`security` always appear first regardless of score.

### Steps 1c, 1d, 2, 2b, 2c, 2d — comment enrichment and classification

These steps fetch comments + reviews per item, run effort estimation, and apply the InfoStatus completeness check that gates `solve`/`merge` decisions. **`infoStatus: insufficient` items MUST decision = `defer`** — never silently `solve` them.

Full procedural detail: `references/comment-enrichment-and-classification.md` (covers Step 1c throttling/privacy/sanitization, Step 1d backfill, Step 2 classification fields, Step 2b effort heuristics, Step 2c comment classifier signals, Step 2d completeness gate).

### Step 3 — Analyze issues

For each issue: read body + enriched comments, run Step 2d completeness check, check if skill/agent exists, check for duplicates, determine decision (`close` / `merge` / `solve` / `defer`). Do NOT mark an item `solve` without `infoStatus: complete` or `partial`.

### Step 4 — Review PRs

Spawn `omg-code-reviewer` agent per PR. If fixable issues found, push review comments via `gh pr review`.

**Skill file gate:** If a PR modifies `$HOME/.agents/skills/` files (SKILL.md, references/, scripts/), run `omg-skill-creator validate <skill-name>` before recommending merge. Skillmark conventions (frontmatter, progressive disclosure, effort tags, gotcha format) MUST be verified.

### Step 4a — Sync-back PR regression detection (all modes)

Sync-back PRs that fail CI are *prima facie* evidence that `omg-sync-back` produced output the kit's quality gates reject. For each detected sync-back PR with red CI: emit `[omg-skill-bug ...]` marker, add to "Sync-Back Regressions" section of report, mark `merge-blocked: sync-back-regression-<check>`.

Full identification rules, fetch commands, sanitization, and suppression conditions: `references/sync-back-regression.md`.

### Steps 4b / 4c / 4d — `--yolo` merit pipeline

When `--yolo` is set, run a 3-step pipeline that turns AI judgement into real GitHub state changes (instead of internal bypasses): **4b** Risk Classification (low/medium/high) → **4c** Auto-Fix On PR Head (origin markers, omg-modules.json regen, markdownlint) → **4d** Self-Approve via `gh pr review --approve`. After 4d, `reviewDecision === APPROVED` is genuinely true; the unmodified Step 5b strict gate passes.

**Merit-pass requires ALL of:** omg-code-reviewer = `approve`, risk = `low`, PR author ≠ self, Step 4c auto-fix clean, Step 4d API call OK. Any failure → defer to human, none silent.

Full pipeline detail (risk thresholds, fixable categories, push protocol, body template, rollback semantics): `references/yolo-merit-pipeline.md`.

### Step 5 — Report

Save to: `plans/reports/triage-{YYMMDD}-{HHMM}-triage.md`

Module-aware report format:

| # | Repo | Module | Type | Effort | S/M/L | Priority | Title |

**Required report sections (in order):**

1. Triage summary — counts per decision
2. 🎯 High-Impact Candidates (Step 1c-pre, optional)
3. Items by decision — full classification table
4. **Sync-Back Regressions** (Step 4a) — only if any sync-back PRs failed CI
5. Actions taken (in-session merges, closes, cook PR URLs)
6. Deferred items (with reasons)
7. **Contribution Score** (Step 8) — appended at the very end

### Step 5b — Auto-merge gate

Before any merge action, every PR with `decision: merge` MUST pass the **strict** gate (isDraft=false, reviewDecision=APPROVED, all checks SUCCESS, mergeable=MERGEABLE, mergeStateStatus ∈ {CLEAN, BEHIND}, skill-file gate). Anything ambiguous defers to human; **never relax the gate to chase throughput**.

**Admin escalation (yolo only):** when the operating user holds admin role on the target repo AND Steps 4b–4d cannot land an approval (e.g., self-authored PR where GitHub forbids self-approve, or branch protection won't accept bot APPROVE alone), `gh pr merge --admin --squash --delete-branch` is permitted as a final escalation IFF all other gates pass (checks green, mergeable, no requested changes). The merge MUST still satisfy the strict gate except for `reviewDecision=APPROVED`. Cite "admin-override (yolo)" in any output that records the merge.

Full gate spec, `--yolo` flow into the gate, and Step 5c BEHIND-branch handling: `references/auto-merge-gate.md`.

### Step 6 — Action phase

The classifier output is partitioned by `decision`. **By default (no flag) triage runs the auto path** for every partition; `--ask` switches to interactive prompts; `--dry-run` reports only.

Run partitions in parallel where possible; merge actions in parallel batches of 5 to avoid GitHub secondary rate limits.

| Decision | Auto path (default) | `--ask` mode |
|---|---|---|
| `merge` | Default-auto delegates `omg-babysit-pr {n} --repo {REPO}`. `--yolo` merges directly via `gh pr merge --squash --delete-branch`. Items failing the Step 5b gate → `merge-blocked: <reason>` | List in "Ready to merge" group; `AskUserQuestion` per partition |
| `solve` | `omg-cook --auto --parallel` for items where `infoStatus` ∈ {`complete`, `partial`} | `AskUserQuestion` per partition |
| `close` | Comment with reason via template, then `gh issue close` / `gh pr close` | Show in "Recommended close" group; ask per item |
| `defer` | NO action — Step 2d already posted the missing-fields comment | Same as auto |

**NEVER auto-merge `defer` items.** They lack the information required to verify safety. **NEVER cook `defer` or `close` items.**

`close` template: `Closing per triage on {date}: {reason}. Re-open if context changed.`

`--ask` mode "do all" shortcut: when user replies "do all" / "yes to everything" to the partition prompt, run that partition's auto path immediately.

### Step 6b / 6c — `--yolo` decision matrix and active merge

When `--yolo` is set, every decision that default-auto would defer is replaced with a structured AI investigation step (omg-code-reviewer for merges, blocker-resolution for tracking issues, plan→cook chain for large issues). After approval + gate pass, yolo merges in-session via `gh pr merge` (does NOT delegate to babysit-pr — direct merge is the only way to satisfy the Completion Contract).

Full decision matrix, blocker-detection regex, plan→cook chain, yolo invariants, failure handling, and active-merge polling protocol: `references/yolo-decision-matrix.md`.

### Step 7 — Definition of Done

After Step 6 dispatches all actions, triage runs a completion-verification loop. **Triage MUST NOT report completion until every classified item is in a terminal state.**

| Decision | Terminal state |
|---|---|
| `merge` | PR `MERGED` in GitHub OR `merge-blocked: <reason>` recorded |
| `solve` | Cook PR URL recorded OR `solve-failed: <reason>` recorded |
| `close` | Issue/PR `CLOSED` in GitHub |
| `defer` | Missing-fields comment posted (Step 2d) |

Polling: every 60s with a 30-minute total budget (configurable via `OMG_TRIAGE_TIMEOUT_MIN`) and 10-attempt per-item cap. Final report MUST include the terminal_marker for every item. `--dry-run` skips Step 7. `--ask` runs Step 7 only against items the user approved.

Full algorithm, verification commands, interaction rules: `references/completion-verification.md`.

### Step 8 — Contribution Score Report (this run only)

After Step 7 verifies all items reached terminal state, render a contribution-score summary scoped strictly to **items handled during this triage run** — NOT the user's lifetime aggregate. Throughout Steps 1d/6/6a/6c, triage POSTs each item to the contribution-score worker and accumulates `runScores[]` in memory. Step 8 just renders that table — does NOT call `/api/contributors/me`.

Full table format, failure handling, and boundary rules: `references/contribution-score-report.md`.

## Agents

| Phase | Agent |
|---|---|
| PR review (default + yolo) | `omg-code-reviewer` |
| Skill validation | `omg-skills-manager` |
| Implementation | `omg-cook` (registry-routed) |
| Yolo: large-issue planning | `omg-plan` (registry-routed) |
| Sync-back regression filing (Step 4a) | `omg-issue` (auto-spawned by lesson pipeline) |

## Future: Self-Improving AI integration

See: `references/self-improving-ai.md`
