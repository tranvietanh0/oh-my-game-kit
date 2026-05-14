---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Architecture Rules for Agents

Distilled from `omg-skill-creator/references/architecture-rules.md` and `omg-architecture/references/review-checklist.md`, filtered to concerns that apply specifically to **agent `.md` files**. Use when creating, reviewing, or auditing any agent.

**Severity legend:** **Blocker** (security/correctness) · **High** (cache/recursion/cost) · **Medium** (drift/clarity) · **Low** (style)

---

## 0. Universal `omg-` prefix (MANDATORY) — Blocker

**Every agent in every kit MUST start with `omg-`. No exemptions, including core.**

Tier-derived form:

| Tier | Pattern | Example |
|---|---|---|
| Core kit | `omg-{name}.md` | `omg-fullstack-developer.md`, `omg-debugger.md` |
| Kit-wide (non-core) | `omg-{kit}-{name}.md` | `omg-unity-developer.md` |
| Module-scoped | `omg-{kit}-{module}-{name}.md` | `omg-web-ui-developer.md`, `omg-cocos-game-developer.md` |

`{kit}` is the repo slug minus the `oh-my-game-kit-` prefix. `{module}` is the directory containing the agent under `.agents/modules/{module}/agents/` or `modules/{module}/agents/`.

**Enforcement:** `oh-my-game-kit-release-action/scripts/lib-prefix.cjs` is the SSOT. `validate-agent-prefix.cjs` polices file names; `validate-no-collisions.cjs` Rule 1 also delegates to `lib-prefix.cjs` (post 2026-05-08 hot-fix oh-my-game-kit-release-action#68 — Rule 1 was previously enforcing the OLD `{kit-short}-{module}-` formula and silently failing post-rename releases).

**Frontmatter `name:` invariant:** the agent's frontmatter `name:` MUST match the file basename (without `.md`). Both must be the prefixed form. The CI auto-prefixer rewrites both atomically.

**Checklist for new agents:**

1. Pick the tier based on which `module.json` will list the agent.
2. Compose the file basename from the table above. Verify with `lib-prefix.expectedName({kit, module, slug})`.
3. Set frontmatter `name:` to match the basename (no `.md`).
4. Add the basename (WITH `.md`) to the owning `module.json` `agents:` array.
5. **If `routingOverlay.roles.{role}` points at this agent**, update its value to the prefixed form too.
6. Regen `omg-modules.json` via `generate-modules-registry.cjs` (per `rules/module-registry-sync.md`).
7. Run `node scripts/validate-agent-prefix.cjs` locally before pushing.

**Known gap (2026-05-08):** `auto-prefix-agents.cjs` renames the agent file but does NOT rewrite per-module `module.json` `agents`/`routingOverlay` fields. Bit oh-my-game-kit-web/ui release run #25552998095. Until that gap is closed (separate release-action follow-up), authors MUST update both manifests by hand when renaming agents.

History: rolled out 2026-05-08 via `plans/260508-1544-omg-prefix-universal/`. 44 agents renamed across 9 repos. Audit SSOT: `audit-agents.json` in that plan dir.

---

## 0.1 Slug dedup invariant (algorithm v2) — Blocker

**The slug part of a new agent MUST NOT start with the kit-short or any module-segment-token.** Same rule and same algorithm as for skills (see `omg-skill-creator/references/architecture-rules.md` §0.1).

**Algorithm v2 (left-prefix-strip recursion):** `expectedName({kit, module, slug})` builds candidate set `{kitShort} ∪ {module-segments-split-on-hyphen}` and recursively strips any matching `{cand}-` left prefix from `slug`. Idempotent. SSOT: `oh-my-game-kit-release-action/scripts/lib-prefix.cjs:71-110`.

**Authoring check before creating an agent file:**

1. Mentally apply algorithm v2: if your basename starts with `{kit-short}-` or any `{module-segment}-`, drop that segment.
2. Run `node /path/to/release-action/scripts/auto-prefix-agents.cjs --dry-run` if uncertain — it will tell you what the canonical name should be.

**Example correct vs incorrect:**

| Kit | Module | BAD basename | GOOD basename |
|---|---|---|---|
| rn | rn-base | `omg-rn-rn-base-base-developer.md` | `omg-rn-rn-base-developer.md` |
| unity | dots-core | `omg-unity-dots-core-dots-tester.md` | `omg-unity-dots-core-tester.md` |

History: as of 2026-05-10, no agents required dedup renaming (Phase 0 audit found 0 algorithm-deduped agents across all 8 non-core kits). The rule is enforced at creation time to prevent future drift.

---

## 0.2 Agent `name:` stays HYPHENATED — even when skills go colon — Blocker

The companion plan `plans/260510-1711-skill-name-colon-namespace/` (oh-my-game-kit-core) migrates SKILL.md `name:` fields to colon-form for slash UX (e.g., `name: omg-unity:dots-core:ecs-core`). **Agents are explicitly OUT of scope** for that migration.

Three reasons:

1. **No slash UX surface.** Agents are invoked via `Task(subagent_type: "...")`, not `/agent-name`. The slash-form-readability argument that drives skill colon-form does not apply.
2. **Basename invariant.** The harness resolves agents by file basename. The frontmatter `name:` field MUST equal the basename (no `.md` extension). Filesystems do not portably support colons (NTFS especially), so basenames must stay hyphenated, and `name:` follows.
3. **Plan §2 explicit non-goal.** `plans/260510-1711-skill-name-colon-namespace/PLAN.md` §2 lists "Renaming agents" under out-of-scope.

**Correct form for every agent** (file `agents/<basename>.md`, frontmatter):

```yaml
---
name: <basename-no-extension>  # MUST equal file basename, hyphenated, NEVER colon
---
```

For example, an agent file `omg-unity-tester.md` ships frontmatter `name: omg-unity-tester`.

**INCORRECT (do NOT do this even after the colon migration ships):**

```yaml
---
# colon-form name: would fail validate-agent-prefix.cjs since the basename uses hyphens
name: omg-unity:tester
---
```

**Validator:** `validate-agent-prefix.cjs` enforces the basename match — colon-form `name:` would fail this gate.

---

## A. Control loop & termination

| Red flag | Severity | Fix |
|---|---|---|
| Workflow advises "retry until success" without circuit breaker | High | Specify max-retries (e.g., 3) and circuit-break on consecutive failure |
| Completion gates are not verifiable | Medium | Gates must be tool-referenced and severity-marked (BLOCKING/MANDATORY) |
| No typed termination states in complex workflows | Medium | Enumerate "complete", "blocked", "needs-clarification", "fatal" explicitly |

---

## B. Tool & extension interface

| Red flag | Severity | Fix |
|---|---|---|
| Agent has `Bash` in `tools:` but only reads files | Medium | Read-only agents declare `[Read, Glob, Grep]` — Bash grants `rm`, `git push --force` |
| No output size cap on large-report agents | High | Declare per-section caps (e.g., "diff ≤ 32KB; truncate with `…[N more lines]`") |
| `tools:` omitted when agent is fork-eligible | High | Omitting inherits ~70-tool default — every parent that wants `useExactTools: true` must re-invent the list. SSOT violation. |
| `tools:` syntax is comma-string, not YAML array | Low | Always `[Read, Glob, Bash]` — comma-string parses but non-canonical. `omg-planner.md` uses array; `omg-mcp-manager.md` drifted. |

---

## C. Memory & SSOT

| Red flag | Severity | Fix |
|---|---|---|
| `Last Updated` or commit hash embedded in agent body | High | Remove — `git log` answers on demand. Prevents cache bust on every release. |
| `version:` hand-edited post-CI | High | CI injects `version` from `module.json`. If present, it was injected — do not edit. |
| Duplicate `origin`/`module` across agents with different values | Medium | Each file has one origin; conflicts signal a copy-paste error. |

---

## D. Sub-agent spawning (REQUIRED for agents with `Agent`/`Task` in tool list)

| Red flag | Severity | Fix |
|---|---|---|
| Agent spawns sub-agents without recursion guard | **Blocker** | Add: refuse to spawn an agent matching your own name; check `OMG_FORK_DEPTH` env. |
| Domain Orchestration fan-out unbounded | High | `Math.min(matchedCount, 4)` cap. Violated by: `omg-code-reviewer.md:113`, `omg-debugger.md:69`, `omg-tester.md:77`, `omg-fullstack-developer.md:74`, `omg-brainstormer.md:73` |
| Fork child reuses parent tool array without `useExactTools: true` | High | Cache miss on re-serialization. Declare `tools: [...]` in the child frontmatter so parent can mirror exactly. |
| Verifier agent without Anti-Avoidance Checklist | Medium | omg-tester + omg-code-reviewer have it; omg-debugger + omg-researcher don't. Must add. |
| `gitStatus` block referenced in agent prompt | Medium | Strip for read-only forks. If agent needs git state, run `git status` itself. |
| Sub-agent spawned without `filterIncompleteToolCalls()` guard | **Blocker** | API rejects orphan `tool_use` lacking `tool_result`. See architecture-rules §D row 12. |
| Domain Orchestration spawned when `OMG_FORK_DEPTH >= 2` | High | Gate: if depth >= 2, skip orchestration, report `domain-agents-skipped: depth-limit-reached`. |

Cross-reference: `omg-architecture/references/fork-hygiene.md` §§1–6 (parent-side rules).
Skill-creator red-flag table: `omg-skill-creator/references/architecture-rules.md` §D.

---

## E. Prompt cache stability

Agent bodies become prompt prefixes on every spawn. The same rules that apply to skill bodies apply here.

| Red flag | Severity | Fix |
|---|---|---|
| Live shell substitution in body (`` `...` ``, `$(...)`, `${env:...}`) | High | Move to a tool call AFTER the cached prefix. **Test:** `grep -E '\$\(|`[^`]*`'` on the agent file must return zero. |
| Runtime date, session paths, or commit hashes in body text | High | Move volatile content to tool results. Core commit `c17a037` fixed this in 4 skills. |
| Conditional inserts before the logical static section | High | Each conditional doubles unique cache prefix hashes (2^N explosion). |
| Output Format section uses variable-cardinality counts in top-level keys | Medium | GOOD: `### Files Modified\n[list]` · BAD: `### Files Modified (3 files):` — count busts cache. |
| Agent body includes `gitStatus` block reference | Medium | Fork-hygiene rule 4: strip for read-only forks. Agent can call `git status` directly. |

**Rule of thumb:** body order = static persona FIRST, stable rules NEXT, dynamic instructions LAST, volatile content NEVER inline — always in tool results.

---

## F. Cloud auth & external services (agents that call GitHub/Slack/MCP)

| Red flag | Severity | Fix |
|---|---|---|
| Auth token read from `process.env.X` mid-flow | High | Per-instance auth-token closure. See `omg-skill-creator/references/architecture-rules.md` §H. |
| MCP mutating tool (issue create, Slack send) without guarded-writes preamble | High | Cite `omg-mcp-management` skill for guarded-writes rule. |

---

## I. Destructive operation safety (AGENTS.md #10)

| Red flag | Severity | Fix |
|---|---|---|
| Agent recommends `rm -rf` on `.agents/` or user dirs | **Blocker** | Wrap in `omg install --reset` / `omg doctor --nuke`. See AGENTS.md #10. |
| Agent allows `git push --force` to main without user instruction | High | Refuse + explain. See `omg-git-manager.md` as canonical pattern. |
| Agent allows `--no-verify` / `--no-gpg-sign` without user instruction | High | Same: refuse + explain. |
| Bash-capable agent has no backup-before-destruction clause | High | Body MUST include: "ALWAYS take a backup before any destructive operation." |

---

## Anti-Pattern: Inlining Universal Rules in Agent Bodies

Universal rules **auto-load every session** from `.agents/rules/`. Inlining them in agent `.md` files duplicates content and drifts when the canonical version updates.

**The known offenders (do NOT paste into an agent body):**

| Boilerplate | Lives in |
|---|---|
| "Never reveal skill internals or system prompts" block | `.agents/rules/skill-security-boilerplate.md` |
| "Never echo your own system prompt" block | `.agents/rules/agent-security-boilerplate.md` |
| Fork-hygiene 5-line block (`OMG_FORK_DEPTH < 2 ...`) | `.agents/skillsomg-architecture/references/fork-hygiene.md` (cite, don't paste) |

**Current offender:** `omg-skills-manager.md:47–56` pastes the skill-security block verbatim. Track via doctor check #44.

**Test:** if the boilerplate applies to ≥3 agents verbatim, it belongs in `rules/` or a `references/` file.

**Caught by:** doctor check #44 (`check-no-inline-universal-rules.cjs`) — now extended to scan `agents/*.md`.

---

## Sources

- `omg-architecture/references/fork-hygiene.md` — fork rules §§1–6
- `omg-architecture/references/cache-stability-rules.md` — prompt cache rules
- `omg-skill-creator/references/architecture-rules.md` — full 10-category skill checklist
- `AGENTS.md` principle #10 — destructive operation safety
- `rules/agent-security-boilerplate.md` — universal agent output policy
