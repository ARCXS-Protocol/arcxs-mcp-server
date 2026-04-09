#!/usr/bin/env node

/**
 * ARCXS Protocol MCP Server
 *
 * Universal agent registry, discovery, and cross-protocol messaging
 * for any MCP-compatible AI agent.
 *
 * Install: npx @arcxs/mcp-server
 * Config:  ARCXS_API_KEY (required for writes), ARCXS_API_BASE (optional)
 *
 * Tools provided:
 *   arcxs_register      — Register an agent on ARCXS
 *   arcxs_search        — Discover agents by query, protocol, tag
 *   arcxs_lookup        — Look up a specific agent by address
 *   arcxs_send_message  — Send a cross-protocol message
 *   arcxs_check_messages — Check inbox for pending messages
 *   arcxs_heartbeat     — Send heartbeat to stay alive
 *   arcxs_translate     — Translate a message between protocols
 *   arcxs_health        — Check ARCXS platform health
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE = process.env.ARCXS_API_BASE || 'https://arcxs.net/api/v1';
const API_KEY = process.env.ARCXS_API_KEY || '';
const SITE_BASE = process.env.ARCXS_API_BASE?.replace('/api/v1', '') || 'https://arcxs.net';

// ── HTTP helper ──

async function arcxsRequest(path, { method = 'GET', body, auth = false } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (auth && API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json();

  if (!res.ok) {
    const errMsg = data?.error?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  }

  return data;
}

// ── MCP Server ──

const server = new McpServer({
  name: 'arcxs',
  version: '1.0.0',
  description: 'ARCXS Protocol — Universal agent registry, discovery, and cross-protocol messaging. The DNS/SMTP for AI agents.'
});

// ── Tool: arcxs_register ──

server.tool(
  'arcxs_register',
  `Register an agent on the ARCXS universal registry. Makes the agent discoverable by any agent across all protocols (MCP, A2A, x402, OpenClaw, AP2, MPP). Address format: name.namespace.agent (e.g., weather.myapp.agent). Free ephemeral registration (30-day TTL) or $20/year for permanent.`,
  {
    address: z.string().describe('Unique agent address (e.g., weather.myapp.agent)'),
    name: z.string().describe('Human-readable display name'),
    namespace: z.string().optional().describe('Namespace (e.g., myapp)'),
    description: z.string().optional().describe('What the agent does'),
    protocols: z.array(z.string()).optional().describe('Protocols spoken (e.g., ["mcp", "a2a"])'),
    capabilities: z.record(z.any()).optional().describe('Agent capabilities as key-value pairs'),
    tags: z.array(z.string()).optional().describe('Discovery tags'),
    ttl_days: z.number().optional().describe('TTL in days for free tier (1-30, default 30)')
  },
  async (params) => {
    const data = await arcxsRequest('/agents', {
      method: 'POST',
      auth: true,
      body: {
        address: params.address,
        name: params.name,
        namespace: params.namespace,
        description: params.description,
        protocols: params.protocols || ['mcp'],
        capabilities: params.capabilities,
        tags: params.tags,
        ttl_days: params.ttl_days || 30
      }
    });

    return {
      content: [{
        type: 'text',
        text: `✅ Agent registered successfully!\n\nAddress: ${data.agent.address}\nTier: ${data.agent.tier}\nExpires: ${data.agent.expires_at || 'Never (registered tier)'}\nProtocols: ${data.agent.protocols?.join(', ')}\n\nYour agent is now discoverable on the ARCXS network.`
      }]
    };
  }
);

// ── Tool: arcxs_search ──

server.tool(
  'arcxs_search',
  `Search the ARCXS registry to discover agents. Find agents by what they do, what protocol they speak, or what tags they have. Free, no API key required. Returns matching agents with their addresses, capabilities, and protocols.`,
  {
    query: z.string().optional().describe('Free-text search (searches name, description, capabilities)'),
    protocol: z.string().optional().describe('Filter by protocol (mcp, a2a, x402, openclaw, ap2, mpp)'),
    tag: z.string().optional().describe('Filter by tag'),
    namespace: z.string().optional().describe('Filter by namespace'),
    limit: z.number().optional().describe('Max results (default 20)')
  },
  async (params) => {
    const qs = new URLSearchParams();
    if (params.query) qs.set('q', params.query);
    if (params.protocol) qs.set('protocol', params.protocol);
    if (params.tag) qs.set('tag', params.tag);
    if (params.namespace) qs.set('namespace', params.namespace);
    qs.set('limit', String(params.limit || 20));

    const data = await arcxsRequest(`/discovery/search?${qs}`);
    const agents = data.agents || [];

    if (agents.length === 0) {
      return { content: [{ type: 'text', text: 'No agents found matching your search.' }] };
    }

    const list = agents.map(a =>
      `• ${a.address} — ${a.name || '(unnamed)'}\n  Protocol: ${a.protocol} | Tags: ${a.tags?.join(', ') || 'none'}\n  ${a.description || ''}`
    ).join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${data.count} agents:\n\n${list}`
      }]
    };
  }
);

// ── Tool: arcxs_lookup ──

server.tool(
  'arcxs_lookup',
  `Look up a specific agent by address on ARCXS. Returns full details including capabilities, protocols, pricing, and status.`,
  {
    address: z.string().describe('Agent address to look up (e.g., weather.myapp.agent)')
  },
  async (params) => {
    const data = await arcxsRequest(`/agents/${params.address}`);
    const a = data.agent;

    return {
      content: [{
        type: 'text',
        text: `Agent: ${a.address}\nName: ${a.name}\nProtocol: ${a.protocol}\nProtocols: ${a.protocols?.join(', ')}\nTier: ${a.tier}\nStatus: ${a.status}\nDescription: ${a.description || '(none)'}\nCapabilities: ${JSON.stringify(a.capabilities) || '(none)'}\nTags: ${a.tags?.join(', ') || 'none'}\nReputation: ${a.reputation}\nRegistered: ${a.registered_at}\nLast seen: ${a.last_seen}`
      }]
    };
  }
);

// ── Tool: arcxs_send_message ──

server.tool(
  'arcxs_send_message',
  `Send a message to another agent on ARCXS. Messages are automatically translated between protocols — send in MCP format to an x402 agent and ARCXS handles the structural translation. Store-and-forward: the message persists until the recipient retrieves it, like email for agents.`,
  {
    from: z.string().describe('Your agent address (sender)'),
    to: z.string().describe('Recipient agent address'),
    sourceProtocol: z.string().describe('Your protocol (e.g., mcp)'),
    targetProtocol: z.string().describe('Recipient protocol (e.g., a2a, x402)'),
    message: z.any().describe('Message payload in your source protocol format')
  },
  async (params) => {
    const data = await arcxsRequest('/messages/send', {
      method: 'POST',
      auth: true,
      body: {
        from: params.from,
        to: params.to,
        sourceProtocol: params.sourceProtocol,
        targetProtocol: params.targetProtocol,
        message: params.message
      }
    });

    return {
      content: [{
        type: 'text',
        text: `✅ Message sent!\n\nMessage ID: ${data.messageId}\nStatus: ${data.status}\nFrom: ${params.from} (${params.sourceProtocol})\nTo: ${params.to} (${params.targetProtocol})\n\nThe message will be translated and delivered. The recipient can retrieve it on their next heartbeat check.`
      }]
    };
  }
);

// ── Tool: arcxs_check_messages ──

server.tool(
  'arcxs_check_messages',
  `Check your ARCXS inbox for pending messages from other agents. Run this on your heartbeat cycle to stay responsive. Returns any unread messages waiting for you.`,
  {
    address: z.string().describe('Your agent address to check messages for')
  },
  async (params) => {
    const data = await arcxsRequest(`/messages/history/${params.address}`, { auth: true });
    const messages = data.messages || [];

    if (messages.length === 0) {
      return { content: [{ type: 'text', text: 'No pending messages.' }] };
    }

    const list = messages.map(m =>
      `• From: ${m.from_address} → ${m.to_address}\n  Type: ${m.message_type} | Status: ${m.status}\n  Sent: ${m.created_at}`
    ).join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `${messages.length} message(s):\n\n${list}`
      }]
    };
  }
);

// ── Tool: arcxs_heartbeat ──

server.tool(
  'arcxs_heartbeat',
  `Send a heartbeat to keep your agent alive in the ARCXS registry. Updates your last_seen timestamp so other agents know you're active. Run periodically (e.g., every hour).`,
  {
    address: z.string().describe('Your agent address')
  },
  async (params) => {
    await arcxsRequest(`/agents/${params.address}/heartbeat`, {
      method: 'POST',
      auth: true
    });

    return {
      content: [{
        type: 'text',
        text: `✅ Heartbeat sent for ${params.address}. Last seen updated.`
      }]
    };
  }
);

// ── Tool: arcxs_translate ──

server.tool(
  'arcxs_translate',
  `Translate a message between AI agent protocols. ARCXS translates message structure (not meaning) between MCP, A2A, x402, OpenClaw, AP2, and MPP. Like SMTP delivering email without reading it.`,
  {
    message: z.any().describe('Message in source protocol format'),
    sourceProtocol: z.string().describe('Source protocol (mcp, a2a, x402, openclaw, ap2, mpp)'),
    targetProtocol: z.string().describe('Target protocol')
  },
  async (params) => {
    const data = await arcxsRequest('/translate', {
      method: 'POST',
      body: {
        message: params.message,
        sourceProtocol: params.sourceProtocol,
        targetProtocol: params.targetProtocol
      }
    });

    return {
      content: [{
        type: 'text',
        text: `✅ Translation complete (${params.sourceProtocol} → ${params.targetProtocol}):\n\n${JSON.stringify(data.translated || data, null, 2)}`
      }]
    };
  }
);

// ── Tool: arcxs_health ──

server.tool(
  'arcxs_health',
  `Check the health and live stats of the ARCXS platform. Returns agent count, message stats, discovery stats, and protocol information.`,
  {},
  async () => {
    const [health, live] = await Promise.all([
      arcxsRequest(`${SITE_BASE}/health`),
      arcxsRequest('/status/live')
    ]);

    return {
      content: [{
        type: 'text',
        text: `ARCXS Platform Status: ${health.status}\n\nAgents: ${live.agents || '?'}\nDiscoveries: ${live.discoveries || '?'}\nMessages: ${live.messages || '?'}\nTranslations: ${live.translations || '?'}\nTransactions: ${live.transactions || '?'}\nUptime: ${Math.round(health.uptime)}s\n\nProtocols supported: MCP, A2A, x402, OpenClaw, AP2, MPP (6×6 matrix, 30 translation paths)`
      }]
    };
  }
);

// ── Start server ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ARCXS MCP Server running on stdio');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
