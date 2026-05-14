---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# MCP Server Requirements

## Tiered MCP Requirements

Oh My Game Kit declares MCP server requirements in `omg-config-*.json` → `mcp` section. Each kit layer can declare its own requirements. Core defines the baseline.

### Tier Definitions

| Tier | Meaning | Behavior |
|------|---------|----------|
| **required** | Must be connected for core workflows to function | SessionStart hook warns loudly; doctor check fails |
| **recommended** | Significantly improves workflow quality | SessionStart hook suggests installation |
| **optional** | Nice to have for specific use cases | Mentioned in `omg-help` output only |

### Core Layer MCPs (omg-config-core.json)

| MCP Server | Tier | Used By | Purpose |
|------------|------|---------|---------|
| `github` | required | omg-issue, omg-triage, omg-sync-back, omg-git pr | GitHub issue/PR management |
| `context7` | required | omg-plan, omg-cook, omg-ask, omg-brainstorm | Library/framework documentation lookup |
| `sequential-thinking` | required | omg-problem-solve, error-recovery | Structured step-by-step analysis when stuck |
| `memory` | required | Cross-session knowledge persistence | Knowledge graph for entity tracking |
| `playwright` | optional | Frontend testing, browser automation | E2E testing, screenshots, visual regression |
| `chrome-devtools` | optional | Frontend debugging | Console, network, performance analysis |

### Manual-Install Only MCPs (NOT auto-suggested)

| MCP Server | When to Install | Token Cost | Install Command |
|------------|----------------|------------|-----------------|
| `serena` | Projects with 500+ code files (.cs/.ts/.py/.rs/.go) where semantic navigation saves more than it costs | **15-25k tokens per turn** (instructions re-injected on every prompt) | `codex mcp add serena -s project -- serena start-mcp-server --context ide-assistant` |

**Why serena is manual-install only:**
- Serena adds 15-25k tokens per turn from its instruction block (re-injected every prompt)
- In a 20-turn session that's 300-500k tokens on serena instructions alone
- Only pays back when codebase is large enough that semantic navigation saves more tokens than Grep+Read
- Codex cannot disable user-scope MCPs per-project — so installing at user scope (`-s user`) wastes tokens in EVERY project including config-only ones
- **NEVER install with `-s user`**. Always use `-s project` so it's scoped to projects that need it
- To remove a global serena install: `codex mcp remove serena -s user`

### Kit Layer MCPs (engine kits declare their own)

Engine kits extend the MCP requirements in their own `omg-config-{kit}.json`:

```json
{
  "mcp": {
    "required": [
      { "name": "UnityMCP", "installCmd": "codex mcp add UnityMCP -- uvx mcp-for-unity", "purpose": "Unity Editor bridge" }
    ]
  }
}
```

## Auto-Setup Protocol

### Unified Tag Format

The SessionStart hook (`check-mcp-health.cjs`) outputs unified `[omg-mcp]` tags:

```
[omg-mcp] action=install tier=required name="github" purpose="GitHub issue/PR management" cmd="codex mcp add github"
[omg-mcp] action=install tier=recommended name="memory" purpose="Cross-session knowledge" cmd="codex mcp add memory -- npx -y @modelcontextprotocol/server-memory"
[omg-mcp] action=ok name="context7" tier=required
```

Fields:
- `action` — `install` (missing, needs installation) or `ok` (connected)
- `tier` — `required` or `recommended`
- `name` — MCP server name
- `purpose` — human-readable description (install only)
- `cmd` — full install command (install only)

### AI Auto-Install Protocol (MANDATORY)

When AI sees `[omg-mcp]` tags with `action=install`:

1. **Collect** all `action=install` entries from hook output
2. **For REQUIRED tier:**
   - Spawn a **BACKGROUND** sub-agent to install all missing required MCPs
   - Sub-agent runs each `cmd` value via Bash sequentially
   - Sub-agent verifies each install with `codex mcp get {name}`
   - If entry has `verifyTool` in config: also check `ToolSearch` for the prefix
   - Sub-agent reports results (installed/failed) back to main session
   - **Do NOT block** the user's first prompt — install runs in background
3. **For RECOMMENDED tier:**
   - Mention briefly: "{N} recommended MCPs not installed: {names}"
   - Offer to install in background if user wants
   - If user declines, do not re-offer in the same session
4. **For `action=ok` entries:**
   - Note as available — no action needed
   - Use this info when commands need specific MCPs

### Install Verification

After each install command, the sub-agent must verify:

1. Run: `codex mcp get {name}`
   - If found → install succeeded
   - If "not found" → install failed, report to user
2. If `verifyTool` field exists in `omg-config-*.json` for this MCP:
   - Run `ToolSearch` for the prefix (e.g., `mcp__github__`)
   - If tools found → MCP is functional
   - If no tools → MCP registered but not functional (may need auth)
   - Suggest: "Run `! codex mcp auth {name}` if authentication is needed"
3. Never retry more than once per MCP per session

### Doctor Check

`omg-doctor` includes MCP validation (check #31):
- Check all `required` MCPs are connected
- Warn about missing `recommended` MCPs
- Verify `verifyTool` prefixes if present
- Report: `MCP health: {N}/{total} required connected, {M} recommended missing`
- Fix mode: runs install commands for missing MCPs
- **Check #32 (rule dedup):** Detects duplicate project rules and offers backup+removal
- **Serena scope check:** If serena is installed at user scope (`-s user`), warns: "Serena costs 15-25k tokens per turn in all projects. Consider removing with `codex mcp remove serena -s user` and adding per-project."

### MCP Transport Types

All install commands use `-s user` scope (global for the user, persists across projects).

| Type | Pattern | Example |
|------|---------|---------|
| HTTP | `codex mcp add {name} -s user --transport http -- {url}` | context7, github |
| stdio (npx) | `codex mcp add {name} -s user -- npx -y {package}` | sequential-thinking, memory |
| stdio (binary) | `codex mcp add {name} -s user -- {command} {args}` | serena, UnityMCP (uvx) |

## Install Commands Reference

| MCP Server | Install Command |
|------------|----------------|
| `github` | `codex mcp add github` (built-in, usually auto-configured) |
| `context7` | `codex mcp add context7 -- npx -y @context7/mcp` or use HTTP: `https://mcp.context7.com/mcp` |
| `sequential-thinking` | `codex mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking` |
| `memory` | `codex mcp add memory -- npx -y @modelcontextprotocol/server-memory` |
| `serena` | `codex mcp add serena -s project -- serena start-mcp-server --context ide-assistant` (manual-install, **per-project only** — never `-s user`) |
| `playwright` | `codex mcp add playwright -- npx @playwright/mcp@latest --headless` |
| `chrome-devtools` | `codex mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest` |

## Config Schema

```json
{
  "mcp": {
    "required": [
      {
        "name": "github",
        "purpose": "GitHub issue/PR management for triage, sync-back, issue reporting",
        "installCmd": "codex mcp add github",
        "verifyTool": "mcp__github__"
      }
    ],
    "recommended": [
      {
        "name": "sequential-thinking",
        "purpose": "Structured analysis for problem-solving when stuck",
        "installCmd": "codex mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking",
        "verifyTool": "mcp__sequential-thinking__"
      }
    ],
    "optional": [
      {
        "name": "playwright",
        "purpose": "Browser automation for E2E testing",
        "installCmd": "codex mcp add playwright -- npx @playwright/mcp@latest --headless",
        "verifyTool": "mcp__playwright__"
      }
    ]
  }
}
```

The `verifyTool` field is optional. When present, the AI checks `ToolSearch` for this prefix after install to confirm the MCP is functional (not just registered).
```
