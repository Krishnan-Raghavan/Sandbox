# Agentic SEO Skill & Content Auditor MCP Server

Welcome to the **Agentic SEO Auditor MCP Server**. This commercial-grade Node.js/TypeScript application implements the Model Context Protocol (MCP) to provide AI agents with advanced technical SEO auditing and content quality analysis tools.

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### 1. Installation

First, clone or navigate to the project directory, then install the dependencies:

```bash
cd agentic-seo-mcp
npm install
```

This will install the core dependencies including `@modelcontextprotocol/sdk`, `axios`, `cheerio`, and development utilities like `typescript` and `tsx`.

### 2. Verify with the Test Harness

We have included a comprehensive local test harness that mocks an HTTP server (to simulate a problematic web page without external network dependency) and uses the MCP Client SDK to communicate with our new server via Stdio transport.

To run the verification suite:

```bash
npx tsx test-harness.ts
```

> [!SUCCESS]
> If everything is working correctly, you will see a console output detailing the successful connections, the JSON outputs from the tool calls, and a generated SEO Fix Blueprint Markdown report!

---

## 🛠️ Configuring the MCP Server

To use this server with any MCP-compatible AI Assistant (like Claude Desktop, Cursor, or Gemini), you need to configure your assistant to spawn this application using Stdio transport.

### Example Configuration

Add the following to your MCP client's configuration file (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "seo-auditor": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/agentic-seo-mcp/src/index.ts"
      ]
    }
  }
}
```
*(Make sure to replace `/absolute/path/to/agentic-seo-mcp/src/index.ts` with the actual path on your machine).*

---

## 🧰 Available Tools

Once the server is connected, the following three tools are exposed to the AI agent:

### 1. `audit_technical_seo`
- **Description:** Performs a technical SEO audit on a given URL.
- **Input Schema:** `{ "url": "string" }`
- **Output:** Returns a JSON object containing technical `issues` and `warnings` (e.g., missing Canonical tags, missing H1s, improper Title tag lengths, blocked robots directives).

### 2. `analyze_content_quality`
- **Description:** Analyzes the content quality of a given URL against target keywords.
- **Input Schema:** `{ "url": "string", "target_keywords": ["string"] }`
- **Output:** Extracts the visible text body and images. Returns a JSON object detailing Keyword Densities, Keyword Stuffing warnings (>5%), Thin Content warnings (< 300 words), and missing Image Alt attributes.

### 3. `generate_fix_blueprint`
- **Description:** Generates an SEO fix blueprint in Markdown for a given URL based on prior audits.
- **Input Schema:** `{ "url": "string" }`
- **Output:** Automatically synthesizes the cached state of the previous two tools into an actionable, step-by-step developer remediation blueprint in standard Markdown.

---

> [!NOTE]
> **State Management:** The `generate_fix_blueprint` tool relies on the in-memory cache of the MCP server. You must call `audit_technical_seo` and `analyze_content_quality` on a URL *before* attempting to generate the blueprint for that URL.
