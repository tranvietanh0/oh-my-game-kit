---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Queue Writeback

Use this when: completing a sync-back operation that was triggered by the auto-lesson pipeline (lesson-queue-processor, `type=lesson` entries). This step closes the loop so the processor can drop the row on its next tick.

## File location

```
{projectRoot}/.agents/telemetry/pending-skill-updates.jsonl
```

Where `projectRoot` is the consumer project root (same project that spawned this sub-agent).

## Success writeback

After the PR is created, **append** a new JSONL line:

```json
{ "fingerprint": "<fingerprint from queue entry>", "submitted": true, "prUrl": "<https://github.com/...>" }
```

This is an append operation — do NOT overwrite the file. The processor reads all lines, drops rows where `submitted === true`, and rewrites the remaining rows on its next tick.

## Failure writeback

If the PR could not be created (GitHub MCP error, repo access denied, invalid rationale, etc.):

```json
{ "fingerprint": "<fingerprint>", "submitted": false }
```

The processor's circuit breaker increments `failures` on this entry. After 5 consecutive failures the entry is marked `permanently_failed` and dropped from the queue. A `[omg-lesson-stale]` marker is emitted so the maintainer is aware.

## Required fields from the queue entry

When invoked from the lesson pipeline, the prompt will include:
- `fingerprint` — 16-char md5, used for dedup and writeback identification
- `kit` — target kit repo
- `skill` — target skill name
- `fragment` — which section of the skill to update (`e.payload.fragment`)
- `reason` — why the change is warranted (`e.payload.reason`)

All five must appear in the PR body's rationale section to close the traceability loop.

## Do NOT silently drop

If writeback itself fails (e.g., file unwritable), log via `console.error` and leave the entry in the queue for retry. Do not silently discard it.
