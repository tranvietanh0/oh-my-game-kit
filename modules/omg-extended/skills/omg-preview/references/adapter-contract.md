---
contractVersion: "1.0.0"
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Adapter Contract — Versioned Specification

**Contract version: 1.0.0** — frozen at `omg-extended@1.65.0`. Additive changes only until major bump.
Downstream adapters declare: `"dependencies": { "omg-extended": ">=1.65.0 <2.0.0" }`.

## Contract Version History

### 1.0.0 — 2026-04-17 (Phase 1 release)
- Initial freeze: frontmatter schema, 4 script filenames, `install.json` schema v1.
- Capability enum: `modules`, `classes`, `packages`, `c4`, `scenes`, `prefabs`, `routes`, `state`.
- Pluggable handler mechanism (BLOCKER 1). Frontmatter-based discovery (BLOCKER 2). SHA-256 refresh protection (BLOCKER 5).

### 1.1.0 — (example future additive bump)
- Added optional capability: `deployment`. Pre-1.1.0 adapters unaffected.

---

## Adapter Skill Layout

```
.agents/skills/{adapter-skill-name}/
├── SKILL.md                 # required — omg-adapter frontmatter block
├── install.json             # required — toolchain declarations
└── scripts/
    ├── detect.cjs           # exit 0 = match, exit 1 = no match
    ├── list-capabilities.cjs # stdout = JSON array of capabilities
    ├── generate.cjs         # diagram generation (two modes — see below)
    └── requirements.cjs     # stdout = JSON array of { tool, checkCommand, installHint }
```

Skill name must match `/(^|-)(?:assembly|script|service)-graph$/` for discovery pre-filtering.
This regex is a performance filter only — engine identity comes from SKILL.md frontmatter.

---

## Required SKILL.md Frontmatter

```yaml
omg-adapter:
  engine: unity                          # required — authoritative engine identity token
  capabilities: [modules, classes, packages]
  priority: 100                          # int — tie-breaker for multi-adapter conflicts
```

Skills matching the candidate regex but NOT adapters MUST declare `omg-adapter: false` (explicit opt-out).

---

## Discovery Algorithm (frontmatter-based — BLOCKER 2 resolution)

1. Source: `metadata.json` → `installedModules[*].skills[]` (SSOT; no disk scan outside this list).
2. Pre-filter by candidate regex (performance only — not authoritative).
3. Parse SKILL.md frontmatter. Skip + log stderr if `omg-adapter` block missing or malformed.
4. Run `detect.cjs`. Keep only exit-0 results.
5. Invoke `list-capabilities.cjs`. Runtime output is authoritative.
6. Group by `omg-adapter.engine`. Highest `priority` wins conflicts. Tie → alphabetical module name. Still tied → **hard error** (no silent pick).

### Discovery across scopes (H1 — global-only mode)

| Mode | Metadata read |
|------|---------------|
| Global-only | `~/.agents/metadata.json` |
| Project-only | `.agents/metadata.json` |
| Hybrid | Union of both; project-scope wins on name conflict |

`resolveCodexDir()` (from `telemetry-utils.cjs`) handles all scope resolution.

---

## Script Interfaces

**Common invocation semantics (all scripts):**
- **Invocation:** cwd = project root; stdin = empty; stderr = diagnostics only; stdout = per-interface below
- **Timeout:** 30 s default; override via `--timeout <sec>` flag on `omg diagram refresh`
- **Exit codes (general):** 0 = success; 1 = error (logged by orchestrator; capability marked failed)

### `detect.cjs`

**Exit codes:** 0 = this adapter matches the current project; 1 = no match (adapter skipped — not an error).
**stdout:** empty (ignored).

### `list-capabilities.cjs`

**Exit codes:** 0 = ok; 1 = error.
**stdout:** JSON array of capability strings ⊆ `['modules', 'classes', 'packages', 'c4', 'scenes', 'prefabs', 'routes', 'state']`.

### `generate.cjs` — two modes (both required)

**On-demand mode** (backwards-compatible, no args): stdout = Mermaid/DOT source.

**Refresh mode** (v1.0.0+):
```bash
node generate.cjs --type <capability> --out-dir <absPath>
```
Writes exactly ONE file inside `out-dir`. stdout = JSON: `{ "file": "<relPath>", "warnings": [], "capabilities_skipped": [] }`.
`file` MUST be a relative path. Absolute paths and `../` escapes are rejected by the orchestrator sandbox.

**Exit codes:** 0 = ok; 1 = error (capability marked failed; orchestrator continues to next type).

### `requirements.cjs`

**stdout:** JSON array of `{ tool: string, checkCommand: string, installHint: string }`.
Lists external tools the adapter needs; `omg diagram detect` surfaces the `installHint` strings when a tool is absent.
**Exit codes:** 0 = ok; 1 = error.

---

## `install.json` Schema

```jsonc
{
  "$schema": "https://the1studio.github.io/omg/adapter-install.schema.json",
  "contractVersion": "1.0.0",
  "engine": "unity",                     // must match SKILL.md omg-adapter.engine
  "requires": ["cs2mermaid"],
  "optionalTools": ["plantuml"],
  "prerequisites": [
    { "name": ".NET 8 SDK", "check": "dotnet --list-sdks", "minVersion": "8.0.0",
      "installHintUrl": "https://dotnet.microsoft.com/download/dotnet/8.0" }
  ],
  "installSteps": [
    {
      "target": "cs2mermaid",
      "method": "dotnet-tool",           // OPEN STRING — no closed enum
      "handler": "dotnet-tool",          // REQUIRED — names a core or kit handler
      "package": "Cs2Mermaid",
      "version": "0.6.0",               // REQUIRED — pinned semver; no 'latest'
      "sha256": "<optional hex>",        // recommended for binary downloads
      "verify": "cs2mmd --version",
      "uninstall": "dotnet tool uninstall -g Cs2Mermaid"
    },
    {
      // Kit ships its own handler for a method core has never heard of:
      "target": "godepgraph",
      "method": "go-install",
      "handlerPath": "install-handlers/go-install.cjs",  // relative to skill dir
      "package": "github.com/kisielk/godepgraph@v0.0.0-20200624014737-ca8d0fbec8bc",
      "version": "v0.0.0-20200624014737-ca8d0fbec8bc",
      "verify": "godepgraph -h"
    }
  ],
  "perProject": [{ "tool": "ts-morph", "hint": "npm i --save-dev ts-morph" }]
}
```

**Key invariants:** `version` is REQUIRED (no `latest`). `handler` is REQUIRED when `handlerPath` is absent.
For available built-in handler names, see `references/install-handlers.md`.

### Handler resolution order

1. `step.handler` names a core handler → use it; ignore `handlerPath`.
2. `step.handlerPath` set → resolve relative to skill directory; validate export shape.
3. Neither → hard error: `Step '${step.target}' references unknown handler '${step.handler}' and provides no handlerPath`.

---

## Pluggable Install Handler Interface

```js
module.exports = {
  async install(step, ctx) {},    // idempotent; throw on failure
  async uninstall(step, ctx) {},  // best-effort rollback; log errors, never swallow
  async verify(step, ctx) {},     // return true if installed + usable
  manifest() {}                   // return { handler: '<name>', version: '<semver>' }
};
```

`ctx`: `logger`, `tmpDir`, `sandbox.exec(cmd, args, opts)`, `abortSignal`.
All handler scripts MUST use `fs.readFileSync(0)`, `os.tmpdir()`, `path.join()`, `windowsHide: true`.

---

## Semver Rules on Contract Changes

| Change | Bump | Impact |
|--------|------|--------|
| Add optional capability / field / flag | minor | None (backwards-compatible) |
| New CI gate on downstream kits | minor | Fix within 2 releases |
| Rename script / remove required key / change stdout schema | major | 90-day deprecation window |

---

## Concurrency Model

All mutating diagram commands (`refresh`, `install`, `list --verify`) acquire the cross-command lock at
`~/.agents/.diagram.lock` before executing. This prevents interleaved state corruption (e.g., `omg diagram install`
modifying toolchain files while `omg diagram refresh` is mid-run).

**Adapter script requirements (idempotency):**
- `generate.cjs` MUST be safe to re-run. Running it twice with the same inputs must produce equivalent output.
- `detect.cjs` and `list-capabilities.cjs` are read-only by contract — no writes permitted.
- `requirements.cjs` is read-only by contract.

If an adapter's `generate.cjs` is not idempotent, concurrent refreshes from two terminals will produce
non-deterministic diffs. The lock prevents concurrency from two `omg` processes, but the idempotency
requirement guards against internal adapter bugs.

---

## Threat Model — Adapter Trust

Adapters are user-installed code with shell-exec privileges. Mitigations:
- Handler files loaded via absolute path from `resolveCodexDir()` — no `../` traversal.
- Refresh orchestrator enforces write sandbox: all writes resolve inside `outDir` after `fs.realpathSync`.
- `lstatSync` pre-write check rejects symlink targets.

Security invariant: adapter trust = trust level of the kit repo it ships in. Use only The1Studio-owned or audited adapters.
