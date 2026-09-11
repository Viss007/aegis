# Aegis

Fail-closed control layer for coding agents. MCP tool, not a chat app.

Hooks inject. Tools execute. File-exists is not a receipt. You do not certify.

## Tools

| Tool | Job |
| --- | --- |
| `land_inject` | Force LAND context this turn (`truth` + `act`) |
| `no_fake_done` | BLOCK a done-word with no live proof |
| `trust_freeze` | Freeze the seat after BLOCK |
| `decide` | Run the scar engine on a prompt |

## Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "aegis": {
      "command": "npx",
      "args": ["-y", "github:Viss007/aegis"]
    }
  }
}
```

Local clone:

```json
{
  "mcpServers": {
    "aegis": {
      "command": "node",
      "args": ["bin/aegis-mcp.mjs"]
    }
  }
}
```

Hook (inject, not a tool):

```json
{
  "version": 1,
  "hooks": {
    "beforeSubmitPrompt": [{ "command": "node hooks/land.cjs" }]
  }
}
```

## Scar

Same file on disk. No live proof.

- inject on → refuse. file-exists side door blocked.
- inject off → liar says DONE.

## HTTP

`POST /mcp` JSON-RPC. Same methods as stdio (`initialize`, `tools/list`, `tools/call`).
