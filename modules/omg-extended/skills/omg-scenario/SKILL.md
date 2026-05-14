---
name: omg-scenario
description: "Generate exhaustive edge cases across 12 dimensions before implementation or testing. Use for 'edge cases for X', 'test scenarios', 'what could go wrong', 'boundary testing'."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Scenario — Edge Case Generation

Generate comprehensive edge cases before implementing or testing a feature. Covers 12 orthogonal risk dimensions.

## Usage

```
omg-scenario "user registration flow"        # All 12 dimensions
omg-scenario --file src/auth/login.ts        # Analyze a specific file
omg-scenario "payment processing" --dimensions 1,2,3,9  # Specific dimensions only
omg-scenario "order API" --for-tests         # Output as test-plan format
```

## 12 Dimensions

| # | Dimension | Focus |
|---|-----------|-------|
| 1 | Auth / Permissions | Who can access, what happens when they can't |
| 2 | Concurrency / Race Conditions | Parallel requests, shared state, locks |
| 3 | Network Failure / Timeout | Partial failures, retries, idempotency |
| 4 | Invalid Input / Boundary Values | Null, empty, overflow, malformed data |
| 5 | i18n / l10n | Unicode, RTL, locale-specific formats |
| 6 | Scale / Volume | Large datasets, high throughput, memory |
| 7 | State Transitions | Invalid state sequences, partial updates |
| 8 | Backward Compatibility | Old clients, schema changes, deprecated paths |
| 9 | Error Cascades | One failure causing downstream failures |
| 10 | Config / Env Variation | Missing env vars, wrong config, multiple envs |
| 11 | Data Integrity | Partial writes, constraint violations, corruption |
| 12 | Observability / Logging | Missing logs, PII leakage, trace gaps |

Detailed scenario lists per dimension: `references/dimension-details.md`

## Output Format (default)

Grouped checklist per dimension with: short description, expected behavior, test approach (unit/integration/E2E).

## --for-tests Flag

Output as test-plan structured for the `omg-tester` agent (tabular format with Test ID, Scenario, Input, Expected, Type).
Pass output directly to `omg-test` as test plan input.

## Gotchas

- **Skip irrelevant dimensions**: A pure CLI tool may not need i18n or auth scenarios — use `--dimensions` to focus
- **Test approach specificity**: Always suggest a concrete test type, not just "test it"
- **Cascades are underspecified**: For dimension 9, always trace the full failure chain, not just the first hop
- **--for-tests output**: Verify test IDs are unique across all suites before passing to omg-tester agent

## Auto-Activation Keywords

Triggers on: `scenario`, `edge cases`, `edge case`, `test scenarios`, `boundary testing`, `what could go wrong`, `risk analysis`, `corner cases`
