---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Diátaxis Guide — Four Page Types

Every wiki page belongs to exactly one of four types. Validator
`validate-section-headers.cjs` checks for the canonical sections per
type; mixing types in a single page hurts both human scanning and AI
retrieval (chunks lose coherent topic boundaries).

## Decision

| User intent | Page-type |
|---|---|
| "I want to learn by doing" | tutorial |
| "I want to accomplish a specific task" | how-to |
| "I need to look up a fact" | reference |
| "I want to understand why/how" | explanation |

Source: [Diátaxis framework](https://diataxis.fr/). Validated by
Google / Microsoft / Django / FastAPI / Pulumi docs teams as a
production-grade IA pattern.

## Type: reference

**Purpose:** authoritative fact lookup. Terse, complete, scannable.

**Canonical sections (in order):**
1. `## Overview` — one paragraph: what this is, when to use it
2. `## Syntax` — API / schema / CLI / config format
3. `## Constraints` — limits, invariants, boundary conditions
4. `## Examples` — 2-4 minimal, runnable examples
5. `## See Also` — related pages, with one-line context per link

**Good titles:** `Mechanic-Registry-API`, `PLAGameFoundation-Signals`,
`Template-Scaffolder-CLI`.

**Bad titles:** `About-Registry` (too vague — is it reference or
explanation?), `How-to-use-Registry` (that's a how-to).

## Type: how-to

**Purpose:** goal-driven recipe. Assumes user knows what they want,
shows the steps to get there.

**Canonical sections (in order):**
1. `## Prerequisites` — required tools / pages / access / prior knowledge
2. `## Steps` — numbered, imperative sentences (not prose)
3. `## Validation` — how to confirm the goal is achieved
4. `## Troubleshooting` — common failures + fixes

**Good titles:** `Publish-a-New-Playable-Ad`, `Add-a-Mechanic-to-the-Registry`.

**Bad titles:** `Deployment` (too vague), `Publishing` (noun — a how-to is a verb phrase).

## Type: tutorial

**Purpose:** guided learning. User builds something end-to-end and
develops intuition.

**Canonical sections (in order):**
1. `## Objectives` — what the reader will be able to do after
2. `## Setup` — prep the environment (install, clone, open editor)
3. `## Walkthrough` — the experience, broken into parts
4. `## Wrap-Up` — summary + next steps + links to how-tos/references

Tutorials are the ONLY page-type where a narrative voice ("we'll now
add…") is acceptable. For all other types, prefer imperative or
descriptive.

**Good titles:** `Build-Your-First-Variant`, `End-to-End-Publishing-Tutorial`.

## Type: explanation

**Purpose:** conceptual deepening. Why things are the way they are.

**Canonical sections (in order):**
1. `## Context` — the history / domain / motivation
2. `## Core Concepts` — the mental model (diagrams welcome)
3. `## Best Practices` — patterns that emerge from the model
4. `## Related Links` — references, how-tos, or further reading

**Good titles:** `Variant-Generation-Architecture`, `Why-Cocos-3.8.7`.

## Mixing types = chunk drift

When a page mixes types (e.g., a reference page that casually slips
into explanation), H2 sections stop being homogeneous. A RAG system
retrieving `## Constraints` expects facts; if it retrieves a narrative
paragraph embedded between a table and a code sample, the answer
quality drops.

The validator warns on:
- Missing canonical sections for the declared page-type
- Canonical sections appearing out of order
- Sections named similarly to a canonical section on a different page-type (e.g., a reference with `## Walkthrough`)

## Retrofit workflow

For existing pages without a declared `page-type`:
1. Read the page end-to-end — identify the dominant purpose
2. Set `page-type` in frontmatter accordingly
3. Run `beautify-frontmatter.cjs` to infer any missing fields
4. Rename or merge sections to match the canonical template
5. If the page genuinely covers two purposes (common for old docs),
   **split it** — one page per type
