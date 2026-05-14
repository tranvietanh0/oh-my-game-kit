---
name: omg-repomix
description: "Pack repositories into AI-friendly files (XML, Markdown, plain text). Use for codebase snapshots, LLM context preparation, security audits, third-party library analysis."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Repomix Skill

Repomix packs entire repositories into single, AI-friendly files. Perfect for feeding codebases to LLMs like Codex, ChatGPT, and Gemini.

## When to Use

Use when:
- Packaging codebases for AI analysis
- Creating repository snapshots for LLM context
- Analyzing third-party libraries
- Preparing for security audits
- Generating documentation context
- Investigating bugs across large codebases
- Creating AI-friendly code representations

## Quick Start

### Check Installation
```bash
repomix --version
```

### Install
```bash
# npm
npm install -g repomix

# Homebrew (macOS/Linux)
brew install repomix
```

### Basic Usage
```bash
# Package current directory (generates repomix-output.xml)
repomix

# Specify output format
repomix --style markdown
repomix --style json

# Package remote repository
npx repomix --remote owner/repo

# Custom output with filters
repomix --include "src/**/*.ts" --remove-comments -o output.md
```

## Core Capabilities

### Repository Packaging
- AI-optimized formatting with clear separators
- Multiple output formats: XML, Markdown, JSON, Plain text
- Git-aware processing (respects .gitignore)
- Token counting for LLM context management
- Security checks for sensitive information

### Remote Repository Support
Process remote repositories without cloning:
```bash
# Shorthand
npx repomix --remote yamadashy/repomix

# Full URL
npx repomix --remote https://github.com/owner/repo

# Specific commit
npx repomix --remote https://github.com/owner/repo/commit/hash
```

### Comment Removal
Strip comments from supported languages (HTML, CSS, JavaScript, TypeScript, Vue, Svelte, Python, PHP, Ruby, C, C#, Java, Go, Rust, Swift, Kotlin, Dart, Shell, YAML):
```bash
repomix --remove-comments
```

## Common Use Cases

### Code Review Preparation
```bash
# Package feature branch for AI review
repomix --include "src/**/*.ts" --remove-comments -o review.md --style markdown
```

### Security Audit
```bash
# Package third-party library
npx repomix --remote vendor/library --style xml -o audit.xml
```

### Documentation Generation
```bash
# Package with docs and code
repomix --include "src/**,docs/**,*.md" --style markdown -o context.md
```

### Bug Investigation
```bash
# Package specific modules
repomix --include "src/auth/**,src/api/**" -o debug-context.xml
```

### Implementation Planning
```bash
# Full codebase context
repomix --remove-comments --copy
```

## Command Line Reference

### File Selection
```bash
# Include specific patterns
repomix --include "src/**/*.ts,*.md"

# Ignore additional patterns
repomix -i "tests/**,*.test.js"

# Disable .gitignore rules
repomix --no-gitignore
```

### Output Options
```bash
# Output format
repomix --style markdown  # or xml, json, plain

# Output file path
repomix -o output.md

# Remove comments
repomix --remove-comments

# Copy to clipboard
repomix --copy
```

### Configuration
```bash
# Use custom config file
repomix -c custom-config.json

# Initialize new config
repomix --init  # creates repomix.config.json
```

## Token Management

Repomix automatically counts tokens for individual files, total repository, and per-format output.

Typical LLM context limits:
- Codex Sonnet: ~200K tokens
- GPT-4: ~128K tokens
- GPT-3.5: ~16K tokens

### Token Count Optimization
```bash
repomix --token-count-tree
repomix --token-count-tree 1000  # Only show files/directories with 1000+ tokens
```

## Security Considerations

Repomix uses Secretlint to detect sensitive data (API keys, passwords, credentials, private keys, AWS secrets).

Best practices:
1. Always review output before sharing
2. Use `.repomixignore` for sensitive files
3. Enable security checks for unknown codebases
4. Avoid packaging `.env` files
5. Check for hardcoded credentials

Disable security checks if needed:
```bash
repomix --no-security-check
```

## Implementation Workflow

When user requests repository packaging:

1. **Assess Requirements**
   - Identify target repository (local/remote)
   - Determine output format needed
   - Check for sensitive data concerns

2. **Configure Filters**
   - Set include patterns for relevant files
   - Add ignore patterns for unnecessary files
   - Enable/disable comment removal

3. **Execute Packaging**
   - Run repomix with appropriate options
   - Monitor token counts
   - Verify security checks

4. **Validate Output**
   - Review generated file
   - Confirm no sensitive data
   - Check token limits for target LLM

5. **Deliver Context**
   - Provide packaged file to user
   - Include token count summary
   - Note any warnings or issues

## Reference Documentation

For detailed information, see:
- [Configuration Reference](./references/configuration.md) - Config files, include/exclude patterns, output formats, advanced options
- [Usage Patterns](./references/usage-patterns.md) - AI analysis workflows, security audit preparation, documentation generation, library evaluation

## Additional Resources

- GitHub: https://github.com/yamadashy/repomix
- Documentation: https://repomix.com/guide/
- MCP Server: Available for AI assistant integration

## Tool Size Caps + Security Guards (E6)

When invoking `repomix`, this skill MUST enforce the following caps on every run:

- **Output size cap:** default `--max-output-size 8MB` (8 × 1024 × 1024 chars). Larger packs do not fit a single LLM context anyway. Override only when the user explicitly requests `--no-output-size-cap`.
- **Token-count guard:** if the post-pack token estimate exceeds `200_000`, refuse to deliver the file inline; instead write the path and report `'too large to inline; opened on disk at <path>'`.
- **Security check is FAIL-CLOSED, not fail-open:** the historical `--no-security-check` flag is a fail-OPEN default that ships secret-laden packs. This skill MUST pass `--security-check` (default), and MUST refuse `--no-security-check` unless the user types the literal phrase `I accept secret leak risk` in the same turn.
- **Guarded write:** packed file goes to `os.tmpdir()omg-repomix/<sha>.{xml,md,txt}` first; only after the security-check passes does the skill copy to the user-specified output path. Failure path leaves nothing in the destination.

These caps protect downstream consumers (LLM context budgets) and prevent the most common failure mode (accidentally packing `.env` or credential files into a session).
