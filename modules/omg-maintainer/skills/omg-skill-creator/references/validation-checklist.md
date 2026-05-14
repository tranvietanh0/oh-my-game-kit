---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Skill Validation Checklist

Quick validation before packaging. Run `scripts/package_skill.py` for automated checks.

## Critical (Must Pass)

### Metadata
- [ ] `name`: namespaced `namespace:skill-name` (or `skill-name` for legacy), descriptive
- [ ] `description`: under 200 characters, specific triggers, not generic

### Size Limits
- [ ] SKILL.md: under 300 lines
- [ ] Each reference file: under 300 lines
- [ ] No info duplication between SKILL.md and references

### Structure
- [ ] SKILL.md exists with valid YAML frontmatter
- [ ] Unused example files deleted
- [ ] File names: kebab-case, self-documenting

## Scripts (If Applicable)

- [ ] Tests exist and pass
- [ ] Cross-platform (Node.js/Python preferred)
- [ ] Env vars: respects hierarchy `process.env` > `$HOME/.agents/skills/${SKILL}/.env` (global) > `$HOME/.agents/skills/.env` (global) > `$HOME/.agents/.env` (global) > `$HOME/.agents/skills/${SKILL}/.env` (cwd) > `$HOME/.agents/skills/.env` (cwd) > `$HOME/.agents/.env` (cwd)
- [ ] Dependencies documented (requirements.txt, .env.example)
- [ ] Manually tested with real use cases

## Quality

### Writing Style
- [ ] Imperative form: "To accomplish X, do Y"
- [ ] Third-person metadata: "This skill should be used when..."
- [ ] Concise, no fluff

### Practical Utility
- [ ] Teaches *how* to do tasks, not *what* tools are
- [ ] Based on real workflows
- [ ] Includes concrete trigger phrases/examples

## Integration

- [ ] No duplication with existing skills
- [ ] Related topics consolidated (e.g., cloudflare + docker → devops)
- [ ] Composable with other skills

## Architecture (run BEFORE shipping — full checklist in `architecture-rules.md`)

### A. Cache stability (Category E in architecture-rules.md)
- [ ] Body order: stable rules FIRST, dynamic content LAST, conditional inserts NEVER
- [ ] No live shell substitution `` !`...` `` in skill body
- [ ] No runtime date/time computation in body without `memoize(getLocalISODate)`
- [ ] No templated boilerplate inserted BEFORE the H1 heading
- [ ] No body-embedded scripts (move to `scripts/`)
- [ ] No reference-loading rules conditional on flags mid-body

### B. Sub-agent fork hygiene (Category D — REQUIRED for skills that spawn agents)
- [ ] `context: fork` declared on `effort: high` and on any skill that spawns sub-agents
- [ ] Recursion guard documented (skill MUST NOT spawn instance of self)
- [ ] Fan-out cap documented (e.g., max 5 parallel) and configurable
- [ ] Fork children pass `useExactTools: true`
- [ ] Read-only/exploration sub-agents strip `gitStatus`
- [ ] Verification sub-agents enumerate excuses + reinject "verify ONLY" reminder after every tool result

### C. Tool/extension safety (Category B)
- [ ] Every tool/script has output size cap (`maxResultSizeChars`, e.g., 32KB)
- [ ] Defaults are fail-CLOSED, not fail-OPEN (no `--no-security-check` without `_reason`)
- [ ] Shell command matchers return safe-on-parse-fail (true, not false)

### D. Memory & SSOT (Category C)
- [ ] No duplicate `version` (frontmatter `version` AND `metadata.version`)
- [ ] No `Last Updated` commit metadata embedded in body
- [ ] Persistent storage has size cap (lines AND bytes)
- [ ] No scheduled expiry — staleness warnings only
- [ ] Avoids storing data derivable from project/git state

### E. Hooks/MCP safety (Category F)
- [ ] **Blocker check:** any MCP-sourced content (script bodies, console output) has hard-block on inline-shell tokens (`` ! ``, `$(...)`, backticks) before treating as instruction
- [ ] Hook config snapshotted at startup (no runtime re-read)
- [ ] Exit code 2 (not 1) for blocking hooks
- [ ] MCP tool listing snapshotted at session start

### F. Cloud safety (Category H — REQUIRED for skills that talk to remote services)
- [ ] Per-instance auth-token closure (no `process.env.X` mid-flow)
- [ ] Token capture-at-send-time (not re-read on 401)
- [ ] Asymmetric channels documented (read=persistent, write=ack-required)
- [ ] Bounded retry table per close code (not one-size-fits-all interval)
- [ ] BoundedUUIDSet for echo dedup (not TTL cache)

### G. Destructive operation safety (Category I — AGENTS.md #10)
- [ ] No raw `rm -rf` on user files/dirs in skill body
- [ ] No raw `git checkout --` recommendations without backup step
- [ ] Bulk-delete workflows have snapshot/rollback step BEFORE delete
- [ ] Recovery instructions wrap destructive ops in CLI command (`omg install --reset` style) that backs up first

### H. Universal rules hygiene
- [ ] Skill body does NOT inline universal rules. The 3 forbidden boilerplates (skill-security, AI-Driven Design, fork-hygiene 5-line) live in `.agents/rules/` or `references/fork-hygiene.md`. See `architecture-rules.md` → "Anti-Pattern: Inlining Universal Rules".

If any architecture box is unchecked, EITHER fix it OR document the deliberate exception inline in SKILL.md so future reviewers don't re-flag.

## Automated Validation

Run packaging script to validate:

```bash
scripts/package_skill.py <path/to/skill-folder>
```

Checks performed:
- YAML frontmatter format
- Required fields present
- Description length (<200 chars)
- Directory structure
- File organization

Fix all errors before distributing.

## Subagent Delegation Enforcement

When a skill requires subagent delegation (via Task tool):

1. **Use MUST language** - "Use subagent" is weak; "MUST spawn subagent" is enforceable
2. **Include Task pattern** - Show exact syntax: `Task(subagent_type="X", prompt="Y", description="Z")`
3. **Add validation rule** - "If Task tool calls = 0 at end, workflow is INCOMPLETE"
4. **Mark requirements clearly** - Use table with "MUST spawn" column
5. **Forbid direct implementation** - "DO NOT implement X yourself - DELEGATE to subagent"

**Anti-pattern (weak):**
```
- Use `omg-tester` agent for testing
```

**Correct pattern (enforceable):**
```
- **MUST** spawn `omg-tester` subagent: `Task(subagent_type="omg-tester", prompt="Run tests", description="Test")`
- DO NOT run tests yourself - DELEGATE
```
