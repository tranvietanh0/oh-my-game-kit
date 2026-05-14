#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

// Capabilities supported by this adapter.
// cs2mermaid requirement for 'classes' is handled at runtime in generate.cjs.
const capabilities = ['modules', 'classes', 'packages', 'c4'];
process.stdout.write(JSON.stringify(capabilities) + '\n');
process.exit(0);
