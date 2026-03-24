import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../lib/prisma';

const GROWTH_AUDIT_PROMPT = `You are a Senior Partner at Boston Consulting Group (BCG) specializing in E-commerce scaling, Omnichannel Retail, and DTC Growth Strategy. You are delivering an elite, master-level In-Depth Growth Audit for {BRAND} ({URL}).

I will provide you with the scraped text content from their homepage and landing page (if applicable), along with the specific Social Media networks, Amazon presence, and Loyalty/Warranty keywords detected on their site.

CRITICAL FORMATTING INSTRUCTIONS (SMART BREVITY & JSON ARRAY):
You must format your entire response as a raw JSON array of objects. Do NOT wrap it in backticks, do not include markdown blocks, just return the raw JSON. The frontend will parse this JSON to build interactive Accordions.
The 'content' field in your JSON objects MUST be pure, styled HTML. Do NOT use Markdown (no **, no #). You must use <p>, <strong>, <ul>, and <li> tags to format your smart brevity bullet points structurally. Make sure to use <br/> tags to space out distinct thoughts inside the <p> tag if necessary.

The JSON array must contain exactly these 4 specific sections (objects) with "title" and "content" keys:

[
  {
    "title": "Intro: Performance Branding & The Core Phrasing",
    "content": "Analyze their branding based on the extracted text. Identify phrases that stand out. Emphasize that 'Performance Branding' must include a specific phrase that solves a problem (Who it's for, What it solves, How long it takes—like '47% less hair loss in 90 days'). Does {BRAND} do this well? Note what they should be placing at the top of landing pages and ad copy."
  },
  {
    "title": "Ad Copy & Video Strategy (Meta & Google)",
    "content": "Critique their active video ads strategy theoretically. Provide highly tactical, concrete ad copy suggestions for both Meta and Google. Structure this playfully but firmly, focusing on intent capture and compelling offers."
  },
  {
    "title": "Social Footprint & Amazon Strategy",
    "content": "I detected the following social and retail footprints: {SOCIALS}. Provide an analysis targeting their organic and paid ecosystem. Break down TikTok vs Meta. Also, analyze their Amazon potential (1P vendor vs 3P seller control) based on whether an Amazon link was detected. Explain how they must defend DTC margins while capturing retail scale."
  },
  {
    "title": "Lifecycle Marketing (Email/SMS & Loyalty)",
    "content": "Loyalty indicators detected on site: {LOYALTY}. Analyze how a loyalty program or product warranty is the ultimate tool to convert Amazon/retail buyers into 1st-party data for Email/SMS remarketing. Since Milled.com prevents automated scraping, provide theoretical feedback on what their Email flows (Welcome Series, Replenishment) SHOULD look like based on their niche."
  }
]

Brand: {BRAND}
URL: {URL}

Extracted Website Content:
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    };

    const [homeRes, landingRes] = await Promise.all([
      fetch(targetUrl, fetchOptions).catch(() => null),
      landingPageUrl ? fetch(landingPageUrl, fetchOptions).catch(() => null) : Promise.resolve(null)
    ]);

    if (!homeRes || !homeRes.ok) throw new Error(`Failed to fetch homepage.`);

    const homeHtml = await homeRes.text();
    const $home = cheerio.load(homeHtml);

    let landingHtml = "";
    if (landingRes && landingRes.ok) landingHtml = await landingRes.text();
    const $landing = landingHtml ? cheerio.load(landingHtml) : null;

    // 1. Affiliate Check
    const affiliateKeywords = ['shareasale', 'impact.com', 'impactradius', 'cj affiliate', 'commission junction', 'rakuten', 'partnerize'];
    let affiliateProgramsFound: string[] = [];
    
    // 2. Social & Amazon & Loyalty Checks
    const socialLinks: string[] = [];
    const loyaltyKeywords = ['rewards', 'loyalty', 'vip', 'warranty', 'guarantee'];
    let loyaltyFound: string[] = [];

    $home('a').each((_, el) => {
        const href = $home(el).attr('href')?.toLowerCase() || '';
        const text = $home(el).text().toLowerCase();
        
        affiliateKeywords.forEach(keyword => {
            if ((href.includes(keyword) || text.includes(keyword)) && !affiliateProgramsFound.includes(keyword)) {
                affiliateProgramsFound.push(keyword);
            }
        });

        if (href.includes('facebook.com') && !socialLinks.includes('Facebook')) socialLinks.push('Facebook');
        if (href.includes('instagram.com') && !socialLinks.includes('Instagram')) socialLinks.push('Instagram');
        if (href.includes('tiktok.com') && !socialLinks.includes('TikTok')) socialLinks.push('TikTok');
        if (href.includes('youtube.com') && !socialLinks.includes('YouTube')) socialLinks.push('YouTube');
        if (href.includes('amazon.com') && !socialLinks.includes('Amazon')) socialLinks.push('Amazon');
    });

    // Scan text for loyalty cues
    const rawBodyText = $home('body').text().toLowerCase();
    loyaltyKeywords.forEach(keyword => {
       if (rawBodyText.includes(keyword)) loyaltyFound.push(keyword);
    });

    // 3. Sitemap XML
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
    sitemapUrls.forEach(link => { sitemapXml += `  <url>\n    <loc>${link}</loc>\n  </url>\n`; });
    sitemapXml += `</urlset>`;

    // 4. Technical checks (Pixel, Shopify)
    const checkPixel = (htmlSource: string) => {
      const lower = htmlSource.toLowerCase();
      return lower.includes('fbq(') || lower.includes('fbevents.js') || lower.includes('web-pixels-manager') || lower.includes('googletagmanager.com/gtm.js');
    };
    const isShopify = homeHtml.toLowerCase().includes('myshopify.com');
    const metaPixelFound = checkPixel(homeHtml) || (landingHtml ? checkPixel(landingHtml) : false);

    // 5. Content Extraction
    $home('script, style, nav, footer, noscript').remove();
    let textContent = $home('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);

    if ($landing) {
        $landing('script, style, nav, footer, noscript').remove();
        textContent += "\n\n--- LANDING PAGE CONTENT ---\n\n" + $landing('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);
    }

    let analysisResult = "";
    if (!process.env.ANTHROPIC_API_KEY) {
        analysisResult = JSON.stringify([{ title: "Error", content: "LLM API Key missing. Growth analysis could not be generated." }]);
    } else {
        const prompt = GROWTH_AUDIT_PROMPT
            .replace(/{URL}/g, targetUrl)
            .replace(/{BRAND}/g, brandName)
            .replace('{SOCIALS}', socialLinks.length > 0 ? socialLinks.join(', ') : 'None Detected')
            .replace('{LOYALTY}', loyaltyFound.length > 0 ? loyaltyFound.join(', ') : 'No exact keywords matching rewards/loyalty/warranty found')
            .replace('{CONTENT}', textContent);

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const message = await anthropic.messages.create({
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
            model: 'claude-sonnet-4-6',
        });
        
        let rawAnswer = message.content[0].type === 'text' ? message.content[0].text : "";
        // Strip out any surrounding backticks/markdown formatting returning by the LLM accidentally
        rawAnswer = rawAnswer.replace(/```json/gi, '').replace(/```/gi, '').trim();
        analysisResult = rawAnswer;
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
        isShopify,
        socialLinks,
        brandName,
        apexDomain
    });

  } catch (error: any) {
    console.error('Growth Audit Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process the URL.' }, { status: 500 });
  }
}
