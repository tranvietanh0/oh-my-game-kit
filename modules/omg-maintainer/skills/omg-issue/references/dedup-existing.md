---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Dedup — Check for Existing Issues Before Filing

Use this when: before any `gh issue create` call, both manual and auto-mode. Dedup is MANDATORY — never skip it.

## Why

Duplicate issues fragment discussion, inflate counts, and waste maintainer time. A single issue with a "new occurrence" comment is far more useful.

## Search strategy

**MCP (preferred):**
```
search_issues(query="in:title {skill-name}", owner="{owner}", repo="{repo}")
```

**gh CLI fallback:**
```bash
gh issue list \
  --repo {owner}/{repo} \
  --search "in:title {skill-name}" \
  --state open \
  --json number,title,url
```

## Match criteria

An issue is a duplicate if:
- Title matches pattern `fix({kit}):` or `fix({kit}/{module}):` AND
- Title contains the affected skill name

Case-insensitive match is acceptable.

## If a duplicate is found — add a comment instead

**MCP:**
```
add_issue_comment(owner, repo, issue_number, body)
```

**gh CLI:**
```bash
gh issue comment {number} --repo {owner}/{repo} --body "..."
```

**Comment body (new occurrence):**
```markdown
**New occurrence** — {ISO timestamp}

**Fingerprint:** `{fingerprint}` (if from auto-mode)
**Session context:** {short description of what triggered this recurrence}
**Evidence:**
```
{sanitized logs}
```
```

## If no duplicate found

Proceed to create a new issue via `references/file-from-marker.md` or `references/file-manual.md`.

## Local dedup cache (auto-mode only)

After filing, update the local dedup cache:
```js
// from .agents/hooks/lib/kit-error-dedup.cjs
markSubmitted(fingerprint, issueUrl)
```
This prevents re-filing within `autoIssueSubmission.dedupeTTLDays` days even if the GitHub search is slow.
