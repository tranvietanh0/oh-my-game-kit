---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---

# `--yolo` Merit Pipeline — Risk + Auto-Fix + Self-Approve

Detail for SKILL.md Steps 4b, 4c, 4d. The pipeline turns AI judgement into real GitHub state changes (instead of internal bypasses).

## Step 4b — Risk Classification (`--yolo` only)

After Step 4, classify each `decision: merge` PR by **diff risk** to determine whether omg-code-reviewer LGTM alone is sufficient to substitute for the human APPROVED gate. Run via `gh pr view {n} --repo {REPO} --json files,additions,deletions`.

| Risk | Conditions (ALL must hold) | Yolo treatment |
|---|---|---|
| **low** | additions+deletions ≤ 200 lines AND files ≤ 10 AND only `.md` / `.json` (excluding `package.json`, `metadata.json`) / `.agents/skills/**` / `docs/**` paths AND no `.cjs` / `.js` / `.mjs` / `.sh` / `.py` / `.yml` / `.github/workflows/**` / schema fragments (`*-routing-*.json` / `*-modules.json`) touched | omg-code-reviewer LGTM → eligible for self-approve (Step 4d) |
| **medium** | low conditions partially fail (one of: 200 < lines ≤ 1000, OR 10 < files ≤ 30, OR touches one but ≤2 of {`.cjs`/`.js`, `.yml`, schema fragments} without touching `.github/workflows/**`) | omg-code-reviewer LGTM is NOT enough — defer to human even in yolo |
| **high** | Touches `.github/workflows/**` OR `*-routing-*.json` OR ≥3 schema/code file types OR > 1000 lines OR > 30 files | Always defer — yolo never auto-approves high-risk |

Output per PR: `risk: {low|medium|high} — {1-line justification}`. Surface in report under each merge candidate.

**Calibration rationale:** the user-of-the-day audience is ~50 internal studio engineers (AGENTS.md scope). Low-risk = "skill markdown / docs / data refresh" — the kind of changes humans approve in 30 seconds with a glance. Medium = "should have a real code review." High = "should never auto-anything." Thresholds err conservative; raise only with logged evidence of false-defers.

## Step 4c — Auto-Fix On PR Head (`--yolo` + merit-pass only)

When `--yolo` is set AND Step 4b risk = `low` AND omg-code-reviewer returned `approve`, attempt to auto-fix common blockers BEFORE running the strict gate. Auto-fixes apply only to PRs whose head branch is in the SAME repo (no external forks — write access required).

**Detection:** `gh pr view {n} --repo {REPO} --json headRepositoryOwner,headRefName` — proceed only when `headRepositoryOwner.login` matches `{REPO}`'s owner. External forks → skip auto-fix, leave a PR comment with the patch suggestion, mark `auto-fix-skipped: external-fork`.

**Fixable categories** (run in order, stop on first failure):

| Category | Detect | Fix | Verify |
|---|---|---|---|
| Missing origin markers on new files | Run `validate-origin-injection-coverage.cjs --root .agents` after checkout | For each missing-marker file, stamp the per-file-type marker with `kit=<repo-suffix>` placeholder values (CI overwrites post-merge — values are best-effort) | Re-run validator → exit 0 |
| `omg-modules.json` drift | Run `node {release-action-path}/scripts/validate-modules-registry-sync.cjs` | Run `node {release-action-path}/scripts/generate-modules-registry.cjs $PWD` | Re-run sync validator |
| Markdown lint drift | `npx markdownlint-cli2 .agents/skills/**/*.md` | `npx markdownlint-cli2 --fix .agents/skills/**/*.md` | Re-run linter |
| Code-reviewer "simple fix" suggestions | Parse omg-code-reviewer output for `simple-fix:` blocks (typo, missing import, unused var, obvious null guard) — each must touch ≤3 lines in ≤1 file | Apply via `Edit` tool | Re-run omg-code-reviewer in verify-only mode (no new fix suggestions) |

**Push protocol:**

```bash
# Use a git worktree to avoid contaminating triage CWD
git checkout {pr-head-ref}
# ... apply fixes ...
git add -p {only-fixed-files}
git commit -m "chore({scope}): auto-fix triage blockers ({categories})

Auto-applied via omg-triage --yolo on PR #{n}.
Categories: {comma-separated list}.

Co-authored-by: omg-triage <noreply@oh-my-game-kit.dev>"
git push origin {pr-head-ref}
```

**Mark `auto-fix-applied: <categories>` in report.** If any fix fails (lint can't auto-fix, validator still red after stamp, omg-code-reviewer flags new issues): roll back the local checkout (`git reset --hard origin/{pr-head-ref}`), mark `auto-fix-failed: <category>`, defer to human.

**NEVER auto-fix:**
- Schema fragments (`*-routing-*.json`, `*-modules.json` outside the regen path)
- `.github/workflows/**`
- Anything not in the Fixable Categories table above
- PRs from external forks (no write access; comment-with-patch only)

## Step 4d — Self-Approve Via `gh pr review --approve` (`--yolo` + merit-pass only)

When `--yolo` is set AND Step 4b risk = `low` AND omg-code-reviewer = `approve` AND Step 4c auto-fix succeeded (or wasn't needed), self-approve the PR via real GitHub review BEFORE running the strict gate. This produces an audit trail in the PR's review timeline and lets the unmodified Step 5b strict gate pass naturally.

```bash
gh pr review {n} --repo {REPO} --approve --body "$(cat <<'EOF'
Auto-approved via omg-triage --yolo.

**Merit verdict:** omg-code-reviewer agent returned approve.
**Risk classification:** low ({step-4b justification}).
**Diff:** {N} files changed, {+M -K} lines.
**CI status:** all checks green.
{auto-fix-summary, e.g. "Auto-fix applied: origin-markers (3 files)" — omit if not applicable}

Future maintainers: this approval was generated by triage automation under the low-risk merit gate. GitHub records the review createdAt automatically — see this review's timestamp. To dispute, re-request review or apply the `triage-incorrect` label.
EOF
)"
```

**Self-approve constraints:**
- GitHub does not allow self-approving PRs you authored. Triage MUST check `gh pr view {n} --json author` first; if `author.login` matches the authenticated `gh` user, skip Step 4d entirely and mark `merit-pass-blocked: self-authored` (still defer — human reviewer needed)
- If the approval API call fails (network, rate limit, permission): **leave the auto-fix push in place** (it's net-positive; CI will run on it like any other commit), mark `merit-pass-blocked: approve-api-failed`, and defer to human. Do NOT force-revert — that would destroy a maintainer's commit if they pushed work concurrently. The auto-fix commit becomes part of the PR; a human can choose to keep or revert it during review
- The body must be **constant-shape** per cache-stability rule. The example above uses no live shell substitution (`$(date ...)` removed, heredoc quoted with `'EOF'` to disable interpolation). All variable values like `{step-4b justification}` and `{N}` are placeholders the calling code substitutes BEFORE the heredoc; the resulting body has identical shape across runs (only leaf values change), and section headers stay constant

After successful approval, fall through to Step 5b — `reviewDecision === APPROVED` is now genuinely true and the strict gate proceeds unchanged.

## Step 4e — Active Merge (`--yolo` only, after gate pass)

Yolo does NOT delegate merge to `omg-babysit-pr`. After Step 4d sets the approval and Step 5b passes, triage merges the PR itself in-session. Detail in SKILL.md Step 6c. The short version:

1. **Re-check Step 5b gate** (state may have shifted between approve and merge action — concurrent push, late CI run flip).
2. **Merge** via `gh pr merge {n} --repo {REPO} --squash --delete-branch`. Verify `gh pr view {n} --json state` returns `MERGED`. Record `merged: <merge-commit-sha>` in report.
3. **CI still PENDING?** Poll `statusCheckRollup` every 60s for up to 10 minutes. Merge once green. Timeout → `merge-deferred: ci-timeout-10m`, surface to human.
4. **`mergeStateStatus = BEHIND`?** Fall back to `omg-babysit-pr {n}` (its rebase-then-merge handles BEHIND). Verify final state is MERGED before considering complete.
5. **Merge call fails** (network / branch protection / race) → `merge-blocked: gh-merge-failed: <stderr-excerpt>`, no retry, surface to human.

The `gh pr merge` body and merge-commit message are constant-shape per `agent-security-boilerplate.md` — substitute leaf values, never headers, to keep prompt cache stable across runs.

**Why merge in-session, not delegate:** babysit-pr is a separate skill with separate timing. If triage delegates and returns control to the user, babysit may never run (user moves on, session ends, stop hook fires). User expectation of `--yolo` is "you actually closed the loop." Direct merge satisfies the Completion Contract; delegation breaks it.

## Step 4f — Cook PR Follow-up (`--yolo` only, after `solve` partition)

When `--yolo` runs the `solve` partition, each invoked `omg-cook` returns a new PR URL. Triage's responsibility for those new PRs:

1. **Record** the cook PR URL in the final report under each `solve` item: `solved: PR #{n} {url}`.
2. **Do NOT recursively triage** the new PR in the same session. Bounded depth — recursion can fan out unbounded if cook produces a PR that needs another cook (rare but possible).
3. **Defer to next triage run.** The new PR will be picked up by the next `omg-triage --yolo` invocation via the normal classify → merit → merge flow.
4. If cook fails synchronously (returns `solve-failed: <reason>`), record that instead and surface to human.

This matches the "fork-depth-limit" principle in `rules/agent-security-boilerplate.md` — sub-agent spawns respect the parent's recursion budget. Recording + deferring keeps each triage run bounded and predictable.
