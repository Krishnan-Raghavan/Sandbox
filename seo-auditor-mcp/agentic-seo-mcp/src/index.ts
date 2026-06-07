import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import modules from the rest of the application. 
// These modules should be implemented by other subagents.
import { crawlPage as crawlUrl } from "./crawler.js";
import { performTechnicalAudit, analyzeContent, createBlueprint } from "./auditor.js";

// Define the in-memory cache structure
interface AuditCacheEntry {
  crawlResult?: any;
  technicalAuditResult?: any;
  contentQualityResult?: any;
}

// In-memory cache to store results between tool calls
const auditCache = new Map<string, AuditCacheEntry>();

function getCacheEntry(url: string): AuditCacheEntry {
  if (!auditCache.has(url)) {
    auditCache.set(url, {});
  }
  return auditCache.get(url)!;
}

// Initialize the MCP Server
const server = new Server(
  {
    name: "seo-auditor-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register the ListToolsRequestHandler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "audit_technical_seo",
        description: "Perform a technical SEO audit on a given URL.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to audit",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "analyze_content_quality",
        description: "Analyze the content quality of a given URL against target keywords.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to analyze",
            },
            target_keywords: {
              type: "array",
              items: {
                type: "string",
              },
              description: "List of target keywords to check against",
            },
          },
          required: ["url", "target_keywords"],
        },
      },
      {
        name: "generate_fix_blueprint",
        description: "Generate an SEO fix blueprint in Markdown for a given URL based on prior audits.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to generate the blueprint for",
            },
          },
          required: ["url"],
        },
      },
    ],
  };
});

// Register the CallToolRequestHandler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "audit_technical_seo": {
      if (!args || typeof args.url !== "string") {
        throw new Error("Invalid arguments: url is required and must be a string");
      }
      const url = args.url;
      console.error(`Running technical SEO audit for: ${url}`);

      try {
        // Step 1: Crawl the URL
        const crawlResult = await crawlUrl(url);
        
        // Step 2: Perform the technical audit
        const technicalAuditResult = await performTechnicalAudit(crawlResult);

        // Update the cache for subsequent tool calls
        const cacheEntry = getCacheEntry(url);
        cacheEntry.crawlResult = crawlResult;
        cacheEntry.technicalAuditResult = technicalAuditResult;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(technicalAuditResult, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(`Error in audit_technical_seo: ${error.message}`);
        return {
          content: [{ type: "text", text: `Error during technical audit: ${error.message}` }],
          isError: true,
        };
      }
    }

    case "analyze_content_quality": {
      if (!args || typeof args.url !== "string" || !Array.isArray(args.target_keywords)) {
        throw new Error("Invalid arguments: url (string) and target_keywords (string[]) are required");
      }
      const url = args.url;
      const targetKeywords = args.target_keywords as string[];
      console.error(`Analyzing content quality for: ${url} with keywords: ${targetKeywords.join(", ")}`);

      try {
        let crawlResult;
        const cacheEntry = getCacheEntry(url);
        
        // Use cached crawl result if available, otherwise crawl anew
        if (cacheEntry.crawlResult) {
          crawlResult = cacheEntry.crawlResult;
        } else {
          crawlResult = await crawlUrl(url);
          cacheEntry.crawlResult = crawlResult;
        }

        // Analyze content
        const contentQualityResult = await analyzeContent(crawlResult, targetKeywords);

        // Update cache
        cacheEntry.contentQualityResult = contentQualityResult;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(contentQualityResult, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(`Error in analyze_content_quality: ${error.message}`);
        return {
          content: [{ type: "text", text: `Error during content quality analysis: ${error.message}` }],
          isError: true,
        };
      }
    }

    case "generate_fix_blueprint": {
      if (!args || typeof args.url !== "string") {
        throw new Error("Invalid arguments: url is required and must be a string");
      }
      const url = args.url;
      console.error(`Generating fix blueprint for: ${url}`);

      try {
        const cacheEntry = getCacheEntry(url);
        
        if (!cacheEntry.crawlResult || !cacheEntry.technicalAuditResult) {
          return {
            content: [
              {
                type: "text",
                text: "Insufficient data to generate blueprint. Please run audit_technical_seo first.",
              },
            ],
            isError: true,
          };
        }

        // Generate the blueprint using the cached results
        const blueprint = await createBlueprint({
          url,
          crawlResult: cacheEntry.crawlResult,
          technicalAuditResult: cacheEntry.technicalAuditResult,
          contentQualityResult: cacheEntry.contentQualityResult,
        });

        return {
          content: [
            {
              type: "text",
              text: blueprint,
            },
          ],
        };
      } catch (error: any) {
        console.error(`Error in generate_fix_blueprint: ${error.message}`);
        return {
          content: [{ type: "text", text: `Error generating blueprint: ${error.message}` }],
          isError: true,
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server using stdio transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SEO Auditor MCP Server is running on stdio");
}

run().catch((error) => {
  console.error("Fatal error starting the server:", error);
  process.exit(1);
});
