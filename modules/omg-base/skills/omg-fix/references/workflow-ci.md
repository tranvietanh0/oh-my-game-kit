---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# CI/CD Fix Workflow

For GitHub Actions failures and CI/CD pipeline issues.

## Prerequisites
- `gh` CLI installed and authorized
- GitHub Actions URL or run ID

## Workflow

1. **Fetch logs** with `omg-debugger` agent:
   ```bash
   gh run view <run-id> --log-failed
   gh run view <run-id> --log
   ```

2. **Analyze** root cause from logs

3. **READ the failing validator/gate source — do NOT guess from the error string** (see "Gate Fix Gotcha" below)

4. **Implement fix** based on what the validator actually enforces

5. **Test locally** with `omg-tester` agent before pushing

6. **Iterate** if tests fail, repeat from step 3

## Notes
- If `gh` unavailable, instruct user to install: `gh auth login`
- Check both failed step and preceding steps for context
- Common issues: env vars, dependencies, permissions, timeouts

## Gate Fix Gotcha — Read the Validator, Not the Error

**Rule:** When a CI gate fails with a `[SHAPE-INCONSISTENCY]`, `[INVALID]`, `[SCHEMA]`, `[UNKNOWN-SHAPE]`, or any structured-data validation error, you MUST locate and read the validator script before writing the fix. **Never infer the schema from the error string alone.**

**Where validators live:**
- OMG release gates: `oh-my-game-kit-release-action/scripts/validate-*.cjs`
- Doctor checks: `oh-my-game-kit-core/.agents/hooks/doctor/*.cjs`
- Other gates: `.github/workflows/*.yml` → grep the failing job name → trace to the `node ... .cjs` invocation

**Why guessing fails (real 2026-04-27 incident — 2 wasted iterations on PR #117/#118):**

| Iteration | Fix applied | Result |
|---|---|---|
| 1 | Error said `schemaVersion:3 requires installedModules` → added `installedModules: []` | **Failed**: validator actually requires object. Worse, the iteration-1 handoff doc was written with wrong info, anchoring the next session. |
| 2 | Re-read same error, reread own handoff note → still wrong | **Failed**: same gate, same error, different shape needed |
| 3 | Read `validate-metadata-shape.cjs` line 94: `typeof !== 'object' \|\| Array.isArray()` — schema requires OBJECT (map of `module_name → version`) | **Passed** |

**The validator's own error message contained the answer** (`installedModules must be an object, got array`) but iteration 1 only saw the FIRST gate failure (missing field) and never read the script that would have flagged the type. Reading the validator surfaces all enforced invariants at once.

**Don't trust handoff notes for schema facts.** Handoff documents preserve session context, not validated truth. If a handoff says "X must be Y" and Y looks like a guess (no link to source code, no `parse-X.cjs:line`), verify against the validator before applying.

**Workflow when fixing a structured-data gate:**

1. From error: identify the validator name (e.g., `validate-metadata-shape`)
2. `find` it in `oh-my-game-kit-release-action/scripts/` or the kit's hooks
3. `grep -n "<field-name>"` the validator to surface ALL enforced shape rules at once
4. Write the fix to satisfy ALL rules (not just the one that fired)
5. If you also captured the lesson in a handoff, **re-verify schema facts against the validator on resume** — don't compound the error.
