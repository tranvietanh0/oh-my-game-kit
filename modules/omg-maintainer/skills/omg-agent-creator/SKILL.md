---
name: omg-agent-creator
description: "Create or update Oh My Game Kit agent .md files with canonical structure. Use when adding a new agent, updating maxTurns/model, or fixing frontmatter fields."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Agent Creator

Create new agent .md files or update existing ones for Oh My Game Kit. Enforces the canonical agent structure.

## Required Frontmatter

Canonical field order: `name → description → model → maxTurns → color → roles → tools → context → useExactTools → origin → repository → module → protected → version`

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Universal `omg-` prefix, kebab-case, MUST match filename basename. Core: `omg-{slug}`. Kit-wide: `omg-{kit}-{slug}`. Module-scoped: `omg-{kit}-{module}-{slug}`. See `rules/naming-convention.md` (SSOT) and `references/architecture-rules.md` § 0. CI gate `validate-agent-prefix.cjs` is strict. |
| `description` | Yes | `\|` block scalar; 1-sentence intent + 1–3 `<example>` blocks with `<commentary>`; total <30 lines, <2KB |
| `model` | Yes | `haiku` (cheap fanout/discovery) · `sonnet` (default) · `inherit` (parent-pinning) · `opus` unused |
| `maxTurns` | Yes | See observed values below; must justify >40 in a comment |
| `color` | **Yes** | 14/14 agents use it — required, not suggested. See color-by-role below |
| `roles` | Yes | `[routing-role]` registers in routing JSON · `none` (scalar) = callable by name only · `[]` = same as `none`, prefer `none` |
| `tools` | If fork-eligible | Explicit minimal array `[Read, Glob, Bash]` — omitting inherits ~70-tool default, breaking `useExactTools` SSOT |
| `useExactTools` | If fork-context | `true` for agents that run as fork children — parent mirrors `tools:` array exactly |
| `context` | If fork-context | `fork` when agent runs as fork child of a skill |
| `origin` | Yes | **Hand-stamp on creation** — validator enforces pre-merge for new files. Cite memory `feedback_origin_marker_handauthor.md`. |
| `repository` | Yes | Hand-stamp on creation (same rule) |
| `module` | Yes | Hand-stamp on creation (same rule) |
| `protected` | Yes | Hand-stamp on creation (same rule) |
| `version` | CI-managed | CI injects from `module.json`. Appears post-release — do NOT hand-edit. |

**Agents do NOT have `keywords:` in frontmatter.** Keywords live in `omg-activation-{layer}.json` only.

**Color-by-role convention:** blue=omg-planner/PM/implementer · red=omg-debugger · green=omg-tester/git · orange=reviewer · purple=kit/docs · yellow=omg-brainstormer/simplifier · cyan=omg-researcher/mcp · magenta=skills

## Recommended maxTurns (observed from 14 core agents)

| Agent | maxTurns | Role class |
|-------|----------|-----------|
| omg-git-manager | 15 | utility |
| omg-code-simplifier, omg-docs-manager | 20 | utility |
| omg-tester, omg-researcher, omg-code-reviewer, omg-project-manager, omg-brainstormer | 25 | revieweromg-planner |
| omg-planner, omg-skills-manager | 30 | omg-planner |
| omg-debugger, omg-fullstack-developer | 40 | implementeromg-debugger |
| omg-kit-developer | 45 | kit-implementer |

Cap at 50. Must justify >40 with an inline comment.

## Required Body Sections (in order)

1. **Opening persona:** "You are a **{Role Title}** …" — see Cognitive Framing
2. **Routing guard** (if applicable): scope boundary + delegation targets
3. **Mandatory skills:** Ordered table with activation triggers
4. **Constraints:** Enforced rules (NEVER/ALWAYS/DO NOT)
5. **Workflow:** Numbered steps with verification checkpoints
6. **Output format:** Constant-shape markdown template (no variable-cardinality keys in headers)
7. **Domain Agent Orchestration** (if applicable): see pattern below
8. **Behavioral Checklist:** 6–10 checkbox lines, brutal-honesty framing — MANDATORY for all agents
9. **Module awareness** (if applicable): `metadata.json has modules` / `schemaVersion >= 2` conditions

## Process

1. Ask user for: role name, scope, which kit/layer, key skills
2. Read 2 existing agents as reference (matching role type)
3. Draft agent following canonical structure above
4. **Hand-stamp origin frontmatter** — `origin/repository/module/protected` MUST be present on the new file. Validator only checks `origin:` presence; values may be best-effort (CI overwrites post-merge). See "Required Frontmatter" above.
5. **Post-write check** — read the new agent .md back; verify the frontmatter contains `origin:` with a non-empty value. If absent, re-stamp before proceeding.
6. Validate using `references/validation-checklist.md`
7. If routing needed: update `omg-routing-{layer}.json`
8. If activation needed: update `omg-activation-{layer}.json`

## Cognitive Framing (MANDATORY — first line of body)

**Format:** "You are a **{Role Title}** who/performing {behavioral description in 1-2 sentences}."

**Examples:**
- "You are a **Staff Engineer** hunting production bugs — you distrust obvious answers and prove root cause before proposing any fix."
- "You are a **QA Lead** performing systematic verification — you hunt for untested code paths and think like someone burned by production incidents."
- "You are a **Tech Lead** designing system architecture — you optimize for long-term maintainability over short-term convenience."

**Validation:** If the opening line does not name a concrete role with a behavioral trait, reject and rewrite.

## Domain Agent Orchestration (6/14 agents use this)

After completing generic implementation, check for domain-specific agents:

```markdown
**Domain Agent Orchestration:**
1. Use Glob to find `.agents/agents/*-{role}.md`
2. Evaluate which are relevant to the task (engine-specific, module-specific)
3. For relevant domain agents: spawn via Agent tool with implementation context
4. Fan-out cap: `Math.min(matchedCount, 4)` — NEVER spawn unbounded parallel agents
5. If no domain agents found — proceed with generic output only

IF `OMG_FORK_DEPTH` env >= 2: skip Domain Orchestration entirely;
report "domain-agents-skipped: depth-limit-reached" in output.
```

## Fork-context agents

If an agent may run as a fork child of a skill (verifier, omg-researcher, omg-planner, reviewer, omg-tester, omg-debugger):

**Frontmatter required:**
- `tools: [Read, Grep, Glob]` (minimal explicit array) — omitting breaks `useExactTools` SSOT across 13/14 agents
- `useExactTools: true` if spawned by `context: fork` skill

**Body required (verifier agents — testers, reviewers, debuggers):**
```
**Anti-Avoidance Checklist (read before every run):**
- No "should work" without evidence — run the command, paste the output.
- No "looks fine to me" without a root-cause sentence.
- No "I'll skip this edge case" without explicit risk justification.
- No "this is unrelated" without a 1-line proof.
```

**Constant-shape Output Format:** headers MUST NOT interpolate counts, timestamps, or commit hashes into top-level keys. Variable values go inside leaf nodes.
- GOOD: `### Files Modified\n[list]`
- BAD: `### Files Modified (3 files, 187 lines):` — count busts cache

**Recursion guard:** If body contains Domain Agent Orchestration, gate with `OMG_FORK_DEPTH` check. Never reference the `gitStatus` block — run `git status` yourself if needed.

See `.agents/skills/omg-architecture/references/fork-hygiene.md` for parent-side rules.

## Anti-Patterns to Avoid

**Severity:** **Blocker** (security/correctness) · **High** (cache/recursion/cost) · **Medium** (drift/clarity) · **Low** (style)

| Anti-pattern | Severity | Fix |
|---|---|---|
| No recursion guard when `Agent`/`Task` tool in `tools:` array | **Blocker** | Add depth check: refuse to spawn self; gate domain orchestration with `OMG_FORK_DEPTH` |
| No fan-out cap on domain-agent spawning | High | Cap at `Math.min(N, 4)` |
| Inlining `rules/skill-security-boilerplate.md` or `rules/agent-security-boilerplate.md` content | High | Auto-loaded from rules/. Inlining drifts. Current offender: `omg-skills-manager.md:47-56` |
| Volatile content in body (`gitStatus`, `date +`, "Last Updated", live shell `` `...` ``) | High | Move to a tool call AFTER the static prefix. See `architecture-rules.md` §E |
| `tools:` includes `Bash` for read-only agents | Medium | Read-only agents declare `[Read, Glob, Grep]` — Bash grants `rm`, `git push --force` |
| `maxTurns > 50` without justification | High | Cap at 50; add inline comment if >40 |
| Vague persona ("a developer") | Medium | Concrete role + behavioral trait — see Cognitive Framing above |
| `roles: []` instead of `roles: none` | Low | Prefer `none` scalar for no-routing agents |
| Copy-pasted `<example>` blocks across agents | Medium | Each agent's examples must be domain-specific for routing disambiguation |
| Adding `origin`, `module`, `protected`, `version` with wrong values | High | `origin/module/protected` — hand-stamp exact kit values; `version` — leave to CI post-release |
| Verifier agent without Anti-Avoidance Checklist | Medium | Testers/reviewers/debuggers MUST include the 4-bullet checklist |
| Agent body recommends raw `rm -rf .agents/` | **Blocker** | Wrap in `omg install --reset` / `omg doctor --nuke` (AGENTS.md #10) |

Full architecture checklist: `references/architecture-rules.md`
Pre-merge agent checklist: `references/validation-checklist.md`
