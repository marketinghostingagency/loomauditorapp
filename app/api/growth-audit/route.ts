import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../lib/prisma';

const GROWTH_AUDIT_PROMPT = `You are a Senior Partner at Boston Consulting Group (BCG) specializing in E-commerce scaling, Omnichannel Retail, and DTC Growth Strategy. You are delivering an elite, master-level In-Depth Growth Audit for {BRAND} ({URL}).

I will provide you with the scraped text content from their homepage and landing page (if applicable). Based on this limited visibility, you must synthesize a theoretical strategic playbook covering the following operational vectors.

Format your response strictly as continuous, professional business prose. Do NOT format this like an AI generated list. Write in flowing, authoritative paragraphs. 

CRITICAL RULES:
- DO NOT use markdown headers like '#' or '##'.
- DO NOT use bolding or bullet points unless strictly quoting specific client copy.
- DO NOT use generic filler. Make assertions confidently.

Core Web Vitals Directive: Briefly mention that their mobile website Core Web Vitals passed with flying colors (a fantastic job), but do not harp on it. Immediately transition into optimization strategy.

Analyze and critique the following vectors deeply:
1. Mobile CRO: Analyze their Compelling Offer (is it a discount, or a solution to a problem?). Is it prominent above the fold? Is there frictionless conversion via sticky headers/footers?
2. SEO & Answer Engine Optimization (AEO): How should they structure content for AI indexers?
3. Affiliate Strategy: Given their niche, what should their affiliate footprint look like?
4. Organic Social & Paid Media: Break down Organic (TikTok/IG) vs Paid (Facebook/Google) strategies.
5. CRM & Lifecycle Marketing: Propose strategies for increasing LTV through email/SMS retention.
6. Omnichannel Retail & Amazon 1P/3P: Assuming they have ambitions for massive scale, outline the structural channel strategy for succeeding on Amazon (1P vs 3P control) alongside retail expansion while defending DTC margins. Are they bridging the gap between direct acquisition and external channels?

Brand: {BRAND}
URL: {URL}

Extracted Content:
{CONTENT}
`;

export async function POST(req: Request) {
  try {
    const { url, brand, landingPageUrl } = await req.json();

    if (!url || !brand) {
      return NextResponse.json({ error: 'URL and Brand Name are required' }, { status: 400 });
    }

    let targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const baseUrlObj = new URL(targetUrl);
    const baseUrl = baseUrlObj.origin;
    let brandName = brand;
    let apexDomain = baseUrlObj.hostname.replace('www.', '');

    const fetchOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    };

    const [homeRes, landingRes] = await Promise.all([
      fetch(targetUrl, fetchOptions),
      landingPageUrl ? fetch(landingPageUrl, fetchOptions) : Promise.resolve(null)
    ]);

    if (!homeRes.ok) throw new Error(`Failed to fetch homepage. Status: ${homeRes.status}`);

    const homeHtml = await homeRes.text();
    const $home = cheerio.load(homeHtml);

    let landingHtml = "";
    if (landingRes && landingRes.ok) {
        landingHtml = await landingRes.text();
    }
    const $landing = landingHtml ? cheerio.load(landingHtml) : null;

    // 1. Affiliate Check
    const affiliateKeywords = ['shareasale', 'impact.com', 'impactradius', 'cj affiliate', 'commission junction', 'rakuten', 'partnerize', 'affiliate'];
    let affiliateProgramsFound: string[] = [];
    
    $home('a').each((_, el) => {
        const href = $home(el).attr('href')?.toLowerCase() || '';
        const text = $home(el).text().toLowerCase();
        
        affiliateKeywords.forEach(keyword => {
            if ((href.includes(keyword) || text.includes(keyword)) && !affiliateProgramsFound.includes(keyword)) {
                affiliateProgramsFound.push(keyword);
            }
        });
    });

    // 2. Sitemap XML
    const internalLinks = new Set<string>();
    internalLinks.add(baseUrl + '/');

    $home('a').each((_, el) => {
        const href = $home(el).attr('href');
        if (!href) return;
        if (href.startsWith('/') && !href.startsWith('//')) {
            internalLinks.add(baseUrl + href);
        } else if (href.startsWith(baseUrl)) {
            internalLinks.add(href);
        }
    });

    const sitemapUrls = Array.from(internalLinks).slice(0, 100);
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    sitemapUrls.forEach(link => {
        sitemapXml += `  <url>\n    <loc>${link}</loc>\n  </url>\n`;
    });
    sitemapXml += `</urlset>`;

    // 3. Technical checks (Pixel, Shopify)
    const checkPixel = (htmlSource: string) => {
      const lower = htmlSource.toLowerCase();
      return lower.includes('fbq(') || lower.includes('fbevents.js') || lower.includes('web-pixels-manager') || lower.includes('googletagmanager.com/gtm.js');
    };
    const isShopify = homeHtml.toLowerCase().includes('myshopify.com');
    const metaPixelFound = checkPixel(homeHtml) || (landingHtml ? checkPixel(landingHtml) : false);

    // 4. Content Extraction
    $home('script, style, nav, footer, noscript').remove();
    let textContent = $home('body').text().replace(/\s+/g, ' ').trim().substring(0, 2500);

    if ($landing) {
        $landing('script, style, nav, footer, noscript').remove();
        textContent += "\n\n--- LANDING PAGE CONTENT ---\n\n" + $landing('body').text().replace(/\s+/g, ' ').trim().substring(0, 2500);
    }

    let analysisResult = "";
    if (!process.env.ANTHROPIC_API_KEY) {
        analysisResult = "LLM API Key missing. Growth analysis could not be generated.";
    } else {
        const prompt = GROWTH_AUDIT_PROMPT
            .replace(/{URL}/g, targetUrl)
            .replace(/{BRAND}/g, brandName)
            .replace('{CONTENT}', textContent);

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const message = await anthropic.messages.create({
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
            model: 'claude-sonnet-4-6',
        });
        analysisResult = message.content[0].type === 'text' ? message.content[0].text : "";
    }

    const auditRecord = await prisma.audit.create({
      data: {
        url: targetUrl,
        brandName,
        apexDomain,
        metaPixelFound,
        sitemapXml: Buffer.from(sitemapXml).toString('base64'),
        affiliatePrograms: JSON.stringify(affiliateProgramsFound),
        aiAnalysis: analysisResult,
        script: ""
      }
    });

    return NextResponse.json({
        auditId: auditRecord.id,
        affiliatePrograms: affiliateProgramsFound,
        sitemapXml: Buffer.from(sitemapXml).toString('base64'),
        aiAnalysis: analysisResult,
        metaPixelFound,
        isShopify
    });

  } catch (error: any) {
    console.error('Growth Audit Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process the URL.' }, { status: 500 });
  }
}
