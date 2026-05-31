# Oh My Game Kit

Codex-native game-development skills, Unity and Cocos workflows, and optional Codex agent templates.

The kit installs `omg-*` skills into Codex skill roots and merges a small managed instruction block into `AGENTS.md`. For Unity projects, it includes skills for editor workflows, MCP tool usage, testing, rendering, UI, DOTS, mobile, audio, and networking. For Cocos projects, it includes Cocos Creator and playable-ad workflows ported as `omg-cocos-*` skills.

## Requirements

- Node.js 20 or newer
- npm
- Codex Desktop or Codex CLI using local skill folders

## One-Line Install From GitHub

Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/tranvietanh0/oh-my-game-kit/release/scripts/install.ps1 | iex
```

macOS/Linux:

```sh
curl -fsSL https://raw.githubusercontent.com/tranvietanh0/oh-my-game-kit/release/scripts/install.sh | sh
```

The one-line installer asks which engine to install when `OMG_ENGINE` is not set:

- `Unity`: installs the `unity-production` preset.
- `Cocos`: installs the `cocos-playable` preset.
- `Both`: installs the `full` preset.

It installs globally, refreshes managed Oh My Game Kit files, installs skills into `~/.codex/skills`, and installs optional Codex agents into `~/.codex/agents`. The installer keeps one global skill root by default so Codex CLI does not waste its skill context budget on duplicate global skills.

For non-interactive installs, set `OMG_ENGINE`:

```powershell
$env:OMG_ENGINE = "all"; irm https://raw.githubusercontent.com/tranvietanh0/oh-my-game-kit/release/scripts/install.ps1 | iex
```

```sh
OMG_ENGINE=cocos curl -fsSL https://raw.githubusercontent.com/tranvietanh0/oh-my-game-kit/release/scripts/install.sh | sh
```

Engine values are `unity`, `cocos`, or `all`.

To install a smaller preset:

```powershell
$env:OMG_PRESET = "unity-minimal"; irm https://raw.githubusercontent.com/tranvietanh0/oh-my-game-kit/release/scripts/install.ps1 | iex
```

```sh
PRESET=unity-minimal curl -fsSL https://raw.githubusercontent.com/tranvietanh0/oh-my-game-kit/release/scripts/install.sh | sh
```

For Codex CLI, prefer a compact global preset and install engine-specific skills per project:

```sh
npx --yes github:tranvietanh0/oh-my-game-kit#release install --target global --fresh --preset core
```

Then, inside a Unity or Cocos project:

```sh
npx --yes github:tranvietanh0/oh-my-game-kit#release install --target project --engine unity
npx --yes github:tranvietanh0/oh-my-game-kit#release install --target project --engine cocos
```

If you need the old dual-root behavior for compatibility, add `--dual-roots` or set `OMG_DUAL_ROOTS=1`.

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
npx --yes github:tranvietanh0/oh-my-game-kit#release install --target global --fresh --preset core
```

Useful commands:

```sh
npx --yes github:tranvietanh0/oh-my-game-kit#release validate
npx --yes github:tranvietanh0/oh-my-game-kit#release doctor --target global
npx --yes github:tranvietanh0/oh-my-game-kit#release install --target project --engine cocos
npx --yes github:tranvietanh0/oh-my-game-kit#release uninstall --target global
```

Engine shortcuts:

```sh
npx --yes github:tranvietanh0/oh-my-game-kit#release install --target global --engine unity
npx --yes github:tranvietanh0/oh-my-game-kit#release install --target global --engine cocos
npx --yes github:tranvietanh0/oh-my-game-kit#release install --target global --engine all
npx --yes github:tranvietanh0/oh-my-game-kit#release install --target global --engine all --dual-roots
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
npx --yes @tranvietanh0/oh-my-game-kit install --target project --engine cocos
```

Or install it globally once:

```sh
npm install --global @tranvietanh0/oh-my-game-kit
omg-kit install --target global --fresh --preset core
omg-kit install --target global --engine cocos
omg-kit doctor --target global
```

### Publish a new package version

Publishing is handled by the `Publish GitHub Package` GitHub Actions workflow when the `release` branch is pushed, when a GitHub Release is published, or when the workflow is started manually.

Before publishing again, update `package.json` to a new version and create a matching release tag, for example `v0.1.1`. GitHub Packages will reject publishing the same package version twice.

## Local Development

```sh
git clone https://github.com/tranvietanh0/oh-my-game-kit.git
cd oh-my-game-kit
npm run check
node src/cli.js install --target global --fresh --preset core
node src/cli.js install --target global --fresh --engine cocos
node src/cli.js doctor --target global
```

## Presets

- `core`: base Codex workflows
- `core-maintainer`: core workflows plus maintainer skills
- `unity-minimal`: core plus Unity base/editor workflows
- `unity-production`: Unity base, editor, testing, UI, rendering, animation, audio, and mobile
- `unity-dots`: Unity base plus DOTS architecture, combat, navigation, AI, rendering, and testing
- `unity-full`: all Unity modules
- `cocos-minimal`: core plus Cocos script-graph workflow
- `cocos-playable`: Cocos Creator playable-ad workflows
- `cocos-full`: all Cocos modules
- `full`: all modules and all optional Codex agents

## Installed Locations

Global install:

- `~/.codex/skills/<skill>/SKILL.md`
- `~/.codex/agents/*.toml`
- `~/.codex/config.toml`
- `~/.codex/AGENTS.md`
- `~/.codex/.oh-my-game-kit/install-state.json`

Use `--dual-roots` to also install global skills into `~/.agents/skills`.

Project install:

- `.agents/skills/<skill>/SKILL.md`
- `.codex/agents/*.toml`
- `.codex/config.toml`
- `AGENTS.md`
- `.oh-my-game-kit/install-state.json`

Managed blocks are protected with Oh My Game Kit sentinels. User content outside those blocks is preserved.

## Release Workflow

`main` is for development and validation. `release` is the public install and package-publish branch. Exact versions are represented by git tags such as `v0.1.1`, not by per-version release branches.

Before publishing:

```sh
npm run check
npm pack --dry-run
```

Create a new version on `main`:

```sh
npm version patch
git push origin main --tags
```

Promote that version to `release`:

```sh
git checkout release
git merge main
git push origin release
```

Pushing `release` runs CI and publishes `@tranvietanh0/oh-my-game-kit` to GitHub Packages. If the version already exists, the publish workflow fails with a clear version-bump error.

Users can also pin an exact tag:

```sh
npx --yes github:tranvietanh0/oh-my-game-kit#v0.2.2 install --target global --fresh --engine all
```
