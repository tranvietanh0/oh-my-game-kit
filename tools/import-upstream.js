#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = os.tmpdir();
const legacyToken = ["t", "1", "k"].join("");
const legacyPackage = ["theone", "kit"].join("");
const legacyTitle = ["The", "One", "Kit"].join("");
const legacyUpper = legacyToken.toUpperCase();
const coreRoot = process.env.OMG_UPSTREAM_CORE ?? path.join(tempRoot, `${legacyPackage}-core`);
const unityRoot = process.env.OMG_UPSTREAM_UNITY ?? path.join(tempRoot, `${legacyPackage}-unity`);
const cocosRoot = process.env.OMG_UPSTREAM_COCOS ?? path.join(tempRoot, `${legacyPackage}-cocos`);

const generatedHeader = "Generated from upstream reference sources. Re-run `node tools/import-upstream.js` to refresh.";
const excludedUnityModules = new Set(["tof"]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function rm(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dst) {
  ensureDir(dst);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (entry.isFile()) {
      ensureDir(path.dirname(d));
      fs.copyFileSync(s, d);
    }
  }
}

function stripFrontmatter(content) {
  if (!content.startsWith("---")) return { frontmatter: {}, body: content };
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: {}, body: content };
  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  return { frontmatter, body: content.slice(match[0].length) };
}

function mapName(name) {
  return name
    .replace(new RegExp(`^${legacyToken}-unity-`), "omg-unity-")
    .replace(new RegExp(`^${legacyToken}-`), "omg-")
    .replace(/^dots-/, "omg-dots-")
    .replace(/^unity-/, "omg-unity-")
    .replace(/:/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapModuleName(name) {
  return String(name)
    .replace(new RegExp(`^${legacyToken}-`), "omg-")
    .replace(/:/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapCocosModuleName(name) {
  const local = String(name).includes(":") ? String(name).split(":").pop() : String(name);
  const mapped = mapModuleName(local);
  if (mapped === "base") return "cocos-base";
  if (mapped === "playable") return "cocos-playable";
  return mapped;
}

function mapText(text) {
  return text
    .replaceAll(legacyTitle, "Oh My Game Kit")
    .replaceAll(legacyPackage, "oh-my-game-kit")
    .replaceAll(legacyUpper, "OMG")
    .replaceAll(`${legacyToken}-unity-`, "omg-unity-")
    .replaceAll(`${legacyToken}-`, "omg-")
    .replaceAll(`${legacyToken}_`, "omg_")
    .replaceAll(`${legacyToken}:`, "omg-")
    .replaceAll("/omg-", "omg-")
    .replaceAll(`/${legacyToken}:`, "omg-")
    .replaceAll(legacyToken, "omg")
    .replaceAll(".claude", ".agents")
    .replaceAll("CLAUDE.md", "AGENTS.md")
    .replaceAll("Claude Code", "Codex")
    .replaceAll("Claude", "Codex")
    .replaceAll("claude", "codex");
}

function mapPathSegment(name) {
  return mapText(name)
    .replace(/[^a-zA-Z0-9._ -]+/g, "-")
    .replace(new RegExp(legacyToken, "gi"), "omg");
}

const textExtensions = new Set([
  ".md",
  ".txt",
  ".json",
  ".jsonc",
  ".yaml",
  ".yml",
  ".cjs",
  ".mjs",
  ".js",
  ".ts",
  ".py",
  ".sh",
  ".html",
  ".css",
  ".xml",
  ".meta",
  ".asmdef",
]);

function isTextFile(file) {
  return textExtensions.has(path.extname(file).toLowerCase());
}

function normalizeTreeNames(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) normalizeTreeNames(full);
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const mapped = mapPathSegment(entry.name);
    if (mapped !== entry.name) {
      fs.renameSync(full, path.join(dir, mapped));
    }
  }
}

function normalizeTreeText(dir) {
  for (const file of walk(dir)) {
    if (isTextFile(file)) {
      fs.writeFileSync(file, mapText(fs.readFileSync(file, "utf8")), "utf8");
    }
  }
}

function yamlString(value) {
  return JSON.stringify(String(value ?? "").replace(/\s+/g, " ").trim());
}

function cleanInlineDescription(value) {
  return mapText(value)
    .replace(/[`*_#>\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function trimDescription(value, fallback) {
  const text = cleanInlineDescription(value);
  if (!text) return fallback;
  if (text.length <= 280) return text;
  const sentence = text.slice(0, 280).match(/^(.+?[.!?])\s/);
  if (sentence?.[1] && sentence[1].length >= 80) return sentence[1];
  return `${text.slice(0, 277).trimEnd()}...`;
}

function agentDescriptionFromBody(body, sourceName) {
  const mappedName = mapName(sourceName);
  for (const paragraph of mapText(body).split(/\r?\n\s*\r?\n/)) {
    const cleaned = cleanInlineDescription(paragraph);
    if (!cleaned) continue;
    if (/^mandatory\b/i.test(cleaned)) continue;
    if (/^tools?\b/i.test(cleaned)) continue;
    return trimDescription(cleaned, `Use this ${mappedName} agent for delegated Oh My Game Kit work.`);
  }
  return `Use this ${mappedName} agent for delegated Oh My Game Kit work.`;
}

function convertSkillDir(srcDir, dstDir, targetName, origin) {
  copyDir(srcDir, dstDir);
  normalizeTreeNames(dstDir);
  const skillMd = path.join(dstDir, "SKILL.md");
  const sourceSkill = path.join(srcDir, "SKILL.md");
  const raw = fs.readFileSync(sourceSkill, "utf8");
  const { frontmatter, body } = stripFrontmatter(raw);
  const description = mapText(frontmatter.description || `Use this Oh My Game Kit Codex skill for ${targetName}.`);
  const portNotice = [
    "# Codex Port Notice",
    "",
    `This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Claude-specific mechanics when they conflict.`,
    "",
  ].join("\n");
  const next = [
    "---",
    `name: ${targetName}`,
    `description: ${yamlString(description)}`,
    "---",
    "",
    portNotice,
    mapText(body).trim(),
    "",
  ].join("\n");
  fs.writeFileSync(skillMd, next, "utf8");
  normalizeTreeText(dstDir);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function convertAgent(srcFile, dstFile, sourceName, origin) {
  const raw = fs.readFileSync(srcFile, "utf8");
  const { frontmatter, body } = stripFrontmatter(raw);
  const name = mapName(sourceName);
  const frontmatterDescription = cleanInlineDescription(frontmatter.description);
  const description =
    !frontmatterDescription || ["|", "|-", "|+", ">", ">-", ">+"].includes(frontmatterDescription)
      ? agentDescriptionFromBody(body, sourceName)
      : trimDescription(frontmatterDescription, agentDescriptionFromBody(body, sourceName));
  const instructions = mapText(body).trim();
  const toml = [
    `# ${generatedHeader}`,
    `# source = ${JSON.stringify(mapText(origin))}`,
    `description = ${JSON.stringify(description)}`,
    "",
    'developer_instructions = """',
    instructions.replaceAll('"""', '\\"\\"\\"'),
    '"""',
    "",
  ].join("\n");
  ensureDir(path.dirname(dstFile));
  fs.writeFileSync(dstFile, toml, "utf8");
  return { name, description };
}

function normalizeDeps(deps, moduleNameMapper = mapModuleName) {
  const result = {};
  for (const [name, version] of Object.entries(deps ?? {})) {
    const local = name.includes(":") ? name.split(":").pop() : name;
    result[moduleNameMapper(local)] = version;
  }
  return result;
}

function normalizeCocosDeps(deps) {
  const result = normalizeDeps(deps, mapCocosModuleName);
  delete result["omg-extended"];
  return result;
}

function importCore(modulesOut, agentsOut) {
  const modulesDir = path.join(coreRoot, ".claude", "modules");
  const flatSkills = path.join(coreRoot, ".claude", "skills");
  const flatAgents = path.join(coreRoot, ".claude", "agents");
  const imported = [];
  const agents = [];

  for (const sourceModuleName of fs.readdirSync(modulesDir)) {
    const moduleName = mapModuleName(sourceModuleName);
    const srcModule = path.join(modulesDir, sourceModuleName);
    const moduleJsonPath = path.join(srcModule, "module.json");
    if (!fs.existsSync(moduleJsonPath)) continue;
    const manifest = readJson(moduleJsonPath);
    const dstModule = path.join(modulesOut, moduleName);
    const mappedSkills = [];
    const mappedAgents = [];

    for (const skill of manifest.skills ?? []) {
      const srcSkill = path.join(flatSkills, skill);
      if (!fs.existsSync(srcSkill)) continue;
      const mapped = mapName(skill);
      convertSkillDir(srcSkill, path.join(dstModule, "skills", mapped), mapped, `core:${skill}`);
      mappedSkills.push(mapped);
    }

    for (const agent of manifest.agents ?? []) {
      const srcAgent = path.join(flatAgents, `${agent}.md`);
      if (!fs.existsSync(srcAgent)) continue;
      const mapped = mapName(agent);
      const info = convertAgent(srcAgent, path.join(agentsOut, `${mapped}.toml`), agent, `core:${agent}`);
      mappedAgents.push(mapped);
      agents.push(info);
    }

    writeJson(path.join(dstModule, "module.json"), {
      name: moduleName,
      version: manifest.version ?? "0.1.0",
      description: mapText(manifest.description ?? moduleName),
      required: false,
      dependencies: normalizeDeps(manifest.dependencies),
      skills: mappedSkills,
      agents: mappedAgents,
      source: "upstream-core",
    });
    imported.push(moduleName);
  }
  return { modules: imported, agents };
}

function importUnity(modulesOut, agentsOut) {
  const modulesDir = path.join(unityRoot, ".claude", "modules");
  const rootAgents = path.join(unityRoot, ".claude", "agents");
  const imported = [];
  const agents = [];

  for (const sourceModuleName of fs.readdirSync(modulesDir)) {
    const moduleName = mapModuleName(sourceModuleName);
    if (excludedUnityModules.has(moduleName)) continue;
    const srcModule = path.join(modulesDir, sourceModuleName);
    const moduleJsonPath = path.join(srcModule, "module.json");
    if (!fs.existsSync(moduleJsonPath)) continue;
    const manifest = readJson(moduleJsonPath);
    const dstModule = path.join(modulesOut, moduleName);
    const mappedSkills = [];
    const mappedAgents = [];

    for (const skill of manifest.skills ?? []) {
      const srcSkill = path.join(srcModule, "skills", skill);
      if (!fs.existsSync(srcSkill)) continue;
      const mapped = mapName(skill);
      convertSkillDir(srcSkill, path.join(dstModule, "skills", mapped), mapped, `unity:${moduleName}:${skill}`);
      mappedSkills.push(mapped);
    }

    for (const agent of manifest.agents ?? []) {
      const srcAgent =
        fs.existsSync(path.join(srcModule, "agents", `${agent}.md`))
          ? path.join(srcModule, "agents", `${agent}.md`)
          : path.join(rootAgents, `${agent}.md`);
      if (!fs.existsSync(srcAgent)) continue;
      const mapped = mapName(agent);
      const info = convertAgent(srcAgent, path.join(agentsOut, `${mapped}.toml`), agent, `unity:${moduleName}:${agent}`);
      mappedAgents.push(mapped);
      agents.push(info);
    }

    writeJson(path.join(dstModule, "module.json"), {
      name: moduleName,
      version: manifest.version ?? "0.1.0",
      description: mapText(manifest.description ?? moduleName),
      required: false,
      dependencies: normalizeDeps(manifest.dependencies),
      skills: mappedSkills,
      agents: mappedAgents,
      detect: manifest.detect,
      source: "upstream-unity",
    });
    imported.push(moduleName);
  }

  for (const file of fs.readdirSync(rootAgents).filter((f) => f.endsWith(".md"))) {
    const name = file.replace(/\.md$/, "");
    const mapped = mapName(name);
    if (fs.existsSync(path.join(agentsOut, `${mapped}.toml`))) continue;
    agents.push(convertAgent(path.join(rootAgents, file), path.join(agentsOut, `${mapped}.toml`), name, `unity:${name}`));
  }

  return { modules: imported, agents };
}

function importCocos(modulesOut, agentsOut) {
  const modulesDir = path.join(cocosRoot, ".claude", "modules");
  const rootAgents = path.join(cocosRoot, ".claude", "agents");
  const imported = [];
  const agents = [];

  for (const sourceModuleName of fs.readdirSync(modulesDir)) {
    const moduleName = mapCocosModuleName(sourceModuleName);
    const srcModule = path.join(modulesDir, sourceModuleName);
    const moduleJsonPath = path.join(srcModule, "module.json");
    if (!fs.existsSync(moduleJsonPath)) continue;
    const manifest = readJson(moduleJsonPath);
    const dstModule = path.join(modulesOut, moduleName);
    const mappedSkills = [];
    const mappedAgents = [];

    for (const skill of manifest.skills ?? []) {
      const srcSkill = path.join(srcModule, "skills", skill);
      if (!fs.existsSync(srcSkill)) continue;
      const mapped = mapName(skill);
      convertSkillDir(srcSkill, path.join(dstModule, "skills", mapped), mapped, `cocos:${moduleName}:${skill}`);
      mappedSkills.push(mapped);
    }

    for (const agent of manifest.agents ?? []) {
      const srcAgent =
        fs.existsSync(path.join(srcModule, "agents", `${agent}.md`))
          ? path.join(srcModule, "agents", `${agent}.md`)
          : path.join(rootAgents, `${agent}.md`);
      if (!fs.existsSync(srcAgent)) continue;
      const mapped = mapName(agent);
      const info = convertAgent(srcAgent, path.join(agentsOut, `${mapped}.toml`), agent, `cocos:${moduleName}:${agent}`);
      mappedAgents.push(mapped);
      agents.push(info);
    }

    writeJson(path.join(dstModule, "module.json"), {
      name: moduleName,
      version: manifest.version ?? "0.1.0",
      description: mapText(manifest.description ?? moduleName),
      required: false,
      dependencies: normalizeCocosDeps(manifest.dependencies),
      skills: mappedSkills,
      agents: mappedAgents,
      detect: manifest.detect,
      source: "upstream-cocos",
    });
    imported.push(moduleName);
  }

  if (fs.existsSync(rootAgents)) {
    for (const file of fs.readdirSync(rootAgents).filter((f) => f.endsWith(".md"))) {
      const name = file.replace(/\.md$/, "");
      const mapped = mapName(name);
      if (fs.existsSync(path.join(agentsOut, `${mapped}.toml`))) continue;
      agents.push(convertAgent(path.join(rootAgents, file), path.join(agentsOut, `${mapped}.toml`), name, `cocos:${name}`));
    }
  }

  return { modules: imported, agents };
}

function main() {
  for (const required of [coreRoot, unityRoot, cocosRoot]) {
    if (!fs.existsSync(required)) {
      throw new Error(`Missing source repo: ${required}`);
    }
  }

  const modulesOut = path.join(repoRoot, "modules");
  const agentsOut = path.join(repoRoot, "agents", "codex");
  rm(modulesOut);
  rm(agentsOut);
  ensureDir(modulesOut);
  ensureDir(agentsOut);

  const core = importCore(modulesOut, agentsOut);
  const unity = importUnity(modulesOut, agentsOut);
  const cocos = importCocos(modulesOut, agentsOut);
  const moduleNames = [...core.modules, ...unity.modules, ...cocos.modules];

  writeJson(path.join(repoRoot, "kit.json"), {
    name: "oh-my-game-kit",
    version: "0.2.3",
    provider: "codex",
    description: "Codex-native Oh My Game Kit core, Unity, and Cocos game-development workflows.",
    generatedFrom: {
      core: "upstream-core-reference",
      unity: "upstream-unity-reference",
      cocos: "upstream-cocos-reference",
    },
    modules: moduleNames,
    presets: {
      "core": ["omg-base", "omg-extended"],
      "core-maintainer": ["omg-base", "omg-extended", "omg-maintainer"],
      "unity-minimal": ["omg-base", "omg-extended", "base", "editor"],
      "unity-project": ["base", "editor"],
      "unity-production": ["omg-base", "omg-extended", "base", "editor", "testing", "ui", "rendering", "animation", "audio", "mobile"],
      "unity-dots": ["omg-base", "omg-extended", "base", "editor", "testing", "dots-core", "dots-combat", "dots-nav", "dots-ai", "ui", "rendering"],
      "unity-full": ["omg-base", "omg-extended", ...unity.modules],
      "cocos-minimal": ["omg-base", "omg-extended", "cocos-base"],
      "cocos-project": ["cocos-base", "cocos-playable"],
      "cocos-playable": ["omg-base", "omg-extended", "cocos-base", "cocos-playable"],
      "cocos-full": ["omg-base", "omg-extended", "cocos-base", "cocos-playable"],
      "engine-project": ["base", "editor", "cocos-base", "cocos-playable"],
      "full": "*",
    },
  });

  console.log(`Imported ${core.modules.length} core modules, ${unity.modules.length} unity modules, ${cocos.modules.length} cocos modules.`);
  console.log(`Imported ${walk(modulesOut).filter((f) => path.basename(f) === "SKILL.md").length} skills.`);
  console.log(`Imported ${walk(agentsOut).filter((f) => f.endsWith(".toml")).length} Codex agents.`);
}

main();
