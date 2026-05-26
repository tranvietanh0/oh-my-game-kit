---
name: omg-team
description: "Spawn parallel agent teams for large features. Use for multi-agent research, implementation, review, or debugging across independent workstreams requiring 3+ agents."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Team — Registry-Aware Agent Teams

Orchestrate parallel Codex Agent Teams with OMG infrastructure: registry-routed agents, module-scoped skill injection, manifest-derived file ownership, mandatory worktree isolation.

**Requires:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json env.
**Requires:** CLI terminal — Agent Teams tools are disabled in VSCode extension.
**Model:** All teammates run Opus 4.6 (Agent Teams constraint).

## Agent Routing

Follow protocol: `.agents/skills/omg-cook/references/routing-protocol.md`
Templates resolve roles dynamically: `omg-researcher`, `implementer`, `reviewer`, `omg-debugger`, `omg-tester`, `omg-planner`

## Templates

| Template | Purpose | Risk | Reference |
|----------|---------|------|-----------|
| `research` | N researchers, module-scoped angles | Low (read-only) | `references/research-template.md` |
| `review` | N reviewers, registry-routed, module boundary checks | Low (read-only) | `references/review-template.md` |
| `cook` | N implementers, worktree-isolated, manifest ownership | Medium (writes code) | `references/cook-template.md` |
| `debug` | N debuggers, adversarial hypotheses, worktree-isolated | Medium (may add debug code) | `references/debug-template.md` |
| `triage` | Parallel issue/PR processing across kit repos | Low (read + GitHub API) | `references/triage-template.md` |

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--researchers N` | 3 | Number of researchers |
| `--reviewers N` | 3 | Number of reviewers |
| `--devs N` | auto | Number of devs (auto = one per module) |
| `--debuggers N` | 3 | Number of debuggers |
| `--delegate` | off | Lead only coordinates, never touches code |
| `--no-plan-approval` | off | Skip plan approval gate (cook template) |

## Pre-flight Protocol (MANDATORY)

0. **Verify `Agent` tool is in scope BEFORE anything else.** Run `ToolSearch(query="select:Agent", max_results=1)` to confirm the underlying spawn primitive is available. If the call returns no match, STOP IMMEDIATELY with this exact warning — do NOT silently fall back to serial in-thread execution:

   > **omg-team cannot spawn teammates from this context.** The `Agent` tool is not in scope, which means this skill was invoked from a forked sub-context (typically via the `Skill` tool from a sub-agent, or by another skill marked `context: fork`). Re-invoke `omg-team` from the **main session** instead. Serial-as-lead fallback is forbidden because it silently breaks the parallelism contract and the worktree-isolation / manifest-ownership guarantees.

   Why this matters: the skill frontmatter declares `context: fork`, so when the harness routes `omg-team` it runs in a forked sub-context. The `Agent` tool is NOT inherited into that fork from arbitrary parent contexts — in particular, when the lead invokes this skill via the `Skill` tool from inside a sub-agent, `Agent` is absent. With no availability check, the AI satisfies "spawn N teammates" by doing the work serially as lead — same deliverable, but parallelism is lost, per-teammate context isolation is lost, file-ownership boundaries are not enforced, and the user is not warned. Real-world miss: 2026-05-10 wiki-closure session, commit `69f0831` on `The1Studio/AIPoweredGameDevelopmentSystem.wiki`, five `fullstack-developer` teammates were requested and silently executed serially. See issue #163.

1. **Verify `TeamCreate` is available BEFORE calling it.** Run `ToolSearch(query="select:TeamCreate", max_results=1)` to confirm the tool schema loads. If the call returns no match (or `TeamCreate` does not appear in the deferred-tool listing for this session), STOP IMMEDIATELY with this exact warning to the user — do NOT silently fall back to plain `Agent` spawning:

   > **Agent Teams not enabled.** Add to `settings.json`:
   > ```json
   > "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }
   > ```
   > Then restart your Codex session. (CLI terminal only — disabled in VSCode extension.)

   Why this matters: `TeamCreate`/`TeamDelete`/the team-mode `SendMessage` variants are only registered as tools when the env var is set at session start. When unset they are absent from the tool list entirely — there is no error to catch. Without this explicit availability check, the AI satisfies "spawn parallel teammates" with whatever tools it has (regular `Agent`), and the user gets degraded "team-shaped output" without worktree isolation, manifest-derived file ownership, or the shared task list.

   Once verified available, call `TeamCreate(team_name: ...)` per the matching template. If `TeamCreate` errors AFTER passing the availability check, surface the error and STOP.
2. **Resolve roles** — follow `.agents/skills/omg-cook/references/routing-protocol.md`
3. **Detect modules** — follow `.agents/skills/omg-modules/references/module-detection-protocol.md`
4. **Derive file ownership** — `references/manifest-ownership-resolution.md`
5. **Build skill injection** — follow `.agents/skills/omg-cook/references/subagent-injection-protocol.md`
6. **Cost warning** — inform user of teammate count and estimated token cost

Every teammate spawn prompt MUST include the OMG Context Block: `referencesomg-context-block.md`

## Decision Discipline (MANDATORY)

When this skill (or any sub-protocol it spawns) needs the user to make a multi-option choice — including yes/no, A-or-B, or any "pick one of these" prompt — you MUST call `AskUserQuestion`. Prose option lists are forbidden, including from skill output that arrives via `<local-command-stdout>`.

**If `AskUserQuestion` appears in the deferred-tools list:** load it FIRST via `ToolSearch(query="select:AskUserQuestion", max_results=1)` before constructing the question. The schema is auto-deferred in 1M-context Opus sessions; the SessionStart hook `decision-tools-preload.cjs` emits a `[omg-decision-tools]` reminder every session as a backup signal.

**Forbidden prose patterns** in this skill's output AND in any teammate's output:

- "Pick one (reply with the number): 1. … 2. … 3. …"
- "Want me to do A or B?"
- "Should I proceed?"
- Any bulleted/numbered choice list followed by a question mark
- "I cannot use AskUserQuestion right now, so please reply with…" — there is no such fallback; load the schema instead

**When THIS skill body needs a user decision (not just the calling lead):** call `AskUserQuestion` directly from the skill body — do NOT emit a prose option list and rely on the lead to convert it. The lead-side conversion is a fallback for legacy skill output, not the contract. If the schema is deferred, run `ToolSearch(query="select:AskUserQuestion", max_results=1)` first, then call the tool from inside this skill.

**Plan-Fit Assessment Gate (cook template):** before spawning N implementer teammates, the lead MUST present the proposed plan-to-team fit (which modules each dev owns, file-conflict risk, estimated tokens) via `AskUserQuestion` with at least these options: `proceed`, `re-shape teams`, `reduce scope`, `abort`. Skipping this gate produced the 2026-05-08 prefix-migration regret loop where teammates were re-spawned twice mid-flight.

**Why this matters:** prose option lists bypass the structured-answer contract — the user must re-type the choice and the skill cannot reliably parse the reply. Real-world miss (2026-05-08): omg-team emitted prose `1./2./3.` options in its `<local-command-stdout>`; lead relayed verbatim instead of converting to `AskUserQuestion`. User pushback: "why don't use ask me with question tool?"

Cross-reference: `~/.agents/rules/always-ask-on-unresolved.md` § "Failure mode — skills that emit prose option lists", `~/.agents/rules/ask-before-deciding.md`.

## Execution Protocol

When activated, IMMEDIATELY execute the matching template sequence.
Do NOT ask for confirmation. Execute tool calls in order. Report after each major step.

Details on all operational protocols: `references/team-operations.md`

## When to Use Teams vs Subagents

| Scenario | Subagents | Agent Teams |
|----------|-----------|-------------|
| Focused single task | **Yes** | Overkill |
| Sequential chain | **Yes** | No |
| 3+ independent parallel workstreams | Maybe | **Yes** |
| Competing debug hypotheses | No | **Yes** |
| Cross-module implementation | Maybe | **Yes** |
| Token budget is tight | **Yes** | No |

## Constraints

- Teammates inherit the lead's permission settings at spawn time.
- No recursive spawning: teammates MUST NOT spawn their own Agent Teams.
- **Invoke from the main session only.** When this skill is invoked via the `Skill` tool from a sub-agent (or any other forked sub-context), the `Agent` tool is stripped from scope and teammates cannot be spawned. Pre-flight step 0 hard-errors in that case rather than degrading silently to serial-as-lead. See issue #163 for the diagnostic + reproduction.
