# Goal Description

The goal is to upgrade the SEO Auditor from a single-page rule-based scanner into an enterprise-grade SEO application featuring site-wide crawling, LLM-powered AI recommendations, Google Lighthouse speed metrics, historical database tracking, and PDF reporting.

Because this is a massive undertaking involving completely new backend systems, we will execute this in phases to ensure stability.

## User Review Required

> [!WARNING]
> Implementing all five features simultaneously introduces significant complexity. I strongly recommend we tackle this in phases.

**Proposed Phased Approach:**

### Phase 1: AI Integration & PDF Export
- **AI LLM Integration:** We will integrate the Google Gemini SDK into the backend. Instead of generic warnings, the AI will read the HTML and generate exact, rewrite-ready suggestions (e.g., "Change your title to: X").
- **PDF Export:** We will add a button to the Hacker UI to generate and download the full audit (including AI suggestions) as a PDF report.

### Phase 2: Core Web Vitals (Lighthouse)
- **Speed Testing:** We will integrate Google Lighthouse into the backend to run headless browser speed tests, providing metrics like LCP and CLS directly into the dashboard.

### Phase 3: Site-Wide Crawling & Database
- **Historical Tracking:** We will introduce a local SQLite database to store audit results over time.
- **Sitemap Support:** Upgrade the crawler to accept a domain root, find the `sitemap.xml`, and batch-process multiple pages.

## Open Questions

> [!IMPORTANT]
> 1. **Gemini API Key:** For the AI integration (Phase 1), the backend will need a Gemini API key. Do you have one available to provide as an environment variable?
> 2. **Phase Priority:** Are you comfortable proceeding with **Phase 1** first, or is there a different feature (like Site-Wide Crawling) that you want prioritized immediately?

## Proposed Changes (For Phase 1)

### Backend Components
#### [MODIFY] [agentic-seo-mcp/package.json](file:///f:/Sandbox/seo-auditor-mcp/agentic-seo-mcp/package.json)
- Add `@google/genai` (or equivalent SDK) for LLM access.
- Add PDF generation libraries (if doing backend generation, e.g., `puppeteer`).

#### [MODIFY] [agentic-seo-mcp/src/api.ts](file:///f:/Sandbox/seo-auditor-mcp/agentic-seo-mcp/src/api.ts)
- Add a new route or logic to pass the scraped `crawler.ts` data to the Gemini model to request SEO rewrites.

### Frontend Components
#### [MODIFY] [frontend/package.json](file:///f:/Sandbox/seo-auditor-mcp/frontend/package.json)
- Add `html2pdf.js` or `@react-pdf/renderer` for client-side PDF downloads.

#### [MODIFY] [frontend/src/App.tsx](file:///f:/Sandbox/seo-auditor-mcp/frontend/src/App.tsx)
- Add a `[ DOWNLOAD_PDF_REPORT ]` button to the UI.
- Update the Blueprint view to render the new AI-generated suggestions.

## Verification Plan
- We will test the AI generation by running an audit and verifying that the blueprint contains highly specific, context-aware AI text rather than hardcoded rules.
- We will click the PDF button and ensure the styling and text are preserved in the downloaded document.
