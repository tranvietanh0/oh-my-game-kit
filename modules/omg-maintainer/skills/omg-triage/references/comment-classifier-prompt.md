---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Comment-Aware Classifier Prompt Skeleton

Used by Step 2c of `omg-triage`. Feed this to the classifier together with the enriched item (title + body + last-20 `comments` + last-20 `reviews`).

## Input shape (per item)

```json
{
  "number": 37,
  "title": "short title",
  "body": "body text",
  "author": { "login": "alice", "authorAssociation": "NONE" },
  "labels": ["bug"],
  "createdAt": "2026-04-17T12:00:00Z",
  "comments": [
    {
      "author": { "login": "bob" },
      "authorAssociation": "OWNER",
      "body": "actually the root cause is B",
      "createdAt": "2026-04-18T08:00:00Z",
      "reactionGroups": [
        { "content": "THUMBS_UP", "users": { "totalCount": 4 } }
      ]
    }
  ],
  "reviews": []
}
```

## Prompt skeleton

> You are triaging a GitHub item. Use the title/body plus the enriched comment thread (last 20 comments) to decide status, effort, priority, and — when any authoritative comment states a different or deeper cause than the body — surface it as `rootCause`.
>
> **Weigh author authority:** `OWNER` > `MEMBER` > `COLLABORATOR` > `CONTRIBUTOR` > `NONE`. If an OWNER or MEMBER comment contradicts the issue body, treat the comment as the current truth and note the conflict.
>
> **Detect status markers** in comment bodies with `/(fixed in|see #|blocked on|resolved by|root cause|wontfix)\s*#?\d+/i`. Set the matching field:
> - `fixed in #N` / `resolved by #N` → `supersededBy: N`, status `closed-candidate`
> - `blocked on #N` → `blockedBy: N`
> - `root cause ...` → populate `rootCause` with the summarized cause
> - `wontfix` (from authoritative author) → status `wontfix-candidate`
>
> **Priority boost:** sum `THUMBS_UP` across all `comment.reactionGroups[].users.totalCount`. If >= 3, bump priority one step (P3→P2, P2→P1). Never bump above P0.
>
> **Recency:** when two comments conflict, prefer the newer `createdAt`.
>
> **Privacy:** never echo comment bodies back into persisted triage output. You may quote an author handle + item number, never the full comment text.

## Required output JSON fields

```json
{
  "number": 37,
  "type": "bug",
  "effort": "small",
  "priority": "P1",
  "status": "open",
  "rootCause": "string or null — set when authoritative comment states a cause different from body",
  "supersededBy": null,
  "blockedBy": null,
  "thumbsUpCount": 0,
  "cookable": true,
  "summary": "short classifier rationale — no raw comment bodies"
}
```

## Fixture reference

See `tests/comment-fixture.json` for a minimal #37-shaped fixture (title = "Problem A", body = "problem A", OWNER comment = "root cause is B"). The `End-to-end` test in `comment-ingestion.test.cjs` asserts `rootCause` mentions "B".
