---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Unity MCP Tool Creator — Full Templates

## C# Handler Template

File: `MCPForUnity/Editor/Tools/Manage<Domain>.cs`

```csharp
using [YourMCPNamespace].Editor.Helpers;
using Newtonsoft.Json.Linq;

namespace [YourMCPNamespace].Editor.Tools
{
    [McpForUnityTool("manage_<domain>", AutoRegister = true)]
    public static class Manage<Domain>
    {
        public static object HandleCommand(JObject @params)
        {
            if (@params == null)
                return new ErrorResponse("Parameters cannot be null.");

            var p = new ToolParams(@params);
            var actionResult = p.GetRequired("action");
            if (!actionResult.IsSuccess)
                return new ErrorResponse(actionResult.ErrorMessage);

            string action = actionResult.Value.ToLowerInvariant();

            try
            {
                return action switch
                {
                    "action_name" => ActionName(p),
                    _ => new ErrorResponse($"Unknown action: '{action}'.")
                };
            }
            catch (System.Exception ex)
            {
                return new ErrorResponse($"Error in {action}: {ex.Message}");
            }
        }

        private static object ActionName(ToolParams p)
        {
            // Implementation
            return new SuccessResponse("Done.", new { /* data */ });
        }
    }
}
```

## Python MCP Registration Template

File: `Server/src/services/tools/manage_<domain>.py`

```python
from typing import Annotated, Any, Literal
from fastmcp import Context
from mcp.types import ToolAnnotations
from services.registry import mcp_for_unity_tool
from services.tools import get_unity_instance_from_context
from transport.unity_transport import send_with_unity_instance
from transport.legacy.unity_connection import async_send_command_with_retry

@mcp_for_unity_tool(
    description="Brief description of what this tool does. Actions: action1, action2.",
    annotations=ToolAnnotations(title="Manage Domain"),
)
async def manage_<domain>(
    ctx: Context,
    action: Annotated[Literal["action1", "action2"], "Action to perform."],
    param1: Annotated[str, "Description"] | None = None,
) -> dict[str, Any]:
    unity_instance = get_unity_instance_from_context(ctx)
    params = {"action": action}
    if param1 is not None:
        params["param1"] = param1
    params = {k: v for k, v in params.items() if v is not None}

    try:
        response = await send_with_unity_instance(
            async_send_command_with_retry, unity_instance,
            "manage_<domain>", params
        )
        if isinstance(response, dict) and response.get("success"):
            return {
                "success": True,
                "message": response.get("message", "Operation successful."),
                "data": response.get("data"),
            }
        return response if isinstance(response, dict) else {"success": False, "message": str(response)}
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}
```

## C# Parameter Helpers (`ToolParams`)

| Method | Returns | Notes |
|--------|---------|-------|
| `p.GetRequired("key")` | `Result<string>` | Check `.IsSuccess` |
| `p.Get("key", "default")` | `string` | With fallback |
| `p.GetInt("key")` | `int?` | Nullable |
| `p.GetFloat("key")` | `float?` | Nullable |
| `p.GetBool("key", false)` | `bool` | With default |
| `p.GetStringArray("key")` | `string[]` | Array |
| `p.GetRaw("key")` | `JToken` | Raw JSON token |

## C# Response Types

```csharp
new SuccessResponse("message", dataObject)  // success=true
new ErrorResponse("message")                // success=false
new PendingResponse("message", pollInterval) // for long-running ops
```

## Attribute Options

```csharp
[McpForUnityTool("manage_foo", AutoRegister = true, RequiresPolling = true)]
// AutoRegister = true  — auto-register with FastMCP (default)
// RequiresPolling = true — for long-running tools
// Name auto-derived from class: ManageFoo → manage_foo
```

## Conditional Compilation

```csharp
#if UNITY_ENTITIES
// DOTS-specific code
#endif
// Common defines: UNITY_ENTITIES, UNITY_PHYSICS, UNITY_PROBUILDER
```

## Conventions

1. **Naming**: C# `Manage<Domain>` → Python `manage_<domain>` → MCP tool `manage_<domain>`
2. **Action-based routing**: All tools use `action` as first discriminator
3. **Snake_case params**: Python sends snake_case; C# `ToolParams` auto-resolves both casings
4. **Paging**: Support `page_size` + `cursor` params, return `next_cursor` for large results
5. **Studio-specific tools**: Create new files (don't modify upstream) to minimize merge conflicts
6. **Editor-only**: All C# tool code under `Editor/` — never reference from Runtime assemblies

## Verification Checklist

After creating a tool:
1. Check Unity console for compilation errors (`read_console`)
2. Test via MCP: call the tool with each action
3. Verify Python server logs tool registration on startup
