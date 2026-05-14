#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

/**
 * packages-extractor.cjs
 *
 * Parses Packages/manifest.json from a Unity project and generates a Mermaid
 * graph showing UPM dependencies.
 *
 * Local (file:) packages are styled differently from registry packages.
 *
 * Exports:
 *   extractPackages(projectRoot) -> { mermaid: string, warnings: string[] }
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse the UPM manifest and produce a Mermaid dependency graph.
 *
 * @param {string} projectRoot - absolute path to Unity project root
 * @returns {{ mermaid: string, warnings: string[] }}
 */
function extractPackages(projectRoot) {
  const warnings = [];
  const manifestPath = path.join(projectRoot, 'Packages', 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return {
      mermaid: 'graph LR\n  noManifest["Packages/manifest.json not found"]',
      warnings: ['Packages/manifest.json not found']
    };
  }

  let manifest;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(raw);
  } catch (err) {
    return {
      mermaid: 'graph LR\n  parseError["Failed to parse manifest.json"]',
      warnings: [`Failed to parse manifest.json: ${err.message}`]
    };
  }

  const dependencies = manifest.dependencies || {};
  const entries = Object.entries(dependencies);

  if (entries.length === 0) {
    return {
      mermaid: 'graph LR\n  empty["No UPM dependencies declared"]',
      warnings: []
    };
  }

  // Sanitize a package name/version for Mermaid node ID
  function nodeId(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
  }

  // Determine if a dependency is local (file: prefix)
  function isLocal(version) {
    return typeof version === 'string' && version.startsWith('file:');
  }

  // Determine if a package is a Unity built-in package
  function isUnityBuiltin(name) {
    return name.startsWith('com.unity.');
  }

  // Short display name: strip com.unity. / com.the1studio. prefixes for readability
  function displayName(name, version) {
    const short = name
      .replace(/^com\.unity\./, 'unity/')
      .replace(/^com\.the1studio\./, 'the1studio/')
      .replace(/^com\./, '');
    return `${short}@${version}`;
  }

  const lines = ['graph LR'];

  // Project root node
  lines.push('  Project["Project"]');

  for (const [pkgName, version] of entries) {
    const id = nodeId(pkgName);
    const label = displayName(pkgName, version);
    const local = isLocal(version);
    const builtin = isUnityBuiltin(pkgName);

    // Node declaration with style hints in label
    if (local) {
      lines.push(`  ${id}["${label} (local)"]`);
    } else if (builtin) {
      lines.push(`  ${id}["${label}"]`);
    } else {
      lines.push(`  ${id}["${label}"]`);
    }

    // Edge from Project
    if (local) {
      lines.push(`  Project -.->|local| ${id}`);
    } else {
      lines.push(`  Project --> ${id}`);
    }
  }

  return { mermaid: lines.join('\n'), warnings };
}

module.exports = { extractPackages };
