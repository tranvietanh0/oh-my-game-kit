---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: editor
protected: false
---
# CK Baseline

- **CK Version**: v2.13.0
- **Baseline Date**: 2026-03-21
- **GameKit Version**: 1.0.0

## Forked Skills (reimplemented as omg-*)

| CK Skill | GK Skill | CK Skill Version |
|---|---|---|
| `cook` | `omg-cook` | 2.1.1 |
| `plan` | `omg-plan` | — |
| `test` | `omg-test` | 1.0.0 |
| `debug` | `omg-debug` | 4.0.0 |
| `fix` | `omg-fix` | 1.2.0 |
| `code-review` | `omg-review` | — |
| `docs` | `omg-docs` | — |
| `git` | `omg-commit` + `omg-push` | 1.0.0 |
| `brainstorm` | `omg-brainstorm` | 2.0.0 |

## Direct-Use Skills (no fork, use CK as-is)

These CK skills are universal and work for game projects without modification:
- `simplify`

## GK-Only Universal Commands (no CK equivalent needed)

- `omg-scout` (wraps Explore agent with game context)
- `omg-ask` (wraps AskUserQuestion with game skill activation)
- `omg-watzup` (wraps git log + MCP console + TaskList)
- `journal`, `kanban`, `preview`, `sequential-thinking`
- `find-skills`, `ck-help`, `coding-level`, `worktree`

## GK-Only Skills (no CK equivalent)

- `omg-scene`, `omg-playtest`, `omg-balance`, `omg-profile`
- `omg-milestone`, `omg-wiki`, `omg-sync`, `omg-help`

## Sync Instructions

Run `omg-unity:editor:sync` to compare current CK skills against this baseline.
Update this file after incorporating CK changes.
