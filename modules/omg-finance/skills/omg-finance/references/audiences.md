---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Audiences — Same Data, Different Frames

The #1 rule of finance reporting: **before you draft anything, ask who's reading it and what decision they must make.** Same monthly data → four distinct outputs.

## Audience matrix

| Audience | Core question | Decision they make | Frame | Cadence |
|---|---|---|---|---|
| **Investors (outside)** | "Is this company worth more than when I invested?" | Keep holding / add / exit; follow-on check | Forward-looking narrative + trajectory | Monthly (email) + quarterly (deeper) |
| **Board** | "Is management executing, and what's the biggest risk?" | Approve strategy, fire/keep CEO, authorize raises | Risk + strategy + material variance | Quarterly (monthly if pre-Series A) |
| **Internal ops** | "Are we on plan, and where's the leak?" | Resource reallocation, hiring, cost cuts | Variance to plan + unit economics by function | Monthly (tight) |
| **Founders / C-level** | "What's broken this week and what should I focus on?" | Prioritization, escalation, morale | Red-flag dashboard + runway + headcount | Weekly (fast) + monthly (deep) |

## Investor audience — what they want

### Sections (in order)
1. **Highlights** — 2–3 bullets of the month's wins.
2. **Key metrics** — revenue (with growth % MoM and YoY), runway, burn, headcount, top KPIs for your model.
3. **Lowlights / risks** — be candid. Investors distrust all-green reports.
4. **Asks** — intros, hires, advice. Specific, not generic.
5. **Looking forward** — next 30–60 days.

### Top KPIs (pick the 5 that fit your model)

| Model | KPIs to lead with |
|---|---|
| **SaaS** | MRR, MoM growth %, NRR, Gross Margin %, Payback months |
| **Services** | Revenue, Gross margin %, Top-3 client concentration %, Utilization %, Runway |
| **Marketplace / ad arbitrage** | Revenue, Gross ROAS, Net ROAS, CAC payback, Runway |
| **Product / physical goods** | Revenue, Unit margin, Channel mix, CAC payback, Runway |
| **Hybrid** | Revenue (by unit), Blended gross margin, Runway, Top concentration metric, Rule of 40 |

### Style rules

- **Forward-looking narrative** — lead with where you're going.
- **Trajectory > absolute numbers** — "+12% MoM on $50k base" beats "$56k".
- **Candor builds trust** — explicitly flag what's not working; investors have seen everything.
- **Short** — 400–800 words for monthly. Appendix for deep data.
- **No vanity metrics** — if you can't define it in one sentence, don't publish it.

### Cadence and channel

- **Monthly email** (Sequoia format) — 1st week of the month for prior month.
- **Quarterly deeper update** — 2–3 page narrative + data pack, often tied to a board meeting.
- **Year-end annual letter** — 5–10 pages, strategic retrospective + next year plan.
- **Dataroom / secure folder** — for formal documents (cap table, audited financials, contracts).

See `templates/investor-monthly.md` for a ready-to-fill email template.

---

## Board audience — what they want

### Sections (in order)
1. **Executive summary** — 3 bullets on performance, risk, ask.
2. **Financial performance** — P&L, cash, runway, burn trend (6-month look).
3. **KPI dashboard** — top 5–8 business metrics, plan vs actual.
4. **Risk dashboard** — concentration (client, key person, channel), regulatory, competitive.
5. **Strategic initiatives** — status of top 3 bets; decisions needed.
6. **Decisions requested** — binary votes, authorizations.
7. **Appendix** — detailed financials, org chart, pipeline.

### Top KPIs

| Category | Must-show |
|---|---|
| **Growth** | Revenue, growth rate % |
| **Efficiency** | Gross margin %, Burn multiple, Rule of 40 (where applicable) |
| **Risk** | Top-3 client concentration, HHI, Runway in months |
| **Org** | Headcount, open roles, attrition |
| **Strategic** | Status of top 3 initiatives (RAG: red/amber/green) |

### Style rules

- **Risk-first** — surface what could kill the company, not just what's working.
- **Decision-oriented** — every slide should end with "so what" or "decision needed".
- **Balanced** — don't hide bad news; the board finds out anyway and trust erodes.
- **Visual** — waterfall for variance, heatmap for risk, trendlines for direction.
- **Concise** — 10–15 slides total. No narrative walls of text.

### Cadence

- **Quarterly** is standard once past Series A.
- **Monthly** is common at Seed/Series A (less formal deck, more working session).

See `templates/board-quarterly.md` for a ready-to-fill deck outline.

---

## Internal ops audience — what they want

### Sections (in order)
1. **Variance to plan** — revenue, cost, headcount, % delta per line.
2. **Business unit P&L** — each department's revenue, direct cost, contribution.
3. **Unit economics by function** — utilization, revenue per head, margin per project.
4. **Burn detail** — fixed vs variable, one-time vs recurring.
5. **Headcount + open roles** — actuals vs plan, new hires, attrition.
6. **Action items** — corrective actions owned by function leads.

### Top KPIs

- **Variance % per line** (flag >10% misses).
- **Utilization %** per billable role.
- **Revenue per head** (fully loaded) — validates operational leverage.
- **Gross margin by business unit** — shows where profit lives.
- **Cash conversion cycle** (DSO, DPO) — where cash gets stuck.

### Style rules

- **Data-dense** — tables beat narrative.
- **Variance-framed** — every miss has a cause and an owner.
- **Actionable** — no report without next steps.
- **Weekly or monthly cadence** — depending on company stage.

See `templates/ops-monthly-variance.md` for a ready-to-fill template.

---

## Founders / C-level — what they want

### Sections (in order)
1. **Runway** — months + cash on hand. Always first.
2. **This week's red flags** — cash, sales pipeline collapse, key departures, compliance.
3. **This week's wins** — closed deals, key hires, product milestones.
4. **Top-of-mind decisions** — what the founder needs to make this week.
5. **Delegations** — what they gave away and to whom.

### Style rules

- **Brief** — one screen, ideally.
- **Weekly cadence** — finance dashboard + Slack digest.
- **Red-yellow-green traffic light** for each key metric.
- **No buzzwords** — if it wouldn't survive a 7-year-old's "what does that mean?", rewrite it.

## Cross-audience discipline

**One SSOT, four views.** Maintain a single monthly actuals table. All four audience reports pull from it. When numbers disagree across audiences, you have a bug — not a feature.

## Translation cheat-sheet (same data, four framings)

| Fact | Investor framing | Board framing | Ops framing | Founder framing |
|---|---|---|---|---|
| Revenue +12% to $150k | "12% MoM growth to $150k, on track for $1.8M ARR" | "Revenue growth tracking plan; concentration risk unchanged (Top-3 = 52%)" | "$150k actual vs $145k plan (+3.4%); Playable contributed +$8k; Game Studio −$3k" | "🟢 Rev +12%. Nothing to escalate." |
| Voodoo contract paused | (Omit if non-material; mention if >15% of revenue) | "Top-1 client paused; revenue impact estimated −$8k/mo; mitigation pipeline $12k" | "Voodoo stopped invoicing 4/15; follow up w/ Mike; reallocate 2 FTEs to Lihuhu expansion" | "🔴 Voodoo paused. Need to call Mike this week." |
