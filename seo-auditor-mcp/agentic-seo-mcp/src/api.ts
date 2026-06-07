import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { crawlPage } from './crawler.js';
import { performTechnicalAudit, analyzeContent, createBlueprint } from './auditor.js';
import { runLighthouseAudit } from './lighthouse.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/audit', async (req, res) => {
    try {
        const { url, targetKeywords } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const keywords = Array.isArray(targetKeywords) ? targetKeywords : [];

        // 1. Crawl & Lighthouse (Concurrent)
        const [crawlResult, lighthouseResult] = await Promise.all([
            crawlPage(url),
            runLighthouseAudit(url)
        ]);
        
        if (!crawlResult.success) {
            return res.status(500).json({ error: `Crawl failed: ${crawlResult.error}` });
        }

        // 2. Technical Audit
        const techAudit = performTechnicalAudit(crawlResult);

        // 3. Content Audit
        const contentAudit = analyzeContent(crawlResult, keywords);

        // 4. Blueprint
        const blueprint = await createBlueprint({
            url,
            crawlResult,
            technicalAuditResult: techAudit,
            contentQualityResult: contentAudit,
            lighthouseResult // Passed into the new AggregatedSEOData
        });

        res.json({
            url,
            crawlResult: {
                statusCode: crawlResult.statusCode,
                title: crawlResult.title,
                metaDescription: crawlResult.metaDescription,
                canonical: crawlResult.canonical
            },
            technicalAuditResult: techAudit,
            contentQualityResult: contentAudit,
            lighthouseResult,
            blueprint
        });

    } catch (error: any) {
        console.error("Error during audit:", error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`SEO Backend API running on http://localhost:${PORT}`);
});
