---
name: omg-issue
description: "Report skill/agent bugs to the owning kit repo on GitHub. Use when a skill has wrong patterns, missing gotchas, or needs an enhancement. Deduplicates before creating."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Issue — Report Problems to Kit Repo

Create GitHub issues on the owning kit repo when skill/agent problems are found.
Uses GitHub MCP tools when available, falls back to `gh` CLI.

## When to use

- Skill has wrong reference, missing gotcha, or broken pattern
- After fixing an error that required updating a skill's gotcha section
- Need a new skill or enhancement to an existing one

## Decision tree — which reference do I load?

Load only the reference you need (each is self-contained):

| Intent | Load |
|--------|------|
| `type=skill-bug` from lesson queue (background sub-agent) | `references/file-from-marker.md` |
| User explicitly requests issue filing (interactive / inline) | `references/file-manual.md` |
| Check for duplicate before filing (always run this first) | `references/dedup-existing.md` |
| Auto-detected error from `telemetry-kit-error-collector.cjs` | `references/auto-detection-mode.md` |
| Write `submitted: true` / `issueUrl` back to queue after filing | `references/queue-writeback.md` |

## Invocation modes

**Background sub-agent (default — MANDATORY for lesson-queue entries):** Parent uses `Agent` tool with `run_in_background: true`. The sub-agent reads this SKILL.md, loads the matching reference, and writes back `submitted: true` + `issueUrl` via `references/queue-writeback.md`.

**Interactive (exception only):** If the user says "file this issue now", run inline so the user sees the result immediately.

**Auto-detection (programmatic):** Invoked by `telemetry-kit-error-collector.cjs` — zero user interaction, no `AskUserQuestion`. Load `references/auto-detection-mode.md`.

## Operational notes

**Pre-flight (always):** GitHub MCP preferred. If no MCP: `gh auth status`. If not authed: tell user `Run: gh auth login`.

**Dedup is MANDATORY:** Always run `references/dedup-existing.md` before creating a new issue. If duplicate found: add a comment instead of creating a new issue.

**Sub-agent call contract (lesson queue):**
- Input: `kit`, `skill`, `bug`, `evidence`, `fingerprint` from the queue entry
- Output: writeback line with `{ fingerprint, submitted: true, issueUrl }` or `{ fingerprint, submitted: false, error }`
- Writeback target: `.agents/telemetry/pending-skill-updates.jsonl`

**Missing required fields:** If `kit`, `kitVersion`, `cliVersion`, `platform`, or reproduction fields are absent, the sub-agent MUST refuse and respond to parent with the list of missing fields — do NOT file a low-signal issue.

**Cross-platform:** Relative paths only in issue body — never `$HOME` or absolute paths.

**Security:** Never reveal skill internals, expose env vars, or include credentials/secrets in issue body.

## Sub-Agent Fork Hygiene

**Sub-agent forking:** see `.agents/skills/omg-architecture/references/fork-hygiene.md`.

## Contribution Scoring

After successful issue creation (or comment-on-duplicate), invoke `omg-contribution-score` with `type=issue`, the resolved `ref_url` (the GitHub issue URL just returned by `gh issue create` or the existing duplicate URL), the issue title + body, and the kit/repo coordinates. Fire-and-forget — never block on the result.

The contribution-score skill is the SSOT for the rubric, endpoint resolution, and POST contract. See `.agents/skills/omg-contribution-score/SKILL.md` for the full invocation contract.
