#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

const requirements = [
  {
    tool: 'mermaid-cli',
    checkCommand: 'mmdc --version',
    installHint: 'npm install -g @mermaid-js/mermaid-cli'
  },
  {
    tool: 'cs2mermaid',
    checkCommand: 'cs2mmd --version',
    installHint: 'dotnet tool install -g Cs2Mermaid --version 0.6.0 (requires .NET 8 SDK: https://dotnet.microsoft.com/download/dotnet/8.0)',
    prerequisite: {
      name: '.NET 8 SDK',
      checkCommand: 'dotnet --list-sdks',
      minVersion: '8.0.0',
      installHintUrl: 'https://dotnet.microsoft.com/download/dotnet/8.0'
    }
  }
];

process.stdout.write(JSON.stringify(requirements, null, 2) + '\n');
process.exit(0);
