---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# M&A Deal Structure — Negotiation Mechanics

Specialized guidance for M&A and high-stakes deal structures: earn-outs, representations & warranties, MAC clauses, term sheet → definitive agreement transitions, advisor equity (FAST agreements), and Modified Lehman fee structures.

This reference complements the broader negotiation skill with deal-structure-specific mechanics that frequently appear in gaming partnership / advisor / acquisition contexts.

---

## 1. Earn-out structures (valuation-gap bridging)

### What it is
A deal structure where part of the purchase price (typically 10-40%) is paid contingent on post-closing performance milestones. Bridges the gap between buyer's lower valuation and seller's higher valuation.

### When to use it (as seller)
- Buyer's offer is below your valuation, but you're confident in growth trajectory
- You need cash now AND you believe in upside
- You're willing to share some operational visibility post-deal

### When to use it (as buyer)
- Seller's valuation feels aspirational
- You want to align seller's incentives post-acquisition
- You need risk-mitigation against integration challenges

### Core structure

```
Total deal value = Cash at closing + Earn-out potential
   $10M total = $7M closing + up to $3M over 24 months
```

**Earn-out tied to:**
- Revenue / ARR thresholds
- DAU / MAU targets
- EBITDA milestones
- Customer retention metrics
- Specific product launches

### Negotiation principles

**As seller (defending earn-out):**

1. **Auditable KPIs only.** Refuse vague milestones ("commercial success", "satisfactory growth"). Insist on specific numbers measurable independently.

2. **Measurement methodology pre-defined.** Who calculates? What data sources? What if there's disagreement? Build dispute-resolution into the earn-out clause itself.

3. **Buyer's operational interference protection.** If the buyer can starve the acquired business of resources to avoid earn-out payment, the structure is broken. Add: "Buyer will operate acquired business with substantially equivalent resources to historical levels during earn-out period."

4. **Earn-out caps + floors.** Cap the upside (so buyer isn't unlimited liability). Floor the downside (so seller has minimum payout if any milestone is hit).

5. **Acceleration on M&A.** If buyer is acquired during earn-out period, all unpaid earn-out accelerates and pays at signing of buyer's deal.

**As buyer (negotiating earn-out):**

1. **Tie payouts to controllable metrics.** Don't pay earn-out for outcomes the seller can't influence (market-wide downturn, competitor moves).

2. **Cap aggressively.** Earn-outs are notorious for litigation. Aggressive cap reduces dispute surface.

3. **Tie payment to verified milestones.** Don't trust seller-reported numbers. Use audited financials or third-party verification.

4. **Earn-out escrow.** Hold the earn-out potential in escrow, with milestones as release triggers.

### Common earn-out failure modes

- **Vague milestones:** "Commercial success" → litigation. Always quantify.
- **Buyer-controlled metrics:** "Net income" easily manipulated by buyer's accounting. Use revenue or specific operational metrics.
- **Long earn-out periods:** 5+ year earn-outs almost always fail. Cap at 24-36 months.
- **No dispute mechanism:** When parties disagree on KPI achievement, what happens? Pre-write the resolution mechanism (third-party accountant, arbitration).

### Game industry specifics

For gaming M&A:
- DAU/MAU/Retention as primary earn-out metrics (more measurable than revenue, less manipulable)
- Hit-driven business → earn-outs based on launches, not aggregate revenue
- Multi-title companies: per-title earn-outs cleaner than aggregate

---

## 2. Representations & Warranties (R&Ws)

### What they are
Statements about facts that EACH party makes and warrants are true at signing. If they turn out false, the warranting party is liable (typically via indemnity).

### Two types

**Seller reps** (more numerous):
- Title to assets / IP
- Financial statements accuracy
- No undisclosed liabilities
- Compliance with laws
- Material contracts disclosed
- No litigation pending or threatened
- Tax compliance
- Employee-related matters
- (Industry-specific) IP non-infringement, content licensing, user data compliance

**Buyer reps** (fewer):
- Authority to enter agreement
- Sufficient funds available
- No conflicts with existing obligations
- Approval from buyer's board/investors

### Negotiation principles

**As seller (limiting rep exposure):**

1. **"Knowledge" qualifiers.** Limit subjective reps with "to seller's knowledge" — reduces strict liability.

2. **Materiality qualifiers.** Add "material" to broaden the threshold for breach. "No material litigation" vs "no litigation".

3. **Specific disclosures schedule.** Disclose known issues in a Schedule. Disclosed = not actionable as breach.

4. **Cap on liability.** Seller's total indemnity exposure capped at % of deal value (typically 10-25%).

5. **Time limits on reps.** Most reps survive 12-18 months post-closing. Specific reps (tax, fundamental reps) longer (5+ years).

6. **Basket / threshold for claims.** Buyer can only claim losses above a deductible (usually 0.5-1% of deal value).

**As buyer (broadening protection):**

1. **No knowledge qualifiers on fundamental reps.** Title to assets, capitalization — these are objective facts. No "to seller's knowledge" allowed.

2. **Specific reps for industry risks.** Gaming-specific: data privacy, content rights, store relationships, console certification compliance.

3. **R&W insurance.** Buyer can purchase R&W insurance (typically 2-5% of deal value premium) covering breach risk. Becoming standard in deals >$50M.

4. **Indemnity floor for major reps.** Some reps get full indemnity (no basket): IP infringement, fraud, fundamental reps.

### Sample rep negotiation matrix

| Rep type | Seller wants | Buyer wants | Compromise |
|----------|--------------|-------------|------------|
| **IP non-infringement** | "to knowledge" + materiality | Strict liability | Knowledge for known matters; strict for fundamental |
| **Financial statements** | Accurate "in all material respects" | "True and correct" without qualifier | Material accuracy + specific disclosures of departures |
| **Litigation** | "Pending litigation" only | "Pending or threatened" | "Pending, or to seller's knowledge threatened" |
| **No undisclosed liabilities** | Limit to specific schedules | All liabilities disclosed | Material liabilities + standard balance-sheet items |

---

## 3. Material Adverse Change (MAC) Clauses

### What they are
A clause allowing a party (typically buyer) to walk away from the deal if a "material adverse change" occurs between signing and closing.

### Why they matter
Between signing and closing (often 2-6 months), things change: pandemic, market crash, customer churn, regulatory shifts. The MAC clause defines who bears that risk.

### Negotiation principles

**As seller (narrow MAC):**

1. **Specific events excluded.** Carve out: market-wide events, regulatory changes affecting industry generally, war/terrorism, pandemic.

2. **Quantitative thresholds.** "Material" = >$X million impact OR >Y% revenue decline.

3. **Sustained vs. temporary.** "Sustained for at least 6 months" prevents short-term blips from triggering MAC.

4. **No "disproportionate impact" loophole.** Buyers often try to add "unless disproportionately affecting Company" to industry carve-outs. Resist.

**As buyer (broad MAC):**

1. **Forward-looking language.** "Reasonably likely to" + specific outcomes.

2. **Material adverse effect on prospects.** Include future business prospects, not just current results.

3. **Specific financial thresholds.** Tie MAC to specific revenue/EBITDA decline percentages.

### Game industry MAC considerations

- **Hit-driven volatility.** Gaming revenue can drop 30-50% on a single bad launch. Sellers want narrow MAC; buyers want broad.
- **Platform policy changes.** Apple/Google policy shift can materially impact mobile gaming. Allocate this risk explicitly.
- **Regulatory.** China gaming approvals, EU data privacy — specific carve-outs or inclusions.

### Sample MAC compromise language

```
"Material Adverse Change" means any event, change, or effect that has had,
or would reasonably be expected to have, a material adverse effect on the
business, financial condition, or results of operations of the Company,
EXCLUDING:

(a) general economic or industry-wide conditions;
(b) acts of war, terrorism, or pandemic;
(c) changes in law or regulation affecting the gaming industry generally;
(d) any failure to meet financial projections (provided that the underlying
    cause of such failure may itself constitute MAC);
(e) actions taken at the express written request of Buyer.

For this purpose, "material" means a sustained negative impact on revenue
or EBITDA exceeding 25% measured over a trailing 6-month period.
```

---

## 4. Term Sheet → Definitive Agreement Transition

### The risk
Most M&A deals look "done" when the term sheet is signed. Then 6-12 weeks of legal drafting follow, during which 30-50% of the substantive terms get re-negotiated.

### Why it happens
- Term sheet uses general language ("standard reps and warranties", "industry-standard non-compete")
- Legal teams interpret "standard" differently
- New issues surface in due diligence
- Each side's counsel introduces "standard" language that favors their client

### Negotiation principles

**Lock the term sheet harder than you think necessary.**

1. **Define every term explicitly.** Don't defer to "as defined in definitive agreement". Define in the term sheet itself.

2. **Specify post-term-sheet timeline.** "Definitive agreement signed within 60 days; if not, deal terminates." Forces speed.

3. **No-shop period.** Seller agrees not to negotiate with other buyers during the 60-day window. Standard in M&A.

4. **Identify standard reference documents.** "Reps and warranties to follow ABA Model R&W (2024 edition) with industry-specific adjustments noted in Annex A."

5. **Pre-agree definitive agreement principles.** "Definitive agreement to be drafted by [buyer's / seller's] counsel based on [specific recent comparable deal]." Reduces drafting drift.

### Pre-mortem before term sheet signing

Before signing the term sheet, do a 30-minute pre-mortem with your team:

> "Imagine the definitive agreement got signed 60 days from now and we hate it. What changed during legal drafting?"

Common answers:
- Reps got broader than we agreed
- Indemnity caps got higher
- Earn-out KPIs got fuzzier
- Non-compete got broader
- New "standard" clauses appeared (e.g., RSU vesting acceleration triggers)

For each, decide: lock in term sheet now, or accept the legal-phase drift.

### Worked example — what to lock in term sheet

For a gaming acquisition term sheet, lock these explicitly:

✅ **Lock in TS:**
- Purchase price + earn-out structure (specific KPIs, measurement, payment)
- Reps & Warranties scope (knowledge qualifiers, materiality, schedule disclosures)
- Indemnity caps + baskets + survival periods
- Non-compete duration + geography + scope (Schedule A explicit)
- Key person retention requirements
- Closing conditions
- MAC definition (scope + carve-outs + threshold)

❌ **Defer to definitive (acceptable):**
- Standard transition services
- Specific vesting cliff details for retention RSUs
- Closing date (range only)
- Specific employee benefits transition
- Choice-of-counsel for definitive drafting

---

## 5. Advisor Equity & FAST Agreement

### Founder Advisor Standard Template (FAST)

[FAST](https://www.fi.co/fast) is a free template from Founder Institute for advisor equity grants. Standard structure:

| Effort level | Equity range | Vesting cliff |
|--------------|--------------|---------------|
| Standard (5-10 hrs/month) | 0.10% - 0.25% | 4 months |
| Significant (10-25 hrs/month) | 0.25% - 0.50% | 4 months |
| Strategic (25+ hrs/month) | 0.50% - 1.0% | 4 months |
| Co-founder-level | 1.0%+ | 4-12 months |

### When to deviate from FAST

- **Sales-driving advisors with concrete revenue commitments:** higher equity (1-5%) tied to revenue milestones
- **M&A advisors:** tier ladder (Pool B style) tied to exit valuation
- **Combined sales + M&A advisor:** dual-pool structure (the Alfa pattern)

### Advisor equity vs. employee equity

| Dimension | Advisor (FAST) | Employee |
|-----------|----------------|----------|
| Vesting cliff | 4 months | 12 months |
| Total vesting | 12 months | 4 years |
| Forward vs. reverse vest | Forward (earn over time) | Often reverse-vested |
| Tax treatment | Often 83(b) elected | RSU or ISO |
| Termination | Vested equity retained on good leaver | Standard cliff/vesting |

### Advisor equity negotiation

**As founder (granting):**
1. Make grant from founder personal holdings if possible (no dilution to other shareholders)
2. Reverse-vest the grant (full grant Day 1, claw back if cliff fails)
3. Specific milestones ("Month 4: at least one signed Qualifying Client at $X ACV")
4. Bad-leaver clauses: breach of non-compete, fraud, etc. → forfeit all equity
5. Clear definition of "advisor relationship" termination

**As advisor (receiving):**
1. Reverse vesting protects against capricious termination
2. Acceleration on without-cause termination (standard advisor norm: greater of 50% unvested or 100% next tranche)
3. Pool B / exit-trigger equity for M&A advisors
4. Clear definition of "advisor work" — protect against "we redefined the role to exclude what you did"

---

## 6. Lehman / Modified Lehman Fee Structure

### What it is
A regressive percentage-fee structure for M&A advisors, originating with Lehman Brothers (1969). Standard form:

**Original Lehman:**
- 5% on first $1M
- 4% on next $1M
- 3% on next $1M
- 2% on next $1M
- 1% on every $ above $4M

**Modified (Double) Lehman:** doubles the percentages (10/8/6/4/2). Common today.

**Triple Lehman:** triples (15/12/9/6/3). Used for smaller deals where 1% on $50M = $500K, which doesn't justify advisor effort.

### When advisor fees are negotiated

For gaming M&A advisors:
- Deals under $5M: triple Lehman common
- Deals $5M-$50M: modified (double) Lehman standard
- Deals over $50M: capped or fixed-fee structure

### Negotiation principles

**As founder (paying advisor):**
1. **Cap the advisor fee.** "Maximum fee = $2M regardless of deal value."
2. **Tail period.** Limit "trailing commission" period. Standard: 12-18 months post-engagement termination.
3. **Excluded buyers.** Pre-list buyers Company already had relationship with — these don't trigger advisor fee.
4. **Performance gates.** "Advisor fee paid only if exit valuation exceeds [X]." Aligns incentives.

**As advisor (receiving):**
1. **Modified Lehman, no cap.** Standard market practice.
2. **Tail period of 24 months.** Common for active engagements.
3. **Exclusivity for the engagement period.** No other advisor on this deal.

### Hybrid structures

Many gaming advisor deals combine:
- Lower cash fee (modified Lehman)
- Equity component (% of company)
- Performance bonuses (tied to exit valuation tiers)

This is what an "Alfa-like" Pool A + Pool B structure achieves: reduce cash burn while keeping advisor highly aligned with successful exit.

---

## 7. LOI vs. binding agreement transitions

### Letter of Intent (LOI) — typically non-binding
- Signals serious intent
- Outlines key terms
- Standard sections binding even in non-binding LOI: confidentiality, no-shop, expense reimbursement

### What can go wrong in LOI → definitive

1. **No-shop expires.** Definitive takes 60+ days; no-shop was 60. Seller starts shopping during gap. Lock no-shop tighter.

2. **Diligence finds new issues.** Seller's reps hadn't surfaced things. Definitive agreement adjusts. Build "diligence-discovery" provisions into LOI.

3. **Buyer's financing falls through.** Especially for cash-heavy deals. Either require buyer to commit to financing terms, or include financing-out clause for both sides.

4. **Material adverse change.** MAC during this window — defined how? Lock the MAC definition in the LOI.

### Binding portions to insist on in LOI

Even if the LOI is "non-binding overall", these sections should be binding:

- **Confidentiality** — protects DD information
- **No-shop / exclusivity** — prevents seller from pursuing alternatives
- **Expense reimbursement** — if deal falls through, who pays advisors
- **Choice of law / dispute resolution** — for any disputes about LOI itself
- **Term and termination** — specify when LOI expires and how it terminates

---

## 8. Game industry M&A specifics

### Common deal types

1. **Studio acquisition** — buyer acquires studio's IP + team + ongoing operations
2. **IP-only acquisition** — buyer acquires specific game IPs without team
3. **Talent acquisition (acqui-hire)** — buyer wants the team; IP secondary
4. **Technology acquisition** — buyer wants engine / platform / tools

Each has different negotiation dynamics, KPIs, and risk allocation.

### Gaming-specific reps to negotiate

- **Console certification status** — which platforms certified, expiration dates
- **Storefront relationships** — Apple/Google/Steam status, no breach
- **Content licensing** — music/sports/IP rights properly licensed and current
- **User data compliance** — GDPR/CCPA/COPPA compliance, data flow to acquirer
- **Live ops continuity** — servers, save data, monetization continuity post-close
- **Refund/chargeback policies** — game-specific liability exposure

### Earn-out KPIs for gaming

Most useful KPIs for gaming earn-outs:

| Metric | Pros | Cons |
|--------|------|------|
| **Revenue (ARR)** | Direct value measure | Can be manipulated by buyer's pricing/marketing |
| **DAU / MAU** | Hard to manipulate | Doesn't directly equal value |
| **Retention curves (D7, D30)** | Quality signal | Industry-specific norms vary |
| **Specific game launches** | Concrete milestone | Binary (hit/miss); volatile |
| **EBITDA** | Profit-aligned | Buyer's overhead allocation can manipulate |
| **Net new users / cohort growth** | Forward-looking | Marketing-dependent |

Best for sellers: blend 2-3 metrics with weights. Best for buyers: single metric with manipulation-resistant calculation.

### Earn-out duration in gaming

- Live-service games: 24-36 months (full retention curve visible)
- Premium/F2P with predictable monetization: 12-24 months
- Hit-driven (one-shot launch): 6-12 months tied to launch + 90 days

---

## 9. Sample term sheet structure for advisor equity (FAST + Pool B)

For founders granting advisor equity that combines sales-execution AND M&A advisory:

### Structure (similar to the Alfa scenario)

```
Total cap: 10% of fully-diluted equity from founder personal holdings
- Signing grant: 1% (4-month cliff, 12-month total vest)
- Pool A (Sales): 5% earned via Qualifying Client milestones (Gates 1-4)
- Pool B (M&A): 4% earned via Exit Event ladder
```

### Pool A milestone structure

| Gate | Month | KPI |
|------|-------|-----|
| Cliff | 4 | At least 1 signed Qualifying Client ≥ $100K ACV |
| 1 | 12 | 5 Qualifying Clients, $1M aggregate ACV |
| 2 | 18 | 10 Qualifying Clients, $1.6M aggregate ACV |
| 3 | 24 | 16 Qualifying Clients, $2.5M aggregate ACV |

### Pool B exit ladder

| Exit valuation | Pool B equity |
|----------------|---------------|
| < $4M | 0.5% (floor) |
| $4M - $6M | 1% |
| $6M - $8M | 2% |
| $8M - $10M | 3% |
| $10M - $15M | 3.5% |
| ≥ $15M | 4% (cap) |

### Negotiation hot points (recurring patterns from Alfa case)

1. **Definition discipline on "Qualifying Client"** — see `pattern-catalog.md` pattern #1 "Accept volume, attack definitions"
2. **Concentration cap** — defends against single-client risk; counterparty will often push to remove
3. **Stickiness window** — post-vesting clawback if client churns within N months. 6-9 months typical.
4. **Key Person clause** — counterparty often pushes to delete; founder needs accountability
5. **Non-compete genre scope** — Schedule A defines explicitly. See `cultural-map.md` for Turkish counterparty negotiation norms (Alfa context).

The 20-pattern catalog in `pattern-catalog.md` formalizes patterns observed across real advisor-equity / sales-partner negotiations (counterparty names retained as illustrative case studies).

---

## Cross-reference

- For negotiation patterns specific to M&A: `pattern-catalog.md` (patterns #6 sunk-cost reframing, #19 retroactive redefinition especially common in M&A)
- For phase guidance during M&A negotiations: `phase-playbook.md` (M&A typically takes Phases 1-5 over 4-12 months)
- For cultural overlay on M&A negotiations: `cultural-map.md` (Korean acquirers vs US acquirers vs Chinese have very different norms)
- For framework theory: `frameworks.md` (Voss for emotional management; Karrass for concession discipline; Bazerman for biases)
- For BATNA template: `batna-template.md`
