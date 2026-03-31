import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../lib/prisma';
import { marked } from 'marked';

const GROWTH_AUDIT_PROMPT = `You are Joel Otten, VP of Performance Branding, E-Commerce, and Growth at Marketing Hosting Agency. You are delivering an elite, master-level In-Depth Growth Audit for {BRAND} ({URL}).

I will provide you with the scraped text content from their homepage and landing page, along with the specific Social Media networks, Amazon presence, and Loyalty/Warranty keywords detected on their site.

CRITICAL FORMATTING INSTRUCTIONS (XML STRUCTURE & CONTENT FORMAT):
You must strictly format your response using exactly 7 <section> blocks.
Each <section> must contain an exactly matched <title> and a <content> tag.
The inside of the <content> tag MUST be strictly formatted in STANDARD MARKDOWN. Use **bold** for emphasis, \`-\` for bulleted lists, and double newlines (\`\\n\\n\`) to separate paragraphs. 
Use "Smart Brevity: The Power of Saying More with Less". Keep the insights brief, punchy, and bullet-pointed. The analysis MUST be written from a first-person perspective as Joel Otten (your "Blueprint"). DO NOT mention BCG, Boston Consulting Group, any agency, or yourself by name. Speak directly about "my blueprint" or "my thoughts".

CRITICAL TONAL RULE (HYPOTHESIS-DRIVEN):
Marketing is a science. There should be absolutely NO statements of fact, and you must NEVER say a brand "needs to do X". Every single insight must be framed strictly as a HYPOTHESIS to test with the client. 
BAD EXAMPLE: "...its messaging hierarchy needs sharpening to punch harder."
GOOD EXAMPLE: "...testing a new messaging hierarchy could sharpen the message to punch harder."
Present ideas entirely as "hypotheses we would like to spearhead a test on."

1. Title: "Prologue: Marketing is a Science"
Content Instructions: Act as an introduction. Introduce yourself (Joel Otten) and your executive experience in performance branding. Emphasize that marketing is fundamentally a deep science, and everything in this report moving forward is an elite hypothesis built to test and prove. The true winners in e-commerce strictly rely on mathematical testing.

2. Title: "Brand Messaging"
Content Instructions: Is there a tag line consistent across all channels? Is it based on science, problem, solution, or emotion? 

3. Title: "Website Optimization & Technicals"
Content Instructions: 
- CRO (Mobile First - iPhone 14 Pro Max): Evaluate the shoppability of the Homepage, Collection, and PDP. Can you add to cart/subscribe smoothly? Evaluate the Mobile Menu (more than 3 categories is too many). Look for a Sticky CTA on the PDP after scroll. 
- Lead Generation: Based on the scraped HTML, do they use Klaviyo/SMS popups? ({KLAVIYO_STATUS}).
- Cart Mechanics: Do they have Cart Upsells (Rebuy/Recharge)? ({CART_UPSELL_STATUS}). Are Quickpay options present? ({QUICKPAY_STATUS}). Is there a callout for free shipping thresholds? Check Cart Compliance for subscriptions (TOS unchecked box).
- Page Speed Insights: Include actual verified data: {PAGESPEED_DATA}. 

4. Title: "Meta (Facebook & Instagram)"
Content Instructions: Discuss organic strategy, paid media strategy, and affiliate marketing strategy for the Meta ecosystem all in this section. Based on the {SOCIALS} array detected, explicitly identify their active footprint. Provide a definitive blueprint of what their Paid Social strategy SHOULD look like: testing cobranded vs non-cobranded with social proof, testing divergent visual hooks, and assuring consistent branding. (Rule: DO NOT ask the user to verify ads; provide direct theoretical analysis). (Rule: Strongly advocate for routing traffic EXCLUSIVELY to the PDP, Collection page, or Homepage. Never recommend temporary standalone landing pages. That is a core belief). Also, do not recommend quizzes for standard eCommerce product variants like delivery methods.

5. Title: "TikTok"
Content Instructions: Discuss organic strategy, paid ads strategy, and TikTok affiliates all in this section. Recommend a TikTok shop integration and deploying TikTok affiliates. Check if an affiliate portal exists ({AFFILIATE_STATUS}).

6. Title: "Google & YouTube"
Content Instructions: Discuss paid advertising, organic strategy, and SEO all in this section. Provide a blueprint of what their Google strategy SHOULD look like. (Rule: DO NOT ask the user to verify Google ads; analyze theoretically). 

7. Title: "CRM & Lifecycle Marketing"
Content Instructions: Emphasize that SMS/Email flows are the engine of CRM revenue. 
- Post-purchase flows for loyalty and product education.
- The 4th Purchase Rule (loyal customers become brand evangelists).

Brand: {BRAND}
URL: {URL}

Extracted HTML Content Elements:
{CONTENT}
{DOM_SIGNALS}
{SEO_SNIPPET}

{STYLE_RULES}
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

    $home('a').each((_, el) => {
        const href = $home(el).attr('href')?.toLowerCase() || '';
        if (href.includes('/pages/affiliate') || href.includes('/affiliate')) {
            if (!affiliateProgramsFound.includes('Affiliate Landing Page')) affiliateProgramsFound.push('Affiliate Landing Page');
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
    let csvContent = "URL,Meta Title,Meta Description\n";
    const crawlResults = await Promise.all(urlsToCrawl.map(async (u) => {
        try {
            const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, signal: AbortSignal.timeout(5000) }).catch(() => null);
            if (!r || !r.ok) return `"${u}","Access Blocked","Access Blocked"\n`;
            const html = await r.text();
            const $u = cheerio.load(html);
            let title = $u('title').text()?.replace(/"/g, '""')?.trim() || "Missing Title";
            let desc = $u('meta[name="description"]').attr('content')?.replace(/"/g, '""')?.trim() || "Missing Description";
            return `"${u}","${title}","${desc}"\n`;
        } catch (e) {
            return `"${u}","Error","Error"\n`;
        }
    }));
    csvContent += crawlResults.join('');
    
    let seoSnippet = "Top Site Infrastructure Meta Mappings:\n";
    crawlResults.slice(0, 5).forEach(res => seoSnippet += res);

    // 4. Technical checks (Pixel, Shopify, Schema)
    const checkPixel = (htmlSource: string) => {
      const lower = htmlSource.toLowerCase();
      return lower.includes('fbq(') || 
             lower.includes('fbevents.js') || 
             lower.includes('web-pixels-manager') || 
             lower.includes('googletagmanager.com/gtm.js') ||
             lower.includes('tealium') ||
             lower.includes('ensighten') ||
             lower.includes('segment.com/analytics.js') ||
             lower.includes('assets.adobedtm.com');
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
    let pageSpeedStr = "Google PageSpeed API data was rate limited during the audit. Omit explicit performance score metrics.";
    try {
        const apiKeyParam = process.env.GOOGLE_PAGESPEED_API_KEY ? `&key=${process.env.GOOGLE_PAGESPEED_API_KEY}` : '';
        const psRes = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&url=${encodeURIComponent(targetUrl)}${apiKeyParam}`, { signal: AbortSignal.timeout(6000) }).catch(() => null);
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
        const checkKeyword = (lowerHtml: string, keywords: string[]) => keywords.some(k => lowerHtml.includes(k));
        let klaviyoStatus = checkKeyword(homeHtmlLower, ['klaviyo', 'klaviyo-form']) ? "Klaviyo JS/Forms Detected" : "No Klaviyo scripts visually detected in DOM";
        let cartUpsells = [];
        if (checkKeyword(homeHtmlLower, ['rebuy'])) cartUpsells.push('Rebuy (Upsell JS)');
        if (checkKeyword(homeHtmlLower, ['recharge'])) cartUpsells.push('Recharge (Subscriptions)');
        let upsellStatus = cartUpsells.length > 0 ? `Cart Extensibility: ${cartUpsells.join(', ')}` : "No explicit Rebuy/Recharge scripts detected.";
        let quickpayUrls = [];
        if (checkKeyword(homeHtmlLower, ['shop-pay', 'shop pay', 'cdn.shopify.com/s/javascripts/'])) quickpayUrls.push('Shop Pay');
        if (checkKeyword(homeHtmlLower, ['paypal'])) quickpayUrls.push('PayPal');
        if (checkKeyword(homeHtmlLower, ['apple-pay', 'applepay'])) quickpayUrls.push('Apple Pay');
        let quickpayStatus = quickpayUrls.length > 0 ? `Quickpay Detected: ${quickpayUrls.join(', ')}` : "No direct Quickpay JS tokens found.";
        
        let domSignals = `Technical DOM Signals:\nAffiliates Status: ${affiliateProgramsFound.length > 0 ? affiliateProgramsFound.join(', ') : 'None'}\nLead Gen: ${klaviyoStatus}\nCart Upsells: ${upsellStatus}\nQuickpay: ${quickpayStatus}`;

        let styleRulesStr = "";
        try {
            const rules = await prisma.styleRule.findMany({
                orderBy: { createdAt: 'desc' },
                take: 20
            });
            if (rules.length > 0) {
                styleRulesStr = "\n--- CRITICAL STYLE RULES (LEARNED FROM PAST EDITS) ---\nThe following stylistic rules must be STRICTLY adhered to. Limit superlatives if told to. Follow these user preferences exactly:\n" + rules.map((r: { section: string, rule: string }) => `- [${r.section}] ${r.rule}`).join('\n');
            }
        } catch(e) {
            console.error("Failed to fetch style rules", e);
        }

        const prompt = GROWTH_AUDIT_PROMPT
            .replace(/{URL}/g, targetUrl)
            .replace(/{BRAND}/g, brandName)
            .replace('{SOCIALS}', socialLinks.length > 0 ? socialLinks.map(s => s.name).join(', ') : 'None Detected')
            .replace('{LOYALTY}', loyaltyFound.length > 0 ? loyaltyFound.join(', ') : 'No exact keywords matching rewards/loyalty/warranty found')
            .replace('{CONTENT}', textContent)
            .replace('{KLAVIYO_STATUS}', klaviyoStatus)
            .replace('{CART_UPSELL_STATUS}', upsellStatus)
            .replace('{QUICKPAY_STATUS}', quickpayStatus)
            .replace('{AFFILIATE_STATUS}', affiliateProgramsFound.length > 0 ? 'Active Program Found' : 'No Program Found')
            .replace('{DOM_SIGNALS}', domSignals)
            .replace('{PAGESPEED_DATA}', pageSpeedStr)
            .replace('{SEO_SNIPPET}', seoSnippet)
            .replace('{STYLE_RULES}', styleRulesStr);

        const anthropic = new Anthropic({ 
            apiKey: process.env.ANTHROPIC_API_KEY,
            defaultHeaders: { "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15" }
        });
        const message = await anthropic.messages.create({
            max_tokens: 8192,
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
