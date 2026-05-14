---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Workflow: Session

Use this when: user wants to open or switch to an existing worktree session.

```bash
node $HOME/.agents/skillsomg-worktree/scripts/worktree.cjs session "<NAME>" --json
```

Reports: worktree path, branch, session command (`cd <path> && codex`).
Then execute the session command for the user.
