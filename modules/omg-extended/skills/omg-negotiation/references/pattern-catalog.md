---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Pattern Catalog — 20 Named Counterparty Negotiation Patterns

A tier-ranked catalog of recurring counterparty negotiation patterns. Each entry includes detection signals, what they're optimizing for, counter-tactics with specific language, and observed examples from real deals.

**Tier ranking** is based on frequency in commercial gaming/dealmaking contexts. Tier 1 patterns are seen in most multi-round negotiations. Tier 3 patterns are less common but high-impact when they appear.

---

## Tier 1 — Most common (seen in >50% of multi-round negotiations)

### 1. Accept volume, attack definitions

**Tell:** Counterparty accepts your headline numbers (royalty %, equity cap, vesting periods, milestone targets) without pushing back, but proposes 5–20+ redefinitions of the words AROUND those numbers (e.g., "royalty on net revenue after platform fees, refunds, chargebacks, localization, server costs"; "qualifying client per definition X with carve-outs Y, Z").

**What they're optimizing for:** The visible commitment looks unchanged, but the actual delivery bar drops 30–50%. Cleaner negotiating optics ("we accepted your terms!") while substantively reducing what they owe.

**Why this works on most negotiators:** Definition-attacks feel pedantic and easy to give up one at a time. By the time you notice the cumulative effect, you've conceded the deal economically without seeming to concede anything visible.

**Counter-tactics (ranked):**

1. **Definition discipline pre-commit.** Before opening, decide which definitions are sacrosanct ("Qualifying Client", "Net Revenue", "Material Breach") and which are negotiable. Hold the sacrosanct ones absolutely.
2. **Trade definitions for headline tightening.** When they push to loosen a definition, demand a parallel headline-tightening: *"We can accept invoiced-but-unsigned for the Month-4 cliff IF the WCP target rises from 16 to 20 at Gate 3."*
3. **Worked-example freeze.** For each contested definition, attach 3 positive examples (counts) and 3 negative examples (doesn't count) in the term sheet itself. Examples beat abstract definitions in disputes.
4. **Unified rebuttal.** When >5 definitions are attacked under the same rhetorical frame ("we're in growth stage", "this is industry standard"), respond to the FRAME, not the items. Item-by-item concession is how this pattern wins.

**Observed:** Alfa v3 (2026-05-04) — 22 inline comments on a term sheet. Headline numbers (10% equity cap, 5% Pool A, 4% Pool B, vesting buckets, Gate 3 = 16 WCP + $2.5M floor + 5 clients) all untouched. But every quality definition attacked: drop concentration cap, drop margin floor, drop Key Person clause, accept invoiced-but-unsigned, narrow non-compete to playable-ads-only, narrow non-circumvention to clients-only. Net effect: same nominal headline, ~40% looser delivery bar.

---

### 2. Growth-stage rhetoric bundle

**Tell:** Counterparty repeatedly invokes a single rhetorical frame ("we're in growth stage", "early days for us", "scaling phase", "this is normal at our stage") to bundle multiple guardrail-relaxation requests under one rationale. The frame appears 3–5+ times across separate clauses.

**What they're optimizing for:** Get you to evaluate each ask individually rather than as a coordinated set. Each individual ask seems reasonable in isolation; the cumulative effect is structural.

**Counter-tactics:**

1. **Counter-frame.** "Growth stage means we BOTH need certainty — that's exactly why these guardrails exist." Reverse the frame.
2. **Bundle their bundle.** "I see five asks under 'growth stage'. Let's evaluate them as a package: which 2 of the 5 matter most to you? In exchange, we tighten on the other 3."
3. **Maturity ladder.** Propose a vesting of guardrails: "We can drop concentration cap until Gate 2, but it reactivates from Gate 3 onward when growth stage transitions to retention stage." Time-boxes the relaxation.
4. **Surface the opposite frame.** "Growth-stage companies often FAIL because they don't have these guardrails. Here are 3 examples." Use their narrative against them.

**Observed:** BagelCode Phase 1/2 funding discussion — "growth stage" used to justify lower royalty + extended payment terms + reduced approval rights as a coordinated package. Alfa v3 — same frame used to attack concentration cap, margin floor, Qualifying Client definition, and stickiness window simultaneously.

---

### 3. Disclosure deflection

**Tell:** When asked specific questions about conflicts, existing portfolio, or prior commercial relationships, counterparty answers with generalities. Specific questions: "Which other gaming studios are you publishing?" Generic answers: "We work with many studios." "We have a strong portfolio in the space." "Our investments are confidential."

**What they're optimizing for:** Either (a) hiding a competitive conflict they don't want to disclose, or (b) leaving room to maneuver post-signature, or (c) testing whether you'll push for specifics. Often (a) and (c).

**Counter-tactics:**

1. **Specific re-ask, three times.** "I appreciate that. To be specific — names please. Even just 3-4 of the 4 you mentioned." If they deflect a third time, treat as confirmed conflict.
2. **Schedule attachment.** "We need this listed in Schedule X of the agreement before signing. Can you send the list by next week?"
3. **Indemnity proxy.** If they refuse to disclose, demand an indemnity for any conflict that emerges later: "If a portfolio company is found to be in our genre, you indemnify us for [breach remedy]." Most deflectors won't sign that — which itself confirms the deflection.
4. **Prefer no-deal to undisclosed conflicts.** If they refuse all three above, the deal is structurally unsafe. Walk.

**Observed:** Alfa v3 — Ozgur openly stated "We are Gaming Focus Investment bank and have 4 Gaming Studio investment in Turkey. Our focus is Gaming Studios anywhere" but never offered names of those 4 studios. This is the deflection in its purest form: admit the existence of conflict at the abstract level while withholding the specifics that would make conflict-resolution possible.

---

### 4. Approval-rights creep

**Tell:** Counterparty accepts the headline structure but proposes adding approvers, sign-offs, or quality gates throughout: "We need approval on marketing campaigns, monetization changes, IP usage, character design, post-launch content, pricing changes, localization, soft-launch geographies, partnership announcements..." Each individually seems reasonable.

**What they're optimizing for:** Installing de facto control without formal control rights. Each approval gate is a delay vector and a leverage point. Death by 1,000 cuts.

**Counter-tactics:**

1. **Enumerate-and-bundle.** List all proposed approval points. Then trade collectively: "Approval on these 8 items = we need parallel approval on YOUR pricing strategy and DLC roadmap." Mirror imaging often kills the request.
2. **Approval-with-deemed-consent.** Accept approval rights but with a 5-business-day silence-equals-consent rule. If they don't object within 5 days, deemed approved. This converts veto power into review power.
3. **Approval criteria pre-commit.** "We accept approval, but only on objective criteria you specify in advance — not subjective judgment." Forces them to write the criteria; most won't.
4. **Tier the approvals.** Major (board-level, signed off): pricing strategy, IP licensing, M&A. Minor (operational, written notice only): marketing copy, character art, localization. Don't let them roll all approvals into one gate.

**Observed:** JM Game bilingual contracts — multiple approval rights inserted across operational dimensions. The fight isn't about ANY single approval; it's about the cumulative effect.

---

### 5. Precedent anchoring (fake or unsourced)

**Tell:** "Industry standard is X." "Our standard rate is Y." "Comparable deals have Z." But when pressed for source, they deflect: "It's just standard." "Trust us, we've done this many times." Never produces a citation.

**What they're optimizing for:** Anchor your perception of fair using social proof without burden of proof.

**Counter-tactics:**

1. **Demand source, three times.** "Which 3 deals? Names? Dates?" If they can't produce, ignore the precedent claim.
2. **Counter-cite.** Pre-load real benchmarks: GDC State of the Industry, Crunchbase deal databases, Newzoo, App Annie, recent VC reports. "Newzoo's 2025 report shows publisher royalty range 8-18%. Your 30% is above market. What's the justification?"
3. **Reverse-precedent.** "Show me 3 deals at your proposed rate AND I'll show you 3 at mine. Let's compare which is more representative."
4. **Time-stamp benchmarks.** Old precedent is stale. Demand recent deals (last 24 months) — markets shift, especially in mobile gaming.

**Observed:** Common across Bagelcode, JM Game, Alfa. Especially common when the counterparty has more public-deal-flow experience than you (they assume you can't verify).

---

### 6. Sunk-cost reframing

**Tell:** After 4–6 rounds of negotiation with substantial time investment, counterparty introduces a new requirement that wasn't in scope: "We'll also need board approval." "Your CTO needs to relocate to Seoul." "There's a 6-month exclusivity period we forgot to mention." Presented as if previously discussed or as if minor.

**What they're optimizing for:** Exploit your sunk-cost psychology. You've invested time and trust; you'll likely accept the new ask rather than restart.

**Counter-tactics:**

1. **Out-of-scope reset.** "That wasn't in scope. New scope = new negotiation. Where else might scope have shifted?"
2. **BATNA recalculation with new friction.** Pause. Recalculate your BATNA INCLUDING the new requirement. If it fails BATNA, walk.
3. **Trade explicitly.** "If relocation is required, the salary/equity package needs adjustment by [X]." Don't accept new asks without trades.
4. **Anti-creep clause.** Future deals: "All material requirements must be in the term sheet. Subsequent additions require an explicit trade." Bake this into your standard term sheet template.

**Observed:** Common in multi-round negotiations everywhere. The longer the negotiation, the more vulnerable you are.

---

### 7. Higher-authority invocation

**Tell:** When pressed on a specific point, counterparty claims "the board requires X" or "compliance mandates Y" or "the investment committee won't approve below Z." But never offers to bring the authority into the conversation.

**What they're optimizing for:** Plausible deniability. Shifts burden of proof to you. Lets them make tough demands without owning them personally.

**Counter-tactics:**

1. **Direct invitation.** "Can we schedule 30 minutes with [board member / compliance lead] so we understand the constraint directly?" Real authorities accept; fake ones decline.
2. **Written constraint request.** "Can you send the board policy / committee guideline in writing?" Real policies exist on paper; fake ones don't.
3. **Mirror the move.** "Funny coincidence — our board has the opposite constraint. Let's get both authorities in a room."
4. **Recognize and respect REAL higher authority.** Sometimes it IS real (especially with regulated entities). When real, respect the constraint and adjust around it.

**Observed:** BagelCode — investment committee invoked. Alfa — "our investment committee sets these terms." Sometimes real, sometimes a tactic. The test is whether they'll let you talk to the authority.

---

### 8. Late-stage nibbling

**Tell:** In rounds 8–9 of a 10-round negotiation, counterparty introduces small new asks: "Also, can we have a right of first refusal on your next title?" "Can we add a non-disparagement clause?" "Just a quick one — we need a co-marketing right." Presented as minor.

**What they're optimizing for:** Test if you'll accept scope creep when you're nearly done. Often the "small" nibbles are HIGH-value (ROFR can be worth more than the base deal).

**Counter-tactics:**

1. **Round discipline announcement.** Before the final round: "Round 8 is final on existing terms. Any new asks need new concessions."
2. **Force trades.** "ROFR on your next title? OK — in exchange, we waive your exclusivity on this one." Make every nibble cost.
3. **Push to next negotiation.** "That's a fair ask, but it's outside this deal. Let's discuss it as a separate agreement."
4. **Pre-commit list.** At round 7 send: "Here are the remaining items. Anything not on this list is out of scope. Confirm by Friday."

**Observed:** General pattern across all multi-round deals.

---

### 9. Good-cop / Bad-cop

**Tell:** Multi-person negotiating team. One member is warm and collaborative ("I really want to make this work, but..."). Another is harsh and demanding ("Frankly, your terms are unreasonable"). They alternate.

**What they're optimizing for:** Soften you with the good cop, pressure you with the bad cop. You'll agree to good cop's "compromise" to escape bad cop's pressure.

**Counter-tactics:**

1. **Stay consistent regardless of tone.** Respond to substance only, not warmth or harshness.
2. **Name it kindly.** "I notice [Bad Cop] takes a tougher line than [Good Cop]. Where's the consensus on your side?" Forces them to align internally before continuing.
3. **Bilateral commitment ask.** "[Good Cop], do you agree with [Bad Cop's] position on X?" Don't let one defer to the other.
4. **Equal-time response.** Address both parties equally. Don't skew responses toward the warmer one — that's the trap.

**Observed:** Common in larger counterparty teams (Korean conglomerates, Chinese trading companies, US strategic acquirers).

---

### 10. False-choice framing

**Tell:** "Either we get 50% equity, or this deal is off." "We need IP assignment OR we walk." Presented as binary with no middle ground.

**What they're optimizing for:** Anchor via ultimatum. Test whether you'll capitulate under pressure rather than explore alternatives.

**Counter-tactics:**

1. **Reject the frame explicitly.** "Those aren't the only options. Let's explore: minority equity + voting rights + earn-out, or licensing + sublicensing rights, or hybrid structures." Propose 3+ alternatives.
2. **Calibrated question.** "How do we get to a structure that protects both your downside risk and our equity dilution concerns?" Voss-style.
3. **Walk-away calibration.** Calculate: is your BATNA better than their ultimatum? If yes, walk. False-choice framers often re-engage when you actually walk.
4. **Time the response.** Don't respond same-day to ultimatums. Sleep on it. Often by next morning they've softened or proposed alternatives themselves.

**Observed:** Distribution discussions where counterparty has many options.

---

## Tier 2 — Moderately common (seen in 25-50% of negotiations)

### 11. Flinch (emotional reaction)

**Tell:** When you state your ask, counterparty visibly reacts: "WHAT?!" "That's way off!" "I didn't expect that!" Even when your ask is within range. The reaction is theatrical.

**What they're optimizing for:** Anchor lower by signaling pain. Test if emotional reaction makes you retreat.

**Counter-tactic:** Acknowledge without retreating. "I know it's a big ask. That's why we structured it as [X + milestone] instead of fixed [Y]." Don't defend the position; reframe it.

---

### 12. Vise technique (squeezing for justification)

**Tell:** Counterparty asks "Why X?" "Why that number?" "Why that timeline?" repeatedly. Each "why" forces you to re-justify. You start to sound uncertain even on points you're sure of.

**What they're optimizing for:** Shake your confidence. Make you waver and then capitulate.

**Counter-tactic:** Pre-prepared written justifications. When asked, cite the source instead of re-justifying: "Industry data shows 12% is median. Full report at [URL]." Same data, no re-litigation.

---

### 13. Escalation of commitment

**Tell:** After significant time invested, counterparty introduces friction: "Requires CEO signature." "Needs external legal firm review." "Board just added a requirement." Each increment seems small.

**What they're optimizing for:** Test sunk-cost psychology. If you're committed, you'll absorb new friction without protest.

**Counter-tactic:** Pause and recalculate BATNA WITH new friction. If deal still clears BATNA, continue. If not, walk. Don't let prior rounds influence current decision.

---

### 14. Fixed-pie assumption

**Tell:** Counterparty negotiates each dimension independently — wants higher equity AND higher royalty AND all IP — without trading across dimensions.

**What they're optimizing for:** Either they don't realize trades are possible (unsophisticated), or they're testing if you'll let them have everything.

**Counter-tactic:** Explicitly propose multi-dimensional trades: "Higher equity IF royalty reduces AND IP reverts in 5 years." Force them to reveal priority. Most will trade when faced with explicit choices.

---

### 15. Anchoring by precedent (fake)

**Tell:** "Our standard deal includes [X]" when X is actually rare or specific to your ask, not theirs.

**What they're optimizing for:** Use social proof to legitimize without evidence.

**Counter-tactic:** Challenge with real precedent. "Show me 3 comparable deals with that term." If they can't, ignore the "standard" framing.

---

### 16. Delay tactic / urgency inversion

**Tell:** When you propose a deadline ("Decision needed by Friday"), they counter with their own delay: "We can't decide until we consult [authority], so let's pause until next month."

**What they're optimizing for:** Stall to build sunk cost on your side. You'll lower asks to get the deal done.

**Counter-tactic:** Set hard deadlines in writing at the start. "We'll have a final term sheet by [date]. After that, we pursue alternatives." Then enforce it. If they need delay, THEY must offer concession to buy time.

---

### 17. Reciprocity exploitation

**Tell:** When you make a concession (lower royalty), they immediately counter-ask for an unrelated concession (IP rights, approval authority) without trading.

**What they're optimizing for:** Exploit reciprocity norm. You conceded once; you'll concede again.

**Counter-tactic:** Require explicit trades. "I moved on royalty. What are you moving on?" Reciprocity flows both ways.

---

## Tier 3 — Less common, high-impact when present

### 18. Splitting-the-difference trap

**Tell:** After deadlock, counterparty proposes "let's split the difference." Sounds fair — you asked 12%, they offered 18%, so 15%.

**What they're optimizing for:** Lock you into their anchor. If they anchored at 18% but their real limit is 16%, splitting to 15% gives them 15% instead of 16%.

**Counter-tactic:** Reject splitting: "Let's not split — let's solve the underlying constraint." Or, if you must split, ensure you anchored LOWER than your real ask so split is favorable.

---

### 19. Retroactive redefinition

**Tell:** After signature, counterparty claims terms meant something different. "When we said 'net revenue,' we meant net after platform fees, localization, server costs, support."

**What they're optimizing for:** Test post-signature if you'll renegotiate. Especially common when economics are tight.

**Counter-tactic:** Prevent. Define every ambiguous term in the term sheet itself with worked examples. When drafting the definitive agreement, circle back to term sheet. If they try retroactive redefinition, point to term-sheet definition.

---

### 20. Ownership of objections

**Tell:** When you raise a concern ("This IP clause is risky"), counterparty reframes as YOUR problem ("That's just how publishing works") instead of mutual problem to solve.

**What they're optimizing for:** Deflect responsibility. Invert power dynamic.

**Counter-tactic:** Reframe as mutual problem. "We both want to avoid IP disputes. Here's a structure that protects both of us: [X]." Don't accept "that's how it works" — find precedent for your alternative.

---

## How to use this catalog

1. **In Mode 1 (`analyze`):** Match counterparty input against patterns. Use the "Tell" column. Confidence is high if 3+ signals match a single pattern; low if signals are scattered.

2. **In Mode 2 (`prep`):** Predict which 2–3 patterns the counterparty is likely to use based on culture + deal type. Pre-prepare counters.

3. **In daily review:** When stuck, scan this catalog. Often you'll recognize a pattern you didn't have a name for.

4. **As an internal training tool:** Walk a teammate through these patterns before they negotiate independently. The catalog is a mental shorthand for fast pattern recognition.

---

## Provenance

Patterns 1, 2, 3 originated from observed Alfa v3 / BagelCode / JM Game / PlayableLab dealmaking. The remaining 17 are synthesized from canonical literature (Voss, Karrass, Shell, Malhotra, Diamond, Dawson, Cialdini, Schweitzer) and Harvard Program on Negotiation case studies.

Tier ranking is based on observed frequency in the user's contracts (2026-04 through 2026-05 deal flow). Update as new deals surface new patterns.
