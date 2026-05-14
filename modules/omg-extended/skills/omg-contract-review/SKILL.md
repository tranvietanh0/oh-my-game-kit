---
name: omg-contract-review
description: "Adversarial contract review and negotiation playbook. Use for reviewing term sheets, partnership agreements, distribution/licensing contracts, NDAs BEFORE signing. Modes: (1) one-sided tilt analysis — surface clauses that disadvantage you; (2) cross-party synthesis — reconcile your review with counterparty's markup; (3) round-based balance review — multi-pass polish of your own draft toward a desired posture (neutral / slightly-company-favorable / slightly-partner-favorable); (4) term rationale doc — why-it-exists / what-each-side-gets / tension-axis for each major clause; (5) Schedule A genre scope drafting; (6) round-2 cover email structure (post-rebalance send). Complements omg-contract (which handles rendering/linting). Use this skill FIRST (review + draft) before running omg-contract (render + beautify)."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Contract Review — Adversarial Negotiation Playbook

A structured review and drafting playbook for commercial contracts where both parties have real leverage — term sheets, partnership agreements, distribution agreements, licensing agreements, advisor equity agreements, NDAs with substantive commercial exposure.

**Scope boundary vs `omg-contract`:**

- This skill (`contract-review`) is about **what the contract says** — clause analysis, tilt detection, redlining, cover email drafting.
- `omg-contract` is about **how the contract looks** — pandoc rendering, lint gotchas, CSS, tabularization.
- Typical workflow: review with `contract-review` → edit the Markdown → `omg-contract beautify` to produce the final `.docx` / `.pdf`.

## Modes

| Mode | What it does | When to use | Detail |
|------|--------------|-------------|--------|
| **`tilt`** | One-sided review: read the contract from your side only; surface every clause that disadvantages you, ranked by severity (deal-killer / structural / polish). | Received a draft from the counterparty; haven't drafted your own markup yet. | `references/mode-1-tilt.md` |
| **`synthesize`** | Merge your tilt review with the counterparty's own markup/counter-feedback; identify overlap (both sides flagged), divergence (only one flagged), and blind spots (neither flagged but material). | Counterparty has replied with their own feedback; you need to see the whole negotiation surface. | `references/mode-2-synthesize.md` |
| **`balance`** | Multi-round polish of a draft toward a target posture (neutral / slightly-you-favorable / slightly-them-favorable). Rounds are structured: R1 deal-killer fixes, R2 structural moderation, R3 polish, R4 edge-case adversarial, R5 cross-doc consistency. | Preparing your own draft to send; posture is a deliberate choice. | `references/mode-3-balance.md` + `references/second-layer-defects.md` (R4/R5) |
| **`rationale`** | For each major clause, produce a why-it-exists / what-each-side-gets / tension-axis analysis. Output doc lives at `{scope}/internal/term-rationale-EN.md`. | Preparing to walk the counterparty through your reasoning (sales-y), or teaching your own team why each clause is shaped as it is. | `references/mode-4-rationale.md` |
| **`schedule-a`** | Draft a non-compete genre-scope appendix: explicit in-scope genres + explicit out-of-scope carve-outs + annual update mechanism + interpretation rules. | Non-compete clause references a Schedule A but none is attached. | `references/mode-5-schedule-a.md` + `references/schedule-a-template.md` |
| **`cover-email`** | Draft a round-2 cover email (post-rebalance send): what-moved-your-way / what-held-and-why / why-leading-with-X / attachments / internal fallback posture section. | Sending a revised draft back to the counterparty after their counter. | `references/mode-6-cover-email.md` + `references/cover-email-round2-template.md` |
| **`pattern-recognize`** | Read counterparty's markup/feedback and classify the negotiation pattern they're using (1 of 20 named patterns). Cross-links to `omg-negotiation` for full pattern catalog + counter-tactics. | After receiving any counterparty markup; complement to `tilt` mode for strategic-level (not just clause-level) understanding. | `references/mode-7-pattern-recognize.md` |

Each mode is documented in detail in its corresponding reference file. Read the relevant file before running the mode for the first time in a session.

---

## Cross-mode patterns

### Canonical deal-killer clauses

A 10-clause recurring pattern across many contract reviews. Always scan for these in `tilt`; always fix in `balance` R1. Full list with rationale and replacement language: `references/canonical-deal-killers.md`.

Quick reference:

1. Voluntary exit forfeits vested equity
2. Non-compete >18 months, worldwide, no genre carve-out
3. Clawback with no fair-cause exceptions
4. Unilateral termination, <30-day notice, no acceleration
5. Gross margin / cost-of-sales as a vesting gate for a sales partner
6. Pool B (exit) with minimum-valuation cliff
7. IP assignment without carve-out for Partner's pre-existing methodologies
8. "Material breach" undefined in for-cause termination
9. Exit / valuation ladder without strict `≥` and `<` boundary inequalities
10. Anti-non-compete jurisdictions without firm-level fallback

### Second-layer defects (R4/R5 adversarial pre-send pass)

After R1-R3 of `balance` fix obvious deal-killers, a second layer of defects remains — clauses that look fine in isolation but fail an adversarial reading. Categories: contradictions between clauses; asymmetric safety valves; closed exception lists missing realistic causes; undefined terms that can be weaponized; boundary mechanics breaking at the edge; loopholes in time-based mechanics; non-cash transaction handling; cross-document numerical drift.

**Always run R4 (edge-case) and R5 (consistency + polish) before sending.** Typical find rate: 5–10 must-fix + 15–20 should-fix per contract. Full scan list with examples: `references/second-layer-defects.md`.

### Intentional scenario divergence — when to preserve

If a contract has multiple scenarios, resist the urge to flatten them during `balance`. Preserve divergences that are structurally motivated (different KPI shape, different per-unit equity weight, different revenue recognition). Document the divergence in the rationale doc and balance log. Detail: `references/second-layer-defects.md`.

---

## Workflow — typical session

1. **Received a draft from counterparty.**
   - Run `tilt` from your side. Output: deal-killer / structural / polish list.
2. **Counterparty replies with their markup.**
   - Run `synthesize` over your tilt + their feedback. Output: overlap / divergence / blind-spot lists.
   - Optionally run `pattern-recognize` for strategic-level pattern classification.
3. **Decide your target posture** (neutral / slightly-you / slightly-them).
4. **Draft your revised version.**
   - Run `balance` in rounds R1 → R2 → R3. Write delta log each round.
5. **Adversarial pass before sending.**
   - Run R4 (edge-case stress test) and R5 (cross-doc consistency + polish). Use the scan list in `references/second-layer-defects.md`. **Do not skip this** — it catches the defects that survive the first 3 rounds.
   - For parallel execution, 5 independent sub-agents (one per round: Company-exposure / Partner-fairness / edge-cases / consistency / polish) can run concurrently; aggregate into a consolidated action plan.
6. **Before sending, document rationale.**
   - Run `rationale` to produce `{scope}/internal/term-rationale-EN.md`.
7. **If Schedule A is referenced but missing, draft it.**
   - Run `schedule-a` using the 4-section template.
8. **Draft the cover email.**
   - Run `cover-email` with the round-2 structure; include internal fallback posture.
9. **Render and send.**
   - Hand off to `omg-contract beautify` to produce `.docx` / `.pdf`.
   - Use the sending checklist in the cover email draft to verify attachments.

---

## Gotchas

- **Tilt review is not redlining.** Tilt produces a severity-ranked list; redlining produces a specific line-by-line edit. Do tilt first; redline in a separate pass.
- **Synthesize only after you have both reviews.** Don't run synthesize on just one side — you'll bias toward whoever you read first.
- **Balance posture must be explicit.** If you can't articulate "slightly-company-favorable" vs "neutral," you don't know what you're optimizing for.
- **Rationale doc is internal, not for sending.** If counterparty asks for rationale, produce a counterparty-facing summary — not the full doc.
- **Schedule A must be updatable, not one-shot.** Without A.3 (annual update), the schedule ossifies and becomes a liability when Company changes direction.
- **Cover email fallback section is INTERNAL.** Never paste the fallback posture into the actual email. Remove before sending.
- **Scenario divergences are features, not bugs.** Don't flatten them in balance unless the divergence was accidental.
- **Cross-reference staleness after `balance`** — after renumbering sections, grep for `§` cross-refs and verify each still points to the right section. `balance` R3 should include this sweep.

---

## When NOT to use this skill

- **Template contracts with no real negotiation surface** (e.g., cookie-cutter SaaS EULA, standard NDA). Use a lawyer-provided template; don't over-engineer.
- **Contracts in regulated domains with statutory form requirements** (e.g., Vietnamese labor contracts, consumer credit contracts, real estate). The framework may not map cleanly; consult local counsel.
- **Pure rendering/formatting work** — use `omg-contract` instead.
- **Drafting from scratch with no counterparty yet.** Use a template library first; contract-review is for review + negotiation, not greenfield drafting.

---

## References

Mode-detail files (read before first use of each mode):

- `references/mode-1-tilt.md` — severity buckets, output format, 12-clause checklist
- `references/mode-2-synthesize.md` — 3-list structure, output format, discipline
- `references/mode-3-balance.md` — postures, round structure, log template, scenario divergence
- `references/mode-4-rationale.md` — 4-part analysis, output template, divergence tables
- `references/mode-5-schedule-a.md` — 4-section structure, drafting rules, common mistakes
- `references/mode-6-cover-email.md` — section outline, internal-only sections, tone discipline
- `references/mode-7-pattern-recognize.md` — workflow, classification heuristic, worked example

Cross-mode patterns:

- `references/canonical-deal-killers.md` — 10-item canonical list with rationale
- `references/second-layer-defects.md` — R4/R5 adversarial pre-send scan list

Standalone templates (drop into a contract project's `templates/` or `internal/` folder):

- `references/deal-killer-checklist.md` — 12-clause recurring tilt checklist with example language
- `references/schedule-a-template.md` — 4-section template
- `references/cover-email-round2-template.md` — round-2 cover email template
- `references/balance-review-log-template.md` — delta log template

---

## Provenance

Created from patterns observed across the following counterparties:

- **Alfa Partnership** (advisor equity / sales partner) — originating patterns: Schedule A genre scope, round-2 cover email, balance review discipline.
- **BagelCode Pre-Publishing Agreement** — deal-killer pattern: Bagelcode-side IP assignment on Phase 1 funds (from `BagelCode/funding-agreement/`).
- **Neptune** — deal-killer pattern: IP-hostage risk elevated to critical (from `Neptune/` session).
- **JM Game distribution** — bilingual-contract pattern: edits must update both Chinese and English.

This skill is designed to be counterparty-agnostic; the modes above apply to any commercial negotiation with meaningful leverage on both sides.
