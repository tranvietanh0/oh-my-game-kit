---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Deal-Killer Checklist — 10 Recurring Clauses That Kill Deals

A canonical list of clauses that recur as deal-killers in commercial contract reviews when present in their adversarial form. Always scan for these in any contract review (mode `tilt`).

For each: detection signal, why it's a killer, and the standard fix.

---

## 1. Voluntary exit forfeits vested equity

**Detection:** Termination clause says vested equity is clawed back if Partner/Founder leaves voluntarily, even without breach.

**Why it's a killer:** Vested equity is sacrosanct — it represents value already earned through completed milestones. Allowing claw-back for voluntary exit converts equity from compensation into golden handcuffs.

**Standard fix:**

```
Vested equity is retained in all termination scenarios EXCEPT:
(a) Material breach of §§ 9 (non-compete), 10 (non-circumvention), or 11 (Key Person)
(b) Fraud, willful misconduct, or gross negligence
(c) Insolvency or bankruptcy

Voluntary exit, death, disability, mutual agreement = good leaver
→ retains all vested equity
```

Add a clear "good leaver / bad leaver" definition to make it explicit.

---

## 2. Non-compete >18 months with worldwide scope and no genre carve-out

**Detection:** Non-compete clause has 2+ year duration AND worldwide geographic scope AND no Schedule A genre limitations.

**Why it's a killer:**
- Unenforceable in OECD jurisdictions (US, EU, parts of Asia) due to disproportionate restraint
- Vietnam law voids individual non-competes entirely
- California voids almost all non-competes
- Many EU jurisdictions require compensation during non-compete period (which adds $$$)
- Worldwide scope = unenforceable as overreach

**Standard fix:**
- Reduce duration to 18 months or less
- Add Schedule A defining specific game genres / categories that are in-scope
- Add carve-outs for: different platforms (e.g., console-only), different audience segments, B2B SaaS, web3, etc.
- Add jurisdictional fallback: if individual non-compete is voided in counterparty's jurisdiction, firm-level non-compete and joint-and-several liability still apply

---

## 3. Clawback with no fair-cause exceptions

**Detection:** Vesting / royalty / milestone clawback clause lists triggers (client churn, missed KPI, etc.) with no carve-outs for COMPANY-caused failures.

**Why it's a killer:** Partner is held responsible for failures outside their control. If Company kills a product line, Partner shouldn't lose equity for clients churning as a result.

**Standard fix:** Add 5-7 carve-out exceptions:

1. **Company's product defects** — service breach, support failure, product end-of-life
2. **Force majeure** — events reasonably outside Partner's control
3. **M&A-caused merging** — client acquired into existing Company client (no net revenue loss)
4. **Strategic pivot** — Company pivots away from client's use case
5. **Pricing changes** — Company unilaterally prices out the client
6. **Catch-all** — any other Company-attributable cause, with neutral-expert dispute resolution
7. **Natural decline** — exogenous client revenue decline (not Partner's fault)

---

## 4. Unilateral termination with <30-day notice and no acceleration

**Detection:** Termination-without-cause clause allows one party to terminate with 30 days or less notice, with no acceleration of unvested equity.

**Why it's a killer:** Allows bad-faith firing right before a big milestone. Partner does the work, Company terminates day before vesting, retains all upside.

**Standard fix:**
- Notice period: 90 days minimum
- Acceleration formula: greater of (50% of unvested equity) OR (100% of next-scheduled tranche)
- Apply only to without-cause termination by Company (not Partner-initiated)
- Pool B (M&A exit) treatment specified separately: forfeits unless Exit closes within 6-12 months

---

## 5. Gross margin / cost-of-sales as a vesting gate for a sales partner

**Detection:** Vesting condition includes gross margin floor or cost-of-sales ratio that Partner cannot directly control.

**Why it's a killer:** Sales partner sources clients but doesn't control delivery cost, pricing strategy, or operational efficiency. Tying their compensation to margin penalizes them for Company's operational decisions.

**Standard fix:** Demote gross margin from "gating KPI" to "reported KPI":

```
Gross margin on attributed revenue is reported monthly in the §14 reporting
package. If gross margin falls below 40% for two consecutive gates, parties
will meet in good faith to diagnose cause and agree corrective actions.
This does NOT defer or forfeit any tranche.
```

---

## 6. Pool B (exit) with a minimum-valuation cliff

**Detection:** Pool B / M&A advisor equity has a "minimum exit valuation" below which Partner gets ZERO. Common form: "Pool B vests only if exit ≥ $10M".

**Why it's a killer:** Creates a discontinuity at the threshold. $9.99M exit = $0 to Partner. $10.01M exit = full Pool B. Massive incentive distortion at boundary.

**Standard fix:** Replace with graduated ladder starting at a nominal % below threshold:

```
| Exit valuation             | Pool B equity |
|----------------------------|----------------|
| < $4M                      | 0.5% (floor)   |
| ≥ $4M and < $6M            | 1%             |
| ≥ $6M and < $8M            | 2%             |
| ≥ $8M and < $10M           | 3%             |
| ≥ $10M and < $15M          | 3.5%           |
| ≥ $15M                     | 4% (cap)       |
```

Each tier inclusive of lower bound, exclusive of upper bound. Boundary values belong to the higher tier.

---

## 7. IP assignment with no carve-out for Partner's pre-existing methodologies

**Detection:** IP clause says "all work product belongs to Company" with no exceptions.

**Why it's a killer:** Partner brought in pre-existing frameworks, methodologies, evaluation systems. If Company owns "all work product", Partner can't use their own toolset on future projects.

**Standard fix:**

```
All work product, client lists, pipeline data, and M&A materials developed
under this agreement → Company owns exclusively.

EXCEPT: Partner retains ownership of Partner's pre-existing methodologies,
frameworks, evaluation systems, and intellectual property that existed
before the Effective Date, including any improvements thereto developed
independent of Company's confidential information.

Partner grants Company a perpetual, royalty-free license to use Partner's
frameworks incorporated into work product.
```

---

## 8. "Material breach" undefined in for-cause termination

**Detection:** For-cause termination clause uses "material breach" without defining what counts as material. Leaves "material" subjective.

**Why it's a killer:** Arbitration-bait. Either party can claim ANY breach is material to terminate for cause and avoid acceleration / clawback obligations.

**Standard fix:**

```
"Material breach" defined: For purposes of §12.1, "material breach" means
a breach that:
(a) materially impairs the non-breaching party's economic position OR
    core protections under this Agreement, AND
(b) was not cured within 30 days of written notice specifying the breach
    with reasonable particularity.
```

Add a specific list of pre-defined material breaches if possible:
- Failure to pay > 30 days past due on undisputed invoices
- Breach of confidentiality
- Failure to deliver work product after 60 days notice
- Etc.

---

## 9. Exit / valuation ladder without strict ≥ and < boundary inequalities

**Detection:** Pool B ladder uses ranges like "$4M–$6M" without specifying which boundary value belongs to which tier.

**Why it's a killer:** At the moment of exit, $6M valuation could be argued to belong to either the $4M-$6M tier OR the $6M-$8M tier. Arbitration bait.

**Standard fix:**
- Always use `≥` and `<`: "≥ $4M and < $6M"
- Add explicit boundary convention: "Where an exit valuation falls exactly on a tier boundary, the value belongs to the higher tier (each tier is inclusive of its lower bound and exclusive of its upper bound)."
- Tier boundaries are intentional step transitions

---

## 10. Anti-non-compete jurisdictions without firm-level fallback

**Detection:** Non-compete + Key Person clauses in agreements involving Vietnamese, California, or certain EU-based individuals — without provision for what happens when individual non-compete is unenforceable.

**Why it's a killer:** Vietnamese individual labor law renders individual non-competes void. California voids almost all. Some EU states require compensation. Without firm-level fallback, the entire enforcement mechanism collapses.

**Standard fix:**

```
Jurisdictional carve-out for anti-non-compete regimes:

Where a Key Person's domicile law renders the individual non-compete
provisions of §9 unenforceable (e.g., Vietnam individual employment law,
California, and certain EU jurisdictions):

(a) The firm-level non-compete of §9 remains enforceable against Partner
    firm.

(b) The firm-level clawback remedy (§9 breach remedy) applies to any
    breach by the individual.

(c) Partner firm is jointly and severally liable for any damage resulting
    from the individual's breach of the corresponding conduct standard.
```

---

## How to use this checklist

**In `tilt` mode (counterparty draft review):**
Run through this checklist top-to-bottom. Any matching deal-killer = include in your "Deal-killer issues" section with severity HIGH.

**In `balance` mode (your own draft review, posture: neutral or slightly-you-favorable):**
Pre-emptively fix all 10 in your draft so the counterparty can't easily attack them.

**In `synthesize` mode (cross-party):**
If counterparty flagged any of these = legitimate concern; address. If counterparty did NOT flag = they may have missed a vulnerability; either fix quietly or use as goodwill gesture.

**In `pattern-recognize` mode (counterparty pattern detection):**
If counterparty's markup attacks all 10 of these in your draft = sophisticated counterparty doing thorough review. If they only attack 3-5 of obvious ones = less sophisticated; you have informational advantage.

---

## Cross-reference

- For 20 named counterparty negotiation patterns: `omg-negotiation/references/pattern-catalog.md`
- For 80 named techniques: `omg-negotiation/references/technique-library.md`
- For Schedule A (non-compete genre scope) template: `references/schedule-a-template.md`
- For balance review log template: `references/balance-review-log-template.md`
- For round-2 cover email template: `references/cover-email-round2-template.md`
