#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT_NAME = "oh-my-game-kit";
const SKILL_PREFIX = "omg-";
const MANAGED_START = "<!-- oh-my-game-kit:start -->";
const MANAGED_END = "<!-- oh-my-game-kit:end -->";
const CODEX_CONFIG_START = "# oh-my-game-kit agents:start";
const CODEX_CONFIG_END = "# oh-my-game-kit agents:end";
const ENGINE_PRESETS = {
  unity: "unity-production",
  cocos: "cocos-playable",
  all: "full",
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonAtomic(filePath, value) {
  ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, filePath);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function fileSha256(filePath) {
  return sha256(fs.readFileSync(filePath));
}

function copyDir(source, target) {
  ensureDir(target);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const src = path.join(source, entry.name);
    const dst = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else if (entry.isFile()) {
      ensureDir(path.dirname(dst));
      fs.copyFileSync(src, dst);
    }
  }
}

function removeDirIfExists(dirPath) {
  if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true });
}

function listFiles(dirPath, base = dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full, base));
    else if (entry.isFile()) files.push(path.relative(base, full).replaceAll("\\", "/"));
  }
  return files;
}

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const args = { _: [] };
  for (let i = 0; i < rest.length; i += 1) {
    const item = rest[i];
    if (!item.startsWith("--")) {
      args._.push(item);
      continue;
    }
    const raw = item.slice(2);
    const eq = raw.indexOf("=");
    if (eq !== -1) {
      args[raw.slice(0, eq)] = raw.slice(eq + 1);
      continue;
    }
    const next = rest[i + 1];
    if (next && !next.startsWith("--")) {
      args[raw] = next;
      i += 1;
    } else {
      args[raw] = true;
    }
  }
  return { command, args };
}

function loadKit() {
  const kitPath = path.join(repoRoot, "kit.json");
  const kit = readJson(kitPath);
  const modules = new Map();
  const modulesDir = path.join(repoRoot, "modules");
  for (const name of fs.readdirSync(modulesDir)) {
    const modulePath = path.join(modulesDir, name, "module.json");
    if (fs.existsSync(modulePath)) modules.set(name, readJson(modulePath));
  }
  return { kit, modules };
}

function dependencyNames(moduleManifest) {
  return Object.keys(moduleManifest.dependencies ?? {});
}

function resolveModules(requested, kit, modules) {
  const selected = new Set();
  const visiting = new Set();
  const ordered = [];

  for (const [name, mod] of modules) {
    if (mod.required) selected.add(name);
  }
  for (const name of requested) selected.add(name);

  function visit(name) {
    if (ordered.includes(name)) return;
    if (visiting.has(name)) throw new Error(`Circular module dependency involving "${name}"`);
    const mod = modules.get(name);
    if (!mod) throw new Error(`Unknown module "${name}"`);
    visiting.add(name);
    for (const dep of dependencyNames(mod)) visit(dep);
    visiting.delete(name);
    ordered.push(name);
  }

  for (const name of selected) visit(name);
  return ordered;
}

function modulesFromPreset(presetName, kit, modules) {
  const preset = kit.presets?.[presetName];
  if (!preset) throw new Error(`Unknown preset "${presetName}"`);
  if (preset === "*") return [...modules.keys()];
  if (!Array.isArray(preset)) throw new Error(`Preset "${presetName}" must be an array or "*"`);
  return preset;
}

function inferEngineFromPreset(presetName) {
  if (!presetName) return "custom";
  if (presetName === "full") return "all";
  if (presetName.startsWith("cocos-")) return "cocos";
  if (presetName.startsWith("unity-")) return "unity";
  return "custom";
}

function validateEngine(engine) {
  if (!Object.hasOwn(ENGINE_PRESETS, engine)) {
    throw new Error(`Unknown engine "${engine}". Use unity, cocos, or all.`);
  }
}

function resolveInstallSelection(args, kit, modules) {
  if (args.modules) {
    return {
      engine: "custom",
      preset: "custom",
      requested: String(args.modules).split(",").map((s) => s.trim()).filter(Boolean),
    };
  }

  if (args.preset) {
    const preset = String(args.preset);
    return {
      engine: inferEngineFromPreset(preset),
      preset,
      requested: modulesFromPreset(preset, kit, modules),
    };
  }

  if (args.engine) {
    const engine = String(args.engine).toLowerCase();
    validateEngine(engine);
    const preset = ENGINE_PRESETS[engine];
    return {
      engine,
      preset,
      requested: modulesFromPreset(preset, kit, modules),
    };
  }

  return {
    engine: "unity",
    preset: "unity-minimal",
    requested: modulesFromPreset("unity-minimal", kit, modules),
  };
}

function parseSkillFrontmatter(content) {
  if (!content.startsWith("---\n")) return { error: "Missing YAML frontmatter" };
  const end = content.indexOf("\n---", 4);
  if (end === -1) return { error: "Unclosed YAML frontmatter" };
  const raw = content.slice(4, end).trim();
  const fields = {};
  for (const line of raw.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) return { error: `Invalid frontmatter line: ${line}` };
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }
  const keys = Object.keys(fields);
  const extra = keys.filter((key) => !["name", "description"].includes(key));
  if (extra.length) return { error: `Unsupported frontmatter fields: ${extra.join(", ")}` };
  if (!fields.name) return { error: "Missing name" };
  if (!fields.description) return { error: "Missing description" };
  return { fields };
}

function validateKit() {
  const errors = [];
  const warnings = [];
  const { kit, modules } = loadKit();

  if (kit.name !== KIT_NAME) errors.push(`kit.json name must be "${KIT_NAME}"`);
  if (!kit.version) errors.push("kit.json version is required");

  for (const name of kit.modules ?? []) {
    if (!modules.has(name)) errors.push(`kit.json references missing module "${name}"`);
  }

  for (const [moduleName, mod] of modules) {
    if (mod.name !== moduleName) errors.push(`${moduleName}/module.json name mismatch`);
    for (const dep of dependencyNames(mod)) {
      if (!modules.has(dep)) errors.push(`${moduleName} depends on missing module "${dep}"`);
    }
    for (const skill of mod.skills ?? []) {
      if (!skill.startsWith(SKILL_PREFIX)) errors.push(`${moduleName} skill "${skill}" must start with ${SKILL_PREFIX}`);
      if (!/^[a-z0-9-]+$/.test(skill)) errors.push(`${moduleName} skill "${skill}" must be lowercase hyphen-case`);
      const skillPath = path.join(repoRoot, "modules", moduleName, "skills", skill, "SKILL.md");
      if (!fs.existsSync(skillPath)) {
        errors.push(`${moduleName} lists missing skill ${skill}`);
        continue;
      }
      const content = fs.readFileSync(skillPath, "utf8");
      const parsed = parseSkillFrontmatter(content);
      if (parsed.error) errors.push(`${skill}: ${parsed.error}`);
      else {
        if (parsed.fields.name !== skill) errors.push(`${skill}: frontmatter name must match directory`);
        if (parsed.fields.description.length < 80) warnings.push(`${skill}: description may be too short to trigger reliably`);
      }
      if (content.length > 12000) warnings.push(`${skill}: SKILL.md is large; move details to references`);
    }
  }

  return { errors, warnings };
}

function projectTarget(cwd = process.cwd()) {
  return {
    kind: "project",
    root: cwd,
    skillsRoots: [path.join(cwd, ".agents", "skills")],
    codexAgentsDir: path.join(cwd, ".codex", "agents"),
    codexConfig: path.join(cwd, ".codex", "config.toml"),
    agentsMd: path.join(cwd, "AGENTS.md"),
    stateDir: path.join(cwd, ".oh-my-game-kit"),
  };
}

function globalTarget(args) {
  const home = os.homedir();
  const requestedRoot = args["skills-root"] ? path.resolve(String(args["skills-root"])) : null;
  const skillsRoots = requestedRoot
    ? [requestedRoot]
    : [path.join(home, ".agents", "skills"), path.join(home, ".codex", "skills")];
  return {
    kind: "global",
    root: home,
    skillsRoots,
    codexAgentsDir: path.join(home, ".codex", "agents"),
    codexConfig: path.join(home, ".codex", "config.toml"),
    agentsMd: path.join(home, ".codex", "AGENTS.md"),
    stateDir: path.join(home, ".codex", ".oh-my-game-kit"),
  };
}

function resolveTarget(args) {
  return args.target === "project" ? projectTarget(process.cwd()) : globalTarget(args);
}

function removeManagedBlock(content) {
  const start = content.indexOf(MANAGED_START);
  const end = content.indexOf(MANAGED_END);
  if (start === -1 || end === -1 || end < start) return content;
  return `${content.slice(0, start).trimEnd()}\n${content.slice(end + MANAGED_END.length).trimStart()}`.trimEnd() + "\n";
}

function removeManagedTomlBlock(content) {
  const start = content.indexOf(CODEX_CONFIG_START);
  const end = content.indexOf(CODEX_CONFIG_END);
  if (start === -1 || end === -1 || end < start) return content;
  return `${content.slice(0, start).trimEnd()}\n${content.slice(end + CODEX_CONFIG_END.length).trimStart()}`.trimEnd() + "\n";
}

function buildManagedBlock(moduleNames, targetKind) {
  const guidance = [
    "Codex should use installed `omg-*` skills for game-development work.",
  ];
  if (moduleNames.some((name) => name === "base" || name.startsWith("dots-") || ["animation", "architecture", "audio", "editor", "mobile", "networking", "rendering", "testing", "ui"].includes(name))) {
    guidance.push("For Unity work, prefer the Unity MCP workflow when MCP tools are available. After Unity C# script edits, refresh scripts and read console errors before reporting success.");
  }
  if (moduleNames.some((name) => name.startsWith("cocos-"))) {
    guidance.push("For Cocos work, use installed `omg-cocos-*` skills for Cocos Creator and playable-ad workflows.");
  }

  return `${MANAGED_START}
## Oh My Game Kit

Installed target: ${targetKind}
Installed modules: ${moduleNames.join(", ")}

${guidance.join("\n")}
${MANAGED_END}
`;
}

function mergeAgentsMd(filePath, moduleNames, targetKind) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const cleaned = removeManagedBlock(existing).trimEnd();
  const block = buildManagedBlock(moduleNames, targetKind);
  const next = cleaned ? `${cleaned}\n\n${block}` : block;
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, next, "utf8");
}

function listSourceAgents() {
  const dir = path.join(repoRoot, "agents", "codex");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.startsWith(SKILL_PREFIX) && name.endsWith(".toml"))
    .sort()
    .map((name) => path.join(dir, name));
}

function agentSlug(filePath) {
  return path.basename(filePath, ".toml").replace(/-/g, "_");
}

function agentDescription(content, fallback) {
  const match = content.match(/^description\s*=\s*"([\s\S]*?)"\s*$/m);
  if (!match) return fallback;
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return fallback;
  }
}

function mergeCodexConfig(filePath, agentFiles) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const cleaned = removeManagedTomlBlock(existing).trimEnd();
  const entries = [];
  for (const sourceFile of agentFiles) {
    const content = fs.readFileSync(sourceFile, "utf8");
    const slug = agentSlug(sourceFile);
    entries.push(`[agents.${slug}]`);
    entries.push(`description = ${JSON.stringify(agentDescription(content, slug))}`);
    entries.push(`config_file = "agents/${path.basename(sourceFile)}"`);
    entries.push("");
  }
  const block = `${CODEX_CONFIG_START}\n${entries.join("\n").trimEnd()}\n${CODEX_CONFIG_END}\n`;
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, cleaned ? `${cleaned}\n\n${block}` : block, "utf8");
}

function removeOldSetup(target) {
  for (const skillsRoot of target.skillsRoots) {
    if (!fs.existsSync(skillsRoot)) continue;
    for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith(SKILL_PREFIX)) {
        removeDirIfExists(path.join(skillsRoot, entry.name));
      }
    }
  }
  if (fs.existsSync(target.agentsMd)) {
    const cleaned = removeManagedBlock(fs.readFileSync(target.agentsMd, "utf8"));
    fs.writeFileSync(target.agentsMd, cleaned, "utf8");
  }
  if (fs.existsSync(target.codexAgentsDir)) {
    for (const entry of fs.readdirSync(target.codexAgentsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.startsWith(SKILL_PREFIX) && entry.name.endsWith(".toml")) {
        fs.rmSync(path.join(target.codexAgentsDir, entry.name), { force: true });
      }
    }
  }
  if (fs.existsSync(target.codexConfig)) {
    const cleaned = removeManagedTomlBlock(fs.readFileSync(target.codexConfig, "utf8"));
    fs.writeFileSync(target.codexConfig, cleaned, "utf8");
  }
  removeDirIfExists(target.stateDir);
}

function install(args) {
  const validation = validateKit();
  if (validation.errors.length) {
    throw new Error(`Kit validation failed:\n${validation.errors.map((e) => `- ${e}`).join("\n")}`);
  }

  const { kit, modules } = loadKit();
  const selection = resolveInstallSelection(args, kit, modules);
  const moduleNames = resolveModules(selection.requested, kit, modules);
  const target = resolveTarget(args);

  if (args.fresh) removeOldSetup(target);

  const stateFiles = [];
  for (const skillsRoot of target.skillsRoots) {
    ensureDir(skillsRoot);
    for (const moduleName of moduleNames) {
      const mod = modules.get(moduleName);
      for (const skill of mod.skills ?? []) {
        const source = path.join(repoRoot, "modules", moduleName, "skills", skill);
        const destination = path.join(skillsRoot, skill);
        const targetSkill = path.join(destination, "SKILL.md");
        const sourceSkill = path.join(source, "SKILL.md");
        if (fs.existsSync(targetSkill) && !args.force) {
          const existingHash = fileSha256(targetSkill);
          const sourceHash = fileSha256(sourceSkill);
          if (existingHash !== sourceHash) {
            throw new Error(`Conflict: ${targetSkill} differs from source. Use --force or --fresh.`);
          }
        }
        removeDirIfExists(destination);
        copyDir(source, destination);
        for (const rel of listFiles(destination)) {
          const filePath = path.join(destination, rel);
          stateFiles.push({
            source: path.relative(repoRoot, path.join(source, rel)).replaceAll("\\", "/"),
            target: filePath,
            checksum: fileSha256(filePath),
          });
        }
      }
    }
  }

  const installedAgents = [];
  if (!args["no-agents"]) {
    const sourceAgents = listSourceAgents();
    ensureDir(target.codexAgentsDir);
    for (const sourceAgent of sourceAgents) {
      const destination = path.join(target.codexAgentsDir, path.basename(sourceAgent));
      if (fs.existsSync(destination) && !args.force) {
        const existingHash = fileSha256(destination);
        const sourceHash = fileSha256(sourceAgent);
        if (existingHash !== sourceHash) {
          throw new Error(`Conflict: ${destination} differs from source. Use --force or --fresh.`);
        }
      }
      fs.copyFileSync(sourceAgent, destination);
      installedAgents.push(sourceAgent);
      stateFiles.push({
        source: path.relative(repoRoot, sourceAgent).replaceAll("\\", "/"),
        target: destination,
        checksum: fileSha256(destination),
      });
    }
    mergeCodexConfig(target.codexConfig, installedAgents);
  }

  mergeAgentsMd(target.agentsMd, moduleNames, target.kind);

  const state = {
    schemaVersion: 1,
    kit: KIT_NAME,
    version: kit.version,
    installedAt: new Date().toISOString(),
    target: target.kind,
    skillsRoots: target.skillsRoots,
    agentsMd: target.agentsMd,
    codexAgentsDir: target.codexAgentsDir,
    codexConfig: target.codexConfig,
    engine: selection.engine,
    preset: selection.preset,
    modules: Object.fromEntries(moduleNames.map((name) => [name, modules.get(name).version])),
    files: stateFiles,
  };
  writeJsonAtomic(path.join(target.stateDir, "install-state.json"), state);

  return {
    moduleNames,
    engine: selection.engine,
    preset: selection.preset,
    kitVersion: kit.version,
    target,
    skillsInstalled: stateFiles.filter((f) => f.target.endsWith("SKILL.md")).length,
    agentsInstalled: installedAgents.length,
    warnings: validation.warnings,
  };
}

function doctor(args) {
  const validation = validateKit();
  const target = resolveTarget(args);
  const statePath = path.join(target.stateDir, "install-state.json");
  const lines = [];
  lines.push(`Kit validation: ${validation.errors.length ? "FAIL" : "OK"}`);
  for (const warning of validation.warnings) lines.push(`Warning: ${warning}`);
  for (const error of validation.errors) lines.push(`Error: ${error}`);
  lines.push(`Target: ${target.kind}`);
  lines.push(`Skills roots: ${target.skillsRoots.join("; ")}`);
  lines.push(`Codex agents: ${target.codexAgentsDir}`);
  lines.push(`Codex config: ${target.codexConfig}`);
  lines.push(`AGENTS.md: ${target.agentsMd}`);
  if (fs.existsSync(statePath)) {
    const state = readJson(statePath);
    lines.push(`Installed version: ${state.version}`);
    lines.push(`Installed engine: ${state.engine ?? "unknown"}`);
    lines.push(`Installed preset: ${state.preset ?? "unknown"}`);
    lines.push(`Installed modules: ${Object.keys(state.modules ?? {}).join(", ")}`);
    let drift = 0;
    for (const file of state.files ?? []) {
      if (!fs.existsSync(file.target) || fileSha256(file.target) !== file.checksum) drift += 1;
    }
    lines.push(`Managed file drift: ${drift}`);
  } else {
    lines.push("Installed version: not installed");
  }

  const unityRoot = process.cwd();
  const hasUnity = fs.existsSync(path.join(unityRoot, "Assets")) && fs.existsSync(path.join(unityRoot, "ProjectSettings"));
  lines.push(`Unity project at cwd: ${hasUnity ? "yes" : "no"}`);
  return { ok: validation.errors.length === 0, lines };
}

function uninstall(args) {
  const target = resolveTarget(args);
  removeOldSetup(target);
  return target;
}

function printHelp() {
  console.log(`oh-my-game-kit

Usage:
  node src/cli.js validate
  node src/cli.js doctor [--target project|global]
  node src/cli.js install [--target project|global] [--engine unity|cocos|all] [--preset unity-minimal] [--modules a,b] [--fresh] [--force] [--no-agents]
  node src/cli.js uninstall [--target project|global]

Default install target is global. Without --engine, --preset, or --modules, install keeps the legacy unity-minimal fallback. --modules overrides --preset and --engine; --preset overrides --engine. Global installs to both ~/.agents/skills and ~/.codex/skills unless --skills-root is provided. Codex agents are installed to .codex/agents unless --no-agents is passed.
`);
}

function main() {
  const { command, args } = parseArgs(process.argv.slice(2));
  try {
    if (command === "help" || command === "--help" || command === "-h") {
      printHelp();
      return;
    }
    if (command === "validate") {
      const result = validateKit();
      for (const warning of result.warnings) console.warn(`warning: ${warning}`);
      if (result.errors.length) {
        for (const error of result.errors) console.error(`error: ${error}`);
        process.exitCode = 1;
      } else {
        console.log("validate: OK");
      }
      return;
    }
    if (command === "doctor") {
      const result = doctor(args);
      for (const line of result.lines) console.log(line);
      process.exitCode = result.ok ? 0 : 1;
      return;
    }
    if (command === "install") {
      const result = install(args);
      for (const warning of result.warnings) console.warn(`warning: ${warning}`);
      console.log(`installed ${KIT_NAME}@${result.kitVersion} to ${result.target.kind}`);
      console.log(`engine: ${result.engine}`);
      console.log(`preset: ${result.preset}`);
      console.log(`modules: ${result.moduleNames.join(", ")}`);
      console.log(`skills roots: ${result.target.skillsRoots.join("; ")}`);
      console.log(`agents installed: ${result.agentsInstalled}`);
      return;
    }
    if (command === "uninstall") {
      const target = uninstall(args);
      console.log(`removed ${KIT_NAME} managed setup from ${target.kind}`);
      return;
    }
    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

main();
