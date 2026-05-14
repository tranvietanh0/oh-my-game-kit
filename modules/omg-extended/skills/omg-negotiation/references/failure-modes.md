---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Failure Modes — Named Negotiation Mistakes

Five named failure modes that derail even experienced negotiators. Each entry: definition, why it happens, detection signals, prevention, recovery if you're already in it.

These are the patterns to watch for in YOURSELF — counterparty-side patterns are in `pattern-catalog.md`.

---

## 1. Splitting-the-Difference Trap

### Definition
After deadlock on a single dimension, both parties propose "let's split the difference." The midpoint feels fair, but it's almost always worse than alternative trades.

### Why it happens
- Decision fatigue at end of negotiation
- Discomfort with continued conflict
- Anchor on a single dimension (royalty, equity, valuation) instead of multi-dimensional bundling
- "Fair" framing creates pressure to accept

### How it derails you

**Mathematical example:**
- You ask: 12% royalty
- They offer: 18% royalty
- "Split" = 15%

But this is suboptimal because:
- If their actual reservation was 14% and yours was 13%, splitting to 15% gave them 1% more than you knew they'd take
- If you'd refused the split and pushed for 13.5%, they likely would have agreed
- You also lost the chance to trade across dimensions (e.g., 13% royalty + 6-month exclusivity + co-marketing would have been better for both)

**Worse case:** when each side anchored extreme to manipulate the split point.
- They opened: 25% royalty
- You opened: 5% royalty
- "Fair split" = 15%
- But midpoint is anchored on their extreme position; real fair was probably 11-13%

### Detection signals (you're falling into it)

- "Let's just split the difference and move on"
- "We're both reasonable people, let's meet in the middle"
- "What about [average of two numbers]?"
- You feel relief at the proposed split (decision fatigue talking)
- Neither side has proposed alternatives in 2+ exchanges

### Prevention

1. **Always have 3+ dimensions to trade across.** Anchoring on a single number (royalty alone, equity alone) sets up the split trap. Open with 4-5 dimensions: royalty + milestones + IP + timeline + territory.

2. **Reject the split frame explicitly.** "I don't want to split — that locks us into the average. Let's solve the underlying constraint."

3. **Pre-commit to alternative bundling.** Before each round, list 3 multi-dimensional bundles you'd accept. If they propose split, redirect: "I prefer Bundle B which gives you X and Y in exchange for Z."

4. **Anchor based on ZOPA, not aspiration.** If your real minimum is 12% and you opened at 14%, you're vulnerable to splits because the anchor point is too close to your floor. Anchor with margin.

### Recovery (already mid-split)

- "Let me think on it overnight" — break decision fatigue, recalculate from data tomorrow
- "Before we split, let me propose one alternative" — introduce a multi-dimensional bundle
- If split is accepted but you regret it: in next phase, find a non-monetary concession from them to compensate

### Worked example — Alfa context

If Alfa pushes "let's split the difference on stickiness window — you said 8 months, we said 6, let's do 7":

❌ Split to 7 months — locks in a number neither side really wants

✅ Counter: "I'd rather solve why stickiness matters. The 8 months protects against sign-and-churn risk. If you accept tighter Qualifying Client definition (no invoiced-but-unsigned), I can move to 6 months. Trade across dimensions instead of splitting on one."

---

## 2. Reciprocity Exploitation (One-Way Trap)

### Definition
You concede repeatedly. They don't reciprocate. By round 3, you've normalized one-way movement. The deal drifts entirely your way to lose.

### Why it happens

- Cialdini's reciprocity principle is your default mode (you reflexively reciprocate small concessions); counterparty doesn't operate the same way
- "Goodwill" rationalization: "I'll concede on this small thing to build trust"
- Asymmetric expectations: you view negotiation as collaborative; they view it as competitive
- Cultural mismatch (you're task-culture-collaborative; they're zero-sum-positional)

### How it derails you

The first concession sets a pattern. By round 3:
- You've conceded: lower royalty, longer exclusivity, simpler reporting
- They've conceded: nothing
- You feel "we're making progress" because YOU are moving
- Their position is unchanged from opening

By final round, you've effectively negotiated against yourself.

### Detection signals (you're falling into it)

- After your concession, they immediately ask for another concession (instead of trading)
- Counting your concessions vs theirs over the last 3 rounds: ratio >2:1
- You catch yourself thinking "I should give a little to show good faith"
- They've never said no to a concession from you, but always say no to your asks
- Their position at round 4 looks identical to their position at round 1

### Prevention

1. **Conditional concession discipline.** Never concede unilaterally. Every concession is paired: "If we move on X, you need to move on Y."

2. **Track concession ratio.** Keep a running tally. If ratio exceeds 1.5:1 in your direction, stop conceding entirely until they reciprocate.

3. **Decreasing-step rule.** Even when conceding, each move smaller than the last. This signals you're at limit.

4. **Make it visible.** "I notice we've moved on three items — what are you moving on?" Forces them to surface trades.

### Recovery (already mid-trap)

- **Pause unilaterally.** "I need to recalibrate. We've moved on items 1, 2, 3. Before further discussion, I need to see your reciprocal moves on items 4, 5, 6."
- **Reset the round.** "Let's go back to where we were after Round 2. Here are the trades I'd accept moving forward — each contingent on a parallel move from your side."
- **Walk if necessary.** If after reset they still don't reciprocate, your BATNA is probably better than this deal.

### Worked example — anti-pattern

❌ Round 2: "We can move from 12% royalty to 13%."
   Counterparty: "Great, can you also extend the term to 5 years?"
   You: "OK."
   Round 3: "Can you also add a quarterly bonus?"
   You: "Sure, that's reasonable."
   Round 4: "And first refusal on next title?"
   You: "Hmm, OK."

   → You've conceded 4 times. They've conceded 0. This is a death spiral.

✅ Round 2: "We can move from 12% royalty to 13% IF you accept 4-year term instead of 5."
   Counterparty: "We need 5 years."
   You: "Then royalty stays at 12%. Or 13% with 4 years. Which do you prefer?"

   → Forcing the trade structure prevents reciprocity exploitation.

---

## 3. Anchoring on Your Own First Offer

### Definition
You open at an aspirational anchor (20% royalty when market is 14%). They counter at 12%. You feel 16% would be a "win". When in reality 14% (market) was probably achievable.

### Why it happens

- Anchoring bias works on YOU too, not just your counterparty
- Confirmation bias: once you've stated an anchor, you defend it as if it were principled
- Psychological commitment: backing off your own anchor feels like loss
- Insufficient market research; anchored on internal aspiration not external data

### How it derails you

You open at 20%. They counter at 12%. The midpoint feels like 16%. You're "winning" 4 points off your anchor. But:
- Market median is actually 14%
- Their reservation price is probably 14-15%
- 16% is OVER market; you've actually negotiated yourself into above-market territory that they may resent

OR conversely:
- You open at 20% but their reservation is 18%
- They counter at 10% to anchor low
- "Split" lands at 15%
- You feel you got 5 points off your anchor; in reality you got 3 points BELOW their actual willingness-to-pay

### Detection signals

- You opened without market research backing your anchor
- Your anchor came from "what would feel good" not "what does the data say"
- You can't articulate WHY your anchor is your anchor (just "industry standard" without source)
- When counterparty asks for justification, you fall back on "that's our offer"

### Prevention

1. **Anchor from data, not aspiration.** Before opening, research:
   - Recent comparable deals (last 24 months)
   - Industry medians (sourced — Newzoo, GDC, NVCA, Crunchbase)
   - Your real reservation price
   - Their likely reservation price (estimated)

2. **Anchor with documented justification.** When you open at 20%, attach the data: "Based on Newzoo's 2025 industry survey, top-tier mobile publisher royalties range 18-22%. We're proposing 20%."

3. **Build margin into your anchor.** If your real minimum is 12%, opening at 18% gives you room. Opening at 14% leaves no room for reciprocal concession discipline.

4. **Recognize when your anchor is wrong.** If their counter is credible AND backed by data, your anchor was probably aspirational. Adjust.

### Recovery (already anchored too high)

- **Reset with new data.** "Based on what I'm hearing, let me look at this fresh. Here's updated data: [X]. Where does this leave us?"
- **Acknowledge graceful repositioning.** "I want to make sure we're both anchored on real market — let me share what I've found."
- **Don't double down on a bad anchor.** Continuing to defend an aspirational anchor with no data damages credibility.

### Worked example

❌ You open: "We propose 30% royalty for Phase 1."
   Counterparty: "Industry standard is 14-18%, our last deal was 16%."
   You: "We have a strong track record, 30% is justified."
   Counterparty: "Show me the data."
   You: "It's our standard rate."

   → Anchor without data. They'll either walk OR you'll concede deeply (back to 18-20%) with damaged credibility.

✅ You open: "We propose 22% royalty for Phase 1, citing Newzoo 2025 (top-quartile mobile publisher royalties: 18-26% for our genre + region)."
   Counterparty: "Our last deal was 16%."
   You: "Different deal structure. Newzoo data adjusted for genre + audience suggests 20-22% for our profile. Show me your comparable deal structure."

   → Data-backed anchor. They'll move to 18-20% with respect, not capitulation.

---

## 4. Decision Fatigue Concession (Closing-Day Bleed)

### Definition
Late-day, late-round, after marathon negotiation, you concede on terms you wouldn't have accepted at 10am. Cognitive fatigue makes "just close" feel rational.

### Why it happens

- System 2 (deliberate) thinking is metabolically expensive; depletes over the day
- Decision fatigue research (Roy Baumeister, et al.): glucose levels actually drop with sustained decision-making
- Escalation of commitment: "we've come this far, let's just close"
- Cognitive narrowing: tunnel vision on the immediate point, lose sight of the big picture

### How it derails you

By 4pm on day 5 of intense negotiation:
- Your judgment is impaired
- You accept terms you'd reject at 10am
- "Just close" overrides "stay disciplined"
- You'll wake up tomorrow with regret

### Detection signals

- It's late afternoon or evening
- You've been in the negotiation for 6+ hours straight
- You haven't eaten or had water in 2+ hours
- You catch yourself thinking "let's just finalize this"
- Counterparty is pushing for "let's just sign tonight"
- Internal voice: "this isn't ideal but I want to be done"

### Prevention

1. **Schedule final terms for morning.** Push closing decisions to 10am-noon when your System 2 is freshest.

2. **No marathon sessions.** Cap negotiation at 4 hours per day. Beyond that, judgment decays measurably.

3. **Built-in breaks.** 10-15 min break every 90 minutes. Hydrate, eat, walk.

4. **The 24-hour rule for big decisions.** Any commitment >$100K or anything in your 3-5 red lines gets at least 24 hours before signing.

5. **Pre-commit to walk-aways with a partner.** Tell someone outside the negotiation: "Don't let me sign anything tonight." External commitment device.

### Recovery (already fatigued, decision pending)

- "I want to think on this overnight." Don't apologize. Don't justify.
- "Let me sleep on it and come back fresh tomorrow."
- If they push for tonight: "I've made my best decisions in the morning. I'll respect this enough to be fresh."
- If they refuse delay: that's a signal. Either they're trying to force a fatigue concession, or there's a real deadline you should verify.

### Worked example

❌ 7pm, day 4 of negotiation. They propose final terms with a clause you don't fully understand. You're tired. You sign.
   Tomorrow morning: realize the clause shifted IP rights significantly. Now in cleanup mode.

✅ 7pm, day 4. They propose final terms. You: "I want to make sure I've understood correctly. Let me come back tomorrow morning at 9am with my thoughts."
   Counterparty: "We need to close tonight."
   You: "I respect that. If tonight is critical, I'll make my best decision now — and that means saying no to the parts I can't review properly. We can do A and B tonight, but C needs morning eyes."
   Tomorrow at 9am: you accept B, modify C, decline A. Better outcome.

---

## 5. Escalation of Commitment (Sunk-Cost Trap)

### Definition
6 months into a stuck negotiation, you sign a bad deal because "we've come too far to walk." Sunk cost overrides current evaluation.

### Why it happens

- Sunk-cost fallacy (Staw 1976): humans factor unrecoverable past investment into current decisions
- Self-justification: backing out feels like admitting failure
- Sunk-cost rationalizes: "we've invested 6 months, must be salvageable"
- Identity threat: "I'm not the kind of person who walks away from deals"

### How it derails you

You should accept terms ONLY if they clear your reservation price TODAY. The 6 months you've invested are gone whether you sign or walk. Yet:
- "We've negotiated 8 rounds, we should accept this"
- "Walking now wastes everything"
- "Maybe round 9 will solve the remaining issues"

By the time you sign, the deal terms are worse than your day-1 BATNA. You've negotiated yourself into a bad deal because of sunk cost.

### Detection signals

- You catch yourself saying "we've come too far"
- You've been in this negotiation longer than 8 rounds or 3 months
- The deal terms are now worse than your original BATNA
- You're rationalizing acceptance ("at least this clause is OK", "the deal will get better post-signing")
- You can't remember when you last reviewed your reservation price

### Prevention

1. **Recalculate BATNA every 2 rounds.** Pretend it's day 1. Would you accept these terms now? If not, walk.

2. **Document your reservation price BEFORE the round and refuse to look at sunk cost.** Decision rule: terms must clear reservation price. Period.

3. **External BATNA check.** After every 4 rounds, talk to someone OUTSIDE the negotiation. Tell them current terms. Ask: "Would you sign this fresh?"

4. **Time-cap the negotiation.** "If we haven't closed by [date], we both walk and pursue alternatives." Forces resolution before sunk cost gets too deep.

5. **Maintain alternative options actively.** Even mid-negotiation, keep 1-2 alternative paths warm. Their existence keeps your BATNA strong.

### Recovery (already sunk-cost trapped)

- **The "fresh-start test":** if a friend brought you these terms today and asked "should I sign?", what would you say? Apply the same answer to yourself.
- **Reset BATNA visibly.** "Let me take a step back. Here are the terms compared to my reservation price: [X]. We're below [Y]. I need to walk."
- **Walk for real (3-5 days).** Often the counterparty re-engages with better terms when they see you're serious about walking.
- **If walking is genuinely impossible (regulatory deadline, irreversible commitment), at least surface the trap** to yourself so the post-mortem is honest: "I'm signing this not because terms cleared BATNA, but because sunk cost is binding me."

### Worked example

❌ Round 8 of Alfa negotiation. Original BATNA: 10% equity at clean terms. Current proposal: 10% equity but with diluted Qualifying Client definition + no concentration cap + Key Person clause deleted. You sign because "we've already done 8 rounds."
   12 months later: realize the deal is structurally worse than fundraising alone would have been. Sunk-cost trap.

✅ Round 8. You: "Let me step back. My day-1 BATNA was 10% equity with concentration cap, Key Person clause, and 12-month commitment requirement. Current terms have weakened all three. Let me recalculate today's BATNA."
   Calculation: alternatives still viable (different sales partner, in-house build). Current Alfa terms < BATNA.
   You: "I appreciate the work we've put in, but the current structure doesn't clear my reservation. Let's pause for 2 weeks and see if either side has new thinking. If not, we'll go separate ways."

   Possibilities:
   1. Alfa re-engages with stronger terms (likely — they've also sunk cost in)
   2. You walk and pursue alternative (BATNA was always there)
   3. Both confirmed the deal isn't workable, separated cleanly

   In all 3 outcomes, you avoided the sunk-cost trap.

---

## Combined diagnostic — am I in a failure mode RIGHT NOW?

Run this 5-question check at any point in negotiation:

1. **Splitting trap?** Am I about to accept a midpoint without exploring multi-dimensional trades?
2. **Reciprocity trap?** Have I conceded more than 2× more often than counterparty in the last 3 rounds?
3. **Anchor trap?** Did my opening anchor come from data or from aspiration?
4. **Fatigue trap?** Is it after 4pm? Have I been in this negotiation more than 4 hours today?
5. **Sunk-cost trap?** If I were starting fresh today, would I accept these terms?

If yes to ANY: pause. Don't sign. Take 24 hours.

If yes to TWO: this is structural, not tactical. Reset BATNA, consider walking, get external review.

If yes to THREE OR MORE: do not sign anything tonight. The deal as currently structured is not in your interest.

---

## Cross-reference

- For counterparty patterns (their tactics, not yours): `pattern-catalog.md`
- For specific defensive techniques: `technique-library.md`
- For phase-specific failure modes: `phase-playbook.md` (Phase 3 has the most failure-mode entries)
- For framework theory behind why these biases exist: `frameworks.md` (Bazerman/Neale)
