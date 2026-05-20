#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=base | protected=false
'use strict';

// Declares the set of capabilities this adapter implements.
// Per-project tool availability (ts-morph, dependency-cruiser) is checked at generate time,
// not here — missing tools are reported via capabilities_skipped in generate.cjs output.
const capabilities = ['classes', 'modules', 'scenes', 'prefabs'];
process.stdout.write(JSON.stringify(capabilities) + '\n');
process.exit(0);
