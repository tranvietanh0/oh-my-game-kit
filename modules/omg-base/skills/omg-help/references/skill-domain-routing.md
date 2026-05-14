---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
<!-- omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=null | protected=true -->

# Skill Domain Routing (OMG Core)

Intent-based discovery for OMG core skills. This file augments keyword-based activation with natural-language intent matching.

**How to use:** When the user's request matches an intent row, prefer the listed skill(s). This is advisory — the agent still has final authority.

For kit-specific intents (Unity, Cocos, web, etc.), see the kit-level `skill-domain-routing-{kit}.md` fragment.

For workflow chains (multi-step intents like "plan then implement"), see `skill-workflow-routing.md`.

## Planning & Architecture

User wants to...
- Break a task into phases with tasks → `omg-plan`
- Explore options before committing to an approach → `omg-brainstorm`
- Apply structured sequential reasoning through a complex problem → `omg-think`
- Debate via 5 expert personas before coding → `omg-predict`
- Generate edge cases or risk scenarios for a feature → `omg-scenario`
- Ask a technical question or get authoritative guidance → `omg-ask`

## Implementation

User wants to...
- Build a feature end-to-end (plan → code → test → review) → `omg-cook`
- Execute an existing plan phase → `omg-cook <plan-path>`
- Implement with test-driven discipline → `omg-cook --tdd`
- Architecture-critical deep planning before touching code → `omg-plan --deep`

## Debugging & Fixing

User wants to...
- Investigate a runtime error or unexpected behavior (root cause only) → `omg-debug`
- Fix a bug, test failure, or CI error → `omg-fix`
- Fix type errors, lint issues, or trivial compile errors → `omg-fix --quick`
- Get unstuck from a recurring bug or complexity spiral → `omg-problem-solve`
- Run exhaustive edge case generation before fix → `omg-scenario`

## Testing & Review

User wants to...
- Run the test suite and analyze failures → `omg-test`
- Adversarial code review with rigor → `omg-review`
- Security audit (STRIDE, OWASP Top 10) → `omg-security`

## Codebase Exploration

User wants to...
- Find files, code, or usages across the codebase → `omg-scout`
- Discover which skill handles a topic → `omg-find-skill`
- Explain code visually with diagrams or slides → `omg-preview`

## Documentation

User wants to...
- Create, update, or init project docs → `omg-docs`
- Generate visual previews, slides, or architecture diagrams → `omg-preview`
- Save session context for a handoff → `omg-handoff`

## Git & Release

User wants to...
- Stage and commit changes with conventional commit format → `omg-git cm`
- Full shipping pipeline (test → review → merge → tag) → `omg-ship`
- Create a pull request → `omg-git pr`
- Monitor a PR until it goes green and merges → `omg-babysit-pr`
- Manage git worktrees for parallel development → `omg-worktree`

## Kit & Registry Management

User wants to...
- Validate kit integrity across all doctor checks → `omg-doctor`
- Manage optional skill modules (add, remove, list, update) → `omg-modules`
- Kit maintenance operations (release, scaffold, audit, migrate) → `omg-kit`
- Triage GitHub issues and PRs across kit repos → `omg-triage`
- File a skill or agent bug report to the owning kit repo → `omg-issue`
- Sync local skill edits back to the origin kit repo → `omg-sync-back`
- Create or update a OMG skill → `omg-skill-creator`
- Create or update a OMG agent → `omg-agent-creator`

## Session & Context

User wants to...
- Review what was done this session / wrap up → `omg-watzup`
- See the full usage guide with live registry state → `omg-help`
- Optimize context window and token usage → `omg-context`

## Multi-Agent Orchestration

User wants to...
- Orchestrate parallel multi-session teammates → `omg-team`

## Notes

- For any intent not listed here, fall back to keyword-based activation via `omg-activation-*.json`
- Kit-specific intents (Unity, Cocos, web, RN, designer) live in their own `skill-domain-routing-{kit}.md`
- Combine with workflow chains: `omg-plan` → `omg-cook` → `omg-test` → `omg-review`
