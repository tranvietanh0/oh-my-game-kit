'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const OMG = {
  CLAUDE_DIR: '.agents',
  METADATA_FILE: 'metadata.json',
  SKILLS_DIR: 'skills',
};

function getHomeDir() {
  return os.homedir();
}

function isOMGMetadata(meta) {
  return Boolean(
    meta &&
    typeof meta === 'object' &&
    meta.schemaVersion >= 1 &&
    meta.installedModules &&
    typeof meta.installedModules === 'object' &&
    !Array.isArray(meta.installedModules)
  );
}

function getModuleEntries(meta) {
  if (!isOMGMetadata(meta)) return [];
  return Object.keys(meta.installedModules)
    .sort()
    .map((name) => ({ name, ...(meta.installedModules[name] ?? {}) }));
}

function resolveProjectDir(start = process.cwd()) {
  let current = path.resolve(start);
  while (true) {
    const omgDir = path.join(current, OMG.CLAUDE_DIR);
    if (fs.existsSync(path.join(omgDir, OMG.METADATA_FILE))) {
      return {
        omgDir,
        globalOnly: false,
        source: 'walk',
        projectName: path.basename(current),
      };
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  const home = getHomeDir();
  return {
    omgDir: home ? path.join(home, OMG.CLAUDE_DIR) : null,
    globalOnly: true,
    source: 'global-fallback',
    projectName: null,
  };
}

module.exports = {
  OMG,
  getHomeDir,
  getModuleEntries,
  isOMGMetadata,
  resolveProjectDir,
};
