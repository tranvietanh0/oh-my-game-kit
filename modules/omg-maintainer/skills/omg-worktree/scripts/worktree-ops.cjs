#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-maintainer | protected=true
/**
 * Git Worktree Operations - Extended commands for worktree management
 * Commands: session, sync, envsync, diff, status
 *
 * Usage: node worktree-ops.cjs <command> [options]
 *   session <name-or-path>           Generate session command for a worktree
 *   sync [--worktree <name>]         Rebase worktrees from base branch
 *   envsync [--source <path>] [--exclude <name>] Sync .env files across worktrees
 *   diff [--worktree <name>]         Show diff status per worktree
 *   status                           Combined overview of all worktrees
 *
 * Global options:
 *   --json       JSON output for LLM consumption
 *   --dry-run    Preview without executing (envsync, sync)
 *   --exclude    Skip a worktree during envsync (repeatable, or comma-separated).
 *                Matches the same way as --worktree: dir name, full path, or branch.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);

// Extract flags before command parsing
function extractFlag(name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  args.splice(idx, 1);
  return true;
}
function extractFlagValue(name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const val = args[idx + 1];
  args.splice(idx, 2);
  return val;
}
// Extract every occurrence of a repeatable flag. Also splits comma-separated values,
// so `--exclude a,b --exclude c` yields ['a','b','c'].
function extractFlagValues(name) {
  const out = [];
  let v;
  while ((v = extractFlagValue(name)) !== null) {
    v.split(',').map(s => s.trim()).filter(Boolean).forEach(s => out.push(s));
  }
  return out;
}

const jsonOutput = !!extractFlag('--json');
const dryRun = !!extractFlag('--dry-run');
const filterWorktree = extractFlagValue('--worktree');
const sourceOverride = extractFlagValue('--source');
const oneWayOnly = !!extractFlag('--one-way'); // Only master→worktrees, skip reverse
const excludePatterns = extractFlagValues('--exclude'); // envsync: skip these worktrees

const command = args[0];
const arg1 = args[1];

// --- Shared helpers ---

function output(data) {
  if (jsonOutput) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    prettyPrint(data);
  }
}

function outputError(code, message, details = {}) {
  if (jsonOutput) {
    console.log(JSON.stringify({ success: false, error: { code, message, ...details } }, null, 2));
  } else {
    console.error(`\n❌ [${code}]: ${message}`);
    if (details.suggestion) console.error(`   💡 ${details.suggestion}`);
  }
  process.exit(1);
}

function git(cmd, options = {}) {
  try {
    const result = execSync(`git ${cmd}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: options.cwd || process.cwd()
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr?.toString().trim() || '',
      code: error.status
    };
  }
}

function checkGitRepo() {
  const result = git('rev-parse --show-toplevel');
  if (!result.success) outputError('NOT_GIT_REPO', 'Not in a git repository');
  return result.output;
}

function detectBaseBranch(cwd) {
  for (const branch of ['dev', 'develop', 'main', 'master']) {
    if (git(`show-ref --verify --quiet refs/heads/${branch}`, { cwd }).success) return branch;
    if (git(`show-ref --verify --quiet refs/remotes/origin/${branch}`, { cwd }).success) return branch;
  }
  return 'main';
}

// Parse porcelain worktree list into structured data
function parseWorktrees(cwd) {
  const result = git('worktree list --porcelain', { cwd });
  if (!result.success) return [];

  const worktrees = [];
  let current = {};
  result.output.split('\n').forEach(line => {
    if (line.startsWith('worktree ')) {
      if (current.path) worktrees.push(current);
      current = { path: line.replace('worktree ', '') };
    } else if (line.startsWith('branch ')) {
      current.branch = line.replace('branch refs/heads/', '');
    } else if (line === 'bare') {
      current.bare = true;
    }
  });
  if (current.path) worktrees.push(current);
  return worktrees;
}

// Find the main worktree (first one, which is the original checkout)
function getMainWorktree(worktrees) {
  return worktrees[0] || null;
}

// Get non-main worktrees (all except first)
function getSecondaryWorktrees(worktrees) {
  return worktrees.slice(1);
}

// Find worktree by name, path, or branch (fuzzy match)
function findWorktree(worktrees, query) {
  if (!query) return null;
  const q = query.toLowerCase();
  return worktrees.find(w => {
    const name = path.basename(w.path).toLowerCase();
    const fullPath = w.path.toLowerCase();
    const branch = (w.branch || '').toLowerCase();
    return name === q || fullPath === q || branch === q
      || name.includes(q) || branch.includes(q);
  });
}

// Get ahead/behind counts relative to base branch
function getAheadBehind(worktreePath, baseBranch) {
  const branch = git('rev-parse --abbrev-ref HEAD', { cwd: worktreePath });
  if (!branch.success) return { ahead: 0, behind: 0, branch: 'unknown' };

  const revList = git(`rev-list --left-right --count ${baseBranch}...HEAD`, { cwd: worktreePath });
  if (!revList.success) return { ahead: 0, behind: 0, branch: branch.output };

  const [behind, ahead] = revList.output.split('\t').map(Number);
  return { ahead: ahead || 0, behind: behind || 0, branch: branch.output };
}

// Get dirty state for a specific worktree path
function getDirtyState(cwd) {
  const status = git('status --porcelain', { cwd });
  if (!status.success) return { dirty: false, details: null };
  const lines = status.output.split('\n').filter(Boolean);
  if (lines.length === 0) return { dirty: false, details: { modified: 0, staged: 0, untracked: 0, total: 0 } };
  return {
    dirty: true,
    details: {
      modified: lines.filter(l => l.startsWith(' M') || l.startsWith('M ')).length,
      staged: lines.filter(l => l.startsWith('A ') || l.startsWith('M ') || l.startsWith('D ')).length,
      untracked: lines.filter(l => l.startsWith('??')).length,
      total: lines.length
    }
  };
}

// Find .env files in a directory (non-recursive, non-symlink)
function findEnvFiles(dir) {
  try {
    return fs.readdirSync(dir).filter(f => {
      if (!f.startsWith('.env')) return false;
      if (f.endsWith('.example')) return false;
      const stat = fs.statSync(path.join(dir, f));
      return stat.isFile() && !stat.isSymbolicLink();
    });
  } catch { return []; }
}

// Compare two files by content hash
function filesMatch(file1, file2) {
  try {
    const c1 = fs.readFileSync(file1);
    const c2 = fs.readFileSync(file2);
    return c1.equals(c2);
  } catch { return false; }
}

// --- Compose env-drift detection ---
// Find docker-compose*.yml files at repo root (non-recursive).
function findComposeFiles(dir) {
  try {
    return fs.readdirSync(dir).filter(f => /^docker-compose.*\.ya?ml$/.test(f));
  } catch { return []; }
}

// Parse a docker-compose YAML file and extract env keys per service.
// Returns Map<serviceName, Set<envKey>>. Regex-based (no YAML dependency) —
// good enough for the common list-form `- KEY=value` / `- KEY` and the
// map-form `KEY: value`. Unparseable files silently skip the affected block.
function parseComposeEnvKeys(filePath) {
  const result = new Map();
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); } catch { return result; }

  const lines = content.split('\n');
  let inServices = false;
  let servicesIndent = -1;
  let currentService = null;
  let currentServiceIndent = -1;
  let inEnvBlock = false;
  let envBlockIndent = -1;
  let envBlockStyle = null; // 'list' or 'map'

  const getIndent = (line) => line.length - line.trimStart().length;

  for (const rawLine of lines) {
    // Drop inline comments but keep string values; strip trailing CR
    const line = rawLine.replace(/\r$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = getIndent(line);
    const trimmed = line.trim();

    // Track top-level `services:` block
    if (!inServices) {
      if (/^services:\s*$/.test(trimmed) && indent === 0) {
        inServices = true;
        servicesIndent = 0;
      }
      continue;
    }
    // Leaving services section (next top-level key)
    if (indent <= servicesIndent && trimmed.endsWith(':') && !trimmed.startsWith('-')) {
      if (indent === 0 && !/^services:\s*$/.test(trimmed)) {
        inServices = false;
        currentService = null;
        inEnvBlock = false;
        continue;
      }
    }

    // New service definition (one indent deeper than `services:`)
    const serviceMatch = trimmed.match(/^([a-zA-Z0-9_-]+):\s*$/);
    if (serviceMatch && indent > servicesIndent && (currentServiceIndent === -1 || indent <= currentServiceIndent)) {
      currentService = serviceMatch[1];
      currentServiceIndent = indent;
      inEnvBlock = false;
      if (!result.has(currentService)) result.set(currentService, new Set());
      continue;
    }

    if (!currentService) continue;

    // Enter environment block
    if (!inEnvBlock) {
      if (/^environment:\s*$/.test(trimmed) && indent > currentServiceIndent) {
        inEnvBlock = true;
        envBlockIndent = indent;
        envBlockStyle = null; // detect on first key
        continue;
      }
      continue;
    }

    // Inside environment block
    if (indent <= envBlockIndent) {
      inEnvBlock = false;
      envBlockStyle = null;
      // Re-process this line as it may be another block
      if (serviceMatch && indent > servicesIndent) {
        currentService = serviceMatch[1];
        currentServiceIndent = indent;
        if (!result.has(currentService)) result.set(currentService, new Set());
      }
      continue;
    }

    // Detect style and extract key
    if (envBlockStyle === null) {
      envBlockStyle = trimmed.startsWith('-') ? 'list' : 'map';
    }

    let key = null;
    if (envBlockStyle === 'list') {
      // `- KEY=value` or `- KEY`
      const m = trimmed.match(/^-\s*([A-Za-z_][A-Za-z0-9_]*)(?:\s*[:=]|\s*$)/);
      if (m) key = m[1];
    } else {
      // `KEY: value`
      const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:/);
      if (m) key = m[1];
    }
    if (key) result.get(currentService).add(key);
  }

  return result;
}

// Collect env keys across all compose files in a worktree, keyed by service.
// If the same service appears in multiple compose files, keys are merged.
function collectWorktreeComposeEnv(worktreeDir) {
  const merged = new Map();
  for (const file of findComposeFiles(worktreeDir)) {
    const perService = parseComposeEnvKeys(path.join(worktreeDir, file));
    for (const [svc, keys] of perService) {
      if (!merged.has(svc)) merged.set(svc, new Set());
      keys.forEach(k => merged.get(svc).add(k));
    }
  }
  return merged;
}

// Compare compose env blocks across all worktrees (including master).
// Reports per-service drift: which worktrees are missing keys that others have.
// Non-destructive — warn only.
function detectComposeEnvDrift(mainDir, secondaryWorktrees) {
  const labeled = [
    { label: 'master', path: mainDir, env: collectWorktreeComposeEnv(mainDir) }
  ];
  for (const wt of secondaryWorktrees) {
    if (!fs.existsSync(wt.path)) continue;
    labeled.push({
      label: wt.branch || path.basename(wt.path),
      path: wt.path,
      env: collectWorktreeComposeEnv(wt.path)
    });
  }

  // Union of all services seen anywhere
  const allServices = new Set();
  for (const l of labeled) for (const svc of l.env.keys()) allServices.add(svc);

  const drifts = [];
  for (const svc of allServices) {
    // Union of keys across all worktrees for this service
    const union = new Set();
    for (const l of labeled) {
      const keys = l.env.get(svc);
      if (keys) keys.forEach(k => union.add(k));
    }
    // Per-worktree missing keys
    const missing = {};
    let hasDrift = false;
    for (const l of labeled) {
      const keys = l.env.get(svc) || new Set();
      const lost = [...union].filter(k => !keys.has(k));
      if (lost.length > 0) {
        missing[l.label] = lost;
        hasDrift = true;
      }
    }
    if (hasDrift) {
      drifts.push({ service: svc, unionKeys: [...union].sort(), missing });
    }
  }

  return {
    servicesChecked: allServices.size,
    driftedServices: drifts.length,
    drifts
  };
}

// --- Pretty print helper ---

function prettyPrint(data) {
  if (data.command === 'session') {
    console.log(`\n🖥️  Worktree Session`);
    console.log(`   Path:    ${data.worktreePath}`);
    console.log(`   Branch:  ${data.branch}`);
    console.log(`\n📋 Run this to start a Codex session:`);
    console.log(`   cd ${data.worktreePath} && codex`);
  } else if (data.command === 'sync') {
    console.log(`\n🔄 Sync Report`);
    console.log(`   Base branch: ${data.baseBranch}`);
    (data.results || []).forEach(r => {
      const icon = r.status === 'success' ? '✅' : r.status === 'conflict' ? '⚠️' : '⏭️';
      console.log(`\n   ${icon} ${path.basename(r.path)} (${r.branch})`);
      console.log(`      Status: ${r.status}`);
      if (r.ahead !== undefined) console.log(`      Ahead: ${r.ahead} | Behind: ${r.behind}`);
      if (r.message) console.log(`      Note: ${r.message}`);
    });
  } else if (data.command === 'envsync') {
    console.log(`\n📄 Env Sync Report`);
    console.log(`   Source: ${data.mainWorktree || data.source || '(unknown)'}`);
    console.log(`   Files: ${(data.envFiles || data.sourceFiles || []).join(', ')}`);
    (data.results || []).forEach(r => {
      console.log(`\n   📂 ${path.basename(r.worktree)}`);
      (r.files || []).forEach(f => {
        const icon = f.action === 'copied' ? '✅' : f.action === 'skipped' ? '⏭️' : '📝';
        console.log(`      ${icon} ${f.name}: ${f.action}${f.reason ? ` (${f.reason})` : ''}`);
      });
    });
    // Compose env-drift warnings (non-blocking)
    const drift = data.composeEnvDrift;
    if (drift && drift.driftedServices > 0) {
      console.log(`\n⚠️  Compose env drift detected (${drift.driftedServices} service${drift.driftedServices === 1 ? '' : 's'}):`);
      console.log(`    Docker \`environment:\` blocks differ across worktrees. Keys missing`);
      console.log(`    from a worktree will silently drop when that container is recreated.`);
      drift.drifts.forEach(d => {
        console.log(`\n    Service: ${d.service}`);
        for (const [wt, keys] of Object.entries(d.missing)) {
          console.log(`      ${wt} missing: ${keys.join(', ')}`);
        }
      });
      console.log(`\n    Fix: add the missing keys to the lacking worktree's compose file,`);
      console.log(`    or remove them from the worktree that has them if intentional.`);
    } else if (drift && drift.servicesChecked > 0) {
      console.log(`\n✅ Compose env blocks consistent across ${drift.servicesChecked} service${drift.servicesChecked === 1 ? '' : 's'}.`);
    }
  } else if (data.command === 'diff') {
    console.log(`\n📊 Diff Report`);
    (data.results || []).forEach(r => {
      console.log(`\n   📂 ${path.basename(r.path)} (${r.branch})`);
      console.log(`      Ahead: ${r.ahead} | Behind: ${r.behind}`);
      console.log(`      Changed files: ${r.changedFiles}`);
      if (r.dirty) console.log(`      ⚠️  Uncommitted changes: ${r.dirtyDetails.total}`);
      if (r.files && r.files.length > 0) {
        r.files.slice(0, 15).forEach(f => console.log(`      - ${f}`));
        if (r.files.length > 15) console.log(`      ... and ${r.files.length - 15} more`);
      }
    });
  } else if (data.command === 'status') {
    console.log(`\n📋 Worktree Status Overview`);
    console.log(`   Base branch: ${data.baseBranch}`);
    console.log(`   Total worktrees: ${data.total}`);
    (data.worktrees || []).forEach(w => {
      const dirtyIcon = w.dirty ? '🔴' : '🟢';
      const syncIcon = w.envSynced ? '✅' : '⚠️';
      console.log(`\n   ${dirtyIcon} ${path.basename(w.path)} [${w.branch}]`);
      console.log(`      Ahead: ${w.ahead} | Behind: ${w.behind}`);
      if (w.dirty) console.log(`      Dirty: ${w.dirtyDetails.modified}M ${w.dirtyDetails.staged}S ${w.dirtyDetails.untracked}U`);
      console.log(`      Env sync: ${syncIcon}${w.envMissing.length > 0 ? ` missing: ${w.envMissing.join(', ')}` : ''}`);
    });
  } else {
    // Fallback
    console.log(JSON.stringify(data, null, 2));
  }
}

// --- Terminal detection & launch helpers ---

// Check if a command exists on PATH
function commandExists(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'pipe', encoding: 'utf-8' });
    return true;
  } catch { return false; }
}

// Detect best available terminal environment
// Priority: kitty > wezterm > alacritty > gnome-terminal > konsole > Terminal.app > wt > tmux (last resort)
// Kitty/GUI terminals preferred because they provide proper interactive TTY for codex.
// tmux new-window from a non-interactive context often lacks proper TTY, causing codex to fail.
function detectTerminal() {
  const platform = process.platform;
  const inTmux = !!process.env.TMUX;
  const term = (process.env.TERM || '').toLowerCase();
  const termProgram = (process.env.TERM_PROGRAM || '').toLowerCase();

  // Kitty first — best for interactive CLI apps, supports --detach for proper TTY
  if (term.includes('kitty') || termProgram === 'kitty' || commandExists('kitty')) {
    return { type: 'kitty', name: 'kitty' };
  }

  // WezTerm
  if (termProgram === 'wezterm' || commandExists('wezterm')) {
    return { type: 'wezterm', name: 'wezterm' };
  }

  // Platform-specific fallbacks
  if (platform === 'darwin') {
    // macOS: iTerm2 > Terminal.app
    if (termProgram === 'iterm2' || termProgram === 'iterm2.app') return { type: 'iterm2', name: 'iTerm2' };
    return { type: 'macos-terminal', name: 'Terminal.app' };
  }

  if (platform === 'win32') {
    // Windows Terminal
    if (process.env.WT_SESSION || commandExists('wt')) return { type: 'windows-terminal', name: 'Windows Terminal' };
    return { type: 'cmd', name: 'cmd.exe' };
  }

  // Linux fallbacks
  if (commandExists('alacritty')) return { type: 'alacritty', name: 'alacritty' };
  if (commandExists('gnome-terminal')) return { type: 'gnome-terminal', name: 'gnome-terminal' };
  if (commandExists('konsole')) return { type: 'konsole', name: 'konsole' };
  if (commandExists('xterm')) return { type: 'xterm', name: 'xterm' };

  // tmux as last resort — needs special handling for interactive TTY
  if (inTmux) return { type: 'tmux', name: 'tmux' };

  return { type: 'unknown', name: 'unknown' };
}

// Build the shell command to launch Codex in a new terminal window/tab
function buildLaunchCommand(terminal, worktreePath, codexCmd, title) {
  // Shell command that cd's and runs codex
  const innerCmd = `cd "${worktreePath}" && ${codexCmd}`;
  // Wrap in shell for terminals that need it
  // Use user's default shell (zsh/bash) so shell hooks (precmd, window title) load properly
  const userShell = process.env.SHELL || '/bin/bash';
  const shellName = path.basename(userShell);
  const shellCmd = `${userShell} -c '${innerCmd}'`;

  switch (terminal.type) {
    case 'tmux':
      // tmux new-window — no -n flag so dynamic title rules apply
      return `tmux new-window "${shellCmd}"`;

    case 'kitty':
      // kitty --detach opens new OS window with proper interactive TTY
      // Launch codex-yolo in left pane, lazygit in right pane (same directory)
      // Uses kitty launch with splits for side-by-side layout
      return `kitty --detach --directory "${worktreePath}" ${userShell} -il -c '` +
        `kitty @ launch --type=window --location=vsplit --cwd="${worktreePath}" ${userShell} -il -c "lazygit; exec ${userShell} -il" 2>/dev/null; ` +
        `codex-yolo; exec ${userShell} -il'`;

    case 'wezterm':
      return `wezterm cli spawn --new-window --cwd "${worktreePath}" -- ${codexCmd}`;

    case 'alacritty':
      return `alacritty --title "${title}" --working-directory "${worktreePath}" -e ${codexCmd} &`;

    case 'gnome-terminal':
      return `gnome-terminal --title="${title}" --working-directory="${worktreePath}" -- ${codexCmd} &`;

    case 'konsole':
      return `konsole --workdir "${worktreePath}" -e ${codexCmd} &`;

    case 'iterm2':
      // AppleScript for iTerm2
      return `osascript -e 'tell application "iTerm2" to create window with default profile command "${innerCmd}"'`;

    case 'macos-terminal':
      return `osascript -e 'tell application "Terminal" to do script "${innerCmd}"'`;

    case 'windows-terminal':
      return `wt new-tab --title "${title}" -d "${worktreePath}" cmd /c ${codexCmd}`;

    case 'xterm':
      return `xterm -title "${title}" -e bash -c '${innerCmd}' &`;

    default:
      return null; // Cannot auto-launch
  }
}

// --- COMMANDS ---

function cmdSession() {
  const gitRoot = checkGitRepo();
  const worktrees = parseWorktrees(gitRoot);

  if (!arg1) {
    outputError('MISSING_ARG', 'Worktree name or path required', {
      suggestion: 'Usage: node worktree-ops.cjs session <name-or-path>'
    });
  }

  const target = findWorktree(worktrees, arg1);
  if (!target) {
    outputError('WORKTREE_NOT_FOUND', `No worktree matching "${arg1}"`, {
      suggestion: 'Available: ' + worktrees.map(w => path.basename(w.path)).join(', ')
    });
  }

  if (!fs.existsSync(target.path)) {
    outputError('PATH_NOT_FOUND', `Worktree path does not exist: ${target.path}`);
  }

  // Prefer codex --dangerously-skip-permissions (what codex-yolo does), fallback to codex
  const codexCmd = commandExists('codex') ? 'codex --dangerously-skip-permissions' : 'codex';
  const terminal = detectTerminal();
  const title = `codex:${path.basename(target.path)}`;
  const launchCmd = buildLaunchCommand(terminal, target.path, codexCmd, title);

  // Attempt to launch if not dry-run and we have a launch command
  let launched = false;
  let launchError = null;
  if (launchCmd && !dryRun) {
    try {
      execSync(launchCmd, { stdio: 'pipe', timeout: 5000 });
      launched = true;
    } catch (err) {
      launchError = err.stderr?.toString().trim() || err.message;
    }
  }

  output({
    success: true,
    command: 'session',
    worktreePath: target.path,
    branch: target.branch || 'detached',
    codexCommand: codexCmd,
    terminal: terminal.name,
    terminalType: terminal.type,
    launched,
    launchCommand: launchCmd,
    launchError,
    sessionCommand: `cd "${target.path}" && ${codexCmd}`
  });
}

function cmdSync() {
  const gitRoot = checkGitRepo();
  const baseBranch = detectBaseBranch(gitRoot);
  const worktrees = parseWorktrees(gitRoot);
  const secondary = getSecondaryWorktrees(worktrees);

  if (secondary.length === 0) {
    outputError('NO_WORKTREES', 'No secondary worktrees to sync');
  }

  // Fetch latest from remote first
  git('fetch origin', { cwd: gitRoot });

  const targets = filterWorktree
    ? secondary.filter(w => findWorktree([w], filterWorktree))
    : secondary;

  if (targets.length === 0) {
    outputError('WORKTREE_NOT_FOUND', `No worktree matching "${filterWorktree}"`);
  }

  const results = targets.map(wt => {
    const name = path.basename(wt.path);

    // Check if path exists
    if (!fs.existsSync(wt.path)) {
      return { path: wt.path, branch: wt.branch, status: 'skipped', message: 'path not found' };
    }

    // Get ahead/behind before sync
    const before = getAheadBehind(wt.path, baseBranch);

    // Check dirty state - skip if dirty
    const dirtyState = getDirtyState(wt.path);
    if (dirtyState.dirty) {
      return {
        path: wt.path, branch: wt.branch || before.branch,
        status: 'skipped', message: `uncommitted changes (${dirtyState.details.total} files)`,
        ahead: before.ahead, behind: before.behind
      };
    }

    if (dryRun) {
      return {
        path: wt.path, branch: wt.branch || before.branch,
        status: 'dry-run', message: `would rebase onto ${baseBranch}`,
        ahead: before.ahead, behind: before.behind
      };
    }

    // Perform rebase
    const rebaseResult = git(`rebase ${baseBranch}`, { cwd: wt.path });
    if (!rebaseResult.success) {
      // Abort failed rebase
      git('rebase --abort', { cwd: wt.path });
      return {
        path: wt.path, branch: wt.branch || before.branch,
        status: 'conflict', message: rebaseResult.stderr || 'rebase conflict',
        ahead: before.ahead, behind: before.behind
      };
    }

    // Get ahead/behind after sync
    const after = getAheadBehind(wt.path, baseBranch);
    return {
      path: wt.path, branch: wt.branch || after.branch,
      status: 'success', message: `rebased onto ${baseBranch}`,
      ahead: after.ahead, behind: after.behind,
      commitsBefore: before.behind, commitsAfter: after.behind
    };
  });

  output({
    success: true,
    command: 'sync',
    baseBranch,
    dryRun,
    results,
    summary: {
      total: results.length,
      synced: results.filter(r => r.status === 'success').length,
      conflicts: results.filter(r => r.status === 'conflict').length,
      skipped: results.filter(r => r.status === 'skipped' || r.status === 'dry-run').length
    }
  });
}

// Get file mtime in ms
function getFileMtime(filePath) {
  try { return fs.statSync(filePath).mtimeMs; } catch { return 0; }
}

function cmdEnvSync() {
  const gitRoot = checkGitRepo();
  const worktrees = parseWorktrees(gitRoot);
  const mainWt = getMainWorktree(worktrees);
  const allSecondary = getSecondaryWorktrees(worktrees);

  // Apply --exclude filter. Excluded worktrees are fully skipped — we neither
  // read their .env files into the "newest wins" comparison nor write to them.
  // This protects intentionally-divergent worktrees (e.g. a dev-only env dump
  // with empty secret stubs) from clobbering the canonical master .env.
  const excluded = [];
  const secondary = allSecondary.filter(wt => {
    const hit = excludePatterns.find(p => {
      const m = findWorktree([wt], p);
      return m && m.path === wt.path;
    });
    if (hit) {
      excluded.push({ worktree: wt.path, branch: wt.branch, matchedBy: hit });
      return false;
    }
    return true;
  });

  // If the user passed --exclude values that matched nothing, warn loudly
  // rather than silently succeeding — a typo shouldn't turn into an overwrite.
  const unmatchedExcludes = excludePatterns.filter(p =>
    !allSecondary.some(wt => {
      const m = findWorktree([wt], p);
      return m && m.path === wt.path;
    })
  );
  if (unmatchedExcludes.length > 0) {
    outputError(
      'EXCLUDE_NOT_FOUND',
      `--exclude pattern(s) matched no worktree: ${unmatchedExcludes.join(', ')}`,
      { availableWorktrees: allSecondary.map(w => path.basename(w.path)) }
    );
  }

  if (secondary.length === 0) {
    outputError('NO_WORKTREES', 'No secondary worktrees to sync env files to');
  }

  const mainDir = sourceOverride || mainWt.path;
  if (!fs.existsSync(mainDir)) {
    outputError('SOURCE_NOT_FOUND', `Main worktree not found: ${mainDir}`);
  }

  // Collect all unique .env files from main + all non-excluded worktrees.
  // Excluded worktrees' env files do NOT contribute to the "newest wins"
  // comparison, which is the whole point of the exclusion.
  const allEnvFiles = new Set(findEnvFiles(mainDir));
  secondary.forEach(wt => {
    if (fs.existsSync(wt.path)) {
      findEnvFiles(wt.path).forEach(f => allEnvFiles.add(f));
    }
  });

  if (allEnvFiles.size === 0) {
    outputError('NO_ENV_FILES', 'No .env files found in any worktree');
  }

  const envFileList = [...allEnvFiles].sort();
  // bidirectional = default, --one-way = master→worktrees only
  const bidirectional = !oneWayOnly;

  const results = secondary.map(wt => {
    if (!fs.existsSync(wt.path)) {
      return { worktree: wt.path, files: [{ name: '*', action: 'skipped', reason: 'path not found' }] };
    }

    const files = envFileList.map(envFile => {
      const mainPath = path.join(mainDir, envFile);
      const wtPath = path.join(wt.path, envFile);
      const mainExists = fs.existsSync(mainPath);
      const wtExists = fs.existsSync(wtPath);

      // Both exist and identical — skip
      if (mainExists && wtExists && filesMatch(mainPath, wtPath)) {
        return { name: envFile, action: 'skipped', reason: 'identical', direction: 'none' };
      }

      // Determine direction: newest wins (bidirectional) or always master→wt (one-way)
      let direction = 'master→worktree'; // default
      let srcPath = mainPath;
      let destPath = wtPath;

      if (bidirectional && mainExists && wtExists) {
        const mainMtime = getFileMtime(mainPath);
        const wtMtime = getFileMtime(wtPath);
        if (wtMtime > mainMtime) {
          direction = 'worktree→master';
          srcPath = wtPath;
          destPath = mainPath;
        }
      } else if (!mainExists && wtExists) {
        // File only in worktree — sync to master if bidirectional
        if (bidirectional) {
          direction = 'worktree→master';
          srcPath = wtPath;
          destPath = mainPath;
        } else {
          return { name: envFile, action: 'skipped', reason: 'only in worktree (use bidirectional)', direction: 'none' };
        }
      } else if (mainExists && !wtExists) {
        direction = 'master→worktree';
        srcPath = mainPath;
        destPath = wtPath;
      }

      const destExists = fs.existsSync(destPath);

      if (dryRun) {
        return {
          name: envFile,
          action: 'would-copy',
          direction,
          reason: destExists ? 'content differs (newest wins)' : 'missing in target'
        };
      }

      try {
        fs.copyFileSync(srcPath, destPath);
        return {
          name: envFile,
          action: 'copied',
          direction,
          reason: destExists ? 'updated (newest wins)' : 'new file'
        };
      } catch (err) {
        return { name: envFile, action: 'error', direction, reason: err.message };
      }
    });

    return { worktree: wt.path, branch: wt.branch, files };
  });

  const allFiles = results.flatMap(r => r.files);

  // After file sync: check for compose-env drift (warn-only).
  // Catches cases where `environment:` blocks in docker-compose*.yml have
  // diverged across worktrees — e.g., a merge dropped vars that still
  // exist in another branch. Drift does not modify files or block exit.
  const composeEnvDrift = detectComposeEnvDrift(mainDir, secondary);

  output({
    success: true,
    command: 'envsync',
    mode: bidirectional ? 'bidirectional (newest wins)' : 'one-way (master→worktrees)',
    mainWorktree: mainDir,
    envFiles: envFileList,
    dryRun,
    excludePatterns,
    excluded,
    results,
    composeEnvDrift,
    summary: {
      totalWorktrees: results.length,
      excludedWorktrees: excluded.length,
      toWorktree: allFiles.filter(f => f.action === 'copied' && f.direction === 'master→worktree').length,
      toMaster: allFiles.filter(f => f.action === 'copied' && f.direction === 'worktree→master').length,
      skipped: allFiles.filter(f => f.action === 'skipped').length,
      errors: allFiles.filter(f => f.action === 'error').length,
      composeServicesChecked: composeEnvDrift.servicesChecked,
      composeDriftedServices: composeEnvDrift.driftedServices
    }
  });
}

function cmdDiff() {
  const gitRoot = checkGitRepo();
  const baseBranch = detectBaseBranch(gitRoot);
  const worktrees = parseWorktrees(gitRoot);
  const secondary = getSecondaryWorktrees(worktrees);

  if (secondary.length === 0) {
    outputError('NO_WORKTREES', 'No secondary worktrees to diff');
  }

  const targets = filterWorktree
    ? secondary.filter(w => findWorktree([w], filterWorktree))
    : secondary;

  const results = targets.map(wt => {
    if (!fs.existsSync(wt.path)) {
      return { path: wt.path, branch: wt.branch, status: 'missing', ahead: 0, behind: 0, changedFiles: 0, files: [] };
    }

    const ab = getAheadBehind(wt.path, baseBranch);
    const dirtyState = getDirtyState(wt.path);

    // Get changed files compared to base branch
    const diffFiles = git(`diff --name-only ${baseBranch}...HEAD`, { cwd: wt.path });
    const files = diffFiles.success ? diffFiles.output.split('\n').filter(Boolean) : [];

    // Get commit log summary
    const logResult = git(`log ${baseBranch}..HEAD --oneline`, { cwd: wt.path });
    const commits = logResult.success ? logResult.output.split('\n').filter(Boolean) : [];

    return {
      path: wt.path,
      branch: wt.branch || ab.branch,
      ahead: ab.ahead,
      behind: ab.behind,
      changedFiles: files.length,
      files,
      commits,
      dirty: dirtyState.dirty,
      dirtyDetails: dirtyState.details
    };
  });

  output({
    success: true,
    command: 'diff',
    baseBranch,
    results,
    summary: {
      totalWorktrees: results.length,
      totalChangedFiles: results.reduce((sum, r) => sum + r.changedFiles, 0),
      totalCommitsAhead: results.reduce((sum, r) => sum + r.ahead, 0),
      dirtyWorktrees: results.filter(r => r.dirty).length
    }
  });
}

function cmdStatus() {
  const gitRoot = checkGitRepo();
  const baseBranch = detectBaseBranch(gitRoot);
  const worktrees = parseWorktrees(gitRoot);
  const mainWt = getMainWorktree(worktrees);
  const secondary = getSecondaryWorktrees(worktrees);

  // Get env files from main worktree for comparison
  const mainEnvFiles = mainWt ? findEnvFiles(mainWt.path) : [];

  const worktreeStatuses = secondary.map(wt => {
    if (!fs.existsSync(wt.path)) {
      return {
        path: wt.path, branch: wt.branch || 'unknown',
        ahead: 0, behind: 0, dirty: false, dirtyDetails: null,
        envSynced: false, envMissing: mainEnvFiles, status: 'missing'
      };
    }

    const ab = getAheadBehind(wt.path, baseBranch);
    const dirtyState = getDirtyState(wt.path);

    // Check env sync status
    const wtEnvFiles = findEnvFiles(wt.path);
    const envMissing = mainEnvFiles.filter(f => !wtEnvFiles.includes(f));
    const envDiffers = mainEnvFiles.filter(f => {
      if (!wtEnvFiles.includes(f)) return false;
      return !filesMatch(path.join(mainWt.path, f), path.join(wt.path, f));
    });

    return {
      path: wt.path,
      branch: wt.branch || ab.branch,
      ahead: ab.ahead,
      behind: ab.behind,
      dirty: dirtyState.dirty,
      dirtyDetails: dirtyState.details,
      envSynced: envMissing.length === 0 && envDiffers.length === 0,
      envMissing,
      envDiffers
    };
  });

  output({
    success: true,
    command: 'status',
    baseBranch,
    mainWorktree: mainWt ? { path: mainWt.path, branch: mainWt.branch } : null,
    total: worktrees.length,
    worktrees: worktreeStatuses,
    summary: {
      secondary: secondary.length,
      dirty: worktreeStatuses.filter(w => w.dirty).length,
      behind: worktreeStatuses.filter(w => w.behind > 0).length,
      envOutOfSync: worktreeStatuses.filter(w => !w.envSynced).length
    }
  });
}

// --- Main ---

function main() {
  switch (command) {
    case 'session': cmdSession(); break;
    case 'sync': cmdSync(); break;
    case 'envsync': cmdEnvSync(); break;
    case 'diff': cmdDiff(); break;
    case 'status': cmdStatus(); break;
    default:
      outputError('UNKNOWN_COMMAND', `Unknown command: ${command || '(none)'}`, {
        suggestion: 'Available: session, sync, envsync, diff, status'
      });
  }
}

main();
