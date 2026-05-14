---
name: omg-negotiation
description: "Comprehensive negotiation playbook — counterparty pattern recognition, BATNA/ZOPA prep, multi-round phase guidance, cultural code-switching, named techniques (80+) with Tell/Use/Counter framing. Use BEFORE any commercial negotiation (term sheets, partnership agreements, M&A, distribution, licensing, advisor equity, vendor contracts, salary, partnership disputes). Modes: (1) `analyze` — read counterparty markup/email/transcript and classify pattern + suggest counter; (2) `prep` — pre-negotiation BATNA + leverage map + cultural brief for a specific counterparty; (3) `playbook` — phase-aware guidance (pre/opening/middle/closing/post-signature) for current round; (4) `culture` — cultural code-switcher: tone, timing, face-saving, agreement-signal mapping for one counterparty's culture. Anchored to canonical literature (Fisher/Ury, Voss, Karrass, Shell, Bazerman, Meyer, Malhotra, Cialdini, Kahneman, Schelling, Galinsky, Noesner). Complements omg-contract-review (clause craft) and omg-contract (rendering)."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Negotiation — Comprehensive Dealmaking Playbook

A structured negotiation skill for commercial deals where both parties have real leverage: term sheets, partnership agreements, distribution and licensing, M&A, advisor equity, vendor contracts, salary, partnership disputes. Anchors to the canonical negotiation literature and adds 80 named tactics with detection signals and counters.

**Scope boundary vs related skills:**

- This skill (`negotiation`) — **strategy and tactics**: pattern recognition, BATNA, leverage, cultural code-switching, multi-round dynamics, when to walk.
- `omg-contract-review` — **clause craft**: tilt analysis, redlining, balance review, Schedule A drafting, cover-email mechanics. Use AFTER negotiation strategy is set.
- `omg-contract` — **rendering and beautification**: pandoc lint, CSS, docx/pdf generation. Use LAST.

Typical session flow: `negotiation` (strategy + counter to their markup) → `contract-review` (redline the clauses) → `contract` (render the deliverable).

---

## Modes

| Mode | What it does | When to use |
|------|--------------|-------------|
| **`analyze`** | Read counterparty's markup / email / call notes / transcript. Classify the negotiation pattern they're using (1 of 20). Surface their underlying interest. Suggest 2–3 counter-tactics with specific language. | After receiving any counterparty input — markup, email, redline, call notes. |
| **`prep`** | Pre-negotiation worksheet: BATNA + reservation price + ZOPA estimate + 3-axis leverage map (positive / negative / normative) + cultural brief for the specific counterparty + 3–5 red lines + 3–5 green lights. | Before opening any deal, or before each major round of an active deal. |
| **`playbook`** | Phase-aware tactical guidance for the current round: opening anchor / middle-game concession testing / closing bundles / post-signature trust-building. Each phase has a checklist of moves and anti-patterns. | Each round of a multi-round negotiation. The playbook adjusts as you advance through phases. |
| **`culture`** | Cultural code-switcher for one counterparty: tone register, agreement signaling, face-saving rules, decision-making structure, expected pace. Avoids the most common cross-cultural blunders. | First contact with a new culture, OR when you sense miscommunication and want to debug. |

---

## Mode 1 — `analyze` (counterparty pattern recognition)

**Input:** Their markup (.docx with comments, redlined .md, email reply, call notes, term-sheet response).

**Output:**

```markdown
# Counterparty Analysis — {their-name}, {date}

## Detected pattern
**Primary pattern:** {one of the 20 named patterns from references/pattern-catalog.md}
**Confidence:** {high / medium / low — based on signal density}
**Secondary patterns:** {any layered patterns}

## What they're optimizing for
{1–2 sentences inferring their actual goal from the asks they made and didn't make}

## Structural read
| What they accepted | What they attacked | What they ignored |
|---|---|---|
| {headline numbers / structure they didn't touch} | {specific clauses / definitions they pushed on} | {clauses where they were silent — could be tacit acceptance OR ammunition saved} |

## Suggested counter-tactics (ranked by effectiveness)

### 1. {Counter-tactic name from technique-library.md}
- **What to say:** "{specific language to use}"
- **Why it works:** {1–2 sentences — usually citing which canonical principle}
- **Risk if it fails:** {downside if they reject}

### 2. {Second counter}
...

### 3. {Third counter — usually the "fallback if 1+2 fail"}
...

## What I would NOT do
{2–3 anti-patterns specific to this counterparty's pattern}

## Open questions for the user
{Anything ambiguous in the input that would change the recommendation}
```

### Pattern classification heuristic

Before naming a pattern, check 4 dimensions:

1. **Headline-grab vs. definition-attack** — Did they lower the visible numbers, or attack the definitions around them? (Definition-attack = pattern #1 "Accept volume, attack definitions")
2. **Coverage** — Did they flag everything (carpet-bomb) or only 2–3 deal-killers (selective-strike)?
3. **Narrative bundling** — Are multiple asks bundled under a single rhetorical frame ("we're in growth stage", "industry standard")?
4. **Implicit asks via deflection** — When asked about conflicts/portfolio, did they answer with specifics or generalities? (Generalities = pattern #3 "Disclosure deflection")

The full 20-pattern catalog is in `references/pattern-catalog.md` with Tell / Use / Counter for each.

---

## Mode 2 — `prep` (pre-negotiation worksheet)

**Input:** Counterparty name + deal type + (optional) draft term sheet you're sending.

**Output:** A worksheet at `{scope}/internal/negotiation-prep-{counterparty}-{YYMMDD}.md`:

```markdown
# Negotiation Prep — {counterparty}, {date}

## 1. BATNA & reservation price
- **Your BATNA:** {what you do if no deal — fund alone, alternative partner, walk}
- **Your reservation price:** {minimum acceptable deal in plain numbers}
- **Their likely BATNA:** {3 sources: their public statements / similar deals / third-party intel}
- **Their likely reservation:** {your best estimate}
- **ZOPA:** {overlap zone — yes/no/borderline}

## 2. Leverage map (Shell three-axis)
- **Positive (what you can do FOR them):** top 3
- **Negative (what you can do TO them):** top 2
- **Normative (what third parties expect):** top 2 (sourced)
- **Strategy:** which lever to lead with, which to hold in reserve

## 3. Cultural brief
{Reference references/cultural-map.md for the counterparty's primary culture}
- **Trust style:** task-based / relationship-based
- **Disagreement style:** confrontational / harmony-avoidance
- **Pace:** fast / measured / slow-deliberate
- **Key cultural moves to use:** {top 3}
- **Key cultural moves to avoid:** {top 3}

## 4. Red lines (non-negotiable)
1. {Red line + why}
2. {Red line + why}
3. {Red line + why}

## 5. Green lights (you want to win on these)
1. {Green light + your ideal outcome}
2. ...

## 6. Anchor strategy
- **First-anchor decision:** you anchor first / they anchor first
- **Your anchor (multi-dimensional):** anchor on equity AND royalty AND timeline AND territory simultaneously
- **Justification for anchor:** {benchmark / precedent / data source}

## 7. Concession sequence (Karrass decreasing-step)
- Round 1 concession: {largest move you'll make}
- Round 2 concession: {smaller move}
- Round 3 concession: {tiny tweak}
- Walk trigger: {specific condition where you stop}

## 8. Top 3 patterns to expect from them
{Based on counterparty culture + deal type — pull from references/pattern-catalog.md}

## 9. Pre-mortem (5-minute version)
Imagine the deal failed 18 months after signing. Write 3–5 reasons why.
1. ...
2. ...

## 10. Walk-away credibility
- One pre-rehearsed walk-away script: "{exact words}"
- One signal you'll send if you reach the walk-away point
```

---

## Mode 3 — `playbook` (phase-aware guidance)

The full phase-by-phase playbook lives in `references/phase-playbook.md`. The 5 phases:

| Phase | Days/rounds | Primary objective |
|-------|-------------|------------------|
| **1. Pre-negotiation** | Days 1–7 | BATNA assessment, leverage mapping, cultural brief, anchor preparation |
| **2. Opening** | Days 7–14 / Round 1 | Anchor in writing, listen for real vs. negotiating constraints, excavate interests |
| **3. Middle game** | Rounds 2–7 | Concession testing, bundling trades, written recaps, decreasing-step discipline |
| **4. Closing** | Rounds 7–10 | Final bundle, walk-away credibility, nibble defense, "this is final" announcement |
| **5. Post-signature** | Weeks 1–12 | Relationship deepening, dispute prevention, definition lock, pre-legal alignment |

When you say "I'm in {phase}", the skill returns:
- The 3 must-do moves for that phase
- The 3 anti-patterns to avoid
- The phase-specific "Voss script" (mirroring/labeling/calibrated questions tailored to the phase)
- The transition signal (what tells you it's time to advance to the next phase)

---

## Mode 4 — `culture` (cultural code-switcher)

The full cultural map is in `references/cultural-map.md`. Currently covers 7 cultures:

| Culture | Trust style | Disagreement | Pace |
|---------|-------------|--------------|------|
| **Japanese** | Relationship-first | Harmony-avoidance | Slow-deliberate (nemawashi) |
| **Korean** | Mixed | Indirect (face-saving) | Measured |
| **Chinese (HK/SG)** | Relationship + pragmatic | Mixed | Pragmatic |
| **Vietnamese** | Relationship | Harmony-avoidance | Slow-deliberate |
| **Turkish** | Relationship | Direct + emotional | Variable (haggling-fast, decision-slow) |
| **German** | Task-based | Direct | Measured + precise |
| **American** | Task-based | Direct | Fast |

Each culture has its own section with: trust-building moves, disagreement signaling, agreement signals (e.g., Japanese tatemae "yes" ≠ real yes), face-saving rules, decision-making structure, written-vs-verbal weight, and 3 specific blunders to avoid.

For cultures NOT in the catalog (Indian, Russian, Arab/Gulf, Dutch/Scandinavian, Brazilian, etc.), the skill falls back to the **Hofstede 6-dimension framework** (power distance, individualism, uncertainty avoidance, masculinity/femininity, long-term orientation, indulgence) to scaffold a first-pass cultural brief.

---

## Top 20 counterparty patterns (inline summary)

The full Tell/Use/Counter for each is in `references/pattern-catalog.md`. Inline summary for fast recall:

| # | Pattern | One-line tell | Counter |
|---|---------|---------------|---------|
| 1 | **Accept volume, attack definitions** | Headline numbers untouched, every definition attacked | Hold definitions, trade them only for headline tightening |
| 2 | **Growth-stage rhetoric bundle** | Multiple guardrail-relaxations under one narrative ("we're in growth stage") | Counter-narrative: "growth stage means we BOTH need certainty"; bundle their asks against your asks |
| 3 | **Disclosure deflection** | Generalities when asked about conflicts/portfolio | Direct ask: "Names please. If >5, we need non-compete language" |
| 4 | **Approval-rights creep** | Accept in principle but propose adding approvers/gates throughout | Enumerate all approval points upfront; trade collectively |
| 5 | **Precedent anchoring (fake)** | Cite "industry standard X" without source | Counter-cite from public deal databases; demand their source |
| 6 | **Sunk-cost reframing** | After investment, introduce new requirement as if discussed | "That wasn't in scope. New scope = new negotiation." Reset BATNA |
| 7 | **Higher-authority invocation** | "The board requires X" without offering proof | "Can we schedule 30 min with the board member directly?" |
| 8 | **Late-stage nibbling** | Round 8–9 small new asks | "Round 8 is final on existing terms. New asks need new concessions" |
| 9 | **Good-cop/bad-cop** | One warm, one harsh; alternate | Stay consistent regardless of tone-switching; respond to substance only |
| 10 | **False-choice framing** | "Either X or deal is off" | Reject frame: "Those aren't the only options. Let's explore Y, Z, W" |
| 11 | **Flinch (emotional reaction)** | Visible pain reaction to your ask | Acknowledge without retreating; reframe instead of defending |
| 12 | **Vise technique** | Repeated "why X?" until you sound uncertain | Pre-prepared written justifications; cite source instead of re-justifying |
| 13 | **Escalation of commitment** | New friction (board, legal review) introduced after your sunk cost | Recalculate BATNA WITH new friction; if it fails BATNA, walk |
| 14 | **Fixed-pie assumption** | Each dimension negotiated independently | Propose multi-dimensional trades — force priority reveal |
| 15 | **Anchoring by precedent (fake)** | "Our standard deal includes X" | "Show me 3 comparable deals with that term" |
| 16 | **Delay tactic / urgency inversion** | Counter your deadline with their delay | Pre-set deadlines in writing at start; their delay = their concession to buy time |
| 17 | **Reciprocity exploitation** | After your concession, immediate counter-ask without trade | "I moved on X. What are you moving on?" |
| 18 | **Splitting-the-difference trap** | "Let's split it" after deadlock | Reject splitting; trade across dimensions instead |
| 19 | **Retroactive redefinition** | Post-signature: claim terms meant something else | Lock all definitions in term sheet; reference back if attempted |
| 20 | **Ownership of objections** | Reframe your concern as your problem | Reframe as mutual problem; find precedent for alternative |

---

## Decision tree — when to use this skill

```
Did you receive counterparty input (markup/email/transcript)?
├── YES → Mode 1: analyze
│         Output: pattern + counter-tactics
│
├── About to start a new deal?
│   └── Mode 2: prep
│         Output: BATNA + leverage map + cultural brief
│
├── In an active multi-round negotiation, planning next round?
│   └── Mode 3: playbook
│         Output: phase-specific tactical guidance
│
├── About to engage with a counterparty from a culture you haven't worked with before?
│   └── Mode 4: culture
│         Output: cultural code-switcher brief
│
└── Specific named technique recall ("what's the Ackerman model again?")
    └── Look up references/technique-library.md (80 named techniques)
```

---

## Cross-mode patterns

### Definition discipline

The most under-defended attack vector in commercial negotiation is **definition attack**. Counterparties accept your headline numbers and then redefine the words around them. To defend:

1. **Define every term in the term sheet itself** — don't defer to "as defined in definitive agreement"
2. **Lock definitions BEFORE moving to legal phase** — every definitional change in legal phase costs 2× to fix
3. **For each definition, document the EXAMPLES that count and don't count** — examples beat abstract definitions in dispute
4. **Refuse "fully signed" attacks** — if they want invoiced-but-unsigned to count, demand a parallel time fence ("must sign by month X+1")

This is the corollary of the "Accept volume, attack definitions" pattern. Always assume your definitions are under attack and harden them before the deal closes.

### Concession discipline (the one move that beats most counterparties)

Most counterparties win negotiations not because they're skilled, but because their counterpart concedes too much, too easily. The Karrass decreasing-step rule is the single highest-ROI move:

- Round 1 concession: largest, most visible
- Round 2 concession: ~half the size of round 1
- Round 3+ concession: minor tweaks

If you concede in increasing or constant size, you signal infinite headroom. If you concede in decreasing size, you signal you're at your limit. **Document your concession sequence in writing before the round starts.**

### The walk-away rehearsal

Every major negotiation needs ONE pre-rehearsed walk-away — not as a threat but as a boundary. The walk-away has 4 components:

1. **Trigger condition:** specific, measurable ("if equity > 35%, I walk")
2. **Walk-away script:** exact words to say
3. **Pause duration:** typically 3–5 days of silence
4. **Re-engagement signal:** how to come back without losing face

Counterparties chase walk-aways more often than they call bluffs. But you must be willing to actually walk — bluffing once burns the credibility for life.

### The pre-mortem (Klein's prospective hindsight)

Before signing any deal, do a 20-minute pre-mortem with both teams (or solo if one team only):

> "Imagine it's 18 months after signing. The deal has failed badly. List every reason."

Surface assumptions get exposed (e.g., "we assumed they'd provide marketing; they assumed we would"). Fix before signing — fixes after signing cost 10× more.

---

## Workflow — typical session

### Scenario A: You received markup from a counterparty
1. **`analyze`** their markup → identify pattern + counter-tactics
2. Cross-check pattern with your prior `prep` worksheet — does it match what you expected?
3. Hand off to `omg-contract-review` for clause-by-clause redlining
4. Use `playbook` Phase 3 (middle game) to plan your reply
5. Hand off to `omg-contract` to render the response document

### Scenario B: You're about to open a new deal
1. **`prep`** for the counterparty → BATNA + leverage + cultural brief
2. **`culture`** if cross-cultural → tone, pace, agreement signals
3. **`playbook`** Phase 1 (pre-negotiation) → checklist of opening moves
4. Hand off to `omg-contract-review` mode `balance` to draft your opening posture

### Scenario C: Mid-round, you're stuck
1. **`analyze`** the latest counterparty input
2. **`playbook`** for current phase to find phase-specific moves
3. Look up specific techniques in `references/technique-library.md`
4. Re-run BATNA from `references/batna-template.md` — has ZOPA collapsed?

---

## Gotchas

- **Pattern-naming is a tool, not a label.** Don't fight the pattern; use it to predict their next 2–3 moves and prepare counters.
- **Cultural code-switching is not stereotyping.** Cultures are tendencies, not rules. Adjust based on the specific person — but the priors are useful starting points.
- **BATNA decays.** Recalculate every 2 rounds, not at the start. Sunk-cost rises; leverage falls. Pretending day-1 BATNA still holds at round 7 is the most common rationalization for a bad deal.
- **The walk-away must be credible.** Never bluff. One bluff burns the move for the lifetime of the relationship.
- **80% of value is in `analyze` + `prep`.** The other modes are accessory. If you only have 30 minutes, run `analyze` (if reactive) or `prep` (if proactive).
- **Definition discipline > clever clauses.** A clean definition section with 5 worked examples beats 3 pages of "reasonable efforts" language.
- **Don't run `analyze` and `omg-contract-review` in parallel.** Strategy first, clause craft second. Running them together creates bad clause edits informed by half-formed strategy.

---

## When NOT to use this skill

- **Simple template signings with no real negotiation surface** (NDAs, standard SaaS EULAs). Use a lawyer-provided template.
- **Hostage / safety-of-life situations.** This skill borrows from FBI hostage negotiation theory but is not a hostage negotiation skill. Call professionals.
- **Regulated negotiations with statutory form requirements** (Vietnamese labor contracts, consumer credit). Local counsel.
- **Pure clause craft** (redlining, schedule drafting, render). Use `omg-contract-review` for clauses, `omg-contract` for render.

---

## References

- `references/pattern-catalog.md` — 20 named counterparty patterns with Tell/Use/Counter, tier-ranked by frequency in user's deal flow
- `references/technique-library.md` — 80 named negotiation techniques with one-line use cases, scannable catalog
- `references/frameworks.md` — 5 foundational frameworks deep dive (Fisher/Ury, Voss, Karrass/Shell, Bazerman, Meyer)
- `references/phase-playbook.md` — Phase-by-phase tactical guidance: pre-negotiation, opening, middle game, closing, post-signature
- `references/cultural-map.md` — 7 cultures with trust/disagreement/pace dimensions, plus Hofstede framework for unknowns
- `references/failure-modes.md` — 5 named failure modes: splitting-the-difference, sunk-cost, decision-fatigue, anchoring on own offer, reciprocity exploitation
- `references/ma-deal-structure.md` — M&A deal-structure mechanics: earn-outs, R&Ws, MAC clauses, LOI→definitive transitions
- `references/batna-template.md` — BATNA + ZOPA + leverage worksheet template

---

## Provenance

This skill synthesizes:

- **Canonical literature** (canonical-literature survey, Researcher #1): Fisher/Ury, Voss, Karrass, Shell, Bazerman, Meyer, Malhotra, Diamond, Dawson
- **Adjacent / non-canonical** (advanced-techniques supplement, Researcher #2): Cialdini, Kahneman, Schelling, Galinsky, Noesner (FBI), Sharot, Fox, Schweitzer, Greene (defensive), Klein (pre-mortem), Kraljic
- **Real-deal patterns observed in user's contracts** (2026-04 to 2026-05): Alfa v3 (Turkish gaming-investment bank — originating pattern: "Accept volume, attack definitions"), BagelCode (Korean publisher — pattern: "Growth-stage rhetoric bundle"), JM Game (HK Chinese — pattern: "Approval-rights creep"), PlayableLab (mixed — pattern: "Reciprocity exploitation")

Designed to be counterparty-agnostic. The 20-pattern catalog and 80-technique library cover most commercial dealmaking scenarios. Cultural map is comprehensive across 7 cultures with Hofstede fallback for the rest.
