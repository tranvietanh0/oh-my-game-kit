#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

/**
 * unity-stereotype-postprocessor.cjs
 *
 * Injects Unity-specific stereotypes and annotations into Mermaid classDiagram output
 * produced by Cs2Mermaid. Detection is regex-based against the original .cs source files
 * (SSOT — source file, not Mermaid). The Mermaid output is then augmented.
 *
 * Exports:
 *   postprocess(mermaidSource, csFiles) -> { mermaid: string, warnings: string[] }
 *
 * Detection rules (see references/unity-stereotypes.md for full spec):
 *   MonoBehaviour     -> class X { <<MonoBehaviour>> }
 *   ScriptableObject  -> class X { <<ScriptableObject>> }
 *   [SerializeField]  -> field label appended {serialized}
 *   [RequireComponent] -> X ..> Y : requires
 *   IComponentData    -> class X { <<IComponentData>> }
 *   ISystem/ISystemStartStop -> class X { <<ISystem>> }
 *   IAspect           -> class X { <<IAspect>> }
 *   IBufferElementData -> class X { <<IBufferElementData>> }
 *   [CreateAssetMenu] -> class X {asset} (label annotation)
 *   [ExecuteAlways]/[ExecuteInEditMode] -> note on class
 */

const fs = require('fs');
const path = require('path');

// Patterns keyed by stereotype name. Each has:
//   classPattern: regex to find class name from CS source (capture group 1)
//   stereotype: string to inject as <<Stereotype>>
const STEREOTYPE_PATTERNS = [
  {
    name: 'MonoBehaviour',
    // Matches: class X : MonoBehaviour  or class X : SomeBase, MonoBehaviour
    classPattern: /\bclass\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bMonoBehaviour\b/g,
    stereotype: 'MonoBehaviour'
  },
  {
    name: 'ScriptableObject',
    classPattern: /\bclass\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bScriptableObject\b/g,
    stereotype: 'ScriptableObject'
  },
  {
    name: 'IComponentData',
    classPattern: /\b(?:class|struct)\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bIComponentData\b/g,
    stereotype: 'IComponentData'
  },
  {
    name: 'IBufferElementData',
    classPattern: /\b(?:class|struct)\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bIBufferElementData\b/g,
    stereotype: 'IBufferElementData'
  },
  {
    name: 'ISystem',
    // Matches ISystem or ISystemStartStop
    classPattern: /\b(?:class|struct)\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bISystem(?:StartStop)?\b/g,
    stereotype: 'ISystem'
  },
  {
    name: 'IAspect',
    classPattern: /\b(?:class|struct)\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bIAspect\b/g,
    stereotype: 'IAspect'
  }
];

// Pattern for [CreateAssetMenu] — detect class name that has this attribute
const CREATE_ASSET_MENU_PATTERN = /\[CreateAssetMenu[^\]]*\]\s*(?:\/\/[^\n]*)?\n\s*(?:public\s+)?class\s+(\w+)/g;

// Pattern for [SerializeField] fields — detect field name  
const SERIALIZE_FIELD_PATTERN = /\[SerializeField[^\]]*\]\s*(?:\/\/[^\n]*)?\n?\s*(?:private|protected|internal|public)?\s+\w+(?:<[^>]*>)?\s+(\w+)/g;

// Pattern for [RequireComponent(typeof(X))] 
const REQUIRE_COMPONENT_PATTERN = /\[RequireComponent\s*\(\s*typeof\s*\(\s*(\w+)\s*\)\s*\)\s*\]\s*(?:\/\/[^\n]*)?\n?\s*(?:public\s+)?class\s+(\w+)/g;

// Pattern for [ExecuteAlways] / [ExecuteInEditMode]
const EXECUTE_ALWAYS_PATTERN = /\[(ExecuteAlways|ExecuteInEditMode)\]\s*(?:\/\/[^\n]*)?\n?\s*(?:public\s+)?class\s+(\w+)/g;

/**
 * Scan CS files and extract stereotype information.
 *
 * @param {string[]} csFiles - array of absolute paths to .cs files
 * @returns {{
 *   stereotypes: Map<string, string[]>,   // className -> [stereotype1, stereotype2]
 *   serializedFields: Map<string, string[]>, // className -> [fieldName1, ...]
 *   requireComponents: Array<{host: string, required: string}>,
 *   assetMenuClasses: Set<string>,
 *   executeAlwaysClasses: Set<string>
 * }}
 */
function scanCsFiles(csFiles) {
  const stereotypes = new Map();
  const serializedFields = new Map();
  const requireComponents = [];
  const assetMenuClasses = new Set();
  const executeAlwaysClasses = new Set();

  function addStereotype(className, stereotype) {
    if (!stereotypes.has(className)) stereotypes.set(className, []);
    const existing = stereotypes.get(className);
    if (!existing.includes(stereotype)) existing.push(stereotype);
  }

  for (const csFile of csFiles) {
    let content;
    try {
      content = fs.readFileSync(csFile, 'utf8');
    } catch {
      continue;
    }

    // Detect stereotypes via inheritance
    for (const rule of STEREOTYPE_PATTERNS) {
      let match;
      const re = new RegExp(rule.classPattern.source, rule.classPattern.flags);
      while ((match = re.exec(content)) !== null) {
        addStereotype(match[1], rule.stereotype);
      }
    }

    // Detect [CreateAssetMenu]
    {
      let match;
      const re = new RegExp(CREATE_ASSET_MENU_PATTERN.source, CREATE_ASSET_MENU_PATTERN.flags);
      while ((match = re.exec(content)) !== null) {
        assetMenuClasses.add(match[1]);
      }
    }

    // Detect [SerializeField] — we need class context
    // Simple approach: find class name from file, then find serialized fields within
    const classMatches = [...content.matchAll(/\b(?:class|struct)\s+(\w+)/g)];
    const classNames = classMatches.map(m => m[1]);

    {
      let match;
      const re = new RegExp(SERIALIZE_FIELD_PATTERN.source, SERIALIZE_FIELD_PATTERN.flags);
      while ((match = re.exec(content)) !== null) {
        const fieldName = match[1];
        // Associate with first class in file (simple heuristic — good enough for post-processor)
        const className = classNames[0] || 'unknown';
        if (!serializedFields.has(className)) serializedFields.set(className, []);
        serializedFields.get(className).push(fieldName);
      }
    }

    // Detect [RequireComponent]
    {
      let match;
      const re = new RegExp(REQUIRE_COMPONENT_PATTERN.source, REQUIRE_COMPONENT_PATTERN.flags);
      while ((match = re.exec(content)) !== null) {
        requireComponents.push({ required: match[1], host: match[2] });
      }
    }

    // Detect [ExecuteAlways] / [ExecuteInEditMode]
    {
      let match;
      const re = new RegExp(EXECUTE_ALWAYS_PATTERN.source, EXECUTE_ALWAYS_PATTERN.flags);
      while ((match = re.exec(content)) !== null) {
        executeAlwaysClasses.add(match[2]);
      }
    }
  }

  return { stereotypes, serializedFields, requireComponents, assetMenuClasses, executeAlwaysClasses };
}

/**
 * Inject stereotype into a Mermaid classDiagram block.
 * Looks for "class ClassName {" lines and inserts "<<Stereotype>>" as first member.
 *
 * @param {string} mermaid - the Mermaid source
 * @param {string} className - class name to annotate
 * @param {string} stereotype - stereotype text (without <<>>)
 * @returns {string} modified Mermaid source
 */
function injectStereotype(mermaid, className, stereotype) {
  const annotationLine = `    <<${stereotype}>>`;
  // Try to find existing class block: "class ClassName {" 
  const openRe = new RegExp(`(\\bclass\\s+${escapeRegex(className)}\\s*\\{)`, 'g');
  if (openRe.test(mermaid)) {
    return mermaid.replace(
      new RegExp(`(\\bclass\\s+${escapeRegex(className)}\\s*\\{)`, 'g'),
      `$1\n${annotationLine}`
    );
  }
  // Class declared without braces — append a block
  const simpleRe = new RegExp(`(\\bclass\\s+${escapeRegex(className)})(?!\\s*\\{)`, 'g');
  if (simpleRe.test(mermaid)) {
    return mermaid.replace(
      new RegExp(`(\\bclass\\s+${escapeRegex(className)})(?!\\s*\\{)`, 'g'),
      `$1 {\n${annotationLine}\n  }`
    );
  }
  return mermaid;
}

/**
 * Mark a specific field as serialized in Mermaid output.
 * Appends " {serialized}" to the field line if found.
 */
function markSerializedField(mermaid, className, fieldName) {
  // Field lines look like: "  +fieldName : Type" or "  -fieldName : Type"
  const re = new RegExp(`([ \\t]+[+\\-#~]?${escapeRegex(fieldName)}(?:\\s*:.*)?)(\\n|$)`, 'g');
  return mermaid.replace(re, `$1 {serialized}$2`);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main post-processing function.
 *
 * @param {string} mermaidSource - the raw Mermaid output from cs2mmd
 * @param {string[]} csFiles - absolute paths to the .cs files that were processed
 * @returns {{ mermaid: string, warnings: string[] }}
 */
function postprocess(mermaidSource, csFiles) {
  const warnings = [];

  if (!mermaidSource || typeof mermaidSource !== 'string') {
    return { mermaid: '', warnings: ['Empty or invalid Mermaid source'] };
  }

  const { stereotypes, serializedFields, requireComponents, assetMenuClasses, executeAlwaysClasses } =
    scanCsFiles(csFiles);

  let mermaid = mermaidSource;

  // Inject stereotypes
  for (const [className, stypes] of stereotypes) {
    for (const stereotype of stypes) {
      mermaid = injectStereotype(mermaid, className, stereotype);
    }
  }

  // Mark [CreateAssetMenu] classes with {asset} note
  for (const className of assetMenuClasses) {
    // Add note after class definition if possible
    const noteRe = new RegExp(`(class\\s+${escapeRegex(className)}\\s*\\{[^}]*?)\\}`, 's');
    if (noteRe.test(mermaid)) {
      mermaid = mermaid.replace(noteRe, `$1  note: asset\n  }`);
    }
  }

  // Mark [ExecuteAlways] / [ExecuteInEditMode] classes
  for (const className of executeAlwaysClasses) {
    const noteRe = new RegExp(`(class\\s+${escapeRegex(className)}\\s*\\{[^}]*?)\\}`, 's');
    if (noteRe.test(mermaid)) {
      mermaid = mermaid.replace(noteRe, `$1  note: executes in edit mode\n  }`);
    }
  }

  // Mark serialized fields
  for (const [className, fields] of serializedFields) {
    for (const fieldName of fields) {
      mermaid = markSerializedField(mermaid, className, fieldName);
    }
  }

  // Add RequireComponent edges
  const requireEdges = [];
  for (const { host, required } of requireComponents) {
    requireEdges.push(`  ${host} ..> ${required} : requires`);
  }
  if (requireEdges.length > 0) {
    mermaid = mermaid + '\n' + requireEdges.join('\n');
  }

  return { mermaid, warnings };
}

module.exports = { postprocess, scanCsFiles };
