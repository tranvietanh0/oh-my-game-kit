---
name: omg-graphify
description: "Build queryable knowledge graphs from code, docs, papers, and images. Use for codebase understanding, architecture analysis, cross-file relationship mapping."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Graphify — Knowledge Graph Builder

Turn any folder of code, docs, papers, or images into a queryable knowledge graph. Uses tree-sitter AST for code (20 languages), Whisper for audio/video, and LLM subagents for documents.

## Prerequisites

**Python 3.10+ required.** This is an optional skill that integrates with the third-party `graphifyy` package.

Install:
```bash
pip install graphifyy
graphify install  # downloads tree-sitter grammars
```

Optional extras:
```bash
pip install 'graphifyy[mcp]'     # MCP server mode
pip install 'graphifyy[all]'     # full install (PDF, video, office, Leiden)
pip install 'graphifyy[neo4j]'   # Neo4j graph database integration
pip install 'graphifyy[leiden]'  # Leiden community detection algorithm
```

**Note:** The PyPI package is `graphifyy` (double-y). Other `graphify*` packages on PyPI are unaffiliated.

## When to Use

- Understanding unfamiliar codebase architecture before planning
- Discovering cross-file relationships and dependency chains
- Finding "god nodes" (most-connected concepts) in large projects
- Navigating by structure instead of grepping every file
- Preparing context-efficient codebase representation (71.5x fewer tokens vs raw files)

**Typically precedes:** `omg-plan` (understand architecture before planning)
**Related:** `omg-scout` (quick file search), `omg-repomix` (full context dump)

## Quick Start

```bash
# Build knowledge graph from current directory
graphify .

# Build from specific path
graphify /path/to/project

# Watch mode (auto-rebuild on file changes)
graphify . --watch
```

## Output Artifacts

| File | Purpose |
|------|---------|
| `graphify-out/graph.html` | Interactive visualization with search + community filtering |
| `graphify-out/GRAPH_REPORT.md` | God nodes, surprising connections, suggested questions |
| `graphify-out/graph.json` | Persistent graph for queries across sessions |
| `graphify-out/cache/` | SHA256-based incremental updates (only reprocesses changed files) |

## MCP Server Mode

Expose the graph as an MCP server for Codex to query directly:

```bash
python -m graphify.serve graphify-out/graph.json
```

### MCP Tools Available

| Tool | Purpose |
|------|---------|
| `query_graph` | Search for concepts and relationships |
| `get_node` | Get details of a specific node |
| `get_neighbors` | Find related concepts |
| `shortest_path` | Find connection path between two concepts |

### Codex MCP Setup

Add to `.agents/.mcp.json`:
```json
{
  "mcpServers": {
    "graphify": {
      "command": "python",
      "args": ["-m", "graphify.serve", "graphify-out/graph.json"]
    }
  }
}
```

## Three-Pass Architecture

1. **AST extraction (local, no API)** — tree-sitter parses code in 20 languages deterministically
2. **Audio/video transcription (local)** — Whisper runs on-device for media files
3. **Semantic extraction (API)** — LLM subagents process docs, papers, images in parallel

### Supported Languages (tree-sitter)

Python, JavaScript, TypeScript, Go, Rust, Java, C, C++, Ruby, C#, Kotlin, Scala, PHP, Swift, Lua, Zig, PowerShell, Elixir, Objective-C, Julia

## Confidence Tagging

Relationships in the graph are tagged by provenance:

| Tag | Meaning |
|-----|---------|
| `EXTRACTED` | Directly from AST (imports, function calls, class inheritance) |
| `INFERRED` | LLM-derived with confidence score |
| `AMBIGUOUS` | Uncertain — needs human verification |

## Workflow Integration

### Before Planning

```bash
# Build graph first, then plan with context
graphify .
# Codex reads GRAPH_REPORT.md → understands architecture → better plans
```

### With Scout

```bash
# Graph for high-level structure, scout for specific files
graphify .                        # build graph
omg-scout "auth module"          # find specific files
```

### Incremental Updates

Graph rebuilds are incremental — only changed files get reprocessed. Cache at `graphify-out/cache/` tracks file hashes.

## Privacy

- **Code:** Processed locally via tree-sitter AST. No file contents leave your machine.
- **Audio/Video:** Transcribed locally via Whisper.
- **Docs/Images:** Sent to your configured model provider (Codex/OpenAI) for semantic extraction.

## Limitations

- First build on large codebases can be slow (AST parsing + LLM calls)
- Semantic extraction quality depends on the underlying model
- Neo4j integration requires separate setup (`pip install 'graphifyy[neo4j]'`)
- Leiden community detection requires `pip install 'graphifyy[leiden]'`
- **Beta status:** This skill depends on a third-party package (`graphifyy`). API surface may change.

## Tool Size Caps (E6)

When invoking the graphify MCP server's `query_graph` and `get_neighbors` tools, this skill MUST pass an explicit `maxResultSizeChars` cap to prevent context blow-up on large graphs:

- **`query_graph`**: cap at `maxResultSizeChars: 200_000` (~50k tokens). Larger results break Codex's working memory; instead, paginate via cursor.
- **`get_neighbors`**: cap at `maxResultSizeChars: 50_000` (~12k tokens). Neighbor expansion can fan out exponentially in dense graphs.
- **Always include `limit` AND `maxResultSizeChars`** — `limit` bounds nodes, but a single node with megabyte-sized properties still blows the budget.

If a query exceeds the cap, the MCP server returns `truncated: true`; the skill MUST surface this to the user with a hint to refine the query, NOT silently deliver a partial result as if it were complete.
