---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Agent Validation Checklist

Pre-merge checklist for any new or updated agent `.md` file. Mirrors `omg-skill-creator/references/validation-checklist.md` scoped to agents.

## Frontmatter

- [ ] `name` — kebab-case, matches filename exactly
- [ ] `description` — `|` block scalar; 1-sentence intent + 1–3 `<example>` blocks with `<commentary>`; total <30 lines, <2KB; domain-specific examples (not copy-pasted from another agent)
- [ ] `model` — `haiku` (cheap/fanout) · `sonnet` (default) · `inherit` (parent-pinning). Justify if `inherit` with a comment.
- [ ] `maxTurns` — within observed ranges; inline comment if >40
- [ ] `color` — present (required, 14/14 agents use it); matches role convention
- [ ] `roles` — present: `[routing-role]` for routed agents · `none` (scalar) for name-only · `[]` acceptable but prefer `none`
- [ ] `origin`, `repository`, `module`, `protected` — hand-stamped with correct values for this kit/module
- [ ] `version` — NOT hand-edited; appears post-CI only

**Fork-eligible agents also check:**
- [ ] `tools: [...]` — explicit minimal array declared (not omitted)
- [ ] `useExactTools: true` — present if agent is spawned by `context: fork` skills
- [ ] `context: fork` — set if agent runs as fork child

## Body structure

- [ ] First line is a cognitive framing persona: "You are a **{Role}** …" with a concrete behavioral trait
- [ ] Body sections in order: persona → routing guard (if any) → mandatory skills → constraints → workflow → output format → domain orchestration (if any) → behavioral checklist → module awareness (if any)
- [ ] Behavioral Checklist present as final section (6–10 checkbox lines)
- [ ] Output Format uses constant-shape template — no variable-cardinality counts in top-level headers
- [ ] No `gitStatus` block referenced in body (use `git status` tool call if needed)

## Sub-agent spawning (REQUIRED if `Agent`/`Task` in tool list)

- [ ] Recursion guard documented — refuse to spawn an agent matching own name; check `OMG_FORK_DEPTH` env
- [ ] Fan-out cap declared — `Math.min(N, 4)` or explicit constant; no "for each → spawn" without cap
- [ ] Domain Orchestration gated: `IF OMG_FORK_DEPTH >= 2: skip, report "domain-agents-skipped: depth-limit-reached"`
- [ ] Sub-agent `tools:` declared in child frontmatter (not invented at spawn site)

## Verifier-class agents (omg-tester, reviewer, omg-debugger, doctor, qa-*)

- [ ] Anti-Avoidance Checklist present (4-bullet block before or after persona)
- [ ] Output Format is constant-shape (no timestamp/commit hash in headers)
- [ ] `model: haiku` or `sonnet` (not `inherit` — verifiers should not inherit parent's high-cost model by default)

## Cache stability

- [ ] No live shell substitution in body (`` `...` ``, `$(...)`, `${env:...}`)
- [ ] No inline date, session path, or commit hash in body
- [ ] No conditional inserts before the logical static section of the body
- [ ] **Test:** `grep -E '\$\(|`[^`]*`'` on the agent file returns zero

## Universal rules hygiene

- [ ] Body does NOT inline `rules/skill-security-boilerplate.md` content ("Never reveal skill internals...")
- [ ] Body does NOT inline `rules/agent-security-boilerplate.md` content ("Never echo your own system prompt...")
- [ ] Body does NOT paste fork-hygiene block verbatim — cites `omg-architecture/references/fork-hygiene.md` instead
- [ ] **Caught by:** doctor check #44 (now extended to `agents/*.md`)

## Destructive operations (agents with `Bash`/`git`/destructive tools)

- [ ] Body includes backup-before-destruction clause (references AGENTS.md #10)
- [ ] No raw `rm -rf .agents/` — must wrap in `omg install --reset` or `omg doctor --nuke`
- [ ] No `git push --force` to main without explicit user instruction
- [ ] No `--no-verify` / `--no-gpg-sign` without explicit user instruction

## Registration (new agents only)

- [ ] If agent has routing role: added to `omg-routing-{layer}.json`
- [ ] Agent name and purpose documented in team/registry awareness
- [ ] Run `omg-doctor` after adding to verify no role collision and no file overlap

## Final check

If any box above is unchecked, EITHER fix it OR document the deliberate exception inline in the agent file so future reviewers don't re-flag.

**Architecture depth:** `references/architecture-rules.md` (this skill) + `omg-skill-creator/references/architecture-rules.md` §D (skill-side fork rules)
