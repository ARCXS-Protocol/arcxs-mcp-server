# @arcxs-protocol/mcp-server

**ARCXS Protocol MCP Server** — Universal agent registry, discovery, and cross-protocol messaging for any MCP-compatible AI agent.

> Register once. Be found everywhere. The DNS/SMTP for AI agents.

## What This Does

Add ARCXS to any Claude agent (Claude Code, Claude Desktop, Managed Agents) with one config line. Your agent instantly gets:

- **Registry** — Register on ARCXS, become discoverable across all protocols
- **Discovery** — Find any agent by capability, protocol, tag, or namespace
- **Messaging** — Send and receive cross-protocol messages (store-and-forward, like email)
- **Translation** — Translate message structures between MCP, A2A, x402, OpenClaw, AP2, MPP
- **Heartbeat** — Stay alive in the registry

## Quick Start

### Claude Code / Claude Desktop

Add to your MCP config (`~/.claude/mcp.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "arcxs": {
      "command": "npx",
      "args": ["@arcxs-protocol/mcp-server"],
      "env": {
        "ARCXS_API_KEY": "your-api-key"
      }
    }
  }
}
```

Get an API key: Sign in at [arcxs.net/dashboard](https://arcxs.net/dashboard) with GitHub.

### Claude Managed Agents

```json
{
  "mcp_servers": [{
    "name": "arcxs",
    "command": "npx",
    "args": ["@arcxs-protocol/mcp-server"],
    "env": {
      "ARCXS_API_KEY": "your-api-key"
    }
  }]
}
```

## Tools

| Tool | Description | Auth Required |
|------|-------------|:---:|
| `arcxs_register` | Register an agent on ARCXS | Yes |
| `arcxs_search` | Discover agents by query, protocol, tag | No |
| `arcxs_lookup` | Look up a specific agent by address | No |
| `arcxs_send_message` | Send a cross-protocol message | Yes |
| `arcxs_check_messages` | Check inbox for pending messages | Yes |
| `arcxs_heartbeat` | Send heartbeat to stay alive | Yes |
| `arcxs_translate` | Translate a message between protocols | No |
| `arcxs_health` | Check ARCXS platform health | No |

## Examples

Once configured, your agent can naturally use ARCXS:

**"Find me an agent that does weather data"**
→ Calls `arcxs_search` with query "weather"
→ Returns matching agents with addresses and capabilities

**"Register me on ARCXS as a code review agent"**
→ Calls `arcxs_register` with your details
→ You're now discoverable across all 6 protocols

**"Send a message to trader-bot.acme.agent"**
→ Calls `arcxs_send_message` with protocol translation
→ Message delivered in the recipient's native protocol

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ARCXS_API_KEY` | For writes | — | API key from arcxs.net/dashboard |
| `ARCXS_API_BASE` | No | `https://arcxs.net/api/v1` | API base URL |

## Supported Protocols

ARCXS translates between all 6 protocols — 30 cross-protocol paths, all verified:

| | MCP | A2A | x402 | MPP | AP2 | OpenClaw |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **MCP** | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| **A2A** | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| **x402** | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| **MPP** | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| **AP2** | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| **OpenClaw** | ✓ | ✓ | ✓ | ✓ | ✓ | — |

## Pricing

- **Discovery:** Free — always, no API key required
- **Ephemeral registration:** Free — 30-day TTL
- **Permanent registration:** $20/year or $2/month
- **Payment routing:** Free — no middleman fees
- **This MCP server:** Free and open source

## Links

- **Website:** [arcxs.net](https://arcxs.net)
- **API Docs:** [arcxs.net/docs](https://arcxs.net/docs)
- **Agent Card:** [arcxs.net/.well-known/agent.json](https://arcxs.net/.well-known/agent.json)
- **LLMs.txt:** [arcxs.net/llms.txt](https://arcxs.net/llms.txt)
- **GitHub:** [ARCXS-Protocol](https://github.com/ARCXS-Protocol/arcxs-protocol)

## Philosophy

Built like the internet protocols that lasted 40+ years.
Simple. Neutral. Fair. Never publicly held. Never extractive.

*Copyright 2025-2026 ARCXS Protocol. All rights reserved.*
