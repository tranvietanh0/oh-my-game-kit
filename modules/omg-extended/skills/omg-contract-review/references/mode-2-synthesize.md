---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Mode 2 — `synthesize` (cross-party synthesis)

Given your `tilt` review and the counterparty's own markup/feedback, produce three lists:

| List | Meaning | Action |
|------|---------|--------|
| **Overlap** | Both sides flagged the same clause (usually with opposite preferred fixes). | Highest priority — these are the real negotiation axes. Prepare specific compromise language. |
| **Divergence** | Only one side flagged. | If only you flagged: hold firm or trade away silently. If only they flagged: decide whether to concede or counter. |
| **Blind spots** | Neither flagged, but clause is materially off-balance. | You now know something they don't — decide whether to quietly fix, quietly exploit, or surface it as a goodwill gesture. |

## Output format for `synthesize`

```markdown
# Cross-Party Synthesis — {contract-name}

## Overlap (both flagged)

### §X.Y — {clause}
**Your concern:** {yours}
**Their concern:** {theirs}
**Common ground:** {what both can accept}
**Compromise language:** "{specific text}"

## Divergence — only you flagged
...

## Divergence — only they flagged
...

## Blind spots (neither flagged, material)
...
```

## Discipline notes

- **Don't run `synthesize` on just one side** — you'll bias toward whoever you read first. Always finish your tilt review BEFORE looking at theirs.
- **Overlap clauses are the actual negotiation surface.** Prepare specific compromise language for each — not just "we'll discuss".
- **Blind spots create choice space.** You can fix quietly (build trust), exploit quietly (extract value), or surface (signal good faith). Pick deliberately per clause.