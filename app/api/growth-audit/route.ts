import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../lib/prisma';

const GROWTH_AUDIT_PROMPT = `You are Joel Otten, a Senior Partner at Boston Consulting Group (BCG) specializing in E-commerce scaling, Omnichannel Retail, and DTC Growth Strategy. You are delivering an elite, master-level In-Depth Growth Audit for {BRAND} ({URL}).

I will provide you with the scraped text content from their homepage and landing page, along with the specific Social Media networks, Amazon presence, and Loyalty/Warranty keywords detected on their site.

CRITICAL FORMATTING INSTRUCTIONS (XML STRUCTURE & RAW HTML CONTENT):
You must strictly format your response using exactly 8 <section> blocks.
Each <section> must contain a exactly matched <title> and a <content> tag.
The inside of the <content> tag MUST be pure, styled HTML. Do NOT use Markdown (absolutely NO asterisks ** or hash symbols #). Use <p>, <strong>, <ul>, and <li> tags. Do NOT make paragraphs too long! Use "Smart Brevity: The Power of Saying More with Less".

HYPOTHESIS GENERATION (MANDATORY):
To ensure elite consulting depth, for every single section EXCEPT the Intro, you MUST conclude the section's <content> with a dedicated unordered list (<ul>) titled "<strong>Hypotheses to Test:</strong>" containing exactly 3 highly specific, concrete A/B testing variations or tactical strategies to execute.

1. Title: "Intro: The Philosophy of Marketing Science"
Content Instructions: Reinstate the philosophy that treating marketing is a science. Explain that anyone who claims to "know how to grow your brand" is full of nonsense. Explain that anything they read from here on out are purely hypotheses based on 20 years of marketing experience that must be rigorously A/B tested to find truth.

2. Title: "Brand Messaging"
Content Instructions: Is there a tagline consistent across their site? Is it based on science, a problem, a solution, or emotion? Does it connect with the audience? Briefly discuss "Performance Branding" which demands consistent branding so consumers remember the brand, creating higher conversion rates and awareness. Include the 3 Hypotheses to Test.

3. Title: "Website Optimization (CRO, CRM, & SEO)"
Content Instructions: CRO: Analyze primary CTA colors (should be strictly 1 dedicated color) and fixed CTAs. CRM: Do they use pop-ups/landing pages with tip-based lead magnets? PageSpeed: If they pass core web vitals, state it quickly and move on. SEO/AEO: Meta titles, alt text, FAQ schema for AEO. Community: easy affiliate sign-ups. Include the 3 Hypotheses to Test.

4. Title: "Organic Social Ecosystem"
Content Instructions: Based on the {SOCIALS} array detected, explicitly identify their active footprint. Form hypotheses about organic posting frequency, engagement rates, content types (stories, grid, addressing target audience needs), and social proof mediums. Include the 3 Hypotheses to Test.

5. Title: "Meta Advertising (Facebook & Instagram)"
Content Instructions: Theoretically evaluate their Meta strategy: Are they running cobranded ads? Non-cobranded with social proof? Various hooks? Is the brand messaging consistent in the first 4 seconds of video/copy to ensure memorability? Include the 3 Hypotheses to Test.

6. Title: "TikTok Advertising"
Content Instructions: Are they utilizing TikTok Shop? TikTok Affiliates? Are their affiliate programs interconnected (e.g. leveraging Social Snowball)? Include the 3 Hypotheses to Test.

7. Title: "Google Advertising & YouTube"
Content Instructions: Is copy emotionally solving problems while creating urgency in line with the brand messaging? Are they utilizing YouTube by repurposing social assets? Include the 3 Hypotheses to Test.

8. Title: "CRM & Lifecycle Marketing (Retention)"
Content Instructions: Provide a note: 'I've been in mobile marketing since 2005 (2 years before the iPhone came out)'. Emphasize the marketer's holy grail is a 1-to-1 connection via the phone. Evaluate SMS potential. Emphasize that SMS/Email flows (Welcome Series, Post-Purchase) are where the bulk of revenue should come from. Emphasize the "4th Purchase" rule: if they buy 4 times, they are loyal and must become brand evangelists/affiliates compensated for referrals. Campaigns should only articulate timely news/offers. Include the 3 Hypotheses to Test.

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
    const affiliateKeywords = ['shareasale', 'impact.com', 'impactradius', 'cj affiliate', 'commission junction', 'rakuten', 'partnerize', 'social snowball', 'socialsnowball'];
    let affiliateProgramsFound: string[] = [];
    
    // 2. Social & Amazon & Loyalty Checks
    const socialLinks: { name: string, url: string }[] = [];
    const loyaltyKeywords = ['rewards', 'loyalty', 'vip', 'warranty', 'guarantee'];
    let loyaltyFound: string[] = [];

    $home('a').each((_, el) => {
        const href = $home(el).attr('href');
        if (!href) return;
        const lowerHref = href.toLowerCase();
        const text = $home(el).text().toLowerCase();
        
        affiliateKeywords.forEach(keyword => {
            if ((lowerHref.includes(keyword) || text.includes(keyword)) && !affiliateProgramsFound.includes(keyword)) {
                affiliateProgramsFound.push(keyword);
            }
        });

        if (lowerHref.includes('facebook.com') && !socialLinks.some(s => s.name === 'Facebook')) socialLinks.push({ name: 'Facebook', url: href });
        if (lowerHref.includes('instagram.com') && !socialLinks.some(s => s.name === 'Instagram')) socialLinks.push({ name: 'Instagram', url: href });
        if (lowerHref.includes('tiktok.com') && !socialLinks.some(s => s.name === 'TikTok')) socialLinks.push({ name: 'TikTok', url: href });
        if (lowerHref.includes('youtube.com') && !socialLinks.some(s => s.name === 'YouTube')) socialLinks.push({ name: 'YouTube', url: href });
        if (lowerHref.includes('amazon.com') && !socialLinks.some(s => s.name === 'Amazon')) socialLinks.push({ name: 'Amazon', url: href });
    });

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
        analysisResult = JSON.stringify([{ title: "Error", content: "<p>LLM API Key missing. Growth analysis could not be generated.</p>" }]);
    } else {
        const prompt = GROWTH_AUDIT_PROMPT
            .replace(/{URL}/g, targetUrl)
            .replace(/{BRAND}/g, brandName)
            .replace('{SOCIALS}', socialLinks.length > 0 ? socialLinks.map(s => s.name).join(', ') : 'None Detected')
            .replace('{LOYALTY}', loyaltyFound.length > 0 ? loyaltyFound.join(', ') : 'No exact keywords matching rewards/loyalty/warranty found')
            .replace('{CONTENT}', textContent);

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const message = await anthropic.messages.create({
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
            model: 'claude-sonnet-4-6',
        });
        
        let rawAnswer = message.content[0].type === 'text' ? message.content[0].text : "";
        
        const sections: { title: string, content: string }[] = [];
        const sectionRegex = /<section>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<content>([\s\S]*?)<\/content>[\s\S]*?<\/section>/gi;
        
        let match;
        while ((match = sectionRegex.exec(rawAnswer)) !== null) {
           sections.push({
             title: match[1].trim(),
             content: match[2].trim()
           });
        }
        
        if (sections.length === 0) {
           sections.push({ title: "Analysis Summary", content: rawAnswer.replace(/\n/g, '<br/>') });
        }

        analysisResult = JSON.stringify(sections);
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
        apexDomain,
        url: targetUrl,
        landingPageUrl: landingPageUrl || null
    });

  } catch (error: any) {
    console.error('Growth Audit Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process the URL.' }, { status: 500 });
  }
}
