# Oh My Game Kit

Codex-native game-development skills, Unity workflows, and optional Codex agent templates.

The kit installs `omg-*` skills into Codex skill roots and merges a small managed instruction block into `AGENTS.md`. For Unity projects, it includes skills for editor workflows, MCP tool usage, testing, rendering, UI, DOTS, mobile, audio, and networking.

## Requirements

- Node.js 20 or newer
- npm
- Codex Desktop or Codex CLI using local skill folders

## One-Line Install From GitHub

Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/tranvietanh0/oh-my-game-kit/main/scripts/install.ps1 | iex
```

macOS/Linux:

```sh
curl -fsSL https://raw.githubusercontent.com/tranvietanh0/oh-my-game-kit/main/scripts/install.sh | sh
```

By default this installs the `full` preset globally, refreshes managed Oh My Game Kit files, installs skills into both `~/.agents/skills` and `~/.codex/skills`, and installs optional Codex agents into `~/.codex/agents`.

To install a smaller preset:

```powershell
$env:OMG_PRESET = "unity-minimal"; irm https://raw.githubusercontent.com/tranvietanh0/oh-my-game-kit/main/scripts/install.ps1 | iex
```

```sh
PRESET=unity-minimal curl -fsSL https://raw.githubusercontent.com/tranvietanh0/oh-my-game-kit/main/scripts/install.sh | sh
```

To install from another branch or fork:

```powershell
$env:OMG_REPO = "YourOrg/oh-my-game-kit"; $env:OMG_REF = "feature-branch"; irm https://raw.githubusercontent.com/YourOrg/oh-my-game-kit/feature-branch/scripts/install.ps1 | iex
```

```sh
OMG_REPO=YourOrg/oh-my-game-kit OMG_REF=feature-branch curl -fsSL https://raw.githubusercontent.com/YourOrg/oh-my-game-kit/feature-branch/scripts/install.sh | sh
```

## Direct GitHub Package Usage

You can run the CLI directly from GitHub with `npx`:

```sh
npx --yes github:tranvietanh0/oh-my-game-kit install --target global --fresh --preset full
```

Useful commands:

```sh
npx --yes github:tranvietanh0/oh-my-game-kit validate
npx --yes github:tranvietanh0/oh-my-game-kit doctor --target global
npx --yes github:tranvietanh0/oh-my-game-kit install --target project --preset unity-minimal
npx --yes github:tranvietanh0/oh-my-game-kit uninstall --target global
```

## GitHub Packages Usage

Releases publish the scoped npm package `@tranvietanh0/oh-my-game-kit` to GitHub Packages.

### Install as a user

Configure npm to resolve the `@tranvietanh0` scope from GitHub Packages:

```sh
npm config set @tranvietanh0:registry https://npm.pkg.github.com
```

If the package or repository is private, create a GitHub personal access token with `read:packages`, then log in:

```sh
npm login --scope=@tranvietanh0 --registry=https://npm.pkg.github.com
```

Use your GitHub username as the username and the token as the password. Public packages may not require this login step.

Run the CLI without installing globally:

```sh
npx --yes @tranvietanh0/oh-my-game-kit validate
npx --yes @tranvietanh0/oh-my-game-kit doctor --target global
npx --yes @tranvietanh0/oh-my-game-kit install --target project --preset unity-minimal
```

Or install it globally once:

```sh
npm install --global @tranvietanh0/oh-my-game-kit
omg-kit install --target global --fresh --preset full
omg-kit doctor --target global
```

### Publish a new package version

Publishing is handled by the `Publish GitHub Package` GitHub Actions workflow when a GitHub Release is published, and can also be started manually from GitHub Actions.

Before publishing again, update `package.json` to a new version and create a matching release tag, for example `v0.1.1`.

## Local Development

```sh
git clone https://github.com/tranvietanh0/oh-my-game-kit.git
cd oh-my-game-kit
npm run check
node src/cli.js install --target global --fresh --preset full
node src/cli.js doctor --target global
```

## Presets

- `core`: base Codex workflows
- `core-maintainer`: core workflows plus maintainer skills
- `unity-minimal`: core plus Unity base/editor workflows
- `unity-production`: Unity base, editor, testing, UI, rendering, animation, audio, and mobile
- `unity-dots`: Unity base plus DOTS architecture, combat, navigation, AI, rendering, and testing
- `unity-full`: all Unity modules
- `full`: all modules and all optional Codex agents

## Installed Locations

Global install:

- `~/.agents/skills/<skill>/SKILL.md`
- `~/.codex/skills/<skill>/SKILL.md`
- `~/.codex/agents/*.toml`
- `~/.codex/config.toml`
- `~/.codex/AGENTS.md`
- `~/.codex/.oh-my-game-kit/install-state.json`

Project install:

- `.agents/skills/<skill>/SKILL.md`
- `.codex/agents/*.toml`
- `.codex/config.toml`
- `AGENTS.md`
- `.oh-my-game-kit/install-state.json`

Managed blocks are protected with Oh My Game Kit sentinels. User content outside those blocks is preserved.

## Release Checklist

Before pushing a release tag:

```sh
npm run check
npm pack --dry-run
```

Then create and push a tag:

```sh
git tag v0.1.0
git push origin main --tags
```

Users can pin the tag:

```sh
npx --yes github:tranvietanh0/oh-my-game-kit#v0.1.0 install --target global --fresh --preset full
```
