---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Oh My Game Kit Error Recovery

## Registry-Based Error Routing

**MANDATORY:** Read ALL `omg-routing-*.json` files.
Look up the `errorRecovery` map — match error type to role, then resolve role to agent.

| Error Type | Recovery Role | Command |
|------------|--------------|---------|
| Compilation error | `implementer` | `omg-fix` |
| Test failure | `omg-tester` | `omg-fix --test` |
| Runtime error | `omg-debugger` | `omg-debug` |
| Performance regression | `optimizer` | Kit-level command |
| Missing dependency | `implementer` | `omg-fix --quick` |

## Recovery Workflow

1. Match error type to role using `errorRecovery` map in routing registry
2. Resolve role to agent (highest-priority registry wins)
3. Dispatch to `omg-fix` or `omg-debug` as appropriate
4. After fix: always run `omg-test` to confirm resolution
5. Never suppress test failures to pass CI

## Stuck Detection (Auto-Escalation)

**After 3+ failed attempts** on the same error with `omg-fix` or `omg-debug`:

1. Auto-activate `omg-problem-solve` — classify the stuck-type and apply matching technique
2. If `mcp__sequential-thinking__sequentialthinking` MCP is available, use it for structured analysis
3. Identify which module owns the stuck task (module-scoped problem analysis)
4. Apply technique, then retry `omg-fix` with new approach
5. If still stuck after problem-solving: escalate to user with full analysis

## Error Classification

```
Simple:   single compile error, typo, missing import
Moderate: logic error, wrong API usage, missing config
Complex:  cascading failures, breaking API change, environment issue
```

## Self-Validation (MANDATORY)

AI must verify fixes work BEFORE asking user to test:
1. After any fix: check compilation/run output → confirm zero errors
2. After any test fix: run tests → confirm pass BEFORE reporting to user
3. After any skill update: read the skill file back → verify content is correct

## Skill Sync-Back After Fixes (MANDATORY)

**ALWAYS use the `omg-sync-back` and `omg-issue` SKILLS — NEVER manually copy files to kit repos or create issues by hand.** These skills handle routing, frontmatter preservation, module path mapping, and PR creation automatically.

### Background Sub-Agent Invocation (MANDATORY — NEVER INLINE)

Both `omg-sync-back` and `omg-issue` MUST be invoked via the `Task` tool with `subagent_type: "general-purpose"` and `run_in_background: true`. NEVER run them inline in the parent context — they would interrupt the user's current task with duplicate checks, diff reviews, and PR creation.

**Why background:**
- Parent keeps working on the user's original task uninterrupted
- The sub-agent owns the duplicate check, diff review, and PR/issue creation
- User is notified only when the sub-agent completes (non-blocking)
- Parent context stays clean (no skill-load + MCP tool-call pollution)

**Spawn pattern:**
```
Task(
  subagent_type: "general-purpose",
  run_in_background: true,
  description: "sync-back <skill-name>" | "file issue for <skill-name>",
  prompt: "Invoke the omg-sync-back skill (or omg-issue).
    Affected files: <absolute paths>
    Origin metadata: <kit, module, repository from in-file frontmatter>
    Reason: <why this sync/issue is needed>
    Context: <what was changed locally and why>
    Run the full skill workflow: duplicate check → diff/dedupe → PR/issue creation.
    Report back when done."
)
```

### Workflow

After updating any `.agents/skills/` file (gotcha, reference, or SKILL.md):
1. Continue the user's current task — do NOT pause to sync
2. At a natural handoff point (end of fix, end of implementation), spawn the **background** sub-agent
3. The sub-agent runs `omg-sync-back --dry-run` first, then `omg-sync-back` if changes are generic
4. If the fix revealed a skill bug: spawn a **separate** background sub-agent for `omg-issue`
5. Parent reports completion to the user based on sub-agent's return message

**Exception — explicit user request:** If the user explicitly asks "sync this now" or "file the issue now," run inline so they see the result immediately.

## Auto-Issue Submission Handling (telemetry-kit-error-collector)

When `telemetry-kit-error-collector.cjs` detects a OMG-related tool error, it writes a pending request to `.agents/telemetry/pending-issue-submissions.jsonl` and emits a marker to stdout:

```
[omg-auto-issue] count=1/5 kit="oh-my-game-kit-unity" reason="stack-trace-path" fp="abc123def4567890"
```

### Marker Fields

- `count=N/M` — current/max submissions this session (5 by default)
- `kit="..."` — origin kit from classifier (or `"?"` if unknown)
- `reason="..."` — classifier reason: `omg-command | omg-agent | skill-invocation | stack-trace-path | origin-metadata | required-mcp`
- `fp="..."` — 16-char MD5 fingerprint (key into pending-issue-submissions.jsonl)

### Assistant-Side Handling (MANDATORY)

When you see a `[omg-auto-issue]` marker in hook output:

1. **Do NOT interrupt the user** — continue with the user's current task
2. **Read** `.agents/telemetry/pending-issue-submissions.jsonl`
3. **Find the entry** matching the `fp` from the marker (latest occurrence if duplicate fingerprints exist)
4. **Spawn a background sub-agent** for `omg-issue` in auto-submission mode:
   ```
   Task(
     subagent_type: "general-purpose",
     run_in_background: true,
     description: "auto-file issue <fp>",
     prompt: "Invoke the omg-issue skill in AUTO-SUBMISSION mode.

       Input entry (from .agents/telemetry/pending-issue-submissions.jsonl):
       <full JSON entry>

       Mandatory behavior:
       - Mode: auto-submission (no AskUserQuestion)
       - Fetch existing issues FIRST via search_issues() or gh issue list
       - If match found: add comment with occurrence details (count, fingerprint, timestamp), do NOT create new
       - Labels MUST include: 'auto-detected' AND 'classifier:<reason>'
       - Title: auto({kit}): <first 60 chars of stderrHead>
       - Body: use the Detection Context template from omg-issue SKILL.md
       - After success: append writeback entry to pending-issue-submissions.jsonl with submitted:true + issueUrl
       - Also call markSubmitted(fp, issueUrl) via .agents/hooks/lib/kit-error-dedup.cjs"
   )
   ```
5. **Do NOT wait** for sub-agent completion — continue with the user's original task
6. **Do NOT re-emit** the marker — single-shot per session per fingerprint (dedup handles this)

### Kill Switch

Users can disable auto-submission entirely by setting `features.autoIssueSubmission: false` in any `omg-config-*.json`. The hook exits early in that case and no markers are emitted.

### Dry-Run Mode

If `OMG_AUTO_ISSUE_DRY_RUN=1` is set, the hook logs to `~/.agents/.auto-issue.log` and does NOT emit the marker. Assistants should not spawn a sub-agent for dry-run markers (none exist).
