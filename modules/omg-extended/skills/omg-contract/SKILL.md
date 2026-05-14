---
name: omg-contract
description: "Beautify and render Markdown legal documents (term sheets, NDAs, agreements) into HTML, DOCX, and PDF. Lints pandoc gotchas, suggests tabularization, ships professional CSS template."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Contract — Legal Document Beautifier

Render Markdown legal documents (term sheets, NDAs, partnership / distribution / licensing agreements) into HTML, DOCX, and PDF that look professional enough to send to a counterparty.

Ships a CSS template (`references/contract-style.css`), a render pipeline (pandoc + Chrome headless), and a lint pass that catches the four pandoc gotchas that bit us on real contracts.

## Operations

| Operation | What it does |
|---|---|
| `init [dir]` | Scaffold `contract-style.css` + `sample-term-sheet.md` into `dir` (default: cwd). Idempotent — does not overwrite existing files. |
| `lint <file.md>` | Run all checks against the Markdown source. Reports issues with line numbers. Exits non-zero on FAIL. |
| `fix <file.md>` | Auto-apply safe fixes for the lint findings (`\` hard breaks for run-on metadata + signatures; insert blank line before list/blockquote that follows a paragraph; collapse nested italic ambiguity in "(Identical to ...)" patterns). Does NOT change semantics. |
| `tabularize <file.md>` | Suggest sections that should be tables (Parties, vesting schedule, KPI thresholds, governing law, expense reimbursement, etc.). Reports candidates with line numbers; the AI does the conversion (semantic — not auto-applied). |
| `render <file.md\|dir>` | Generate paired `.html`, `.docx`, `.pdf` next to the source. Uses sibling `contract-style.css` if present. Skips lint. |
| `beautify <file.md\|dir>` | Full pass: `fix` then `render`. Default operation when in doubt. |

## Entry point

All operations dispatch through `scripts/contract.cjs <op> [args...]`.

The script auto-detects:
- Output directory (same folder as source)
- CSS template (sibling `contract-style.css`, or copy from `references/` on first run)
- Document title (from YAML frontmatter `title:` or first H1)

## The five gotchas this skill prevents

These have all bitten real contracts in this codebase. The lint enforces them; the fix repairs them.

### 1. Duplicate stacked H1 (eats the first page of the PDF)

**Cause:** `pandoc -s --metadata title="X"` generates a `<header><h1 class="title">X</h1></header>` block AND renders the body `# H1` separately. Both render full-size, stacked, often pushing all content past the page break.

**Fix:** use `--metadata pagetitle="X"` instead of `title`. `pagetitle` populates the `<title>` element in `<head>` (good for browser tab + PDF metadata) but does NOT generate the duplicate header block.

The `render` command always uses `pagetitle`, never `title`.

### 2. Run-on metadata block

**Cause:** Markdown collapses consecutive single-line paragraphs into one. Source like:

```markdown
**Status:** Draft
**Date:** 2026-04-22
**Parties:** Foo and Bar
```

…renders as one paragraph: "Status: Draft Date: 2026-04-22 Parties: Foo and Bar".

**Fix:** end each line with `\` (pandoc hard line break) or two trailing spaces. The `lint` flags missing breaks; `fix` adds the `\`.

### 3. Run-on signature block

Same root cause as #2, but at the bottom of the document:

```markdown
**For Acme Inc.**
Name: Jane Doe
Title: CEO
Date: [____]
```

Without hard breaks, it collapses into a single line that reads like a sentence.

**Fix:** same — `\` at end of each line.

### 4. Nested italic ambiguity (stray asterisks)

**Cause:** Pandoc cannot disambiguate `*outer *inner* outer*`. With four `*` in a row, it pairs them (1,2) and (3,4), producing italic spans that swap which span is which — leaving stray asterisks visible in the output.

Real-world hit: the `*(Identical to the *ARR-Based* scenario — unchanged.)*` pattern, which appeared 11 times in one term sheet, all rendering with stray asterisks.

**Fix:** remove the inner italic. The outer span is already italic; emphasizing one word inside doesn't render correctly. Convert to `*(Identical to the ARR-Based scenario — unchanged.)*`.

The lint pass detects the four-asterisk pattern. The fix collapses any inner italic that lives entirely inside an outer italic span.

### 5. Missing blank line before a list or blockquote (silent collapse)

**Cause:** Pandoc CommonMark requires a blank line between a paragraph and any following block element (list, blockquote, table). Without the blank line, the next block gets concatenated into the preceding paragraph as inline text.

Real-world hit, twice in one session:
- §7.3 source `Any of the following:\n- Sale of...\n- Merger...` rendered as one paragraph: "Any of the following: - Sale of... - Merger..." (with literal dashes visible).
- §8 source `**Reference client mix:**\n> A "full Pool A"...` rendered the blockquote as inline italic prose appended to the paragraph.

**Fix:** insert a blank line between the paragraph and the following block. The lint pass detects:
- A non-blank line ending in `:`, `?`, or `.` immediately followed by `- `, `* `, `1. `, `> `, or `|`.

The fix inserts a blank line. (Note: it does NOT fire if the paragraph is itself a list item — bullets-under-bullets are valid nesting.)

## Render pipeline

For each `<file>.md`:

1. **HTML:**
   ```bash
   pandoc -s --css=contract-style.css \
     --metadata pagetitle="<derived title>" \
     <file>.md -o <file>.html
   ```

2. **DOCX:**
   ```bash
   pandoc <file>.md -o <file>.docx
   ```

   No `--reference-doc` by default — pandoc's built-in styles render acceptably. If a project ships a `reference.docx`, the script picks it up automatically from the source folder.

3. **PDF (via Chrome headless on rendered HTML):**
   ```bash
   google-chrome-stable --headless --disable-gpu --no-pdf-header-footer \
     --print-to-pdf=<file>.pdf \
     "file://$PWD/<file>.html"
   ```

   The CSS `@page { size: A4; margin: 2.5cm 2cm; }` rule controls the PDF margins. Chrome falls back to system print defaults if `@page` is missing.

## CSS template

`references/contract-style.css` (~175 lines) is opinionated for legal/business documents:

- **Type:** Georgia serif body (legal-document tradition), Helvetica Neue sans-serif headings.
- **Color:** navy `#0b2545` accents on H1/H2 headings, table headers, links.
- **Tables:** zebra-striped rows, navy header bar, rounded corners, drop shadow.
- **Headings:** double horizontal rule under H1; single rule under H2; uppercase tracked H4.
- **Blockquote:** navy left-rule, italic text — for "About this scenario" callouts.
- **Print:** A4 page size, 2.5cm vertical / 2cm horizontal margins, page-break-avoid on tables and signature blocks.

Override by dropping a `contract-style.css` in the same folder as the source markdown — the script picks it up automatically.

## Tabularization patterns — sections that should be tables

A contract reads better when **structured data** lives in tables, not prose or bullets. The `tabularize` operation reports candidates; the AI converts them. These nine patterns recur across every term sheet / partnership / distribution / licensing agreement and should always be tables:

| Section | Table shape | Why |
|---------|-------------|-----|
| **§1 Parties** | Field × {Company, Counterparty} (3 columns) | Side-by-side comparison; each field aligns visually. Beats two stacked bullet lists. |
| **§ Term** | Field / Value (2 cols) — Effective Date, Initial term, Renewal, Early termination | Pure key-value data — bullets waste vertical space. |
| **§ Signing grant / vesting schedule** | Month / Vests this period / Cumulative vested (3 cols) | Time-series data; tabular form makes the schedule auditable at a glance. |
| **§ Supporting KPIs** | KPI / Threshold / Measurement (3 cols) | Each KPI has a discrete threshold + measurement formula — exactly what tables are for. |
| **§ Vesting / M&A conditions** | Condition / Requirement (2 cols) | Conditions are atomic, side-by-side comparison helps. |
| **§ Key Person departure options** | Option (Pause / Terminate) / Effect (2 cols) | Two-row decision matrix — table is the canonical representation. |
| **§ Termination — for cause / without cause / good vs bad leaver** | Trigger / Detail OR Type / Triggered by / Equity outcome | Termination is decision data; readers need to scan, not read. |
| **§ Expense reimbursement** | Field / Detail (2 cols) — Cap, Requires, Reimbursement, Not compensation | Field/value form. |
| **§ Governing law and disputes** | Field / Value (2 cols) — Governing law, Disputes, Seat, Language, Arbitrators, Costs | Universal contract pattern. Always a table. |

**Convert when:**
- The bullet list is purely **`**Field:** value`** patterns (4+ rows) → Field/Value table
- Two parties have parallel fields → side-by-side table
- A clause defines a discrete set of conditions/outcomes/options → table
- Data has a numeric or time component → table

**Keep as prose when:**
- The content is one continuous argument or narrative
- Bullets nest 2+ levels (tables don't nest)
- Each item is a paragraph (>200 chars) — table cells become unreadable
- The section is < 3 items (table overhead exceeds payoff)

The skill's `tabularize` operation flags the patterns above. The AI does the actual conversion (semantic — column headers should fit the data, not be auto-generated).

## Conventions for source Markdown

Following these makes the output consistent across documents:

- **Top-of-doc metadata block** — use `\` line breaks, not blank lines (keeps it as a single visual cluster):
  ```markdown
  **Status:** Draft for negotiation\
  **Date:** 2026-04-22\
  **Parties:** Foo Inc. and Bar Ltd.
  ```

- **Signature block** — same pattern, with `**For <Party Name>**` as bold prefix:
  ```markdown
  **For Acme Inc.**\
  Name: Jane Doe\
  Title: CEO\
  Date: [____]\
  Signature: ______________________
  ```

- **Cross-references** — write as plain text with section number: `as set forth in §6.4`. Pandoc does NOT auto-link these; convert to clickable links manually if needed.

- **Defined terms** — use bold-on-first-use convention: **"Confidential Information"**. The skill does NOT auto-highlight defined terms (intentional — automatic detection is unreliable on legal text).

- **Bracketed placeholders** — write as `[____]` (4 underscores in brackets). The skill does not enforce this, but it's the convention this codebase uses for fillable fields.

## Agent routing

Inline operation — the skill is deterministic. No agent delegation needed for `lint`, `fix`, `render`, or `beautify`. For drafting new term sheets from scratch, route to `omg-planner` or `omg-researcher` first.

## References

- `references/contract-style.css` — the bundled professional stylesheet
- `references/sample-term-sheet.md` — minimal scaffold to start from
- `references/lint-rules.md` — full reference for the four gotchas with regex patterns
- `references/pandoc-conventions.md` — pandoc invocation + flag rationale

## Gotchas

- **`pagetitle` not `title`** — `--metadata title=X` generates a duplicate H1 header block. Always use `pagetitle`. The render script does this; if you write your own pandoc command, replicate this.
- **Hard breaks use `\`, not `<br>`** — `<br>` survives HTML rendering but breaks pandoc DOCX (literal `<br>` shows in Word). Pandoc's `\` at end of line works in all output formats.
- **Chrome `--no-pdf-header-footer`** — without this flag, Chrome stamps the URL + date in the PDF header/footer. Looks unprofessional on a contract.
- **CSS `@page` is required for A4 PDFs** — Chrome falls back to system printer defaults (usually US Letter) if `@page { size: A4 }` is missing. The bundled CSS includes it.
- **Don't `--reference-doc=<some-template.docx>` casually** — pandoc DOCX output via reference templates is fragile (style names must match exactly). The skill omits it by default.
- **Pandoc 3.5+ recommended** — older versions handle the metadata YAML block differently. The skill checks pandoc version on first run.

## Security

- Refuses to render files containing `BEGIN RSA PRIVATE KEY`, `-----BEGIN OPENSSH`, `password:`, or other secret indicators (the lint pass checks).
- Never embeds remote stylesheets or scripts (CSS is local-file only).
- Chrome runs with `--disable-gpu --headless` (no UI, no remote-debugging port).
