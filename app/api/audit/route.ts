import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../lib/prisma';

// Basic prompt crafted from your specific Loom examples
const AUDIT_PROMPT = `You are Joel Otten, VP of Performance Branding, E-Commerce, and Growth at Marketing Hosting Agency. You have been in marketing for 15 years, and E-Commerce specifically for the past decade. You have worked with brands from startup to $100M+ companies, including names like the FasciaBlaster by Ashley Black, Pourri the makers of Poo~Pourri and Omi well beauty a Kardashian backed hair growth peptide brand.

You are performing a quick, 2-to-3 minute video audit (Loom) of a prospect's website. Your goal is to apply a "performance lens" to their site, providing highly tactical, educational insights regarding Conversion Rate Optimization (CRO), Accessibility/UX, Emotional Branding (Social Proof), and Advertising Strategies.

I will provide you with:
1. The prospect's brand name and website URLs (Homepage and optionally a specific Landing Page).
2. The extracted text from their Homepage and Landing Page.
3. Relevant Technical Data (Meta Pixel status, Shopify hosting status, and FAQ Schema detection).

Guidelines:
- **Intro:** Start exactly with this text (do not change it, just substitute {BRAND}): "Hello, my name is Joel Otten, and I'm a VP of Performance Branding, Digital Strategy, and Growth. Over my 19 years in marketing—with 16 dedicated specifically to e-commerce—I’ve managed over $100 million in ad spend. I've had the privilege of working with brands like Fascia Blaster, taking them from a start-up to a $100 million company with a $250 million valuation in just nine years; Pourri, the makers of Poo-Pourri; and Omi, the Kardashian-backed hair growth peptide brand.\n\nMarketing is a science. You start by identifying a hypothesis: who, what, how, and why a user will convert. Then, you map out a strategy to test that hypothesis, deploy it, and ensure you have the reporting tools in place to measure the KPIs accurately. What I'm going to walk you through today are some immediate hypotheses that should be tested for {BRAND}."
- **Structure:** You must structure your audit into exactly three phases, verbally transitioning between them.
- **Phase 1: The Value Capture Engine (Website & CRO):** Traffic is an expense; conversion is revenue. Evaluate how efficiently their digital storefront processes intent. Look at their CTA Hierarchy, Sitemap & Landing Pages. IF a Landing Page URL is provided, explicitly contrast its message continuity, funnel optimization, and intent matching against the broad homepage. Mention Site Speed/Core Web Vitals as mobile latency is a silent conversion killer. (Always mention looking at it through a mobile lens). **CRITICAL CRO CONTEXT**: If they have two primary CTAs side-by-side but it is clearly a delivery preference (e.g. "Shop Gummies" vs "Shop Capsules", "Mens" vs "Womens"), do NOT critique this as choice friction. Understand that routing the user to their desired delivery method takes priority.
- **Phase 2: The Discoverability Moat (SEO & AEO):** Explain that traditional SEO is only half the battle, and they need Answer Engine Optimization (AEO) for AI models (Gemini, ChatGPT, Perplexity). Audit their Keyword Architecture (mapping high-intent queries), AEO Readiness (AI prefers definitive answers and structured lists), and Schema Markup. **CRITICAL AEO CONTEXT**: I will provide whether they have FAQ Schema. FAQ schema is the MOST important aspect of AEO. Explicitly comment on their FAQ schema status. If they don't have it, emphasize that AI chat bots lack the context they need to answer questions about the brand.
- **Phase 3: The Acquisition Engine (Paid & Organic Social):** Evaluate social as a holistic performance ecosystem. Discuss their Creative Mix (UGC vs high-production), Social Proof Deployment (injecting reviews into MOFU retargeting ads), and Platform native strategy (e.g. TikTok shouldn't just be repurposed Meta assets).
- **Meta & Shopify Rule:** If they are hosted on Shopify AND have the Meta Pixel installed, Shopify natively handles the Pixel perfectly. DO NOT provide any commentary on the Meta Pixel. However, if the Pixel is NOT installed, warn them aggressively in Phase 1 or 3 about the missed retargeting opportunity.
- **Outro:** End with consultative support: "You're spending valuable time driving traffic to your website ensuring everything is set up to convert better would be the first thing you'd want to do. If you would like to dive deeper into your marketing strategy together, the next steps is scheduling your consultation."
- **Formatting & Tone:** Write conversationally but keep the language tight, sharp, and highly professional while still being urban and modern. Absolutely NO filler words (do not use "Um", "Uh", or "you know" artificially). Do not use bullet points or any structural markdown. CRITICAL: Because this script will be read aloud by an AI text-to-speech avatar, DO NOT include any phase labels, bold text, or headers like "**Phase 1: The Value Capture Engine**" or "Phase 2:". Just output the raw, spoken paragraphs directly. You must use natural, conversational verbal transitions to move between the three phases instead of visually labeling them. CRITICAL LENGTH RESTRICTION: Your entire response must be UNDER 3500 CHARACTERS to emulate a fast, 2-minute video. Be incredibly concise.

Data:
Primary Website URL: {URL}
Landing Page URL: {LANDING_URL}
Brand Name: {BRAND}
Meta Pixel Installed: {PIXEL_STATUS}
Is Shopify Site: {IS_SHOPIFY}
FAQ Schema Found: {FAQ_SCHEMA_FOUND}

Homepage Content Sample:
{CONTENT}

Landing Page Content Sample:
{LANDING_CONTENT}
`;

export async function POST(req: Request) {
  try {
    const { url, landingPageUrl, brand } = await req.json();

    if (!url || !brand) {
      return NextResponse.json({ error: 'URL and Brand Name are required' }, { status: 400 });
    }

    // Attempt to extract the core brand name and the apex domain for the ads libraries
    let brandName = url;
    let apexDomain = url;
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      // Remove www. to get the apex domain for Google (e.g., omiwellbeauty.com)
      apexDomain = parsedUrl.hostname.replace('www.', '');
      // Split by . to just get the core name for Meta (e.g., omiwellbeauty)
      brandName = apexDomain.split('.')[0];
    } catch (e) {
      console.warn("Could not parse domain from URL:", url);
    }

    // 1. Scrape the websites concurrently
    const fetchOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    };

    const [homeRes, landingRes] = await Promise.all([
      fetch(url, fetchOptions),
      landingPageUrl ? fetch(landingPageUrl, fetchOptions) : Promise.resolve(null)
    ]);

    if (!homeRes.ok) {
      throw new Error(`Failed to fetch homepage. Status: ${homeRes.status}`);
    }

    const homeHtml = await homeRes.text();
    const $home = cheerio.load(homeHtml);

    // Extract Homepage Text (limit to 2000 chars to save tokens and allow room for landing page)
    $home('script, style, nav, footer').remove();
    let homeTextContent = $home('body').text().replace(/\s+/g, ' ').trim().substring(0, 2000);

    // Extract Landing Page Text if provided
    let landingTextContent = "No distinct landing page was provided by the user.";
    let landingHtml = "";
    if (landingRes) {
      if (!landingRes.ok) throw new Error(`Failed to fetch landing page. Status: ${landingRes.status}`);
      landingHtml = await landingRes.text();
      const $landing = cheerio.load(landingHtml);
      $landing('script, style, nav, footer').remove();
      landingTextContent = $landing('body').text().replace(/\s+/g, ' ').trim().substring(0, 2000);
    }

    // 3. Check for Meta Pixel, Shopify, and FAQ Schema
    const checkPixel = (htmlSource: string) => {
      const lower = htmlSource.toLowerCase();
      return lower.includes('fbq(') || 
             lower.includes('fbevents.js') ||
             lower.includes('connect.facebook.net/en_us/fbevents.js') ||
             lower.includes('web-pixels-manager') || 
             lower.includes('googletagmanager.com/gtm.js');
    };

    const isShopify = homeHtml.toLowerCase().includes('myshopify.com');
    const metaPixelFound = checkPixel(homeHtml) || (landingHtml ? checkPixel(landingHtml) : false);

    let faqSchemaFound = false;
    const checkFaqSchema = ($doc: cheerio.CheerioAPI) => {
       $doc('script[type="application/ld+json"]').each((_, el) => {
         try {
            const jsonText = $doc(el).text();
            if (jsonText.includes('FAQPage')) {
               faqSchemaFound = true;
            }
         } catch(e) {}
       });
    };
    checkFaqSchema($home);
    if(landingHtml) {
      const $landing = cheerio.load(landingHtml);
      checkFaqSchema($landing);
    }

    // 4. Generate the script via LLM
    let script = "";
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not found. Returning a mock script.");
      script = `Hey there! Joel Otten here, Principal and remote CMO at Marketing Hosting Agency.\n\nI’ve spent the last 20 years in digital marketing, working with everyone from scaling startups to Fortune 2000 companies. At Marketing Hosting Agency, we're an OmniChannel Solution focused on true human-to-human connection. Our whole philosophy is based on "ID, Map, and Transmit"—helping you identify your exact audience, map their journey, and transmit your message across every channel and device.\n\nI was just taking a look at your website, ${url}, and honestly, there's a lot of great stuff here. But I noticed a few quick opportunities where we could better map that user journey and optimize for conversions.\n\nFirst, looking at your hero section, your main call-to-action could be transmitting your value a lot clearer. Sometimes simply bumping the contrast or changing the copy away from a generic "Learn More" to something action-oriented can make a huge difference in engagement.\n\nAlso, I noticed ${metaPixelFound ? 'you do have the Meta Pixel installed, which is great for the identification phase, but we should make sure it\'s fully optimized for OmniChannel retargeting.' : 'you don\'t currently have the Meta Pixel installed. This is a massive missed opportunity for identifying and retargeting people who visit but don\'t convert.'}\n\nI'd love to hop on a quick call to walk you through these strategies and see if there's a good fit for us to support your growth. Let me know!`;
    } else {
      const prompt = AUDIT_PROMPT
        .replace('{URL}', url)
        .replace('{LANDING_URL}', landingPageUrl || 'N/A')
        .replace(/{BRAND}/g, brand)
        .replace('{PIXEL_STATUS}', metaPixelFound ? 'Yes' : 'No')
        .replace('{IS_SHOPIFY}', isShopify ? 'Yes' : 'No')
        .replace('{FAQ_SCHEMA_FOUND}', faqSchemaFound ? 'Yes' : 'No')
        .replace('{CONTENT}', homeTextContent)
        .replace('{LANDING_CONTENT}', landingTextContent);

      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-sonnet-4-6',
      });
      
      script = message.content[0].type === 'text' ? message.content[0].text : "";
    }

    // 5. Save to Prisma & Return the results
    const auditRecord = await prisma.audit.create({
      data: {
        url,
        brandName,
        apexDomain,
        metaPixelFound,
        script
      }
    });

    return NextResponse.json({
      auditId: auditRecord.id,
      url,
      brandName,
      apexDomain,
      metaPixelFound,
      script
    });

  } catch (error: any) {
    console.error('Audit Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process the URL.' },
      { status: 500 }
    );
  }
}
