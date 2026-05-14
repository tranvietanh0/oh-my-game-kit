---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Oh My Game Kit Execution Context

## Context Detection

**MANDATORY:** Read ALL `omg-config-*.json` files to determine execution context.

Each config fragment declares what context it requires:

```json
{
  "kitName": "example-kit",
  "context": {
    "requiredPaths": ["src/", "package.json"],
    "requiredFeatures": ["mcp"],
    "description": "Requires project with src/ and package.json"
  }
}
```

If `requiredPaths` are present in the working directory → that kit's context is active.
If `requiredPaths` are absent → that kit's commands requiring those paths will fail.

## Core Layer (Always Available)

Oh My Game Kit core commands run in ANY context:
- `omg-triage` always fetches from all registered repos regardless of context
- `omg-doctor`, `omg-help`, `omg-ask`, `omg-brainstorm`, `omg-plan` — context-independent
- `omg-scout`, `omg-watzup`, `omg-git` — require a git repository

## Kit-Specific Context

Kit-level configs register context-dependent commands:
- Commands requiring a specific runtime (e.g., a game editor, mobile SDK) will fail outside that context
- When a command fails due to missing context, report the missing requirement clearly
- Never silently skip — always explain what context is needed

## Detection Pattern

```
IF omg-config-*.json has requiredPaths:
  FOR each required path:
    IF path does NOT exist in cwd → log: "command X requires {path} — not in context"
    Do NOT attempt kit-specific commands
ELSE:
  Context is available → proceed
```

## Fallback Behavior

- If no kit configs found: only core layer commands are available
- If kit context missing: report requirements, suggest switching to correct project directory
- Never attempt to fake context (e.g., creating dummy directories)
