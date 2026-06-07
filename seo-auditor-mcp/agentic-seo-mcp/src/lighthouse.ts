import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

export interface LighthouseMetrics {
    performanceScore: number;
    accessibilityScore: number;
    bestPracticesScore: number;
    seoScore: number;
    firstContentfulPaint: string;
    largestContentfulPaint: string;
    cumulativeLayoutShift: string;
    totalBlockingTime: string;
}

export async function runLighthouseAudit(url: string): Promise<LighthouseMetrics | null> {
    let chrome;
    try {
        console.log(`[LIGHTHOUSE] Launching headless Chrome for: ${url}`);
        chrome = await chromeLauncher.launch({
            chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
            userDataDir: false // Fixes EPERM Temp folder issues on Windows
        });

        const options = {
            logLevel: 'error' as const,
            output: 'json' as const,
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            port: chrome.port,
        };

        const runnerResult = await lighthouse(url, options);

        if (!runnerResult || !runnerResult.lhr) {
            throw new Error("Lighthouse failed to return a result.");
        }

        const lhr = runnerResult.lhr;

        const metrics: LighthouseMetrics = {
            performanceScore: Math.round((lhr.categories.performance?.score || 0) * 100),
            accessibilityScore: Math.round((lhr.categories.accessibility?.score || 0) * 100),
            bestPracticesScore: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
            seoScore: Math.round((lhr.categories.seo?.score || 0) * 100),
            firstContentfulPaint: lhr.audits['first-contentful-paint']?.displayValue || 'N/A',
            largestContentfulPaint: lhr.audits['largest-contentful-paint']?.displayValue || 'N/A',
            cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.displayValue || 'N/A',
            totalBlockingTime: lhr.audits['total-blocking-time']?.displayValue || 'N/A',
        };

        console.log(`[LIGHTHOUSE] Audit complete for: ${url}`);
        return metrics;

    } catch (error) {
        console.error("[LIGHTHOUSE] Error during audit:", error);
        return null;
    } finally {
        if (chrome) {
            await chrome.kill();
        }
    }
}
