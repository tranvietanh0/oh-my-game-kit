---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Sub-Agent Invocation

Use this when: invoking sync-back as a background sub-agent from a parent session (the standard mode), OR when the auto-lesson pipeline (lesson-queue-processor) fires and hands you a `type=lesson` queue entry.

## Required Task call template

```
Task(
  subagent_type: "general-purpose",
  run_in_background: true,
  description: "sync-back <skill-name>",
  prompt: "Invoke the omg-sync-back skill.

    Changed files (absolute paths — include BOTH user-scope `$HOME/.agents/...`
    AND project-scope `<cwd>/.agents/...` candidates; sync-back walks both roots):
      - <path 1>
      - <path 2>
    Origin metadata per file (from frontmatter/JSON/comment):
      - file: <path>, kit: <kit>, repository: <owner/repo>, module: <module or null>
    Versions at sync time (REQUIRED):
      - kitVersion: <from consumer project's .agents/metadata.json kitVersion>
      - moduleVersion per module: <from .agents/modules/{module}/module.json>
      - cliVersion: <output of `omg --version`>
      - platform: <process.platform + os.release()>
    Plan link (if applicable): <relative path to plans/YYMMDD-*.md, or 'ad-hoc'>
    Rationale (REQUIRED): <why this change is generic and should propagate — NOT project-specific>
    Local changes summary: <what was edited and why>

    Run the full omg-sync-back workflow:
    1. Pre-flight checks (GitHub MCP connected, repo access, staleness per file)
    2. Path verification (get_file_contents for every target before writing)
    3. Run --dry-run first, then the full sync if changes are generic
    4. Create PR(s), one per kit repo — body MUST include Versions block + Plan link + Rationale
    5. Report PR URL(s) back. Write back queue entry if invoked from lesson pipeline.

    If any of {kitVersion, cliVersion, platform, rationale} is missing, DO NOT sync —
    respond to parent with the list of missing fields so parent can collect them first."
)
```

**Required fields:** `kitVersion`, `moduleVersion` (per module when module set), `cliVersion`, `platform`, `rationale`. Missing any → refuse and request them. This prevents low-context PRs from entering kit repos.

## Auto-lesson pipeline contract (type=lesson entries)

When invoked by the lesson-queue-processor, the queue entry contains:
- `kit` — target kit (e.g., `oh-my-game-kit-core`)
- `skill` — target skill name
- `fragment` — which fragment/section to update (`e.payload.fragment`)
- `reason` — why the change is warranted (`e.payload.reason`)
- `fingerprint` — 16-char md5 used for dedup and writeback

**After creating the PR**, write back to `pending-skill-updates.jsonl`:
```json
{ "fingerprint": "<fingerprint>", "submitted": true, "prUrl": "<pr-url>" }
```
Append this as a new JSONL line. The processor removes rows where `submitted === true` on the next UserPromptSubmit tick.

If the PR could not be created, write:
```json
{ "fingerprint": "<fingerprint>", "submitted": false }
```
The circuit breaker increments `failures`; after 5 failures the entry is permanently dropped.

See `references/queue-writeback.md` for the file path and append mechanics.
