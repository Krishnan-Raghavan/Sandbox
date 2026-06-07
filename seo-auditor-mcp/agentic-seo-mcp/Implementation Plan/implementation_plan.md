# Goal Description

Build a commercial-grade "Agentic SEO Skill & Content Auditor" MCP (Model Context Protocol) Server in TypeScript (Node.js). The server will expose three tools:
1. `audit_technical_seo(url: string)`
2. `analyze_content_quality(url: string, target_keywords: string[])`
3. `generate_fix_blueprint(url: string)`

The development will be executed using three specialized concurrent subagents (Crawler, Auditor, Protocol-Wiring) to handle web scraping, analysis logic, and MCP schema mapping respectively. We will also build a robust local test harness to verify the entire system.

## User Review Required

- **Subagent Delegation:** I will use the `define_subagent` and `invoke_subagent` tools to spawn three agents (Crawler, Auditor, Protocol-Wiring). They will independently write components for the system. I will then review and integrate their outputs.
- **Testing Approach:** A local test harness (`test-harness.ts`) will mock a target HTTP server locally (to simulate a problematic web page without external network dependency) and use the MCP Client SDK to communicate with our new server via Stdio transport. Is this acceptable?

## Open Questions

- Should the mock server test specific edge cases like 403 Forbidden, redirects, or just a standard problematic HTML structure?
- For `generate_fix_blueprint(url: string)`, should the aggregated state from the previous two tool calls be stored in memory keyed by URL, or should the user's client be expected to pass the previous JSON results? (Currently, the prompt implies the tool processes aggregated results, which suggests the server keeps state of recent crawls per URL).

## Proposed Changes

### Configuration
#### [NEW] [tsconfig.json](file:///f:/Sandbox/seo-auditor-mcp/agentic-seo-mcp/tsconfig.json)
Standard Node 20 TypeScript config.

### Source Code
#### [NEW] [src/crawler.ts](file:///f:/Sandbox/seo-auditor-mcp/agentic-seo-mcp/src/crawler.ts)
(Assigned to Subagent: Crawler)
Exports utilities to fetch URLs with Axios, parse HTML with Cheerio, extract title, meta, robots.txt directives, headers, and text bodies. Handles network timeouts and simple errors.

#### [NEW] [src/auditor.ts](file:///f:/Sandbox/seo-auditor-mcp/agentic-seo-mcp/src/auditor.ts)
(Assigned to Subagent: Auditor)
Exports the evaluation logic: checking status codes, H1-H6 hierarchy, keyword density calculation, content thinness checks, missing alt texts, and the template generation for the markdown fix-it blueprint.

#### [NEW] [src/index.ts](file:///f:/Sandbox/seo-auditor-mcp/agentic-seo-mcp/src/index.ts)
(Assigned to Subagent: Protocol-Wiring)
Instantiates the MCP `Server` with `@modelcontextprotocol/sdk`. Exposes the three tools with their schemas. Glues the Crawler and Auditor modules together. Sets up StdioServerTransport.

### Testing
#### [NEW] [test-harness.ts](file:///f:/Sandbox/seo-auditor-mcp/agentic-seo-mcp/test-harness.ts)
Spawns a local Express or simple Node HTTP server to serve a problematic webpage.
Boots the compiled MCP server as a child process using Stdio transport.
Invokes the 3 tools via an MCP Client instance.
Asserts the output structures and validates the blueprint markdown generation.

## Verification Plan

### Automated Tests
- Run `npx tsx test-harness.ts` to execute the full end-to-end MCP client-server integration test with a mock problematic page.

### Manual Verification
- Review the generated Artifact logs checklist showing all completed checks and their passing states.
