# Goal Description

Build a premium, beautiful web application dashboard to serve as a user-friendly interface for the SEO Auditor logic. The UI will abstract away the raw JSON and provide visual progress bars, health checks, and a rendered markdown blueprint.

## User Review Required

- **Architecture Choice:** I will structure this as two parts:
  1. **Backend API:** I will add a lightweight Express.js server to the existing `agentic-seo-mcp` project. This will expose a simple REST endpoint (`/api/audit`) that wraps the existing `crawler.ts` and `auditor.ts` logic.
  2. **Frontend UI:** I will create a new Vite + React + TypeScript project in a `frontend` folder. It will use Vanilla CSS to craft a stunning, modern dark-mode aesthetic with glassmorphism and micro-animations, adhering to the design rules.
  Is this architecture acceptable?

## Open Questions

- What specific branding or color palette would you prefer for the premium dark mode (e.g., Deep Space Blue with Neon Purple/Cyan accents, or Charcoal Gray with Emerald Green)?
- Would you like the backend Express server to run on a specific port (e.g., 3000) and the Vite frontend on another (e.g., 5173)?

## Proposed Changes

### Backend API
#### [MODIFY] [agentic-seo-mcp/package.json](file:///f:/Sandbox/seo-auditor-mcp/agentic-seo-mcp/package.json)
- Add `express` and `cors` dependencies.

#### [NEW] [agentic-seo-mcp/src/api.ts](file:///f:/Sandbox/seo-auditor-mcp/agentic-seo-mcp/src/api.ts)
- Create an Express server exposing `POST /api/audit` which accepts `{ url, targetKeywords }`.
- Invokes the existing `crawler.ts` and `auditor.ts` functions.
- Returns the full aggregated state and markdown blueprint to the frontend.

### Frontend Application
#### [NEW] [frontend/](file:///f:/Sandbox/seo-auditor-mcp/frontend)
- Initialize via `npx create-vite frontend --template react-ts`.
- **CSS Strategy:** Pure Vanilla CSS (`index.css` and `App.css`) with premium CSS variables, HSL colors, hover effects, and modern typography (Google Fonts 'Inter' or 'Outfit').
- **Components:**
  - `HeroInput`: The main URL and keyword search bar.
  - `HealthDashboard`: Visual cards for Technical SEO (Issues/Warnings) and Content Quality.
  - `KeywordDensityChart`: Simple CSS-based progress bars for keyword densities.
  - `BlueprintView`: Rendered markdown for the final remediation steps using `react-markdown`.

## Verification Plan

### Automated Tests
- N/A for UI visual testing.

### Manual Verification
- Boot both the Express API and the Vite frontend.
- Enter a test URL (like Wikipedia) in the UI.
- Verify the loading states, animations, and the final dashboard presentation.
- Provide a Walkthrough artifact with a screenshot/image of the final UI.
