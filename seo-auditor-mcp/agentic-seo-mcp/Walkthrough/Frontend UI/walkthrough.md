# SEO Auditor Web Dashboard

We have successfully transformed the raw SEO MCP server into a beautiful, commercial-grade web application! The dashboard completely abstracts the JSON data and presents the audit in a highly visual, easy-to-use interface.

## 🚀 Architecture

1. **Express Backend API:** We added an `api.ts` file to the existing MCP project that wraps the core SEO auditing functions (`crawler.ts` and `auditor.ts`). It exposes a simple `POST /api/audit` endpoint running on `http://localhost:3000`.
2. **React + Vite Frontend:** We spun up a completely new Vite + React + TypeScript frontend in the `frontend/` directory.
3. **Premium Vanilla CSS Design System:** The UI is designed with a high-end dark mode aesthetic. It uses dynamic HSL gradients, glassmorphism (`backdrop-filter: blur`), hover animations, and the "Inter" typography to make the tool feel extremely premium. 

## ✨ Key Features
- **URL & Keyword Input:** A sleek hero section with form controls.
- **Visual Health Dashboard:** Split panels for Technical SEO and Content Quality, using dynamic CSS bars to visualize keyword stuffing vs healthy density.
- **Markdown Blueprint Rendering:** We integrated `react-markdown` to directly parse and display the "Fix Blueprint" as formatted text, code blocks, and tables.

## 🏃 How to Run the Application

Since there are two parts (Backend and Frontend), you will need to start both.

### 1. Start the Backend API
Open a terminal in the main `agentic-seo-mcp` folder and run the API:
```bash
cd f:\Sandbox\seo-auditor-mcp\agentic-seo-mcp
npx tsx src/api.ts
```

### 2. Start the React Frontend
Open a **new** terminal window, navigate to the `frontend` folder, and start the development server:
```bash
cd f:\Sandbox\seo-auditor-mcp\frontend
npm run dev
```

### 3. Open in Browser
Visit `http://localhost:5173` (or the port Vite provides) in your web browser. Type in `https://example.com` or `https://en.wikipedia.org/wiki/Search_engine_optimization`, hit **Run Full Agentic Audit**, and watch the magic happen!
