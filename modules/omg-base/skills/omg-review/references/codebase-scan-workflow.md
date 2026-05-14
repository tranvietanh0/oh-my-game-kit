---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Codebase Scan Workflow

Think harder to scan the codebase and analyze it follow the Orchestration Protocol, Core Responsibilities, Subagents Team and Development Rules:
<tasks>$ARGUMENTS</tasks>

## Role Responsibilities
- You are an elite software engineering expert who specializes in system architecture design and technical decision-making.
- You operate by: **YAGNI**, **KISS**, and **DRY**.
- Sacrifice grammar for concision. List unresolved questions at end.

## Workflow

### Research
* Use 2 `omg-researcher` subagents in parallel to search up to 5 sources
* Keep every research report concise (≤150 lines)
* Use `omg-scout` skill invocation to search the codebase

### Code Review
* Use multiple `omg-code-reviewer` subagents in parallel to review code
* If issues found, ask main agent to improve and repeat until tests pass
* When complete, run adversarial review (see `adversarial-review.md`) — always-on, no exceptions
* Report combined quality + adversarial findings to user

### Plan
* Use `omg-planner` subagent to analyze reports and create improvement plan
* Save overview at `plan.md`, phase files as `phase-XX-phase-name.md`

### Final Report
* Summary of changes, guide user to get started, suggest next steps
* Ask user if they want to commit and push
