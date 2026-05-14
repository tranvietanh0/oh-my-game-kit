---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
---

# URP Debugging Guide

## Common URP Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Pink/magenta material | Shader error or missing shader | Check Console; add `"RenderPipeline"="UniversalPipeline"` tag |
| Black objects | Missing lighting or normals | Check normals; ensure Light in scene |
| White/washed terrain, no vertex colors | 2D Renderer instead of Forward Renderer | Set `m_RendererType: 0` in URP asset |
| Blue tint on terrain | Skybox SH ambient dominates | Reduce ambient intensity |
| Bright impostor atlas | URP Forward has no GBuffer pass | Use custom MRT shader; see `amplify-impostors` skill |
| SRP Batcher not working | CBUFFER mismatch between passes | Match `CBUFFER_START(UnityPerMaterial)` in all passes |
| Shadows missing | Shadow distance too short | Increase Shadow Distance in URP Asset |
