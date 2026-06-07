import { CrawlResult } from './crawler.js';
import { GoogleGenAI } from '@google/genai';
import { LighthouseMetrics } from './lighthouse.js';

export interface TechnicalSEOResult {
    passed: boolean;
    issues: string[];
    warnings: string[];
}

export interface ContentQualityResult {
    passed: boolean;
    issues: string[];
    warnings: string[];
    keywordDensities: Record<string, number>;
}

export interface AggregatedSEOData {
    url: string;
    crawlResult: CrawlResult;
    technicalAuditResult: TechnicalSEOResult;
    contentQualityResult: ContentQualityResult;
    lighthouseResult?: LighthouseMetrics | null;
}

export function validateTechnicalSEO(data: CrawlResult): TechnicalSEOResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Status code
    if (data.statusCode && data.statusCode >= 400) {
        issues.push(`Page returned status code ${data.statusCode}.`);
    }

    // Robots
    if (data.metaRobots) {
        const robotsLower = data.metaRobots.toLowerCase();
        if (robotsLower.includes('noindex')) {
            warnings.push("Page is blocked from indexing (noindex).");
        }
        if (robotsLower.includes('nofollow')) {
            warnings.push("Page links are not followed (nofollow).");
        }
    } else {
        warnings.push("Missing robots meta tag.");
    }

    // Canonical
    if (!data.canonical) {
        issues.push("Missing canonical tag.");
    } else if (data.canonical !== data.url) {
        warnings.push(`Canonical tag (${data.canonical}) does not match page URL (${data.url}).`);
    }

    // Title
    if (!data.title) {
        issues.push("Missing title tag.");
    } else {
        const titleLen = data.title.length;
        if (titleLen < 30) {
            warnings.push(`Title tag is too short (${titleLen} characters). Recommended: 30-60.`);
        } else if (titleLen > 60) {
            warnings.push(`Title tag is too long (${titleLen} characters). Recommended: 30-60.`);
        }
    }

    // Meta Description
    if (!data.metaDescription) {
        issues.push("Missing meta description.");
    } else {
        const descLen = data.metaDescription.length;
        if (descLen < 70) {
            warnings.push(`Meta description is too short (${descLen} characters). Recommended: 70-155.`);
        } else if (descLen > 155) {
            warnings.push(`Meta description is too long (${descLen} characters). Recommended: 70-155.`);
        }
    }

    // Header structure
    const headers = data.headers || [];
    const h1Count = headers.filter(h => h.level === 1).length;
    if (h1Count === 0) {
        issues.push("Missing H1 tag. A page should have exactly one H1 tag.");
    } else if (h1Count > 1) {
        warnings.push(`Multiple H1 tags found (${h1Count}). Best practice is exactly one H1 tag.`);
    }

    let previousLevel = 0;
    for (const header of headers) {
        if (previousLevel !== 0 && header.level > previousLevel + 1) {
            warnings.push(`Skipped header level from H${previousLevel} to H${header.level} ("${header.text}").`);
        }
        previousLevel = header.level;
    }

    return {
        passed: issues.length === 0,
        issues,
        warnings
    };
}

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function analyzeContentQuality(data: CrawlResult, targetKeywords: string[]): ContentQualityResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const keywordDensities: Record<string, number> = {};

    const textBody = data.mainText || "";
    
    // Word count
    const wordsMatch = textBody.toLowerCase().match(/\b\w+\b/g);
    const totalWords = wordsMatch ? wordsMatch.length : 0;

    if (totalWords < 300) {
        issues.push(`Thin content detected. Word count is ${totalWords}. Recommended minimum is 300 words.`);
    }

    // Keyword density
    for (const keyword of targetKeywords) {
        const keywordLower = keyword.toLowerCase();
        const regex = new RegExp(`\\b${escapeRegExp(keywordLower)}\\b`, 'gi');
        const matches = textBody.match(regex);
        const count = matches ? matches.length : 0;
        
        const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
        keywordDensities[keyword] = density;

        if (density > 5) {
            issues.push(`Keyword stuffing detected for "${keyword}". Density is ${density.toFixed(2)}% (recommended < 5%).`);
        } else if (density === 0) {
            warnings.push(`Target keyword "${keyword}" is not found in the content.`);
        }
    }

    // Image alt texts
    const images = data.images || [];
    const missingAltImages = images.filter(img => !img.alt || img.alt.trim() === '');
    if (missingAltImages.length > 0) {
        issues.push(`${missingAltImages.length} image(s) missing descriptive alt text.`);
        const examples = missingAltImages.slice(0, 3).map(img => img.src || 'unknown source').join(', ');
        warnings.push(`Examples of images missing alt text: ${examples}`);
    }

    return {
        passed: issues.length === 0,
        issues,
        warnings,
        keywordDensities
    };
}

function getActionText(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("status code")) return "Investigate server routing or application logic returning the erroneous status code. Ensure the page resolves with a 200 OK.";
    if (lowerText.includes("missing canonical")) return "Add a `<link rel=\"canonical\" href=\"...\">` tag to the `<head>` of the HTML document.";
    if (lowerText.includes("canonical tag") && lowerText.includes("does not match")) return "Update the canonical tag to exactly match the target URL to prevent duplicate content issues.";
    if (lowerText.includes("missing title tag")) return "Add a `<title>` tag within the HTML `<head>`.";
    if (lowerText.includes("missing meta description")) return "Add `<meta name=\"description\" content=\"...\">` to the HTML `<head>`.";
    if (lowerText.includes("missing h1 tag")) return "Ensure the main heading of the page is wrapped in an `<h1>` tag.";
    if (lowerText.includes("thin content")) return "Coordinate with content creators to expand the page body text to at least 300 words.";
    if (lowerText.includes("keyword stuffing")) return "Review the content and reduce the occurrences of the specified keyword to avoid search engine penalties.";
    if (lowerText.includes("missing descriptive alt text")) return "Update the `<img>` tags in your templates or CMS to include descriptive `alt=\"...\"` attributes.";
    if (lowerText.includes("noindex")) return "Remove the `noindex` directive from the `<meta name=\"robots\">` tag or X-Robots-Tag header if the page should be indexed.";
    if (lowerText.includes("nofollow")) return "Remove the `nofollow` directive from the `<meta name=\"robots\">` tag if links should be crawled.";
    if (lowerText.includes("too short") || lowerText.includes("too long")) return "Adjust the length of the tag content to fall within recommended character limits.";
    if (lowerText.includes("skipped header level")) return "Refactor header tags to follow a strict hierarchical order (e.g., H2 followed by H3, not H4).";
    if (lowerText.includes("multiple h1 tags")) return "Consolidate multiple `<h1>` tags into a single primary heading, and change the rest to `<h2>` or `<h3>`.";
    if (lowerText.includes("not found in the content")) return "Incorporate the target keyword naturally into the page content.";
    
    return "Review the page source and correct the highlighted SEO violation.";
}

export async function generateFixBlueprint(aggregatedData: AggregatedSEOData): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // If no API key is provided, fallback to the hardcoded rule-based blueprint
    if (!apiKey || apiKey === 'your_api_key_here') {
        return generateFallbackBlueprint(aggregatedData);
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `You are an expert SEO Technical Architect and Copywriter. 
        I have crawled the following URL: ${aggregatedData.url}
        
        Here is the raw text content of the page:
        ---
        ${(aggregatedData.crawlResult.mainText || '').substring(0, 5000)}... (truncated for length)
        ---
        
        Here are the Technical SEO Issues found:
        ${aggregatedData.technicalAuditResult.issues.length ? aggregatedData.technicalAuditResult.issues.join('\n') : 'None'}
        
        Here are the Technical SEO Warnings found:
        ${aggregatedData.technicalAuditResult.warnings.length ? aggregatedData.technicalAuditResult.warnings.join('\n') : 'None'}
        
        Here are the Content Quality Issues found:
        ${aggregatedData.contentQualityResult.issues.length ? aggregatedData.contentQualityResult.issues.join('\n') : 'None'}
        
        Here are the Content Quality Warnings found:
        ${aggregatedData.contentQualityResult.warnings.length ? aggregatedData.contentQualityResult.warnings.join('\n') : 'None'}
        
        Lighthouse Telemetry Metrics (Headless Chrome Data):
        ${aggregatedData.lighthouseResult ? `
        - Performance Score: ${aggregatedData.lighthouseResult.performanceScore}/100
        - Accessibility Score: ${aggregatedData.lighthouseResult.accessibilityScore}/100
        - Best Practices Score: ${aggregatedData.lighthouseResult.bestPracticesScore}/100
        - SEO Score: ${aggregatedData.lighthouseResult.seoScore}/100
        - Largest Contentful Paint: ${aggregatedData.lighthouseResult.largestContentfulPaint}
        - Cumulative Layout Shift: ${aggregatedData.lighthouseResult.cumulativeLayoutShift}
        - Total Blocking Time: ${aggregatedData.lighthouseResult.totalBlockingTime}
        ` : 'Lighthouse audit was not available for this run.'}
        
        Your task is to generate a highly specific, actionable "Fix Blueprint". 
        Format the output in raw Markdown. Ensure it looks like a Hacker Terminal report.
        
        Requirements:
        1. Write specific rewrite suggestions based on the DOM and Lighthouse scores. E.g., if LCP is slow, recommend specific asset optimizations.
        2. If keywords are stuffed, suggest exactly how to rewrite the sentences to sound natural.
        3. Do not just say "fix the title". Write the actual HTML tag they should paste.
        4. Use terminal-style markdown headings (e.g. \`# === SYSTEM_REMEDIATION_PROTOCOL ===\`).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        if (response.text) {
            return response.text;
        } else {
            throw new Error("AI returned an empty response.");
        }

    } catch (error) {
        console.error("AI Generation Error:", error);
        return `[CRITICAL ERROR]: AI GENERATION MODULE FAILED. FALLING BACK TO STANDARD PROTOCOL.\n\n` + generateFallbackBlueprint(aggregatedData);
    }
}

function generateFallbackBlueprint(aggregatedData: AggregatedSEOData): string {
    let blueprint = `# SEO Fix Blueprint for ${aggregatedData.url}\n\n`;

    const allIssues = [
        ...(aggregatedData.technicalAuditResult?.issues || []).map(i => ({ type: 'Technical', text: i })),
        ...(aggregatedData.contentQualityResult?.issues || []).map(i => ({ type: 'Content', text: i }))
    ];

    const allWarnings = [
        ...(aggregatedData.technicalAuditResult?.warnings || []).map(w => ({ type: 'Technical', text: w })),
        ...(aggregatedData.contentQualityResult?.warnings || []).map(w => ({ type: 'Content', text: w }))
    ];

    if (allIssues.length === 0 && allWarnings.length === 0) {
        blueprint += `## 🎉 Congratulations!\nNo significant SEO issues found on this page.\n`;
        return blueprint;
    }

    blueprint += `## 🚨 Critical Issues to Fix\n\n`;
    if (allIssues.length === 0) {
        blueprint += `*No critical issues found.*\n\n`;
    } else {
        allIssues.forEach((issue, index) => {
            blueprint += `### ${index + 1}. [${issue.type}] ${issue.text}\n`;
            blueprint += `**Action:** ${getActionText(issue.text)}\n\n`;
        });
    }

    blueprint += `## ⚠️ Warnings & Improvements\n\n`;
    if (allWarnings.length === 0) {
        blueprint += `*No warnings found.*\n\n`;
    } else {
        allWarnings.forEach((warning, index) => {
            blueprint += `### ${index + 1}. [${warning.type}] ${warning.text}\n`;
            blueprint += `**Action:** ${getActionText(warning.text)}\n\n`;
        });
    }

    if (aggregatedData.contentQualityResult && aggregatedData.contentQualityResult.keywordDensities) {
        blueprint += `## 📊 Keyword Densities\n\n`;
        const keywords = Object.keys(aggregatedData.contentQualityResult.keywordDensities);
        if (keywords.length > 0) {
            blueprint += `| Keyword | Density (%) |\n`;
            blueprint += `|---|---|\n`;
            for (const kw of keywords) {
                blueprint += `| ${kw} | ${aggregatedData.contentQualityResult.keywordDensities[kw].toFixed(2)}% |\n`;
            }
            blueprint += `\n`;
        } else {
            blueprint += `*No keywords tracked.*\n\n`;
        }
    }

    return blueprint;
}

// Aliases for index.ts compatibility
export const performTechnicalAudit = validateTechnicalSEO;
export const analyzeContent = analyzeContentQuality;
export const createBlueprint = generateFixBlueprint;
