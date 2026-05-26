---
name: omg-sync-back
description: "Push .agents/ skill/agent/rule edits back to their origin kit repos as PRs. Use after fixing a skill locally, updating a gotcha, or improving agent definitions."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Sync-Back — Push Changes to Kit Repos

Push `.agents/` changes (skills, agents, rules) back to their origin kit repos as PRs.
Uses GitHub MCP tools — no local clone needed.

## Usage
```
omg-sync-back              # Interactive: show diff, ask confirmation, create PR
omg-sync-back --dry-run    # Show what would change without creating PR
omg-sync-back --force      # Skip confirmation. Diff is ALWAYS shown.
```

## Scope — Consumer Projects Only (MANDATORY)

Do NOT invoke when CWD is a kit source repo (`oh-my-game-kit-core`, `oh-my-game-kit-unity`, `oh-my-game-kit-cli`, `oh-my-game-kit-designer`, `oh-my-game-kit-cocos`, `oh-my-game-kit-rn`, `oh-my-game-kit-web`, `oh-my-game-kit-nakama`, `oh-my-game-kit-release-action`, `omg-telemetry-worker`). Those repos ARE the origin — commit directly. See `references/consumer-guard.md`.

## Invocation Mode (MANDATORY — Background Sub-Agent)

This skill MUST run as a background sub-agent via the `Task` tool, NEVER inline.
**Exception:** explicit user request ("sync this now") → run inline so the diff is visible.

See `references/sub-agent-invocation.md` for the required Task call template, required fields (`kitVersion`, `moduleVersion`, `cliVersion`, `platform`, `rationale`), and the auto-lesson writeback protocol (`submitted: true`, `prUrl`, `fingerprint`).

## Decision tree — which reference do I load?

Load only the reference you need (each is self-contained):

| Intent | Load |
|--------|------|
| Check if CWD is a consumer project (first step, always) | `references/consumer-guard.md` |
| Sub-agent invocation template + auto-lesson writeback contract | `references/sub-agent-invocation.md` |
| Pre-flight checks (MCP, repo access, staleness detection) | `references/preflight-checks.md` |
| Resolve file origin + compute target path in kit repo | `references/routing-and-paths.md` |
| Open the PR (branch → push → create, fork flow, PR body template) | `references/open-pr.md` |
| Writeback `submitted: true` to the lesson queue | `references/queue-writeback.md` |
| Error table, cross-platform notes, what gets synced / excluded | `references/error-handling.md` |

## Operational notes

- **Scan BOTH user-scope and project-scope.** Walk `$HOME/.agents/` AND `<cwd>/.agents/` when collecting candidate files. Project-scope modules/skills (e.g., a wiki repo shipping its own module) are invisible if you only scan user-scope. See `references/routing-and-paths.md` Step 0 for the rules. Originating incident: #168.
- **Pre-flight: requires omg CLI v4.17.0+.** The `require-current-cli.cjs` PreToolUse hook will block stale-CLI invocations of `omg sync-back` (and other state-mutating commands) when the cached `latest` version is newer than the local binary. Run `omg self-update` first if the gate fires; override (NOT recommended) is `OMG_REQUIRE_CURRENT_CLI=0`.
- Run pre-flight checks BEFORE any file write — verify GitHub MCP is connected.
- Staleness check is MANDATORY. Never push a stale branch silently.
- Module-registry-sync: if the edit touches `module.json`, the sub-agent must also regenerate `omg-modules.json` in the kit repo (gate #validate-modules-registry-sync).
- **Skill-rename + activation-fragment sync (2026-05-11)** — when a sync-back diff includes a skill directory rename (e.g., `omg-rn-rn-base-old` → `omg-rn-rn-base-new`), the sub-agent must ALSO update every `omg-activation-*.json` fragment whose `sessionBaseline[]` or `mappings[].skills[]` references the old slug. Bare-slug refs (`old`) and full-prefixed refs (`omg-rn-rn-base-old`) both need to swap. The release-action prefixer's `buildSelfHealMap()` will catch the rename on the next CI run, but shipping the activation update in the same PR keeps the SSOT consistent and avoids the per-PR drift safety-net gate (`validate-activation-skill-resolution.cjs`) firing on subsequent unrelated PRs against the kit. If unsure which fragments reference the renamed skill, grep: `grep -rE '"(old-slug|omg-...-old-slug)"' .agents/`.
- PR is created; NOT automerged. End every invocation by reporting the PR URL and noting "review + merge in the kit repo."
- **Security:** never sync `.env`, `settings.local.json`, memory files, or files with secrets. Sanitize absolute paths before writing.
- **Skill-touching syncs MUST consult `omg-skill-creator`.** If any path in the diff matches `.agents/skills/*/SKILL.md` or `.agents/skills/*/references/*.md`, the sub-agent invokes `omg-skill-creator` to validate Skillmark structure (frontmatter shape, line-count cap from gate 2, description cap from gate 3, decision-tree pattern) BEFORE opening the PR. Validation failures block the PR; warnings surface in the PR body so the maintainer reviewer sees them.
- **Naming-prefix gate on creates AND renames.** If the diff CREATES or RENAMES a skill directory or agent file, the sub-agent MUST verify the new name conforms to the universal `omg-` prefix rule (`rules/naming-convention.md`): core = `omg-{slug}`, kit-wide = `omg-{kit}-{slug}`, module-scoped = `omg-{kit}-{module}-{slug}`. Frontmatter `name:` MUST match the directory/file basename. Non-conforming names will fail `validate-skill-prefix.cjs` / `validate-agent-prefix.cjs` at PR time — catch them here and reject the sync-back with a clear error message instead of opening a PR that will block on CI. Agent rename gap (2026-05-08): `auto-prefix-agents.cjs` does NOT rewrite per-module `module.json` `agents`/`routingOverlay` fields, so the sync-back sub-agent must hand-update both manifests when renaming agents.

## Contribution Scoring

After successful PR creation, invoke `omg-contribution-score` with `type=sync-back-pr`, the resolved `ref_url` (the PR URL returned by `gh pr create`), the PR title + description, and the target kit/repo. Fire-and-forget — never block on the result.

See `.agents/skills/omg-contribution-score/SKILL.md` for the full invocation contract (rubric, endpoint resolution, POST contract). Do NOT inline rubric or POST logic here — the SSOT lives in that skill.
