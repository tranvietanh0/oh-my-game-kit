---
name: omg-review
description: "Code review via registry-routed reviewer agent. Adversarial, evidence-based. Inputs: pending changes, PR, commit hash, or codebase scan. Finds security holes, false assumptions, failure modes."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Review — Code Review

Adversarial code review with technical rigor, evidence-based claims, and verification over performative responses. Every review includes red-team analysis that actively tries to break the code.

## Agent Routing

Follow protocol: `.agents/skills/omg-cook/references/routing-protocol.md`
This command uses role: `reviewer`

## Input Modes

| Input | Mode | What Gets Reviewed |
|-------|------|--------------------|
| `#123` or PR URL | **PR** | Full PR diff fetched via `gh pr diff` |
| `abc1234` (7+ hex chars) | **Commit** | Single commit diff via `git show` |
| `--pending` | **Pending** | Staged + unstaged changes via `git diff` |
| *(no args, recent changes)* | **Default** | Recent changes in context |
| `codebase` | **Codebase** | Full codebase scan |
| `codebase parallel` | **Codebase+** | Parallel multi-reviewer audit |

If invoked WITHOUT arguments and no recent changes, use `AskUserQuestion` — details: `references/input-mode-resolution.md`

## Core Principle

**YAGNI**, **KISS**, **DRY** always. Technical correctness over social comfort.
Verify before implementing. Ask before assuming. Evidence before claims.

## Skill Activation

Follow protocol: `.agents/skills/omg-cook/references/activation-protocol.md`

## Practices

| Practice | When | Reference |
|----------|------|-----------|
| **Spec compliance** | After implementing from plan/spec, BEFORE quality review | `references/spec-compliance-review.md` |
| **Adversarial review** | Always-on Stage 3 — actively tries to break the code | `references/adversarial-review.md` |
| Receiving feedback | Unclear feedback, external reviewers, needs prioritization | `references/code-review-reception.md` |
| Requesting review | After tasks, before merge, stuck on problem | `references/requesting-code-review.md` |
| Verification gates | Before any completion claim, commit, PR | `references/verification-before-completion.md` |
| Edge case scouting | After implementation, before review | `references/edge-case-scouting.md` |
| **Checklist review** | Pre-landing, `omg-ship` pipeline, security audit | `references/checklist-workflow.md` |
| **Task-managed reviews** | Multi-file features (3+ files), parallel reviewers, fix cycles | `references/task-management-reviews.md` |
| **Skill review (auto)** | Diff includes `.agents/skills/*/SKILL.md` or `.agents/skills/*/references/*.md` | invoke `omg-skill-creator` (owns Skillmark + decision-tree + line-cap conventions) |
| **Agent review (auto)** | Diff includes `.agents/agents/*.md` | invoke `omg-agent-creator` (owns canonical agent frontmatter + maxTurns/model) |

## Three-Stage Review Protocol

**Stage 1 -- Spec Compliance** → `references/spec-compliance-review.md`
**Stage 2 -- Code Quality** (registry-routed reviewer agent) — runs AFTER Stage 1 passes
**Stage 3 -- Adversarial Review** → `references/adversarial-review.md` — ALWAYS-ON

Full decision tree and workflows: `references/review-workflows.md`

## Generic Review Checklist

- [ ] No hardcoded values
- [ ] Error handling present
- [ ] No unnecessary complexity (YAGNI/KISS)
- [ ] No duplication (DRY)
- [ ] Security: no secrets, credentials, or sensitive data
- [ ] Tests present for new functionality

Project-type checklists: `references/checklists/base.md`, `references/checklists/api.md`, `references/checklists/web-app.md`

## Subagent Skill Injection

Follow protocol: `.agents/skills/omg-cook/references/subagent-injection-protocol.md`

## Sub-Agent Fork Hygiene

**Sub-agent forking:** see `.agents/skills/omg-architecture/references/fork-hygiene.md`.
