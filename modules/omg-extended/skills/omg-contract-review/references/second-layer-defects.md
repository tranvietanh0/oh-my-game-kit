---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Second-layer defects — adversarial R4/R5 pre-send pass

After the first 3 rounds of `balance` review fix the obvious deal-killers and the balance is roughly right, a second layer of defects remains. These are the clauses that survive the rebalance because each one in isolation looks fine — but an adversarial reader will flag them.

**Always run an R4 (edge-case) and R5 (consistency + polish) pass before sending.** Typical find rate: 5–10 must-fix items + 15–20 should-fix items per contract.

## Recurring second-layer defects to scan for

### Contradictions between clauses

- Safety-valve trigger wording contradicts an exclusion list elsewhere (e.g., "written signed commitment" satisfies cliff, but LOI/MOU excluded → ambiguity about whether a written LOI counts).
- Key Person for-cause termination (§11) triggers vested clawback, while §12.3 promises "vested is sacrosanct" — double-jeopardy pattern; always carve out §11 from §12.1 unless the replacement-window remedy fails first.
- §X.Y references broken after section renumbering — grep every `§X.Y` after any balance pass.

### Asymmetric safety valves

- Cliff extensions apply only to Company-side delay; client-side delay (slow procurement, late first invoice) has no parallel carve-out. **Always add symmetric carve-outs.**
- Cure windows apply to one party only; the other party has no cure. **Audit every cure window for both-sides applicability.**

### Closed exception lists that miss realistic causes

- Clawback / retention exception lists enumerate 3–5 causes; real-world churn has 10+. **Always add a catch-all with neutral-expert review**: "any other Company-attributable cause of client loss, subject to good-faith dispute escalation to a neutral third-party accountant or industry expert within 60 days."

### Undefined terms that can be weaponized

- "Pipeline coverage" as a gate but pipeline is not defined → define Qualified Pipeline Prospect explicitly.
- "Qualified substitute" in Key Person replacement → define seniority + experience + no-conflict tests.
- "Similar services" in non-compete → define by genre + platform + audience segment (three-conjunctive test from Schedule A).

### Boundary mechanics that break at the edge

- Weekend/holiday deadlines: add explicit Business Day roll-over rule ("Any deadline falling on a non-Business Day rolls to the next Business Day; 'Business Day' means a day other than Saturday, Sunday, or a public holiday in the governing-law seat").
- ACV / revenue tier boundaries: client at exactly the threshold → spell out which tier wins.
- Exit valuation exactly on a ladder boundary → see canonical deal-killer #9.
- Post-termination attribution: only LOI stage is too narrow; broaden to "Partner was primary source contact AND held ≥ 2 qualifying meetings with prospect's economic buyer AND prospect signs within 90 days."

### Loopholes in time-based mechanics

- Key Person unavailability clock resets on return → add "90+ days of cumulative unavailability within any rolling 12-month period triggers §X.Y" to close rotation loopholes.
- Quarterly sign-off windows that straddle a termination event → define whether a post-termination quarterly review still binds both parties.

### Non-cash transaction handling

- Stock-for-stock mergers: define "enterprise value" (aggregate consideration at closing price on closing date).
- Earn-outs: clarify whether Pool B is on upfront only or follows earn-out tranches.
- Asset sales vs. share deals: make sure Pool B triggers correctly for the chosen structure.

### Cross-document numerical consistency (R4 check)

- Term sheet and deal summary: every number that appears in both MUST match (expense caps, tier thresholds, exit ladder). A $1K vs $2K drift between the two is an immediate credibility hit on the counterparty side.
- Cover email claims vs term sheet reality: every headline claim in the email must map to an exact term-sheet clause.
- Scenario parity sections: clauses marked "identical to [other scenario]" must actually be byte-for-byte identical. Drift is always accidental.

## Intentional scenario divergence — when to preserve

If a contract has multiple scenarios, resist the urge to flatten them during `balance`. Preserve divergences that are **structurally motivated**:

- Different KPI shape (tiered vs continuous) → different clawback mechanics
- Different per-unit equity weight → different stickiness windows
- Different revenue recognition → different expansion rules

Document the divergence in the rationale doc and the balance review log.

## Parallel R4/R5 execution

For parallel execution, 5 independent sub-agents (one per round: Company-exposure / Partner-fairness / edge-cases / consistency / polish) can run concurrently; aggregate into a consolidated action plan.