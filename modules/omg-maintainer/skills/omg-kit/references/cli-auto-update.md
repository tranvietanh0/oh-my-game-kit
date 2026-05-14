---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# CLI Auto-Update

Oh My Game Kit CLI (`omg`) auto-updates itself in the background at session start.

## How It Works

`check-cli-updates.cjs` fires on `SessionStart` (after `check-kit-updates.cjs`):

1. Reads `cli.repo` and `cli.npmPackage` from any `omg-config-*.json` fragment
2. Locates the `omg` binary on PATH (`which` / `where`)
3. Parses `omg --version` → current semver
4. Queries `gh release view --repo <cli.repo>` → latest release tag
5. Compares versions:
   - **Equal or ahead** → silent exit, cache refreshed
   - **Major bump** (default behavior, `autoUpdateMajor: true`) → same auto-update path as minor/patch
   - **Major bump** (when `autoUpdateMajor: false`) → prints `[omg-cli-major]` notice; user must run `omg update` manually
   - **Minor / patch bump** → spawns a **detached** `omg update --yes --cli-only` (or `omg update --yes` on pre-2.5.0 CLIs) whose stdout/stderr stream to the rolling log with `NO_COLOR=1` / `FORCE_COLOR=0` / `TERM=dumb` for readable non-ANSI output; the current session keeps using the old binary, the new one activates on next session start

### --cli-only flag and version-gate

The `--cli-only` flag ships in oh-my-game-kit-cli ≥ 2.5.0. It suppresses the post-update kit content cascade (`promptKitUpdate`), which would otherwise re-init the global `~/.agents/` kit under `--yes`. The hook version-gates the flag:

- **CLI ≥ 2.5.0**: spawns `omg update --yes --cli-only` — CLI binary is upgraded, zero kit content side effects.
- **CLI < 2.5.0**: spawns `omg update --yes` (legacy) — the upgrade happens but the cascade may still fire once. The next session, now on 2.5.0+, will use `--cli-only` going forward.

This graceful degradation keeps users on old CLIs unblocked while delivering the fix automatically once they upgrade.

## Config

Declared in `omg-config-core.json`:

```json
{
  "cli": {
    "repo": "The1Studio/oh-my-game-kit-cli",
    "npmPackage": "@the1studio/oh-my-game-kit-cli"
  }
}
```

Kits do NOT need to declare this — core owns the CLI repo reference.

## Opt-Out

Shared with kit auto-update. Any `omg-config-*.json` can disable both:

```json
{ "features": { "autoUpdate": false } }
```

### Major-Only Opt-Out

To keep minor/patch auto-updates but require manual action for major bumps (e.g., to review breaking changes), set:

```json
{ "features": { "autoUpdateMajor": false } }
```

Default: `true` (majors are auto-applied just like minor/patch). When `false`, majors fall back to the legacy notify-only behavior with the `[omg-cli-major]` / `[omg-major-update]` tags. Applies to both CLI binary and kit content (flat and modular).

## Cache

- File: `~/.agents/.cli-update-check-cache`
- TTL: 24 hours
- Global scope — one check per user, not per project

## Log

- File: `~/.agents/.cli-update.log`
- Rolling, capped at ~100KB (keeps the last half when it overflows)
- Each run appends a timestamped header + full `omg update` output
- Inspect manually after a background update: `cat ~/.agents/.cli-update.log`

## Safeguards

| Guard | Behavior |
|---|---|
| **No `omg` on PATH** | Silent exit — user is likely running from source |
| **CWD git remote matches `cli.repo`** | Silent exit — never self-update the CLI from its own source tree |
| **Cache hit (< 24h)** | Silent exit |
| **`gh` not authenticated / network error** | Fail-open, cache refreshed, retry next day |
| **Spawn fails (EACCES, PATH error, etc.)** | Logged to `.cli-update.log`, session continues |
| **Any uncaught error** | Fail-open, exit 0 |

## Dry-Run (for debugging)

```bash
rm -f ~/.agents/.cli-update-check-cache
OMG_CLI_UPDATE_NOOP=1 node .agents/hooks/check-cli-updates.cjs
```

Emits the `[omg-cli-update]` tag and writes to the log, but does NOT spawn the real update. Useful for verifying version detection, gh lookup, and comparison logic without mutating the CLI install.

## What The AI Should Do When It Sees `[omg-cli-update]`

- Note the version bump for the user
- Do NOT run `omg update` — it is already running in the background
- Remind the user to restart their shell / session after the update log shows completion
- Suggest inspecting `~/.agents/.cli-update.log` if anything seems wrong on the next session

## What The AI Should Do When It Sees `[omg-cli-major]`

This tag only appears when `features.autoUpdateMajor: false` is set.

- Surface the notice to the user
- Offer to run `omg update` interactively so they can review release notes and any breaking changes
- Do NOT spawn a background update for major bumps when this tag is emitted — the opt-out is explicit

## What The AI Should Do When It Sees `[omg-major-update]` (kit content)

Emitted by `check-kit-updates.cjs` when a kit or module has a major bump AND `features.autoUpdateMajor: false`.

- Surface the notice to the user with kit/module name and version range
- Offer to run the suggested `gh release download` command
- If migrating from an old schema (e.g., registry v1→v2), also recommend running `omg-doctor fix` after the update

## Banner Accuracy — `[omg-update]` / `[omg-update-failed]`

Phase 02 of 260418-1942-omg-ecosystem-fixes split the generic auto-update banner into two distinct tags so log parsers can tell a real spawn from a failure by tag alone. **Never mix these tags.**

| Tag | When emitted | Meaning |
|---|---|---|
| `[omg-update]` | Spawn succeeded (`spawnT1kUpdateDetached` returned `spawned: true`) | Background `omg update --yes` is running; log at `~/.agents/.kit-update.log` |
| `[omg-update-failed]` | Spawn itself failed (EACCES, PATH error, etc.) **OR** the previous detached run's recorded exit code is non-zero within the 24h window | Either spawning the child did not succeed this session, or the PREVIOUS session's background update exited non-zero |

### Status File — `~/.agents/.kit-update.status`

Because detached children lose their exit code when the parent unrefs, `.agents/hooks/libomg-update-runner.cjs` wraps the real `omg` invocation and persists the outcome to a JSON file:

```json
{
  "exitCode": 0,
  "ts": "2026-04-19T00:00:00Z",
  "args": ["update", "--yes"],
  "filesChanged": [".agents/skillsomg-foo/SKILL.md"],
  "kits": ["oh-my-game-kit-unity"],
  "stderrTail": "last 2KB of child stderr"
}
```

Written atomically (tmp file + `fs.renameSync`) so concurrent reads never observe a partial write.

- `filesChanged[]` — `.agents/`-relative paths changed by the update (derived from `git diff --name-only HEAD` + `git ls-files --others --exclude-standard` scoped to `.agents/`). Phase 03's scope-safety gate consumes this as `expectedFiles`.
- `kits[]` — pre-update snapshot of installed kit repo short names. Used for commit-message formatting.
- `stderrTail` — last ~2KB of child stderr, surfaced verbatim in the PREV RUN FAILED banner.

On the NEXT SessionStart, `check-kit-updates.cjs` reads this file and — if the previous run FAILED and the status is <24h old — prints a PREV RUN FAILED banner before it decides whether to re-spawn. Successful runs produce no banner; stale (>24h) failures are ignored.

## Auto-Commit Of Kit Sync — `features.autoCommitKitSync` (opt-in)

Phase 03 of 260418-1942-omg-ecosystem-fixes added an opt-in flag that lets the session-start hook commit the `.agents/` changes produced by the auto-update pipeline for you. Default is **OFF** — behavior is unchanged unless the user flips the flag.

```json
{ "features": { "autoCommitKitSync": true } }
```

### Behavior when enabled

| Path | Trigger | Source of file list | Commit message |
|---|---|---|---|
| Manual fallback (CLI binary not on PATH) | Extraction lands in cwd; helper runs before the hook exits | `git status --porcelain -uall` (no expectedFiles) | `chore(omg): sync <kit1>,<kit2> kit modules` (kits from `repoMap`) |
| CLI-spawned | Next SessionStart reads `~/.agents/.kit-update.status`; if `exitCode === 0` AND `filesChanged[]` non-empty, helper runs with `expectedFiles = status.filesChanged` | `.kit-update.status.filesChanged[]` | `chore(omg): sync <kit1>,<kit2> kit modules` (kits from `status.kits`) |

The helper always aborts when:
- The working tree has **non-`.agents/`** changes (scope-safety skip + warn)
- Any staged `.agents/` file is NOT in `expectedFiles` (scope-safety abort when the update-runner's file list is available)
- The repo is mid-merge / mid-rebase
- No `.agents/` paths are dirty

The helper never pushes. It only creates a single local commit.

### `--no-verify --no-gpg-sign` exception (documented)

The auto-commit path runs inside a **TTY-less detached hook**, where Pinentry / GPG-SSH prompts would hang forever. For this ONE call site only we pass `--no-verify --no-gpg-sign` to `git commit`. This is the sole documented exception to the no-skip-hooks rule — every other commit path in Oh My Game Kit retains hooks and signing.

### Debug

- `OMG_DEBUG_AUTOCOMMIT=1` — logs each gate + reason to stderr (e.g. `flag-off`, `no-changes`, `mid-merge`, `non-codex-dirty`, `unexpected-files`, `committed`).

## What The AI Should Do When It Sees `[omg-update-failed]`

1. Note the failure visibly to the user with the reported reason.
2. Offer to inspect `~/.agents/.kit-update.log` for the detailed trace.
3. If the tail mentions a missing flag or preset, suggest running `omg update` interactively so the user can pick the right module selection.
4. Do NOT silently re-spawn in the foreground — the next session will try again automatically, and running concurrent updates risks a lock held by the peer process.
