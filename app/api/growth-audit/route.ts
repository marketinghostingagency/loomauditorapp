import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';

const GROWTH_AUDIT_PROMPT = `You are a Principal Growth Marketer specializing in E-commerce scaling. You are performing an in-depth Growth Audit for {BRAND} ({URL}).

I will provide you with the text content of their homepage/landing page. Based on this content, you need to generate high-level, simulated strategy data for two specific areas:

1. **Meta & Google Ads Optimization**:
   - Provide a strategic critique of what their ad strategy should look like based on their value proposition.
   - Suggest 3 concrete Ad Creative angles (e.g., UGC, Founder Story, Us vs Them).
   - Suggest 2 Google Search Campaign strategies (e.g., specific competitor conquesting, high-intent product terms).
   
2. **SEO & Search Term Volume (Non-Branded)**:
   - Identify 5 highly relevant, high-intent non-branded search terms they should be targeting.
   - Estimate the theoretical search volume (Low, Medium, High).
   - Provide the Funnel Stage for each keyword (ToFu, MoFu, BoFu).
   - Recommend a content or landing page strategy to capture these terms.

Format your response strictly in Markdown format with clear headers (H2, H3, bullet points). Make the tone highly professional, tactical, and actionable.

Brand: {BRAND}
URL: {URL}

Extracted Content:
{CONTENT}
`;

export async function POST(req: Request) {
  try {
    const { url, brand } = await req.json();

    if (!url || !brand) {
      return NextResponse.json({ error: 'URL and Brand Name are required' }, { status: 400 });
    }

    // 1. Fetch website content
    const fetchOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    };

    let targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const baseUrlObj = new URL(targetUrl);
    const baseUrl = baseUrlObj.origin;

    const homeRes = await fetch(targetUrl, fetchOptions);
    if (!homeRes.ok) {
        throw new Error(`Failed to fetch website. Status: ${homeRes.status}`);
    }

    const html = await homeRes.text();
    const $ = cheerio.load(html);

    // 2. Affiliate Marketing Check
    // Look for common affiliate footprints in hrefs or text
    const affiliateKeywords = ['shareasale', 'impact.com', 'impactradius', 'cj affiliate', 'commission junction', 'rakuten', 'partnerize', 'affiliate'];
    let affiliateProgramsFound: string[] = [];
    
    $('a').each((_, el) => {
        const href = $(el).attr('href')?.toLowerCase() || '';
        const text = $(el).text().toLowerCase();
        
        affiliateKeywords.forEach(keyword => {
            if ((href.includes(keyword) || text.includes(keyword)) && !affiliateProgramsFound.includes(keyword)) {
                affiliateProgramsFound.push(keyword);
            }
        });
    });

    // 3. Generate internal sitemap
    const internalLinks = new Set<string>();
    internalLinks.add(baseUrl + '/');

    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        
        if (href.startsWith('/') && !href.startsWith('//')) {
            internalLinks.add(baseUrl + href);
        } else if (href.startsWith(baseUrl)) {
            internalLinks.add(href);
        }
    });

    const sitemapUrls = Array.from(internalLinks).slice(0, 100); // cap to 100 for safety
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    sitemapUrls.forEach(link => {
        sitemapXml += `  <url>\n    <loc>${link}</loc>\n  </url>\n`;
    });
    sitemapXml += `</urlset>`;

    // 4. Clean content for LLM Analysis
    $('script, style, nav, footer, noscript').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 4000);

    // 5. Query LLM
    let analysisResult = "";
    if (!process.env.ANTHROPIC_API_KEY) {
        analysisResult = "## LLM API Key missing. Growth analysis could not be generated.";
    } else {
        const prompt = GROWTH_AUDIT_PROMPT
            .replace(/{URL}/g, url)
            .replace(/{BRAND}/g, brand)
            .replace('{CONTENT}', textContent);

        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const message = await anthropic.messages.create({
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
            model: 'claude-sonnet-4-6', // preserving existing model used in codebase
        });

        analysisResult = message.content[0].type === 'text' ? message.content[0].text : "";
    }

    return NextResponse.json({
        affiliatePrograms: affiliateProgramsFound,
        sitemapXml: Buffer.from(sitemapXml).toString('base64'), // Send as base64 to avoid JSON string escaping issues
        aiAnalysis: analysisResult
    });

  } catch (error: any) {
    console.error('Growth Audit Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process the URL.' },
      { status: 500 }
    );
  }
}
