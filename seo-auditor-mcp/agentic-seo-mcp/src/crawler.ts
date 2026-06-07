import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';

export interface HeaderElement {
  level: number;
  text: string;
}

export interface ImageElement {
  src: string;
  alt: string;
}

export interface CrawlResult {
  url: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  title?: string;
  metaDescription?: string;
  canonical?: string;
  metaRobots?: string;
  headers?: HeaderElement[];
  images?: ImageElement[];
  mainText?: string;
}

export async function crawlPage(url: string): Promise<CrawlResult> {
  const result: CrawlResult = {
    url,
    success: false,
  };

  try {
    const response = await axios.get(url, {
      // Don't throw errors for non-2xx status codes so we can capture the status code
      validateStatus: () => true,
      // Provide a reasonable timeout (e.g., 10 seconds)
      timeout: 10000,
      // Follow redirects up to a certain limit
      maxRedirects: 5,
      // Standard headers to prevent some basic 403s
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    result.statusCode = response.status;

    // Check if the status code indicates an error that we couldn't parse
    if (response.status >= 400) {
      result.error = `HTTP Error: ${response.status} ${response.statusText}`;
      // We can still try to parse the page if there's HTML (e.g. custom 404 page)
    }

    // Ensure we actually got some data
    if (typeof response.data !== 'string') {
      if (!result.error) {
        result.error = 'Invalid response data: Expected HTML string';
      }
      return result;
    }

    result.success = response.status >= 200 && response.status < 400;

    const $ = cheerio.load(response.data);

    // Title tag
    result.title = $('title').first().text().trim() || undefined;

    // Meta Description
    result.metaDescription = $('meta[name="description"], meta[name="Description"]').attr('content')?.trim() || undefined;

    // Canonical Tag
    result.canonical = $('link[rel="canonical"]').attr('href')?.trim() || undefined;

    // Robots directives
    result.metaRobots = $('meta[name="robots"], meta[name="Robots"]').attr('content')?.trim() || undefined;

    // Header nesting structure (H1-H6)
    const headers: HeaderElement[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const tagName = el.tagName.toLowerCase();
      const levelMatch = tagName.match(/^h([1-6])$/);
      if (levelMatch) {
        headers.push({
          level: parseInt(levelMatch[1], 10),
          text: $(el).text().trim().replace(/\s+/g, ' ')
        });
      }
    });
    result.headers = headers;

    // Images and alt attributes
    const images: ImageElement[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      images.push({ src, alt });
    });
    result.images = images;

    // Main visible text body of the page
    const bodyClone = $('body').clone();
    
    // Remove scripts, styles, noscript, iframes, etc.
    bodyClone.find('script, style, noscript, iframe, svg, canvas').remove();
    
    // Extract text, condense whitespace
    const textContent = bodyClone.text().replace(/\s+/g, ' ').trim();
    result.mainText = textContent;

  } catch (error: any) {
    result.success = false;
    
    // Handle Axios errors (e.g., timeout, network failure)
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        result.error = 'Request timed out';
      } else if (error.response) {
        result.statusCode = error.response.status;
        result.error = `HTTP Error: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        result.error = 'No response received from the server';
      } else {
        result.error = `Request setup error: ${error.message}`;
      }
    } else {
      // Generic error
      result.error = error instanceof Error ? error.message : String(error);
    }
  }

  return result;
}
