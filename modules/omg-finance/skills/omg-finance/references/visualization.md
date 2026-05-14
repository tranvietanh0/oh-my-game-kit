---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Visualization Standards

Most finance dashboards fail not on data but on presentation. A CFO-grade chart answers a question in <5 seconds.

## Chart type → question it answers

| Chart type | Question it answers best | Avoid when |
|---|---|---|
| **Line chart** | Trend over time (single/few series) | Values are categorical |
| **Stacked bar** | How parts contribute to a whole, over time | Parts exceed 6 (becomes unreadable) |
| **Waterfall** | How did we get from A to B? (variance bridge) | No bridge logic — just use bar |
| **Heatmap** | Retention cohort, variance by dept×month | Values are not percentages |
| **Sparkline** | Quick trend in a KPI tile | Precision matters |
| **Donut / pie** | Static part-to-whole (≤5 parts) | Need to compare over time — use stacked bar |
| **Gauge / dial** | "Did we hit target" (single KPI vs threshold) | You want precision |
| **Small multiples** | Same chart across N dimensions | N < 3 or > 20 |

Default to line + stacked bar for most finance views. Waterfall whenever you're explaining a change.

## Waterfall (variance bridge)

The single most underused chart in finance. Perfect for:
- Plan → Actual bridge
- Prior month → Current month revenue bridge
- Cash balance start → Cash balance end

```
Starting cash   $1,000k  ████████████████████
  + Revenue       $100k  ████████
  − Payroll      -$80k                   ████████
  − Other        -$30k                          ███
  + Founder loan  $20k                             ██
Ending cash       $950k  ██████████████████
```

**Rules:**
- Start / end bars are neutral (gray).
- Increases: green.
- Decreases: red.
- Totals ("subtotal") are visually distinct.

## Stacked bar — the revenue mix workhorse

Monthly revenue split into business units / clients / segments. Immediate visual of shift.

**Rules:**
- **Consistent segment order** across months (biggest at bottom, smallest at top — or alphabetical).
- **Consistent color per segment** across time.
- Legend above or below, not inside the chart.
- Max 5–6 segments. More → aggregate "Other".
- Total label above each bar.

## Cohort heatmap — retention visualization

Rows = cohorts, columns = months since acquisition, cell color = retention %.

**Rules:**
- Diverging color: green (high), yellow (midpoint), red (low).
- Midpoint at target retention (not mathematical 50%) — e.g., if 70% is "good", set midpoint at 70%.
- Values labeled inside cells when there's room.
- Row labels = cohort date (rotated 90° if needed).

## Sparkline — KPI tile companion

```
Revenue   $62k  ▁▂▃▅▆▇ +13% MoM
Runway    16 mo ▆▇▇▆▇▇ unchanged
```

**Rules:**
- Very thin line, no axis, no legend.
- Pair with a single current value + delta.
- Color: green up, red down — or neutral if the metric has no direction bias.
- Fixed to the last 6–12 months.

## Color semantics (non-negotiable)

| Color | Meaning |
|---|---|
| **Green** | Good / target / increase (in positive-direction metric) |
| **Red** | Bad / miss / decrease |
| **Amber** | Watch / approaching threshold |
| **Gray / neutral** | Baseline, totals, non-directional |
| **Accent (brand color)** | Primary series in a focused chart |

**Direction matters:** a red "cost" bar going up could mean "bad" or "scaling as planned". Attach a reference line (plan) so the color means something.

## Annotation checklist

Every finance chart should have:

- [ ] **Title** (what + period)
- [ ] **Axis labels with units** ("USD thousands", "Month", "%")
- [ ] **Legend** (if multi-series)
- [ ] **Source / data note** (footer small text)
- [ ] **Callouts** for inflections, one-time items, regime shifts
- [ ] **Reference lines** (plan, target, zero — as applicable)

## Accessibility (WCAG 2.1 AA)

| Rule | How to verify |
|---|---|
| **3:1 contrast** between adjacent colors and background | Automated tool; manual squint test |
| **Color-independent** — don't rely on color alone | Turn display to grayscale; is it still readable? |
| **All values labeled** | Every segment / bar / point should be individually labeled or reachable via interaction |
| **Color-blind safe palette** | Use Okabe-Ito, Viridis, or ColorBrewer palettes |
| **Monochrome fallback** | If printed B&W, is it still readable? Use patterns for color-coded segments |

## Dashboard layout patterns

### "Hero KPI + drill-down" (investor dashboard)

```
┌────────────┬────────────┬────────────┬────────────┐
│ Revenue    │ Gross mgn% │ Runway     │ Headcount  │
│ $62k +13%  │ 62.9% +1pp │ 16 mo      │ 13 +1      │
│ ▁▂▃▅▆▇     │ ▅▅▆▆▇▇     │ ▇▇▇▆▇▇     │ ▁▂▃▅▆▇     │
└────────────┴────────────┴────────────┴────────────┘

[ Monthly P&L trend chart — 12 months          ]

[ Revenue mix stacked bar ][ Client concentration ]

[ Commentary / narrative                        ]
```

Hero metrics up top, one trend chart below, mix/detail side-by-side, narrative at bottom.

### "Variance-to-plan" (ops dashboard)

```
[ Variance table: actual | plan | delta | delta % ]

[ Waterfall: Plan → Actual ]

[ Heatmap: dept × month variance % ]

[ Action items ]
```

### "Risk board" (board dashboard)

```
[ KPI dashboard + RAG status ]

[ Concentration heatmap + HHI trend ]

[ Cohort retention heatmap ]

[ Runway scenario chart: base / bull / bear ]

[ Decisions needed ]
```

## Interactive charts vs static

- **Interactive (recharts, Plotly, d3):** for dashboards, live tools, drill-downs.
- **Static (SVG export, PNG):** for investor emails, board decks, PDFs.

Generate the same data structure, render twice. Don't hand-maintain two copies.

## Anti-patterns

1. **3D pie charts** — always wrong.
2. **Dual-axis charts** with revenue and % on different scales — readers misread the comparison.
3. **Tufte-ratio-offender charts** — too much ink per data point.
4. **Unlabeled axes** — assume zero context.
5. **Unbounded time axis** — showing 5 years when the interesting data is last 6 months.
6. **Rainbow heatmaps** — use diverging, not sequential rainbow. Rainbow encodes nothing meaningful.
7. **Zero-truncated bar charts** — misleading magnitudes. Bar charts always start at zero. Line charts can truncate (with a clear break indicator).

## Recharts-specific tips (since TheOneStudio dashboard uses recharts)

- Use `CartesianGrid strokeDasharray="3 3"` for the grid — light but visible.
- `ResponsiveContainer` with `minWidth={0} minHeight={0}` avoids SSR flicker.
- Custom `Tooltip contentStyle` to match design system.
- `ReferenceLine y={0}` for signed-value charts (P&L).
- `useIsMounted` hook before rendering to avoid hydration mismatch.
- For stacked bars, consistent `stackId` and consistent color per series across charts (don't let a segment change color between two charts).
