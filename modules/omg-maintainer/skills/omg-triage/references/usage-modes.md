---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---

# Triage usage modes — full reference

This file documents the full mode/flag matrix. SKILL.md keeps a compressed version; this file keeps the safety contracts in long form.

## Modes

```
omg-triage              # AUTO (default) — report then act, then verify terminal state per item:
                         #   decision=solve  → omg-cook --auto --parallel; record cook PR URL
                         #   decision=merge  → omg-babysit-pr {n} per PR
                         #                     (only when triage's strict gate passes — Step 5b)
                         #   decision=close  → comment with reason + gh issue/pr close
                         #   decision=defer  → comment listing missing fields (no merge / no cook)
                         # Triage is "done" only after Step 7 verifies every item reached a terminal state.
omg-triage --ask        # Old interactive mode — report + AskUserQuestion per partition before acting
omg-triage --dry-run    # Report only, no action (overrides default auto, skips Step 7)
omg-triage --ecosystem  # Maintainer mode — scan ALL OMG repos. Composable with --ask / --dry-run / --yolo
omg-triage --yolo       # Maximum autonomy — investigate deeply, decide, MERGE in-session.
                         #   merge: gh pr merge after self-approve + Step 5b gate (Step 6c)
                         #   solve: cook + record PR URL; defer follow-up triage to next run
                         #   See Step 6b (decision matrix), Step 6c (active merge), Step 7 (DoD)
omg-triage --auto       # Deprecated alias for default. For full autonomy use --yolo
```

## Default-auto safety contract

The strict Step 5b auto-merge gate is what makes default-auto safe. Triage NEVER merges a PR that fails the gate, and the gate is intentionally stricter than `omg-babysit-pr`'s standalone policy (no auto conflict resolution at the triage level — even simple frontmatter conflicts are deferred to a human). If you need a softer threshold, run `--ask` and act manually.

## `--yolo` mode safety contract

Yolo intentionally lowers the human-checkpoint gates so triage acts on items default-auto would defer. To compensate, every gate-bypass is replaced by a structured AI investigation step — omg-code-reviewer agent verdict for merges, blocker-resolution check for tracking issues, omg-planner+cook chain for large issues. Yolo NEVER bypasses correctness invariants (`mergeable: MERGEABLE`, green checks, `infoStatus != insufficient`, credential redaction, skill-file validation). See `references/yolo-merit-pipeline.md` and `references/yolo-decision-matrix.md` (`Step 6b`).

## Completion contract

Triage finishes only when every classified item is in a terminal state. Default-auto and `--yolo` both enforce Step 7 (Definition of Done): no item may be left "in flight" when triage reports completion.

| Decision | Terminal state |
|---|---|
| `merge` | PR `MERGED` in GitHub OR `merge-blocked: <reason>` recorded |
| `solve` | Cook PR URL recorded OR `solve-failed: <reason>` recorded |
| `close` | Issue/PR `CLOSED` in GitHub |
| `defer` | Missing-fields comment posted (Step 2d) |

In `--yolo`, triage actively performs merges itself via `gh pr merge` (does NOT delegate to `omg-babysit-pr`) and polls pending CI with a 10-minute bounded timeout. See `references/completion-verification.md` for the full protocol.

## `--ecosystem` mode (maintainer only)

Scans ALL Oh My Game Kit repos regardless of which project you're in. Discovers repos by scanning the OMG parent directory for cloned kit repos, then reads each repo's `omg-config-*.json` for the `repos.primary` value.

**Discovery algorithm:**
1. Find OMG parent dir: walk up from CWD looking for sibling `oh-my-game-kit-*` directories. Fallback: `/mnt/Work/1M/8. OneAI/` (documented OMG root)
2. List all `oh-my-game-kit-*` directories + `omg-*` directories in parent
3. For each directory: read `$HOME/.agents/omg-config-*.json` → extract `repos.primary`
4. Also include hardcoded known repos not yet cloned:
   ```
   The1Studio/oh-my-game-kit-core
   The1Studio/oh-my-game-kit-cli
   The1Studio/oh-my-game-kit-unity
   The1Studio/oh-my-game-kit-designer
   The1Studio/oh-my-game-kit-cocos
   The1Studio/oh-my-game-kit-rn
   The1Studio/oh-my-game-kit-web
   The1Studio/oh-my-game-kit-nakama
   The1Studio/oh-my-game-kit-release-action
   ```
5. Deduplicate, fetch issues/PRs from all in parallel
6. Report grouped by repo, then by priority

**Note:** This mode fetches from GitHub directly — repos don't need to be cloned locally. The local scan is just for discovering additional repos beyond the hardcoded list.

## `--yolo` flag composition

- `--yolo --dry-run` → run full investigation (omg-code-reviewer verdicts, blocker checks, plan generation) but take ZERO actions. Reports what yolo WOULD do. Use this to preview yolo decisions before running it live
- `--yolo --ask` → INVALID. Error out immediately: yolo means no human prompts; --ask is the opposite
- `--yolo --ecosystem` → yolo across all OMG repos. Maximum blast radius. Recommended only for trusted scheduled automation