---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Mode 7 — `pattern-recognize` (counterparty negotiation-pattern classification)

This mode is the **strategic-level companion** to `tilt` mode. Where `tilt` asks "which clauses disadvantage me?" (clause-level), `pattern-recognize` asks "what is the counterparty's negotiation strategy?" (meta-level).

## Why this mode exists

Counterparties don't randomly attack clauses. They use recognizable patterns. The same counterparty might attack 22 different clauses but be running ONE strategy underneath: "Accept volume, attack definitions" (Alfa v3 case). Recognizing the pattern lets you:

1. **Predict their next 2-3 moves** instead of being surprised
2. **Counter the strategy**, not just the individual asks
3. **Avoid item-by-item concession** when their attack is unified under one frame

## Workflow

1. Receive counterparty's markup, email, redline, or call notes
2. Run `tilt` mode for clause-level disadvantages
3. Run `pattern-recognize` for strategic-level pattern
4. Cross-reference: clause findings + pattern = your reply strategy

## Output format

```markdown
# Pattern Recognition — {counterparty}, {date}

## Detected pattern
**Primary pattern:** {one of the 20 named patterns}
**Confidence:** {high / medium / low}
**Secondary patterns:** {if layered}

## What they're optimizing for
{1-2 sentences inferring their underlying strategy}

## Structural read
| What they accepted | What they attacked | What they ignored |
|---|---|---|
| {their tacit acceptance} | {specific attacks} | {silent dimensions — could be saved ammunition} |

## Counter-strategy (3 options)

### Option A — {name}
{What to do at the strategic level, not just clause-level}

### Option B — {name}
{Alternative strategic counter}

### Option C — {fallback}
{If A and B fail}

## What to NOT do
{2-3 anti-patterns specific to this counterparty's pattern}

## Cross-reference
For full Tell/Use/Counter on detected pattern: omg-negotiation/references/pattern-catalog.md
For specific tactics to deploy: omg-negotiation/references/technique-library.md
For phase-aware moves: omg-negotiation/references/phase-playbook.md
```

## Pattern classification heuristic (4-step diagnostic)

Before naming a pattern, check 4 dimensions:

1. **Headline-grab vs. definition-attack** — Did they lower the visible numbers, or attack the definitions around them?
   - Definition-attack with headline numbers untouched → pattern #1 "Accept volume, attack definitions"
   - Direct number attack → pattern #15 "Anchoring by precedent"

2. **Coverage** — How many clauses did they flag?
   - 20+ clauses, scattered → pattern "Carpet bomb" (rare; usually amateur)
   - 2-3 clauses, focused → pattern "Selective strike" (sophisticated)
   - 8-15 clauses bundled under one rationale → pattern #2 "Growth-stage rhetoric bundle"

3. **Narrative bundling** — Are multiple asks bundled under a single rhetorical frame ("we're in growth stage", "industry standard", "to be aggressive")?
   - Yes, 3+ asks under same frame → pattern #2 "Growth-stage rhetoric bundle"
   - Each ask justified independently → no narrative bundling pattern (just clause-level)

4. **Implicit asks via deflection** — When asked about conflicts/portfolio/track record, did they answer with specifics or generalities?
   - Generalities → pattern #3 "Disclosure deflection"
   - Specifics → no deflection pattern; they're being transparent

## Linking back to `omg-negotiation`

The full 20-pattern catalog with detailed Tell/Use/Counter and worked examples lives in `omg-negotiation/references/pattern-catalog.md`. **This skill (`omg-contract-review`) does NOT duplicate the catalog** — it references it.

For:
- Pattern theory + counters → `omg-negotiation/references/pattern-catalog.md`
- Named techniques (80+) → `omg-negotiation/references/technique-library.md`
- Phase-specific guidance → `omg-negotiation/references/phase-playbook.md`
- Cultural overlay → `omg-negotiation/references/cultural-map.md`

Use Mode 7 for **identification** (which pattern is this?). Then jump to `omg-negotiation` for **strategic counter** (what's my play?).

## Worked example — Alfa v3 (2026-05-04)

**Input:** Alfa v3 docx with 22 inline comments from Ozgur on the client-count term sheet.

**Tilt mode output (clause-level):** 18 clauses flagged across 6 sections — concentration cap, gross margin, Qualifying Client definition, Key Person clause, non-compete genre scope, non-circumvention scope, etc.

**Pattern-recognize mode output (strategic-level):**

> **Primary pattern:** #1 "Accept volume, attack definitions" (HIGH confidence)
> **Secondary patterns:** #2 "Growth-stage rhetoric bundle" (MEDIUM); #3 "Disclosure deflection" (HIGH on the portfolio question)
>
> **What they're optimizing for:** Visible commitment looks unchanged (10% equity cap, 16 WCP at Gate 3, 5 clients, $2.5M floor — all untouched). But every quality definition attacked. Net effect: same nominal headline, ~40% looser delivery bar.
>
> **Counter-strategy:**
> - **Option A (recommended):** Definition discipline. Reject definition concessions piecemeal. Bundle: "We can accept short-commitment clients at 0.5× weighting IF WCP target rises 16 → 20 at Gate 3."
> - **Option B:** Reverse the growth-stage frame. "Growth stage means we BOTH need certainty — that's why these guardrails exist."
> - **Option C (fallback):** Force disclosure. "We need the 4 Turkish portfolio companies named in Schedule A before we can refine non-compete."

**Result:** Without pattern-recognize, you'd respond clause-by-clause and likely concede 3-5 definitions individually. With pattern-recognize, you respond at strategy level: hold definitions or trade them ONLY for headline tightening.