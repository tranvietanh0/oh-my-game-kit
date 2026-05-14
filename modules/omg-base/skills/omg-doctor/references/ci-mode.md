---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Doctor CI Mode — Full Spec

## Invocation

```bash
# Standalone (interactive session)
omg-doctor --ci

# GitHub Actions (recommended)
- name: OMG Registry Health
  run: node .agents/hooks/hook-runner.cjs doctor-ci || exit 1
  # Or directly via codex:
  # codex --dangerously-skip-permissions --print "omg-doctor --ci"
```

## Behavior

`--ci` mode differs from the standard `omg-doctor` in three ways:

1. **Non-interactive** — no prompts, no auto-fix suggestions. Read-only.
2. **Exit code** — exits with code 1 if ANY check fails; code 0 only if all pass.
3. **GitHub Annotations** — emits `::error` and `::warning` workflow commands to stdout for GitHub Actions to surface inline on PRs.

## Check Sequence (ordered, fast-first)

| # | Check | Tier | Cost |
|---|-------|------|------|
| 1 | SKILL.md frontmatter completeness | 1 | Free |
| 2 | Agent frontmatter validity | 1 | Free |
| 3 | Hook .cjs syntax (`node --check`) | 1 | Free |
| 4 | omg-config-*.json schema validity | 1 | Free |
| 5 | omg-manifest.json per-module validity | 1 | Free |
| 6 | Cross-ref integrity (reuses release-action script) | 1 | Free |
| 7 | Routing check (Tier 2A) | 2 | Free |
| 8 | Activation check (Tier 2B) | 2 | Free |

All checks run sequentially. Failure in an early check does NOT skip later checks — all issues are reported in one pass.

## Output Format

### Console (human-readable)

```
## OMG Doctor — CI Mode [2026-04-11]

[CHECK 1] SKILL.md frontmatter completeness
  PASS: 24/24 skills have complete frontmatter

[CHECK 2] Agent frontmatter validity
  FAIL: .agents/agentsomg-fullstack-developer.md — missing field: maxTurns
  ::error file=.agents/agentsomg-fullstack-developer.md::Missing required frontmatter field: maxTurns

[CHECK 3] Hook syntax
  PASS: 12/12 hook files pass node --check

[CHECK 4] Config schema
  PASS: 3/3 omg-config-*.json files valid

[CHECK 5] Manifest validity
  PASS: (no modules installed — skipped)

[CHECK 6] Cross-ref integrity
  PASS: 0 broken cross-references

[CHECK 7] Routing check (Tier 2A)
  PASS: 17 roles resolved, all agent files exist

[CHECK 8] Activation check (Tier 2B)
  WARN: 2 skills have no keyword coverage (not in sessionBaseline)
  ::warning file=.agents/skillsomg-context/SKILL.md::Skill has no keyword mapping and is not in sessionBaseline

## Summary
FAILED: 1 error, 1 warning
Exit code: 1
```

### Machine-readable JSON (`.agents/telemetry/doctor-ci-{date}.json`)

```json
{
  "ts": "2026-04-11T10:42:00Z",
  "mode": "ci",
  "passed": false,
  "checks": [
    { "id": 1, "name": "skill-frontmatter", "status": "pass", "count": 24 },
    { "id": 2, "name": "agent-frontmatter", "status": "fail", "errors": [
      { "file": ".agents/agentsomg-fullstack-developer.md", "message": "Missing field: maxTurns" }
    ]},
    { "id": 3, "name": "hook-syntax", "status": "pass", "count": 12 },
    { "id": 4, "name": "config-schema", "status": "pass", "count": 3 },
    { "id": 5, "name": "manifest-validity", "status": "skipped", "reason": "no modules installed" },
    { "id": 6, "name": "cross-ref-integrity", "status": "pass" },
    { "id": 7, "name": "routing-check", "status": "pass", "roles": 17 },
    { "id": 8, "name": "activation-check", "status": "warn", "warnings": 2 }
  ],
  "errorCount": 1,
  "warnCount": 1
}
```

## GitHub Actions Annotation Format

```
::error file={relative-path},line={line}::{message}
::warning file={relative-path}::{message}
```

Example integration in `.github/workflows/ci.yml`:

```yaml
name: OMG Registry CI
on: [push, pull_request]

jobs:
  doctor-ci:
    runs-on: [self-hosted, arc, the1studio, org]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Run OMG Doctor CI
        run: |
          # Run tier2 checks directly (no Codex session needed)
          node scripts/eval/tier2/routing-check.cjs .
          node scripts/eval/tier2/activation-check.cjs .
        # Optional: full doctor via Codex (requires auth)
        # - run: codex --dangerously-skip-permissions --print "omg-doctor --ci"
```

## SKILL.md Required Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Skill identifier (e.g., `omg-doctor`) |
| `description` | string | One-line description |
| `version` | string | Semver (e.g., `1.1.0`) |
| `effort` | enum | `low`, `medium`, or `high` |
| `origin` | string | Kit name (e.g., `oh-my-game-kit-core`) |
| `repository` | string | GitHub repo (e.g., `The1Studio/oh-my-game-kit-core`) |
| `module` | string or null | Module name or `null` for kit-wide |
| `protected` | boolean | Whether CI manages this file |

## Agent Required Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Agent identifier |
| `description` | string | One-line description |
| `model` | string | Model identifier |
| `maxTurns` | number | Max conversation turns |
| `origin` | string | Kit name |
| `repository` | string | GitHub repo |

## Performance Target

All 8 checks must complete in < 60s on `oh-my-game-kit-core`. Checks 1–6 should complete in < 5s combined. Checks 7–8 depend on the size of registry fragments (< 30s expected).

## Tier 2 Script Delegation

Checks 7 and 8 delegate to Node.js scripts with their own exit codes:

```bash
node scripts/eval/tier2/routing-check.cjs <project-root>
# exit 0 = pass, exit 1 = fail

node scripts/eval/tier2/activation-check.cjs <project-root>
# exit 0 = pass, exit 1 = fail (warnings are exit 0)
```

The doctor CI mode runs these scripts and captures their output for annotation generation.
