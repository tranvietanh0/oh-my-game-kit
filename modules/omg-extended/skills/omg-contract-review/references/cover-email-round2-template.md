---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Round-2 Cover Email Template

Template for cover emails sending a revised draft back to a counterparty after their counter. Used in `cover-email` mode.

The structure has 8 sections plus internal-only fallback section that NEVER gets sent.

---

## Email template

```
Subject: {Project / Deal Name} — Revised Draft v{N}

Hi {Counterparty First Name},

{OPENING — acknowledge their feedback, signal seriousness, set tone}

---

## What moved your way

We've concretely incorporated the following from your v{N-1} feedback:

1. **{Item 1}** — {short description of what changed and to what}
2. **{Item 2}** — {description}
3. **{Item 3}** — {description}
4. **{Item 4}** — {description}
5. **{Item 5}** — {description}

These are real concessions; they reflect our judgment that {brief rationale}.

---

## What's intentionally unchanged

We held the following because {1-sentence shared rationale}:

- **{Item 1}** — {1-sentence rationale}
- **{Item 2}** — {1-sentence rationale}
- **{Item 3}** — {1-sentence rationale}

We're open to discussing these but they're at our reservation point. If they need to move, we'd need an offsetting move from your side.

---

## {If multi-scenario: Why leading with X}

We're proposing **{Scenario A}** as the primary structure. Why:

- {Reason 1 — usually counterparty-aligned interest}
- {Reason 2 — usually downside protection}
- {Reason 3 — usually optionality}

**{Scenario B}** is attached as alternative if the above doesn't work for you. Differences are in §§ X, Y, Z.

---

## {If multi-scenario: Key intentional divergences}

- §X: Scenario A uses {approach}; Scenario B uses {alternative}. Reason: {why}.
- §Y: ...

---

## Attachments

1. **{Primary attachment}** — {filename}.{docx|pdf} — primary draft
2. **{Secondary attachment}** — {filename}.{docx|pdf} — alternative scenario (if multi-scenario)
3. **{Schedule A}** — {filename}.{docx|pdf} — non-compete genre scope
4. **{Term rationale doc}** — {filename}.{docx|pdf} — clause-by-clause rationale (counterparty-facing version)

---

## Next steps

We'd like to land this in 2 weeks. Specifically:

- **{Date 1}**: Your initial reaction (no need for full markup; just direction)
- **{Date 2}**: Detailed feedback from your team
- **{Date 3}**: Joint call to resolve remaining open items
- **{Date 4}**: Final term sheet signature

If your timeline is different, let us know and we'll adjust.

---

Looking forward to your reaction.

Best,
{Your name}
{Your title}
{Your company}
{Phone / preferred contact}
```

---

## Internal-only sections (DO NOT SEND — keep separate)

Below the email draft, in a separate file or below a "DO NOT SEND" line, include:

```markdown
## Sending checklist (INTERNAL — DO NOT INCLUDE IN EMAIL)

- [ ] Verify all attachments are the v{N} versions (not v{N-1})
- [ ] Verify Schedule A reflects current genre scope
- [ ] EXCLUDE: internal/term-rationale-EN.md (full version with cap-table notes)
- [ ] EXCLUDE: internal/open-questions.md
- [ ] EXCLUDE: internal/balance-review-{date}.md
- [ ] Verify blanks are filled (Effective Date, Partner Legal Name, signatory, etc.)
- [ ] Test all PDF attachments render correctly
- [ ] Run final spell-check on email body
- [ ] CC anyone needed (advisor, board observer)?

## Fallback posture (INTERNAL — pre-authorized concessions)

If counterparty pushes for {scenario}, fallback positions:

| Their push | Our public stance | Pre-authorized fallback |
|------------|-------------------|-------------------------|
| Demand retainer | "Equity-only structure" | $3-5K/mo creditable against Pool A. Do NOT offer proactively. |
| Demand higher equity cap | "10% is firm" | 11% if {specific concession from them} |
| Demand longer term | "36 months is standard" | 42 months if {concession} |
| Demand removal of Key Person clause | "Key Person is critical" | Soften to "named lead Partner with 30-day notice rule" |

## Follow-up schedule

- **T+0**: Send email
- **T+3 (soft follow-up)**: "Wanted to make sure this got through — let me know if you need any clarification before we sync next week."
- **T+7 (mid follow-up)**: "Reaching out to see where you're at on this — happy to do a quick call this week or next."
- **T+10 (hard follow-up)**: "I want to make sure we're still aligned on this. Is there a constraint we should know about? Happy to revise if helpful."
- **T+14 (walk-away signal)**: "Given timing constraints on our side, we're going to need to make a call by {date}. If you're not in a position to engage, we'll need to explore alternatives."

## Walk-away script (if no response by T+14)

> "Hi {Name}, given the timeline we discussed, we're moving forward to explore alternative structures. We've appreciated the discussion and remain open if you'd like to revisit, but won't push further at this point. Thanks for the time invested. — {Name}"
```

---

## Tone guidelines (for the email body)

### What to include

- **No apologizing.** "Thank you for the feedback" is fine. "I'm sorry if the original was unfair" is not.
- **Brief, professional warmth.** First-name basis. No "Dear Sir/Madam" formality.
- **Concrete numbers when possible.** "Royalty moved from 14% to 12%" beats "We're flexible on royalty."
- **Lead with value to them.** Frame moves as "we've heard you" not "we've conceded".
- **Closing question or call-to-action.** End with clear next step.

### What to AVOID

- **Re-litigating their wins.** If you conceded on X, list it cleanly without explaining how much it cost you.
- **Long explanations on hold items.** Hold clauses get 1-2 sentences of rationale max. Longer explanations invite re-argument.
- **Defensive language.** No "I hope you understand", "I know this might disappoint", "We had to push back because". Just state position.
- **Hedging.** No "potentially", "perhaps", "I think". Just "we propose X" or "we hold X".
- **Multiple scenario presentation neutrally.** When multi-scenario, lead with the one you want them to pick. Don't present neutrally — they'll pick the one most favorable to them.
- **Too many open items.** Limit to 3-5 in "next steps". More than that = no decision can be made.

### Lead with the scenario you want them to pick

When multiple scenarios are possible:
- ❌ "We've prepared two alternatives — let us know which you prefer"
- ✅ "We're proposing Scenario A as the primary structure. Scenario B is attached as alternative if the above doesn't work."

The framing "primary" + "alternative" is not neutral. It's a Voss-style anchoring move. Use it.

---

## Variations by phase

### Round 2 cover email (this template)
After their first counter. Document concrete movement + holds.

### Round 4-5 cover email
Focus shifts to bundling. Less "what moved" detail; more "here's the package":

```
We've gathered remaining open items into a final bundle. Here's what works
for us:

- Royalty: 13% (you asked 12%)
- Term: 4 years (you asked 5)
- Stickiness: 6 months (you asked 6)
- Pool B trigger: $4M floor (you asked $5M)

If this bundle works, we can move to definitive agreement. If you want to
modify, please specify which 1-2 items, with offsetting concessions.
```

### Round 7+ closing email
Push to signature. Limit further negotiation surface:

```
We're at the line on these terms. The package as currently structured is
our final offer pending your review. If acceptable, we can sign within
72 hours. If the bundle needs adjustment, please be specific — we have
limited flexibility at this stage.
```

### Walk-away email
Professional pause, not burning bridges:

```
Hi {Name},

Reflecting on where we are after {N} rounds, I think we need different
terms to make this work for both sides. Rather than continuing to grind,
let's pause for 2 weeks and see if either side has new thinking.

If we re-engage, I'd want to start from the {Round X} bundle as a
baseline and explore alternative structures.

Thanks for the work invested. The relationship matters to us regardless
of where this specific deal lands.

Best,
{Name}
```

---

## Cross-reference

- For balance review log (what changed in this round): `balance-review-log-template.md`
- For Schedule A drafting (often attached): `schedule-a-template.md`
- For deal-killer checklist (held items often map to these): `deal-killer-checklist.md`
- For pattern recognition before drafting reply: `omg-negotiation/references/pattern-catalog.md`
- For phase-aware closing tactics: `omg-negotiation/references/phase-playbook.md` Phase 4
