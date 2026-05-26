---
name: omg-help
description: "Display Oh My Game Kit usage guide with live registry state. Use for 'what commands exist', 'which agents are registered', 'how do I use Oh My Game Kit'."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Help

Lists all commands and dynamically shows registered agents from the routing registry.

## Live Registry State (fetch on demand — DO NOT inline in body)

When the user asks for the help guide, fetch the live registry state via tool calls AFTER this skill body is loaded — do NOT embed `` !`cat ...` `` in the body (cache-busts every fragment edit). Use:

- `Read .agents/metadata.json` → installed kits + modules
- `Read .omg-module-summary.txt` → module summary (may not exist)
- `Read` each `.agents/omg-routing-*.json` matching glob → role→agent mapping (highest-priority wins per role)
- `Read` each `.agents/omg-activation-*.json` matching glob → keyword→skill activation
- `Read` each `.agents/omg-config-*.json` matching glob → extra commands registered by installed kits

If a file does not exist, treat as "no entries" and skip silently — do not echo error.

## Dynamic Registry Listing

**MANDATORY:** After fetching above, generate the agents table from routing fragments. Show which role is mapped to which agent (highest-priority registry wins per role). List any extra commands from config fragments.

## Commands (Core)

### Implementation
| Command | Purpose |
|---|---|
| `omg-cook` | Feature implementation (registry-routed) |
| `omg-plan` | Implementation planning (omg-planner agent) |
| `omg-brainstorm` | Ideation (omg-brainstormer agent) |
| `omg-test` | Run tests (registry-routed) |
| `omg-fix` | Fix bugs (registry-routed) |
| `omg-debug` | Debug issues (registry-routed) |
| `omg-review` | Code review (registry-routed) |

### Documentation and Git
| Command | Purpose |
|---|---|
| `omg-docs` | Documentation management |
| `omg-git` | Git operations (cm/cp/pr/merge) |

### Maintenance
| Command | Purpose |
|---|---|
| `omg-triage` | Triage issues/PRs across all registered repos |
| `omg-sync-back` | Push .agents/ changes to origin kit repos |
| `omg-issue` | Report problems to correct kit repo |
| `omg-doctor` | Validate registry integrity |
| `omg-help` | This help guide |

### Module Management (when modular kits installed)
| Command | Purpose |
|---|---|
| `omg-modules add <names>` | Install modules + auto-resolve dependencies |
| `omg-modules remove <names>` | Remove modules (refuses if dependents exist) |
| `omg-modules list` | Show installed and available modules |
| `omg-modules preset <name>` | Switch preset (additive; --replace for clean) |

## Installed Modules (Dynamic)

Follow protocol: `.agents/skills/omg-modules/references/module-detection-protocol.md`

If `installedModules` present in `.agents/metadata.json`, for each installed module:
- Module name, version (from `installedModules[name].version`), kit, required/optional status
- Available-but-not-installed modules (from kit release info)

If no `installedModules` key or no metadata: skip this section silently.

### Universal
| Command | Purpose |
|---|---|
| `omg-scout` | Codebase exploration |
| `omg-ask` | Technical Q&A |
| `omg-watzup` | Session review |

## Search and Filter

```
omg-help --search <query>       # Filter commands matching keyword in name or description
omg-help --category <cat>       # Filter by category: implementation, maintenance, modules, universal
```

**Search behavior:** case-insensitive match against command name + description. Show only matching rows.
**Category values:** `implementation`, `docs-git`, `maintenance`, `modules`, `universal`

## Chaining Suggestions

After showing help for a specific command, append suggested next commands:

| Command shown | Suggested next |
|---------------|----------------|
| `omg-plan` | `omg-cook` |
| `omg-cook` | `omg-test`, `omg-review` |
| `omg-test` | `omg-review` (pass) or `omg-fix` (fail) |
| `omg-review` | `omg-git cm` |
| `omg-fix` | `omg-test` |
| `omg-debug` | `omg-fix` |
| `omg-triage` | `omg-cook --auto --parallel` |

Format: `**Next:** omg-{cmd1}, omg-{cmd2}`
