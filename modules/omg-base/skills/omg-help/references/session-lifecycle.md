---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Oh My Game Kit Session Lifecycle

## Start of Session

### TIER 1 — Native (always loaded, survives /clear)
1. Read `AGENTS.md` — confirm project context, installed kits, constraints
2. `$HOME/.agents/rules/*.md` loaded automatically — includes kit conventions
3. **Check feature flags (MANDATORY):**
   - Read ALL `omg-config-*.json` files for `features.*` flags
   - If `features.mcp` is true: verify MCP connection per kit-specific instructions

### TIER 2 — SessionStart Hook (survives /clear, re-fires)
4. `generate-baseline-context.cjs` runs automatically (registered in settings.json)
   - Reads `$HOME/.agents/metadata.json` (SSOT) for installed modules, versions, kit info
   - Falls back to `.omg-module-summary.txt` (CLI-generated) if no metadata
   - Also reads `omg-modules.json` to show available (uninstalled) modules
   - Output: `[omg-context] Kit: <name> v<version> | Modules (<N>): <list>`
   - AI now knows module context from SSOT without extra file dependencies

### Global-Only Mode

When AI sees `[omg-global-only]` in hook output:
1. Note that OMG is running from global install (core skills available)
2. Suggest once: "This project doesn't have OMG installed locally. Run `omg init` for project-level config."
3. Do NOT repeat the suggestion in the same session
4. Proceed normally — global OMG provides skills, agents, rules, and hooks
5. Module-specific features (installed modules, per-project activation) are not available in global-only mode

### TIER 3 — OMG Activation (partial /clear survival)
5. **Activate baseline skills:**
   - Read ALL `omg-activation-*.json` → collect entries with `"sessionBaseline": true`
   - sessionBaseline skills are in REQUIRED modules only
   - Activate all baseline skills

### MODULE STATE CHECK
6. **Check module state:**
   Follow protocol: `skillsomg-modules/references/module-detection-protocol.md`
   - If v3: read `installedModules` → per-module versions, verify deps satisfied
   - If v2 (legacy): read `modules` list → suggest `omg-doctor fix` to migrate to v3
   - If `kits` key (init format): kits installed but modules not individually tracked → read `omg-modules.json` for available modules
   - If flat/core-only: skip module checks
   - If file manifest missing but module in metadata: warn user, suggest reinstall
   - **ALWAYS read `omg-modules.json`** to know ALL available modules (installed + not-yet-installed). Proactively suggest relevant uninstalled modules when user's topic matches their keywords.

### PLAN/TASK RESUME
7. Check `plans/` for active plan directory (most recent timestamp)
8. Call `TaskList` — identify any `in_progress` tasks to resume

## Prompt Cycle (UserPromptSubmit)

On EVERY user prompt, BEFORE AI processes it:
1. `check-module-keywords.cjs` fires (registered in settings.json as UserPromptSubmit hook)
   - Reads `$HOME/.agents/metadata.json` (SSOT) → installed modules
   - Reads `omg-modules-keywords-*.json` → keyword-to-module map (CI-generated, preferred)
   - Falls back to `omg-modules.json` activation mappings (source-repo fallback)
   - If prompt matches keyword for UNINSTALLED module → warn (max 3, dedupe by module)
   - Output: `[omg-module-suggest] keyword="ECS" module="dots-core" action="omg modules add dots-core"`
   - If all matched modules installed → no output (silent)

Then AI processes prompt:
2. **Module Auto-Suggestion** — if hook output contains `[omg-module-suggest]`:
   a. Parse all suggestions (keyword, module, action fields)
   b. Batch into single offer: "Your request involves '{keyword}' which requires '{module}' (not installed). Want me to install it?"
   c. If multiple: "I see {N} uninstalled modules needed: {list}. Want me to install them?"
   d. If user agrees → run action(s) via Bash → verify success → resume original task
   e. If user declines → proceed with available context, note what may be missing
   f. Do NOT ask repeatedly for the same module within a session
3. Classify command (cook/fix/debug/etc.)
4. **Routing — follow `skillsomg-cook/references/routing-protocol.md`**
5. **Skill Activation — follow `skillsomg-cook/references/activation-protocol.md`**
6. **Module Context — follow `skillsomg-cook/references/subagent-injection-protocol.md`** (if spawning agents)
7. Execute command with module-aware agent

## During Work

- Use OMG commands exclusively for routing
- Track every task with `TaskUpdate` (start + finish)
- After each code change: check compilation/run output for errors
- After any error fixed: update relevant `$HOME/.agents/skills/` gotcha entry
- **When modifying module files**: note which module the file belongs to (from metadata)
- **When suggesting skills**: only suggest skills from installed modules
- **After any skill file updated**: ALWAYS invoke `omg-sync-back` as a **background sub-agent** (`Task` tool with `run_in_background: true`). NEVER run inline — it interrupts the user's current task. See `skillsomg-fix/references/error-recovery.md` → "Background Sub-Agent Invocation" for the spawn pattern.
- **After discovering a skill/agent bug**: ALWAYS invoke `omg-issue` as a **background sub-agent** (same pattern). NEVER manually create issues and NEVER run the skill inline.

### Self-Validation Rule (MANDATORY)

AI MUST verify its own work before asking user to test:
1. After ANY fix/update/implementation: check compile/run output → confirm zero errors
2. After ANY implementation (not just test fixes): run the FULL test suite → confirm zero failures BEFORE reporting done
3. After ANY file deletion or rename: grep all source files for references first, update them, THEN delete
4. After ANY skill update: read the skill file back → verify content is correct
5. NEVER say "please test this" or report "done" until you have confirmed ALL tests pass
6. Test count must match pre-change count (no tests silently lost due to compilation errors hiding them)

## Finalize Phase / Feature

1. Registry `omg-tester`: run test suite, confirm zero failures
2. Registry `reviewer`: code review (includes module boundary checks)
3. Registry `omg-docs-manager`: sync `docs/` if affected
4. **Module integrity check**: run `omg-doctor` module checks (verify installed module versions and deps)
5. **Sync-back check**: if any `$HOME/.agents/skills/` files modified, spawn a **background sub-agent** to run `omg-sync-back` (see `skillsomg-fix/references/error-recovery.md` → "Background Sub-Agent Invocation"). NEVER manually copy files and NEVER run the skill inline.
6. Registry `omg-git-manager`: `omg-git cm` with conventional commit message

## Wrap Session

- Run `omg-watzup`: `git log --oneline -10` + error/log check + module summary
- Confirm all in-progress tasks are marked `completed`
- **Module integrity gate**: `omg-doctor` module checks pass?
- **Sync-back audit**: `git diff --name-only HEAD~10 | grep '$HOME/.agents/skills/'` — if any changed and not synced, spawn a background sub-agent for `omg-sync-back` now (never inline)
- Note any blocked tasks and their blockers
