---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Finance Reporting Gotchas

The 10 highest-frequency failures when generating finance reports. Load this BEFORE drafting any output and self-check against the list at the end.

## 1. Currency mix-ups (HIGH severity)

**What:** mixing USD / VND / EUR without explicit labels; retroactively re-converting historical data at today's rate.

**Why it fails:** the numbers become noise. Readers can't reproduce, can't compare, lose trust.

**Fix:**
- Declare currency on every field (`revenue_usd`, `salary_vnd`).
- Freeze FX rate at transaction date; store it alongside the amount.
- Never retroactively re-value.
- One reporting currency per statement.

See: `multi-currency-fx.md`.

---

## 2. Double-counting (HIGH severity)

**What:** inter-segment transfers counted in both segments and in the consolidated total.

**Example:** MKT Inhouse pays Game Studio $15k internally. Segment revenue becomes MKT=$80k, Game Studio=$100k, consolidated reported as $180k. Actually: consolidated = $165k ($180k − $15k internal).

**Fix:**
- Flag every internal transfer with `in_consolidated_pl: false`.
- Consolidated revenue = Σ segment revenue − Σ internal transfers. Verify this equation holds every period.
- Show internal transfers as a memo, not a line in consolidated.

---

## 3. Vanity / non-GAAP without reconciliation

**What:** reporting "Adjusted Revenue" or "Adjusted EBITDA" without showing the bridge to GAAP.

**Why it fails:** readers suspect you're massaging numbers to hide weakness. Legally risky in SEC context (Reg G).

**Fix:**
- Always include a reconciliation table showing additions/subtractions.
- Never give non-GAAP more prominence than GAAP in formal filings.
- Define every custom metric inline: "ARR = current MRR × 12".

---

## 4. Missing variance framing

**What:** reporting "revenue was $150k vs plan $140k" without explaining *why*.

**Fix:**
- Always decompose: `Actual = Plan + A + B − C`, with each letter labeled.
- Use waterfall chart for visual.
- Narrate: "Variance driven by new Voodoo contract (+$15k) offsetting Lihuhu pause (−$5k)."

Every material variance needs: driver, owner, recurring-or-one-time flag.

---

## 5. Time-axis inconsistency

**What:** mixing calendar months, fiscal months, and trailing twelve months in the same report without labels.

**Fix:**
- Declare period on every chart / table: "Monthly (calendar)", "QTD", "YTD", "TTM".
- Stay consistent across the document.
- If your fiscal year isn't calendar-aligned, state it once at the top and then proceed.

---

## 6. Headcount cost allocation errors

**What:** "revenue per head" calculated using base salary, not fully loaded cost. Inflates the metric.

**Fix:**
- Define loaded cost: base + taxes + benefits + allocated overhead.
- Publish the definition in the footer.
- Stick with it across periods.

Example: base salary $24k + taxes $2k + benefits $1k + overhead allocation $4k = $31k loaded.

---

## 7. One-time items buried in recurring

**What:** revenue includes a $50k signing bonus in March. April revenue drops to normal. Reader thinks: churn.

**Fix:**
- Two revenue lines: "Total revenue" and "Recurring revenue". Show both.
- Footnote every one-time item > 5% of monthly revenue.
- In trend charts, also show recurring-only line so readers see the real trajectory.

---

## 8. Churn ambiguity (services specifically)

**What:** every billing gap counted as churn. Services firm retention looks catastrophic.

**Fix:**
- Define churn explicitly: ≥3 months inactive AND no pipeline = churn.
- Define pause: 1–2 months inactive OR active retainer = pause.
- State the rule in the footer; apply consistently.
- Show pauses as a separate state in cohort matrices.

---

## 9. Runway calculation errors

**What:**
- Using gross cash (ignoring payables) → overstates runway.
- Using gross burn (ignoring revenue received) → overstates runway.
- Using a single anomalous month → unrealistic.
- Including unconfirmed future raise → fantasy runway.

**Fix:**
```
Net cash = cash − current liabilities ≤30 days
Net burn = trailing 3-month average of (cash out − cash in)
Runway  = floor(net cash / net burn)
```

Default-based (excludes future raise).

Always use `floor`, not round — investors prefer to be surprised upward.

---

## 10. Missing reconciliation between systems

**What:** P&L revenue shows $500k. Accounting system shows $480k. Reader asks which is right. You can't answer.

**Fix:**
- Define source of truth per metric (accrual? cash? which system?).
- Monthly reconciliation check: delta < 1% between ledger and P&L; explain if more.
- Footnote: "Financial metrics source: Accounting system (accrual basis) as of [date]. Reconciled to invoices on [date]."

---

## Self-check before publishing

Run this 10-item review on any finance output before declaring it done:

- [ ] Every number has a currency label
- [ ] FX rates are documented, period-consistent, and match policy
- [ ] Inter-segment transfers are flagged and don't double-count
- [ ] Non-GAAP metrics are reconciled to GAAP (if present)
- [ ] Every variance has a driver, owner, and recurring flag
- [ ] Time periods are declared and consistent
- [ ] Headcount metrics use fully-loaded cost
- [ ] One-time items are separated from recurring
- [ ] Churn / pause distinction is stated for services
- [ ] Runway uses net cash, net burn (3-month avg), floor
- [ ] Source system + reconciliation note is in the footer
- [ ] Every chart follows visualization standards (`visualization.md`)
- [ ] Audience-specific framing is applied (investor ≠ board ≠ ops)

If more than 2 items are missing, the output isn't ready.

## Red flags the reader will catch

These patterns are immediate credibility hits:

1. **"Revenue grew 40%"** without base period — $70 to $100 is dramatic; $70M to $100M is huge. Always context.
2. **"Adjusted EBITDA"** without showing adjustments — readers assume you're hiding losses.
3. **Prior-period restatements** without explanation — signals bookkeeping problems.
4. **Round numbers** where real numbers are expected — $100,000 exactly for revenue screams plug.
5. **Rapid headcount growth with flat revenue** — operational leverage question.
6. **Gross margin moving >5pp MoM** without explanation — accounting change suspected.
7. **"Run rate"** / "annualized" language — vanity framing if base month is anomalous.
8. **Investor update with no lowlights** — nobody believes all-green reports.

## Meta-principle: conservative framing

When in doubt:
- **Understate** positive.
- **Overstate** concern.
- **Prefer** cash numbers over accrual for founder decisions.
- **Prefer** accrual for investor trajectory.
- **Default alive** > "we'll raise".
- **Floor** > round for runway.
- **Recurring** > total for trend claims.
- **Per-stream** > blended for mixed-model businesses.
