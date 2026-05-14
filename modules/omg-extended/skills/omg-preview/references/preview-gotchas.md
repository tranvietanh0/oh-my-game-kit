---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Preview Gotchas & Extended Error Handling

## Full Error Table

| Error | Action |
|-------|--------|
| Invalid topic (empty) | Ask user to provide a topic |
| Flag without topic | Ask user: "Please provide a topic: `omg-preview --explain <topic>`" |
| Topic becomes empty after sanitization | Ask for topic with alphanumeric characters |
| File write failure | Report error, suggest checking disk space and permissions |
| Server startup failure | Check if port in use, try `omg-preview --stop` first |
| No generation flag + unresolvable reference | Ask user to clarify which file they meant |
| Existing file at output path | Overwrite with new content (no prompt) |
| Server already running | Reuse existing server instance, just open new URL |
| Parent `plans/` dir missing | Create directories recursively before write |
| `--diff` without git context | Explain: "No git repo detected. Run inside a git repository." |
| `--plan-review` without plan file or active plan | Explain: "Provide a plan file path or run from a session with an active plan." |
| `--recap` without git history | Explain: "No git history found. Run inside a git repository with commits." |
| `--html --ascii` combination | Not supported — `--ascii` is terminal-only by design. Suggest `--html --diagram` instead |
| `--diff` with PR number but `gh` unavailable | Explain: "GitHub CLI (gh) is required for PR diffs. Install from https://cli.github.com/" |

## Gotchas

- **Mermaid v11 syntax**: Use `mermaidjs-v11` skill for current syntax rules — avoid deprecated `graph` keyword (use `flowchart`)
- **Large diffs**: Truncate files >500 lines changed, show summary counts instead
- **Plan review accuracy**: Cross-reference git log with task descriptions, not just file names
- **HTML CDN dependency**: `--html` mode requires internet access in browser to render Mermaid. For offline: note this limitation in the output file.
- **Multiple flags**: If multiple generation flags provided, use first one; remaining treated as topic.
- **`--from-file file.md` may be plain Markdown**: A `.md` file may contain plain Markdown, not Mermaid. Scan for ` ```mermaid ` fence blocks before rendering; if none are found, fall back to view mode rather than treating the whole file as a diagram source.
- **Windows `package-manager` handler elevation**: `winget` and `choco` may require interactive elevation that non-interactive OMG commands cannot satisfy. When `package-manager` install fails on Windows, do not retry silently. Instead, fall back to a manual-install hint that prints the exact command the user should run in an elevated terminal (e.g., `winget install --id <pkg>` or `choco install <pkg>`).

## Mode Details Reference

### --explain Structure
1. **Overview** — 2-3 sentence plain language summary
2. **Mermaid diagram** — flowchart or sequence showing the key flow
3. **Code walkthrough** — annotated key sections with inline comments
4. **Key concepts** — bulleted list of patterns used
5. **Gotchas** — non-obvious behavior worth noting

### --diagram Structure
1. **Mermaid diagram** — full architecture or data flow
2. **Component legend** — table of each node/component
3. **Interaction notes** — numbered annotations for non-obvious flows

Prefer `flowchart LR` for architecture, `sequenceDiagram` for interactions, `classDiagram` for data models.

### --slides Structure
Sections separated by `---` (horizontal rule). Each section is one "slide":
1. Title slide — topic name, date
2. Overview slide — what we're covering
3. Content slides — one concept per slide with code or diagram
4. Summary slide — key takeaways

### --diff [ref]
1. Run `git diff {ref}` or `git diff HEAD` if no ref given
2. Group changes by file, then by type (added/removed/modified)
3. Highlight meaningful changes (skip whitespace-only diffs)
4. Include: total files changed, lines added/removed, key semantic changes

### --plan-review
1. Read active plan from `plans/` (most recent directory)
2. Read each phase file — extract todo items
3. Check git log for evidence of completed items
4. Output: phase-by-phase table with `[DONE]` / `[IN PROGRESS]` / `[PENDING]` / `[BLOCKED]`

### --recap [timeframe]
1. Run `git log --oneline --since="{timeframe}"` (default: 7 days ago)
2. Summarize commits by area/module
3. List files most changed
4. Note open tasks from `TaskList`
5. Highlight any uncommitted or in-progress work

### --ascii
- Use ASCII box-drawing characters: `+--+`, `|`, `+--+`, `-->`, `<--`
- Max 80 columns wide
- No Mermaid (terminal-only context)
- Use arrows `-->`, `==>`, `---` for connections

## HTML Reference Loading

| Mode | Always read | Mode-specific |
|------|-------------|---------------|
| All HTML modes | `references/html-design-guidelines.md` | — |
| `--explain` | `references/html-css-patterns.md`, `references/html-libraries.md` | — |
| `--diagram` | `references/html-css-patterns.md`, `references/html-libraries.md` | — |
| `--slides` | `references/html-slide-patterns.md`, `references/html-css-patterns.md`, `references/html-libraries.md` | — |
| `--diff` | `references/html-css-patterns.md`, `references/html-libraries.md` | — |
| `--plan-review` | `references/html-css-patterns.md`, `references/html-libraries.md` | — |
| `--recap` | `references/html-css-patterns.md`, `references/html-libraries.md` | — |

Multi-section pages (`--explain`, `--diff`, `--plan-review`, `--recap`): also read `references/html-responsive-nav.md`.

## Style Strategy
- Default: static anti-slop rules from `references/html-design-guidelines.md` (6 curated presets)
- Agent must vary aesthetics between consecutive HTML outputs (different font pair, palette)

## HTML-Only Mode Details

### --diff [ref]
Scope detection: branch name, commit hash, HEAD, PR number, commit range, default=main.
Data: git diff --stat, --name-status, changed files, new API surface, CHANGELOG.
Output: executive summary, KPI dashboard, module architecture (Mermaid), feature comparisons (side-by-side), flow diagrams, file map, test coverage, code review cards (Good/Bad/Ugly/Questions), decision log, re-entry context.

### --plan-review [plan-file]
Input: plan file path or detect from active plan context.
Data: read plan, read all referenced files, map blast radius, cross-reference assumptions.
Output: plan summary, impact dashboard, current vs planned architecture (paired Mermaid), change breakdown (side-by-side), dependency analysis, risk assessment.
Visual language: blue=current, green=planned, amber=concern, red=gap.

### --recap [timeframe]
Time window: shorthand (2w, 30d, 3m) or default 2w.
Data: project identity, git log, git status, decision context, architecture scan.
Output: project identity, architecture snapshot (Mermaid), recent activity, decision log, state KPI cards, mental model essentials, cognitive debt hotspots, next steps.
