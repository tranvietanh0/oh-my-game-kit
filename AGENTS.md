# Oh My Game Kit

This repository builds a Codex-native game development kit. Keep the kit portable, compact, and safe to install into user projects.

## Engineering Rules

- Prefer project-local Codex skills in `.agents/skills/<name>/SKILL.md`.
- Keep every `SKILL.md` concise. Put long domain details in one-level `references/` files.
- Use only `name` and `description` in skill frontmatter.
- Prefix kit-owned skills with `omg-`.
- Do not overwrite user instructions outside managed blocks.
- Do not delete user Codex config or third-party skills during fresh installs.

## Unity Rules

- Treat Unity MCP operations as stateful editor operations. Inspect state before mutating scenes, assets, or scripts.
- After C# script edits, request a script refresh/compile and read the Unity console before reporting success.
- Avoid broad Unity asset reimports. Prefer targeted refreshes and targeted asset operations.

## Verification

Run these before reporting kit changes complete:

```bash
npm run validate
npm test
```
