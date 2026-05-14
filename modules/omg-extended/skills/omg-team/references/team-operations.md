---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Team Operations

## Tool Reference

### Agent Tool (spawn teammates)

```
Agent(
  subagent_type: "<registry-resolved-type>",
  description: "short task summary",
  prompt: "full instructions + OMG Context Block",
  model: "opus",                    # Required for Agent Teams teammates
  run_in_background: true,          # Non-blocking spawn
  isolation: "worktree"             # Git worktree isolation (cook devs)
)
```

**Note:** `Task` was renamed to `Agent` in v2.1.63. Both names work; prefer `Agent` for new code.

**Teammate budget ceiling (MANDATORY):** Teammates spawned via `Agent` hit a hard **~47-52 tool-use ceiling** and terminate mid-thought (no explicit error). Design teammate tasks for ≤40 tool uses each. Commit per task, not per batch, so partial progress survives a wall-hit. Full gotcha list in `omg-cook/references/subagent-patterns.md` → "Gotchas & Budgeting" section.

### Team Management Tools

| Tool | Purpose | Params |
|------|---------|--------|
| `TeamCreate` | Create team + shared task list | `team_name`, `description` |
| `TeamDelete` | Remove team resources | *none* |
| `TaskCreate` | Create work item | `subject`, `description`, `priority`, `addBlockedBy`, `addBlocks` |
| `TaskUpdate` | Claim/complete task | `taskId`, `status`, `owner`, `metadata` |
| `TaskGet` | Full task details | `taskId` |
| `TaskList` | All tasks (minimal fields) | *none* |
| `SendMessage` | Inter-agent messaging | `type`, `to`/`recipient`, `message` |

### SendMessage Types

| Type | Purpose |
|------|---------|
| `message` | DM to one teammate (requires `recipient`) |
| `broadcast` | Send to ALL teammates (use sparingly) |
| `shutdown_request` | Ask teammate to gracefully exit |
| `shutdown_response` | Teammate approves/rejects shutdown (requires `request_id`) |
| `plan_approval_response` | Lead approves/rejects teammate plan (requires `request_id`) |

## --delegate Mode

When `--delegate` flag is passed:
- Lead ONLY: spawns teammates, manages tasks, sends messages, synthesizes reports
- Lead NEVER: edits files, runs tests, executes git commands directly
- For cook Step 6 MERGE: spawn a dedicated merge teammate instead of lead doing it

## OMG Differentiators (vs CK `/team`)

| Aspect | CK `/team` | OMG `omg-team` |
|--------|-----------|------------------|
| Role resolution | Hardcoded `subagent_type` | Registry-routed via `omg-routing-*.json` |
| Skill injection | None | Module-scoped per `subagent-injection-protocol.md` |
| File ownership | Manual glob patterns | Auto-derived from `.omg-manifest.json` |
| Worktree | Optional | Mandatory for cook/debug |
| Module boundaries | Not checked | Reviewed for violations |
| Triage | Not available | Parallel cross-repo processing |

## Display Modes

| Mode | How | When |
|------|-----|------|
| `auto` (default) | Split panes if in tmux, otherwise in-process | Default |
| `in-process` | All in one terminal. `Shift+Up/Down` navigate. `Ctrl+T` task list. | No tmux |
| `tmux/split` | Each teammate gets own pane. Requires tmux or iTerm2. | Recommended for cook/debug |

Override with `--teammate-mode in-process` or `--teammate-mode split`.
**Incompatible:** Windows Terminal, basic SSH, serial consoles.

## Monitoring & Event Lifecycle

**Event order per teammate:**
```
SubagentStart -> [work...] -> TaskCompleted -> SubagentStop -> TeammateIdle
```

**Primary:** Event-driven hooks — TaskCompleted and TeammateIdle events auto-notify the lead.
**Fallback:** TaskList poll every 60s if no events received.
**Stuck:** If teammate unresponsive >5 min, SendMessage directly. If still stuck, shutdown and replace.

## Cross-Session Memory

Teammates retain learnings in `~/.agents/agent-memory/<name>/` (persists after TeamDelete).

Add `memory: project` to teammate's agent definition frontmatter. First 200 lines of `MEMORY.md` auto-injected at start.

## Worktree Isolation (Cook Template)

`isolation: "worktree"` gives each dev:
- **Own git worktree** — isolated working directory, staging area, HEAD
- **Own branch** — auto-created, returned in agent result
- **No file conflicts** — devs can edit same files independently

After all devs complete, lead merges branches sequentially.

## Token Budget Estimates

| Template | Teammates | Estimated Tokens |
|----------|-----------|-----------------|
| Research (3) | 3 | ~150K-300K |
| Review (3) | 3 | ~100K-200K |
| Cook (auto) | 2-5 | ~400K-800K |
| Debug (3) | 3 | ~200K-400K |
| Triage | 2-4 | ~200K-400K |

## Error Recovery

1. **Check status:** `Shift+Up/Down` (in-process) or click pane (split). Or TaskList.
2. **Redirect:** SendMessage with corrective instructions to specific teammate
3. **Replace:** Shutdown failed teammate, spawn replacement for same task
4. **Reassign:** TaskUpdate stuck task to unblock dependents
5. **Abort:** SendMessage(type: "shutdown_request") to all, then TeamDelete

## Abort & Cleanup

```
1. SendMessage(type: "shutdown_request") to each teammate
2. Wait for shutdown_response (or timeout 30s)
3. TeamDelete (no parameters)
4. tmux kill-pane for each teammate split (MANDATORY in split mode)
```

**Step 4 is non-optional in `split`/`tmux` display mode.** TeamDelete only releases team metadata — it does NOT close the tmux panes that teammates ran in. The panes remain as idle zsh splits cluttering the lead's window. The lead MUST explicitly close them:

```bash
# Capture the lead's pane ID FIRST — never assume the lead lives at pane_index 1.
# (If the user split the window before opening Codex, the lead can be at index 2+.)
LEAD_PANE=$(tmux display -p '#{pane_id}')

# Inspect: list teammate panes in the current window (everything except the lead)
tmux list-panes -F '#{pane_id} #{pane_current_command}' \
  | grep -v "^${LEAD_PANE} "

# Kill them
tmux list-panes -F '#{pane_id}' \
  | grep -v "^${LEAD_PANE}$" \
  | xargs -r -n1 tmux kill-pane -t
```

The `pane_id` capture is non-negotiable — earlier versions of this recipe used `awk '$2 != "1"'` (positional index) and would silently kill the lead if it happened to live at any non-1 position.

Real-world miss (2026-05-08, omg-prefix-universal session): lead closed 12 teammates via TaskStop + TeamDelete but left 5 idle split panes open. User had to ask "why after close the teamate, you don't close the split for me also?" Treat pane cleanup as part of TeamDelete, not a follow-up the user has to chase.

**If unresponsive:** Close terminal or kill session. Then manually clean up:
- `rm -rf ~/.agents/teams/<team-name>/` — orphaned team state <!-- gate:allow-rm-codex (subdirectory cleanup, not the tree) -->
- `git worktree list` -> `git worktree remove <path>` — orphaned worktrees
- `tmux kill-pane` for any leftover teammate splits in the lead window

## Named-agent handles persist for the session's lifetime

Spawning an agent with the Agent tool's `name:` parameter (e.g. `name: "auditor-core"`) registers a **SendMessage handle** in the lead session. That handle is **NOT cleared** by any of:

- The agent's process exiting on completion
- `TaskStop` on the agent's task
- `TeamDelete` (handles are session-scoped, not team-scoped — they exist even when no TeamCreate was ever called)
- Killing the agent's tmux pane

The handles remain visible in the lead's Codex **status bar** (e.g. `@main @auditor-core @auditor-dual-tree …`) and addressable via `SendMessage({to: "auditor-core", …})` until the **lead session itself ends** (`/exit` or terminal close). There is no harness API to deregister a single finished handle.

**Practical implication for the lead:** "All teammates closed" is a four-part claim that requires verifying ALL of these independently:

| What | How to verify it's gone |
|---|---|
| Agent process | `ps aux \| grep codex` shows only the lead PID |
| tmux pane | `tmux list-panes` shows only the lead pane |
| Team metadata | `ls ~/.agents/teams/` is empty + `TeamDelete` returns "no team" |
| **Status-bar handle** | **Cannot be cleared mid-session — only `/exit` removes it** |

Do not say "all closed" unless all four are confirmed. The status-bar handle is the one most likely to be missed because it has no on-disk artifact and no tool to clear it.

Real-world miss (2026-05-08, omg-prefix-universal session): lead reported "all teammates closed" after killing processes + panes + TeamDelete, but the user pointed at the status bar still showing 5 `@auditor-*` names. Lead had to explain those were stale handles from earlier `Agent({name: ...})` spawns, only clearable by ending the lead session.

**Workaround:** if status-bar cleanliness matters mid-session, prefer **anonymous** `Agent` spawns (omit the `name:` parameter) for short-lived background work. Reserve named handles for teammates you need to address by name via SendMessage. Once a named handle is created, it's permanent for the session.

## Limitations

- **One team per session** — cannot manage multiple teams simultaneously
- **No nested teams** — teammates cannot spawn their own teams
- **Fixed lead** — no lead promotion/transfer during session
- **Opus 4.6 only** — all teammates must run same model
- **TTY required** — Agent Teams disabled in VSCode extension
- **Session resume broken** — `/resume` does not restore in-progress teammates
- **Instruction-based ownership** — file ownership enforced by prompt, not filesystem locks
- **No CI/CD mode** — Agent Teams requires interactive terminal
