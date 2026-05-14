---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Mode 6 — `cover-email` (round-2 post-rebalance send)

Draft a cover email for sending a revised draft back to a counterparty after their counter.

The full template lives at `references/cover-email-round2-template.md`. This file documents the section structure, internal-only sections, and tone discipline.

## Section outline (sent to counterparty)

| Section | Purpose |
|---------|---------|
| **Opening** | Acknowledge their feedback; signal seriousness. |
| **What moved your way** | Concrete list of what you conceded. Builds credibility. |
| **What's intentionally unchanged** | Clear list of what you're holding and why. Pre-empts re-litigation. |
| **Why leading with X** | If multi-scenario, explain which primary and why. |
| **Key divergences** | If multi-scenario, document intentional differences so they don't re-flag them. |
| **Attachments** | Numbered list; mark primary vs alternative. |
| **Next steps** | Deadline, call offer. |
| **Signature** | Full contact block. |

## Internal-only sections (DO NOT SEND)

Below the email draft, include internal sections for the sender:

- **Sending checklist** — attachments to include, attachments to EXCLUDE (internal docs), blanks to fill, verification steps.
- **Fallback posture reminders** — pre-authorized concessions for specific counterparty pushes. Example: "If Alfa demands retainer: fallback is $3–5K/mo creditable against Pool A. Do NOT offer proactively."
- **Follow-up schedule** — T+0 send, T+3 soft follow-up, T+7 deadline, T+10 hard follow-up, T+14 walk-away.

## Tone guidelines

- **No apologizing.** "Thank you for the feedback" is fine. "I'm sorry if the original was unfair" is not.
- **No re-litigating their wins.** If you conceded on X, list it cleanly without explaining how much it cost you.
- **Hold clauses get 1 sentence of rationale max.** Longer explanations invite re-argument.
- **Lead with the scenario you want them to pick.** Don't present options neutrally — they'll pick the one most favorable to them.

## Pre-send verification

Before sending, run through the sending checklist. Common misses:

1. Forgetting to remove the "Fallback posture reminders" section.
2. Attaching the rationale doc (`{scope}/internal/term-rationale-EN.md`) — it's internal-only.
3. Stale `§X.Y` cross-references in the email body that point to obsolete sections after `balance` renumbering.
4. Numerical drift: figures in the email don't match the term sheet exactly.