import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as http from "http";

const PORT = 3050;

const problematicHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Short</title>
    <!-- Missing canonical -->
    <!-- Missing meta description -->
    <meta name="robots" content="noindex">
</head>
<body>
    <!-- Missing H1 -->
    <h2>Subheading 1</h2>
    <h3>Subheading 2</h3>
    <p>This is a test page with thin content. Apple apple apple apple apple.</p>
    <img src="test1.jpg" /> <!-- Missing alt -->
    <img src="test2.jpg" alt="" /> <!-- Empty alt -->
</body>
</html>
`;

// Create mock server
const server = http.createServer((req, res) => {
    if (req.url === "/problematic") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(problematicHtml);
    } else if (req.url === "/forbidden") {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Forbidden");
    } else if (req.url === "/redirect") {
        res.writeHead(302, { Location: "/problematic" });
        res.end();
    } else {
        res.writeHead(404);
        res.end("Not found");
    }
});

async function runTest() {
    console.log("Starting test harness...");

    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", "src/index.ts"],
        stderr: "inherit"
    });

    const client = new Client(
        { name: "test-client", version: "1.0.0" },
        { capabilities: {} }
    );

    try {
        console.log("Connecting to MCP Server...");
        await client.connect(transport);
        console.log("Connected.");

        const targetUrl = `http://localhost:${PORT}/problematic`;

        console.log(`\n--- Calling audit_technical_seo for ${targetUrl} ---`);
        const techResult = await client.callTool({
            name: "audit_technical_seo",
            arguments: { url: targetUrl }
        });
        console.log(JSON.stringify(techResult, null, 2));

        console.log(`\n--- Calling analyze_content_quality for ${targetUrl} ---`);
        const contentResult = await client.callTool({
            name: "analyze_content_quality",
            arguments: { url: targetUrl, target_keywords: ["apple", "test"] }
        });
        console.log(JSON.stringify(contentResult, null, 2));

        console.log(`\n--- Calling generate_fix_blueprint for ${targetUrl} ---`);
        const blueprintResult = await client.callTool({
            name: "generate_fix_blueprint",
            arguments: { url: targetUrl }
        });
        console.log(JSON.stringify(blueprintResult, null, 2));

        const forbiddenUrl = `http://localhost:${PORT}/forbidden`;
        console.log(`\n--- Calling audit_technical_seo for ${forbiddenUrl} (Testing 403) ---`);
        const forbiddenResult = await client.callTool({
            name: "audit_technical_seo",
            arguments: { url: forbiddenUrl }
        });
        console.log(JSON.stringify(forbiddenResult, null, 2));

        console.log("\nAll tests completed successfully.");
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        // Cleanup
        await transport.close();
        server.close();
        process.exit(0);
    }
}

server.listen(PORT, () => {
    console.log(`Mock server running at http://localhost:${PORT}`);
    runTest();
});
