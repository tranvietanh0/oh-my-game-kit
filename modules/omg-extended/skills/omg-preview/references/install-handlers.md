---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Install Handlers

Catalog of install handlers used by `omg diagram install`. Handlers are `.cjs` modules
invoked by the CLI installer loop. Core ships built-in handlers; engine kits ship their own.

For how `install.json` references handlers and the handler interface contract, see
`references/adapter-contract.md` §"Pluggable Install Handler Interface".

---

## Built-in Handlers (core)

All built-in handlers: `oh-my-game-kit-cli/src/commands/diagram/install-handlers/`

| Handler name | Used for | Rollback |
|---|---|---|
| `npm-global` | `npm install -g <pkg>@<ver>` | `npm uninstall -g <pkg>` |
| `npm-project` | `npm install --save-dev <pkg>@<ver>` (per-project) | `npm uninstall <pkg>` |
| `dotnet-tool` | `dotnet tool install -g <pkg> --version <ver>` | `dotnet tool uninstall -g <pkg>` |
| `binary-download` | GH Releases binary → `~/.agents/tools/` | Delete binary |
| `jar-download` | Java JAR → `~/.agents/tools/` | Delete JAR |
| `package-manager` | Probe apt/dnf/pacman/zypper/brew/choco/winget | Package manager uninstall |
| `manual-hint` | No automated install — print instructions | No-op |

---

## Handler Interface

```js
module.exports = {
  async install(step, ctx) {},    // idempotent; throw on unrecoverable failure
  async uninstall(step, ctx) {},  // best-effort; log errors, never swallow
  async verify(step, ctx) {},     // return true if installed + usable
  manifest() {}                   // return { handler: '<name>', version: '<semver>' }
};
```

`ctx`: `logger`, `tmpDir`, `sandbox.exec(cmd, args, opts)`, `abortSignal`.

---

## Per-Handler Notes

### `npm-global` / `npm-project`

**Prerequisites:** Node.js + npm on PATH (`npm --version`).
- Prefer `npm-project` for per-project tools (`ts-morph`, `dependency-cruiser`, `tsuml2`) to avoid global namespace pollution.
- Windows: global installs go to `%APPDATA%\npm\node_modules`; PATH updated by npm installer.

### `dotnet-tool`

**Prerequisites:** .NET SDK >= 8.0.0 (`dotnet --list-sdks`).
- Linux/macOS: tools in `$HOME/.dotnet/tools/` — PATH must include this directory.
- Windows: tools in `%USERPROFILE%\.dotnet\tools\`.
- `version` is REQUIRED in `install.json` (no `latest`). NuGet hash verification is not exposed by `dotnet tool install` at time of writing — wire `step.sha256` when upstream adds it.

### `binary-download`

**Prerequisites:** Write access to `~/.agents/tools/`.
- When `step.sha256` is present: verify hash after download. Hard error on mismatch — never proceed with a corrupt binary.
- Windows: use `step.urlWindows` for `.exe` binary. Use `step.urlMacos` for macOS-specific archives.

### `jar-download`

**Prerequisites:** Java JRE >= 11 (`java -version`).
- SHA-256 check same as `binary-download`.

### `package-manager`

**Platform probe order:**
- Linux: `apt-get` → `dnf` → `pacman` → `zypper` → `manual-hint` fallback
- macOS: `brew` → `manual-hint` fallback
- Windows: `choco` → `winget` → `manual-hint` fallback

Note: `apt-get install -y` may require sudo; prompt user if not root. `choco install -y` requires Chocolatey and may need admin PowerShell.

---

## Prerequisite Check Table

| Handler | Check command | Min version | Hint on failure |
|---|---|---|---|
| `npm-global`, `npm-project` | `npm --version` | any | https://nodejs.org |
| `dotnet-tool` | `dotnet --list-sdks` | 8.0.0 | https://dotnet.microsoft.com/download/dotnet/8.0 |
| `jar-download` | `java -version` | 11 | https://adoptium.net |
| `binary-download` | write test on `~/.agents/tools/` | — | Check disk and permissions |

Prerequisite failures are hard errors. Print `installHintUrl` from `install.json` `prerequisites[]`.

---

## Kit-Shipped Handlers (pluggable)

When an adapter needs a method with no core handler, the kit ships its own:

1. Place `<handler>.cjs` inside the adapter skill directory.
2. Set `handlerPath` in `install.json` (relative to skill dir). Do NOT set `handler` to a core name.
3. Export the four required functions. CI gate `validate-install-json-schema.cjs` verifies this.

**Example: Nakama shipping `go-install.cjs`**

```js
// .agents/skills/nakama-service-graph/install-handlers/go-install.cjs
module.exports = {
  async install(step, ctx) {
    await ctx.sandbox.exec('go', ['install', step.package], { windowsHide: true });
  },
  async uninstall(step, ctx) {
    const bin = path.join(await goEnvGOPATH(), 'bin', step.target);
    if (fs.existsSync(bin)) fs.unlinkSync(bin);
  },
  async verify(step, ctx) {
    try { ctx.sandbox.exec(step.target, ['--help'], { windowsHide: true }); return true; }
    catch { return false; }
  },
  manifest() { return { handler: 'go-install', version: '1.0.0' }; }
};
```

No core release needed. The Nakama kit maintainer owns this handler independently.

---

## Atomicity and Rollback (honest language — H6)

OMG provides **best-effort rollback**, not atomic transactions:
- On install failure: OMG calls `uninstall`. If that also fails: log the error, inform the user, never swallow.
- Package manager state consistency is outside OMG's control.
- Binary downloads use temp-file + rename for crash safety.
- Concurrent installs are prevented by the cross-command lock (`~/.agents/.diagram.lock`).

This matches the "Errors Over Silent Fallbacks" principle from `development-principles.md`.
