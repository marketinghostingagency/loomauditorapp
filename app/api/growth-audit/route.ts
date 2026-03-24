import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../lib/prisma';
import { marked } from 'marked';

const GROWTH_AUDIT_PROMPT = `You are Joel Otten, a Senior Partner at Boston Consulting Group (BCG) specializing in E-commerce scaling, Omnichannel Retail, and DTC Growth Strategy. You are delivering an elite, master-level In-Depth Growth Audit for {BRAND} ({URL}).

I will provide you with the scraped text content from their homepage and landing page, along with the specific Social Media networks, Amazon presence, and Loyalty/Warranty keywords detected on their site.

CRITICAL FORMATTING INSTRUCTIONS (XML STRUCTURE & CONTENT FORMAT):
You must strictly format your response using exactly 7 <section> blocks.
Each <section> must contain an exactly matched <title> and a <content> tag.
The inside of the <content> tag MUST be strictly formatted in STANDARD MARKDOWN. Use **bold** for emphasis, \`-\` for bulleted lists, and double newlines (\`\\n\\n\`) to separate paragraphs. 
Use "Smart Brevity: The Power of Saying More with Less". Keep the insights brief, punchy, and bullet-pointed, but ensure the analysis is exhaustive and BCG-consultant tier. It should contain multiple tactical hypotheses that they can test organically woven into the bullet points (do not specifically identify them as "Hypotheses" or create a literal list of hypotheses).

1. Title: "Brand Messaging"
Content Instructions: Is there a tag line consistent across all channels? Is it based on science, problem, solution, or emotion? Does it connect with the audience? Do make any suggestions just try and identify if they have any they are using based on their site. Briefly discuss "Performance Branding" which involves consistent branding so consumers remember your brand, creating higher conversion rates, interest, and increasing awareness. (CRITICAL: Do NOT mention or quote "Byron Sharp" or "mental availability").

2. Title: "Website Optimization & Technicals"
Content Instructions: 
- CRO: Assess their primary CTA styling. Commend them explicitly if they are retaining a singular CTA color matrix across dynamic variants (Add to bag, buy now). Also, carefully evaluate Fixed CTAs based on page context: ({PAGE_CONTEXT}). 
- CRM Lead Magnets: Evaluate their pop-ups and landing pages. Do they have compelling offers? (Not all need to be discounts, tip-based magnets work too). Give a nod to their Quiz Engine if they successfully have one ({QUIZ_STATUS}). Ignore passive Shopify checkout "opt-in" checkboxes.
- Page Speed Insights: Include actual verified data: {PAGESPEED_DATA}. 
- SEO & AEO: Evaluate their schema markup utilizing the provided ({FAQ_SCHEMA_STATUS}): proper schema including FAQs and Author markup is mandatory for AEO. Also utilize this extracted visual data: {ALT_TEXT_DATA}. Do they utilize meta titles and descriptions effectively across the architecture to capture crawl intent?
- Community Engagement: Do they offer easy affiliate sign ups and clear links to organic social pages?

3. Title: "Organic Social Ecosystem"
Content Instructions: Based on the {SOCIALS} array detected, explicitly identify their active footprint. Form theories about their organic posting. Are they posting regularly? Identify frequency and engagement rates (engagement / likes or followers) of each channel. What kind of content is being posted? Does it address the needs or interests of the target audience? Is there enough social proof being shared? What mediums (stories, grid)?

4. Title: "Meta Advertising (Facebook & Instagram)"
Content Instructions: Theoretically evaluate their Meta strategy: Are they running cobranded ads? Or non-cobranded with social proof? Are they using various hooks? Is the brand messaging consistent to ensure the brand is memorable in the first 4 seconds via the copy/video?

5. Title: "TikTok Advertising & Affiliates"
Content Instructions: Theoretically evaluate: Do they have TikTok shop? Do they have TikTok affiliates? Are their affiliate programs interconnected (mention Social Snowball as a good program for that)?

6. Title: "Google Advertising & YouTube"
Content Instructions: Theoretically evaluate: How is the copy? Is it in line with brand messaging? Solving problems using emotional appeal. All messaging needs to create urgency. Is there any YouTube advertising? Point out that many times social assets can be easily repurposed for YouTube.

7. Title: "CRM & Lifecycle Marketing (Retention)"
Content Instructions: Provide a note: 'I've been in mobile marketing since 2005 (2 years before the iPhone came out)'. A marketer's holy grail is to build a 1-to-1 connection with customers and nothing is more intimate than the phone. Identify SMS marketing potential. Emphasize that flows or automations should be where the bulk of CRM revenue comes from:
- Flows for prospects that gave data to get the lead magnet.
- Post-purchase flows ensuring customers are using the product, answering questions, building brand loyalty, and attempting to secure their 2nd purchase. 
- The 4th Purchase Rule: If you get a customer to buy 4 times, they are a loyal customer. You must ensure that customer is an affiliate/brand evangelist on social channels and gets compensated for referrals.
- Campaigns (email/SMS) should then be used to articulate any timely offers or news that would interest your customers or leads.

Brand: {BRAND}
URL: {URL}

Extracted Website Content & Meta Snippets:
{CONTENT}
{SEO_SNIPPET}
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
    
    // Evaluate full raw HTML to catch tracking scripts loaded natively in the DOM headers
    const homeHtmlLower = homeHtml.toLowerCase();
    affiliateKeywords.forEach(keyword => {
        if (homeHtmlLower.includes(keyword) && !affiliateProgramsFound.includes(keyword)) {
            affiliateProgramsFound.push(keyword);
        }
    });
    
    // 2. Social & Amazon & Loyalty Checks
    const socialLinks: { name: string, url: string }[] = [];
    const loyaltyKeywords = ['rewards', 'loyalty', 'vip', 'warranty', 'guarantee'];
    let loyaltyFound: string[] = [];

    $home('a').each((_, el) => {
        const href = $home(el).attr('href');
        if (!href) return;
        const lowerHref = href.toLowerCase();
        const text = $home(el).text().toLowerCase();

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

    const isPDP = url.includes('/products/') || url.includes('/p/');
    const isCollection = url.includes('/collections/') || url.includes('/c/');
    const isHomepage = url === baseUrl || url === baseUrl + '/';
    const pageContext = isPDP ? "Page is a Product Detail Page (PDP): MUST strongly enforce evaluating a sticky/fixed CTA." : isCollection ? "Page is a Collection Page: General Fixed CTAs are NOT recommended here." : isHomepage ? "Page is Homepage: Fixed CTAs are NOT recommended here." : "General Page: Consider recommending a sticky CTA only if it spans long scrolls.";

    // Image Alt Text Checker
    let imgCount = 0; let imgWithAltCount = 0; let missingAltCount = 0;
    $home('img').each((_, el) => {
        imgCount++;
        const alt = $home(el).attr('alt');
        if (alt && alt.trim().length > 0) imgWithAltCount++; else missingAltCount++;
    });
    const altTextStr = `Image SEO: Scanned ${imgCount} total images on the page. ${imgWithAltCount} have functional alt text, ${missingAltCount} are missing alt text completely.`;

    // 3. Sitemap & CSV Meta Data Generator
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
    const quizLink = sitemapUrls.find(link => link.toLowerCase().includes('quiz'));
    const quizStatus = quizLink ? `Active Quiz URL Detected: ${quizLink}` : `No quiz URLs detected`;

    // Spin up concurrent multi-page crawler to map Meta Data
    const urlsToCrawl = sitemapUrls.slice(0, 20); // Capture the top 20 structural limbs
    let csvContent = "URL,Meta Title,Meta Description\\n";
    const crawlResults = await Promise.all(urlsToCrawl.map(async (u) => {
        try {
            const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, signal: AbortSignal.timeout(5000) }).catch(() => null);
            if (!r || !r.ok) return `"${u}","Access Blocked","Access Blocked"\\n`;
            const html = await r.text();
            const $u = cheerio.load(html);
            let title = $u('title').text()?.replace(/"/g, '""')?.trim() || "Missing Title";
            let desc = $u('meta[name="description"]').attr('content')?.replace(/"/g, '""')?.trim() || "Missing Description";
            return `"${u}","${title}","${desc}"\\n`;
        } catch (e) {
            return `"${u}","Error","Error"\\n`;
        }
    }));
    csvContent += crawlResults.join('');
    
    let seoSnippet = "Top Site Infrastructure Meta Mappings:\\n";
    crawlResults.slice(0, 5).forEach(res => seoSnippet += res);

    // 4. Technical checks (Pixel, Shopify, Schema)
    const checkPixel = (htmlSource: string) => {
      const lower = htmlSource.toLowerCase();
      return lower.includes('fbq(') || lower.includes('fbevents.js') || lower.includes('web-pixels-manager') || lower.includes('googletagmanager.com/gtm.js');
    };
    const isShopify = homeHtml.toLowerCase().includes('myshopify.com');
    const metaPixelFound = checkPixel(homeHtml) || (landingHtml ? checkPixel(landingHtml) : false);

    let hasFaqSchema = false;
    $home('script[type="application/ld+json"]').each((_, el) => {
        const text = $home(el).html();
        if (text && text.includes('FAQPage')) hasFaqSchema = true;
    });
    if ($landing && !hasFaqSchema) {
        $landing('script[type="application/ld+json"]').each((_, el) => {
            const text = $landing(el).html();
            if (text && text.includes('FAQPage')) hasFaqSchema = true;
        });
    }
    const faqStatus = hasFaqSchema ? "Yes, FAQPage schema.org markup detected" : "No FAQPage schema.org markup detected";

    // 5. Content Extraction
    $home('script, style, nav, footer, noscript').remove();
    let textContent = $home('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);
    // Strip empty JS countdown timers to prevent LLM hallucinations
    textContent = textContent.replace(/0 days 0 hrs 0 mins 0 secs/gi, ''); 

    if ($landing) {
        $landing('script, style, nav, footer, noscript').remove();
        let landingText = $landing('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);
        landingText = landingText.replace(/0 days 0 hrs 0 mins 0 secs/gi, '');
        textContent += "\n\n--- LANDING PAGE CONTENT ---\n\n" + landingText;
    }

    // Google PageSpeed Insights REST API Call
    let pageSpeedStr = "Google PageSpeed APIs timed out or rate-limited. Omit explicit performance score metrics.";
    try {
        const psRes = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&url=${encodeURIComponent(targetUrl)}`, { signal: AbortSignal.timeout(6000) }).catch(() => null);
        if (psRes && psRes.ok) {
            const psData = await psRes.json();
            const score = psData.lighthouseResult?.categories?.performance?.score;
            if (score) pageSpeedStr = `Live Google PageSpeed REST API returned a Mobile Performance Score of ${Math.round(score * 100)}/100.`;
        }
    } catch(e) {}
    
    let analysisResult = "";
    if (!process.env.ANTHROPIC_API_KEY) {
        analysisResult = JSON.stringify([{ title: "Error", content: "<p>LLM API Key missing. Growth analysis could not be generated.</p>" }]);
    } else {
        const prompt = GROWTH_AUDIT_PROMPT
            .replace(/{URL}/g, targetUrl)
            .replace(/{BRAND}/g, brandName)
            .replace('{SOCIALS}', socialLinks.length > 0 ? socialLinks.map(s => s.name).join(', ') : 'None Detected')
            .replace('{LOYALTY}', loyaltyFound.length > 0 ? loyaltyFound.join(', ') : 'No exact keywords matching rewards/loyalty/warranty found')
            .replace('{CONTENT}', textContent)
            .replace('{QUIZ_STATUS}', quizStatus)
            .replace('{PAGE_CONTEXT}', pageContext)
            .replace('{ALT_TEXT_DATA}', altTextStr)
            .replace('{PAGESPEED_DATA}', pageSpeedStr)
            .replace('{SEO_SNIPPET}', seoSnippet)
            .replace('{FAQ_SCHEMA_STATUS}', faqStatus);

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
           const rawMarkdown = match[2].trim();
           // Compile raw Markdown from Claude firmly into safe HTML syntax before shipping to the client UI
           const contentHtml = (await marked.parse(rawMarkdown))
                .replace(/<p>/g, '<p style="margin-bottom: 1.5rem;">')
                .replace(/<ul>/g, '<ul style="margin-top: 1rem; margin-bottom: 1rem; padding-left: 1.5rem; list-style-type: disc;">')
                .replace(/<li>/g, '<li style="margin-bottom: 0.5rem;">')
                .replace(/<strong>/g, '<strong style="color: #f5ed38;">');

           sections.push({
             title: match[1].trim().replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
             content: contentHtml
           });
        }
        
        if (sections.length === 0) {
           const fallbackHtml = (await marked.parse(rawAnswer))
                .replace(/<p>/g, '<p style="margin-bottom: 1.5rem;">')
                .replace(/<ul>/g, '<ul style="margin-top: 1rem; margin-bottom: 1rem; padding-left: 1.5rem; list-style-type: disc;">')
                .replace(/<li>/g, '<li style="margin-bottom: 0.5rem;">')
                .replace(/<strong>/g, '<strong style="color: #f5ed38;">');
           sections.push({ title: "Analysis Summary", content: fallbackHtml });
        }

        analysisResult = JSON.stringify(sections);
    }

    const auditRecord = await prisma.audit.create({
      data: {
        url: targetUrl,
        brandName,
        apexDomain,
        metaPixelFound,
        sitemapXml: Buffer.from(csvContent).toString('base64'),
        affiliatePrograms: JSON.stringify(affiliateProgramsFound),
        landingPageUrl: landingPageUrl || null,
        socialLinks: JSON.stringify(socialLinks),
        aiAnalysis: analysisResult,
        script: ""
      }
    });

    return NextResponse.json({
        auditId: auditRecord.id,
        affiliatePrograms: affiliateProgramsFound,
        sitemapXml: Buffer.from(csvContent).toString('base64'),
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
