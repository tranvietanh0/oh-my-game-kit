---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Finance Glossary

KPI definitions + formulas + benchmarks, alphabetized for quick lookup.

---

**Accrual basis** — recognize revenue when earned, expense when incurred. Contrast with cash basis (recognize when money moves).

**ARPU (Average Revenue Per User)** — `MRR / Active users`. Monetization per customer.

**ARR (Annual Recurring Revenue)** — `current MRR × 12`. SaaS headline metric.

**Burn multiple** — `Net burn / New ARR`. How much capital consumed per $1 of new recurring revenue. <1.0 excellent, <1.5 healthy, >3 unsustainable. (David Sacks, Craft Ventures.)

**CAC (Customer Acquisition Cost)** — `S&M spend / New customers` in same period. Use **loaded** S&M (team cost + ad + tools + commissions on new).

**CAC Payback** — `CAC / (ARPU × gross margin %)`. Months to recover CAC. <12 mo excellent, <18 OK.

**Cash basis** — recognize revenue/expense only when cash moves. Simpler; used by small businesses and internal founder dashboards.

**Cash conversion cycle** — `DSO − DPO + DIO`. Days cash is tied up in operations.

**Churn (logo)** — `Customers lost / Customers at start of period`. <2% monthly for SMB SaaS; <0.5% monthly for enterprise.

**Churn (revenue)** — `MRR lost / MRR at start`. Can be negative (net-negative churn) for companies with strong expansion.

**Contribution margin** — `Gross margin − variable S&M`. What's left per customer after all variable costs.

**COGS (Cost of Goods / Revenue)** — direct cost to deliver revenue. For SaaS: hosting, payment processing, support, direct customer success. For services: direct delivery labor.

**Cohort** — a group of customers/clients acquired in the same period. Cohort analysis tracks each group's behavior over time.

**Cohort ROAS (Day N)** — `Revenue from cohort through day N / Cost to acquire cohort`. Day 30 and Day 90 are standard checkpoints.

**CPI (Cost per install)** — `UA spend / Installs`. Mobile/ad-monetized apps metric.

**D1/D7/D30 retention** — `Active users on day N / Install cohort size`. Mobile games: D1 >40%, D7 >25%, D30 >15% (casual).

**DAU / MAU** — `Daily active users / Monthly active users`. Engagement stickiness. 20–40% typical for mobile games.

**Default alive** — assuming no new fundraising, current growth rate, current cost growth → company reaches breakeven before cash runs out.

**Default dead** — the inverse. Must change one of: cost trajectory, revenue trajectory, or raise capital.

**DPO (Days Payable Outstanding)** — `AP / COGS × 30`. How long you take to pay vendors. 30–45 healthy.

**DSO (Days Sales Outstanding)** — `AR / Revenue × 30`. How long customers take to pay you. <45 healthy; >60 collection problem.

**EBIT (Operating Income)** — Earnings Before Interest and Tax. `Revenue − COGS − OpEx`.

**EBITDA** — EBIT + Depreciation + Amortization. Proxy for cash profitability; **non-GAAP**. Always reconcile to GAAP when publishing externally.

**Expansion revenue** — existing customer paying more this period than last. Healthy sign.

**FX rate** — foreign exchange rate. For omg-finance: freeze at transaction date, never retroactively re-value.

**GMV (Gross Merchandise Value)** — total value of goods sold through a marketplace. Not revenue — revenue is the take-rate %.

**Gross margin %** — `(Revenue − COGS) / Revenue`. SaaS: 70–85%. Services: 50–65%. Hardware: 30–40%. Ad arbitrage: 5–15%.

**Gross ROAS** — `Ad revenue / Ad spend`. For UA businesses.

**HHI (Herfindahl–Hirschman Index)** — `Σ (client share)²`. Concentration measure. <0.15 diversified, 0.15–0.25 moderate, >0.25 high-risk.

**IAP (In-App Purchase)** — revenue from in-game/in-app items. Monetization alongside ads.

**LTV (Lifetime Value)** — `ARPU × gross margin % / monthly churn %`. Present value of a customer's future revenue.

**LTV / CAC** — LTV divided by CAC. >3 healthy, <1 broken unit economics.

**MAU (Monthly Active Users)** — unique users in the last 30 days.

**MRR (Monthly Recurring Revenue)** — sum of all monthly subscription contracts. Core SaaS metric.

**Net burn** — `Gross burn − cash revenue received`. Real monthly cash consumption.

**Net cash** — `Cash on hand − current liabilities due ≤30 days`. Basis for runway calc.

**Net income** — bottom line. Revenue − all costs including tax, interest, one-time.

**Net Revenue Retention (NRR)** — `(Starting MRR + expansion − churn − contraction) / Starting MRR`. >110% exceptional, >100% healthy. Can exceed 100% if existing customers grow faster than churn.

**Non-GAAP** — any metric not defined by GAAP. Must be reconciled to GAAP when published. See `gotchas.md` → #3.

**Operating margin %** — `EBIT / Revenue`.

**OpEx (Operating Expenses)** — S&M + R&D + G&A. Excludes COGS.

**Payback period** — months to recover customer acquisition cost. For UA: `CPI / daily ARPU`. For SaaS: `CAC / (ARPU × GM%)`.

**Retention** — % of customers/users/revenue remaining at period end vs start.

**Revenue durability** — % of revenue that's recurring or contractually committed. For services: % on retainer. Investors prefer >40%.

**ROAS (Return on Ad Spend)** — `Ad revenue / Ad spend`. Gross (no ops cost) or Net (after ops). >120% needed for sustainable growth.

**Rule of 40** — `Revenue growth % + operating margin %`. ≥40 healthy. Balances growth with profitability. Debated in 2026 — burn multiple is overtaking it in venture circles.

**Runway** — months of cash remaining. `floor(Net cash / trailing-3mo net burn)`.

**S&M (Sales & Marketing)** — OpEx bucket for GTM: sales team, marketing team, ads, tools.

**SBC (Stock-Based Compensation)** — equity granted as employee comp. GAAP expense; often excluded in non-GAAP EBITDA (but must be reconciled).

**TAM / SAM / SOM** — Total / Serviceable / Serviceable Obtainable Market. Sizing; not a finance metric per se.

**Top-N concentration** — % of revenue from top N clients. Top-1, Top-3, Top-5 are standard. See `client-concentration.md`.

**TTM (Trailing Twelve Months)** — rolling 12-month window. Smooths seasonality; common investor metric.

**Unit economics** — profitability of a single unit (customer, install, project). See `unit-economics.md`.

**Utilization %** — `Billable hours / Available hours`. Services firm metric. 65–75% healthy.

**Weighted-average FX rate** — FX rate computed as `Σ(amount × rate) / Σ(amount)` for a period. More accurate than spot rate for multi-transaction months.

**YoY (Year-over-Year)** — growth vs same period one year prior. Core growth metric.

**YTD (Year-to-Date)** — cumulative from year start to current date.
