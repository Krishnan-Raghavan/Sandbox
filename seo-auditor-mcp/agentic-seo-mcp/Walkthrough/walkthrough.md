# SEO Auditor MCP Server Walkthrough

The "Agentic SEO Skill & Content Auditor" MCP server has been successfully built, tested, and is now ready for production use.

## Architecture

We defined three concurrent subagents to build the specialized components of the MCP server:
1. **Crawler (`src/crawler.ts`)**: Uses `axios` and `cheerio` to fetch the HTML, parse DOM elements (H1-H6, Meta tags, Canonical tags), evaluate robots directives, strip styles/scripts, and extract the main text body and images. Handles network failures and `403` gracefully.
2. **Auditor (`src/auditor.ts`)**: Analyzes the raw parsed results. Performs validation on string lengths (Title/Meta), calculates keyword densities, detects keyword stuffing (>5%), spots thin content (< 300 words), flags missing alt texts, and synthesizes these into a Markdown Action Blueprint.
3. **Protocol-Wiring (`src/index.ts`)**: Wires the two modules to the `@modelcontextprotocol/sdk`. Uses a memory cache (`Map`) keyed by the URL to retain the state of the crawl across multiple tool calls, enabling the `generate_fix_blueprint` to access previous results seamlessly. Runs over standard Stdio Transport.

## Testing and Verification

We created a custom `test-harness.ts` that spawns an in-memory Node.js HTTP server mapping problematic routes.

We then booted the new MCP server as a child process and utilized the `@modelcontextprotocol/sdk/client` to execute the three tools:
1. `audit_technical_seo`
2. `analyze_content_quality`
3. `generate_fix_blueprint`

### Results
> [!SUCCESS]
> The automated test passed perfectly! 

The system accurately found all seeded errors in the Mock server, including:
- Missing `H1`, `title` character length warnings, missing canonicals.
- *Thin content* detection (17 words detected on mock page).
- *Keyword stuffing* detection (Apple density was 29.41%).
- Missing descriptive `alt` texts on images.
- A fully aggregated, formatted Markdown Blueprint mapped exactly to the mock data.
- Graceful error handling for the `/forbidden` (403 HTTP status) endpoint.

You can run the test harness yourself locally:
```bash
npx tsx test-harness.ts
```

## Available Tools

Your MCP Server exposes the following tools to the Agent Client:
- `audit_technical_seo(url: string)`
- `analyze_content_quality(url: string, target_keywords: string[])`
- `generate_fix_blueprint(url: string)`

The workspace is fully completed and ready for use!
