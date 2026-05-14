---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Queue Writeback Protocol

Use this when: after any issue submission (success or failure), the sub-agent MUST write the result back to the queue so `lesson-queue-processor.cjs` can drop the row on the next tick.

## Contract (MANDATORY)

The processor filters entries where `submitted === true` — these are dropped from the queue. Entries with `submitted: false` increment the `failures` counter. After 5 failures the circuit breaker marks the entry `permanently_failed: true` and drops it.

## Success writeback

Append a new JSONL line to `.agents/telemetry/pending-skill-updates.jsonl`:

```json
{
  "fingerprint": "<same fingerprint as the original entry>",
  "submitted": true,
  "issueUrl": "https://github.com/Owner/repo/issues/{number}"
}
```

## Failure writeback

```json
{
  "fingerprint": "<same fingerprint>",
  "submitted": false,
  "error": "<short message — e.g. 'no-gh-auth', 'duplicate-filed', 'missing-fields'>"
}
```

Do NOT retry on failure — leave the entry in the queue. The next session's `lesson-queue-processor.cjs` will re-attempt. After `FAILURE_THRESHOLD` (5) failures the circuit breaker permanently drops the entry.

## File location

```
<project-root>/.agents/telemetry/pending-skill-updates.jsonl
```

If operating in global-only mode (no project root), the queue lives at:
```
$HOME/.agents/telemetry/pending-skill-updates.jsonl
```

## Auto-detection mode — additional step

After writing the success line, also call the local dedup cache:
```js
// .agents/hooks/lib/kit-error-dedup.cjs
markSubmitted(fingerprint, issueUrl)
```

This prevents re-filing within `autoIssueSubmission.dedupeTTLDays` days.

## Lesson-queue (type=skill-bug) entries

The processor `lesson-queue-processor.cjs` handles both `type=lesson` and `type=skill-bug` entries in the same JSONL file (`pending-skill-updates.jsonl`). The writeback schema is identical — only the `fingerprint` differs per entry. Sub-agents MUST preserve the fingerprint from the original entry verbatim.
