import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../lib/prisma';
import { marked } from 'marked';
import nodemailer from 'nodemailer';

const CRO_PROMPT = `You are an elite eCommerce Conversion Rate Optimization (CRO) & Technical expert. Your task is to analyze the following website data, including full Markdown content, PageSpeed insights, and technical DOM signals, and output a concise, actionable summary of friction points, cart mechanics, and messaging clarity.
Do not format this as the final audit. Just provide raw factual observations and hypotheses for CRO and brand messaging.
Brand: {BRAND} ({URL})
PageSpeed: {PAGESPEED_DATA}
DOM Signals: {DOM_SIGNALS}
Extracted Content:
{CONTENT}`;

const MEDIA_PROMPT = `You are an elite Paid Media & Traffic Executive specializing in Meta, TikTok, and Google/YouTube. 
Your task is to analyze the website's detected social channels, affiliate presence, pixel installations, and organic posture.
Do not format this as the final audit. Provide a concise factual summary of where they are currently advertising, and generate high-level hypotheses on what their Meta, TikTok, and Google blueprints SHOULD look like.
Brand: {BRAND} ({URL})
Social Links Detected: {SOCIALS}
Affiliate Programs: {AFFILIATE_STATUS}
SEO Metadata: {SEO_SNIPPET}
DOM Signals: {DOM_SIGNALS}`;

const CRM_PROMPT = `You are an elite Lifecycle Marketing & CRM Director.
Your task is to analyze the site's detected Klaviyo usage, loyalty/warranty keywords, and cart extensibility integrations to hypothesize on their retention strategy.
Do not format this as the final audit. Provide actionable hypotheses regarding their SMS, post-purchase flows, and "4th Purchase" brand evangelism loops.
Brand: {BRAND} ({URL})
Loyalty Signals: {LOYALTY}
DOM Signals: {DOM_SIGNALS}`;

const SYNTHESIZER_PROMPT = `You are Joel Otten. You are speaking as a Senior Partner at an elite, top-tier management consulting firm (in the mold of McKinsey, BCG, or Bain). You deliver high-level, mathematically-driven executive strategy to the C-Suite of {BRAND} ({URL}).

You have just received raw insight briefings from your 3 operational Directors (CRO, Media, and CRM). Your job is to synthesize their insights into a brutal, sharp, 7-section Master Growth Audit.

CRITICAL FORMATTING INSTRUCTIONS (XML STRUCTURE & CONTENT FORMAT):
You must strictly format your response using exactly 7 <section> blocks.
Each <section> must contain an exactly matched <title> and a <content> tag.
The inside of the <content> tag MUST be strictly formatted in STANDARD MARKDOWN. Use **bold** for emphasis, \`-\` for bulleted lists, and double newlines (\`\\n\\n\`) to separate paragraphs.
Use "Smart Brevity: The Power of Saying More with Less". Keep the insights brief, punchy, and bullet-pointed. Speak directly about "our hypothesis" or "my thoughts". While you speak like an elite MBB consultant (using frameworks like MECE, unit economics, LTV:CAC logic, and systematic testing), DO NOT literally say the names "McKinsey", "BCG", or "Bain". Maintain the absolute highest standard of executive communication.

CRITICAL TONAL RULE (HYPOTHESIS-DRIVEN):
Marketing is a science. There should be absolutely NO statements of fact, and you must NEVER say a brand "needs to do X". Every single insight must be framed strictly as a HYPOTHESIS to test with the client.
BAD: "...its messaging hierarchy needs sharpening to punch harder."
GOOD: "...testing a new messaging hierarchy could sharpen the message to punch harder at the top-of-funnel."
Present ideas entirely as "hypotheses we would like to spearhead a test on."

1. Title: "Prologue: Marketing is a Science"
Act as an introduction. Introduce yourself (Joel Otten) and your executive experience in performance branding. Emphasize that marketing is a deep science, and everything in this report is an elite hypothesis built to prove. True winners in e-commerce strictly rely on mathematical testing.

2. Title: "Brand Messaging"
Ensure you evaluate their overarching value proposition and taglines based on the CRO Briefing.

3. Title: "Website Optimization & Technicals"
Ensure you evaluate shoppability, mobile view, cart mechanics, and load speed based on the CRO Briefing.

4. Title: "Meta (Facebook & Instagram)"
Provide a definitive blueprint of their expected Paid Social structure based on the Media Briefing.

5. Title: "TikTok"
Provide blueprint based on the Media Briefing.

6. Title: "Google & YouTube"
Provide blueprint based on the Media Briefing.

7. Title: "CRM & Lifecycle Marketing"
Synthesize the CRM Briefing into SMS/Email retention loops and the 4th purchase rule.

{STYLE_RULES}

Here are the briefings from your Directors:
---
[CRO DIRECTOR BRIEFING]
{CRO_OUTPUT}
---
[MEDIA DIRECTOR BRIEFING]
{MEDIA_OUTPUT}
---
[CRM DIRECTOR BRIEFING]
{CRM_OUTPUT}
`;

export async function POST(req: Request) {
  try {
    const { url, brand, landingPageUrl, leadName, leadEmail, leadPhone } = await req.json();

    if (!url || !brand) {
      return NextResponse.json({ error: 'URL and Brand Name are required' }, { status: 400 });
    }

    let targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const baseUrlObj = new URL(targetUrl);
    const baseUrl = baseUrlObj.origin;
    let brandName = brand;
    let apexDomain = baseUrlObj.hostname.replace('www.', '');

    // 1. Create immediate placeholder audit
    const auditRecord = await prisma.audit.create({
      data: {
        url: targetUrl,
        brandName,
        apexDomain,
        landingPageUrl: landingPageUrl || null,
        script: "",
        aiAnalysis: "" 
      }
    });

    // 2. Capture Lead instantly
    if (leadName && leadEmail) {
       await prisma.lead.create({
          data: { name: leadName, email: leadEmail, phone: leadPhone, brandName, auditId: auditRecord.id }
       });
       
       // Send Joel a notification email in the background (fire and forget)
       fetch('http://localhost:3000/api/lead-capture', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ name: leadName, email: leadEmail, phone: leadPhone, brandName, auditId: auditRecord.id })
       }).catch(() => {});
    }

    // 3. Define Heavy Background Process
    const processAudit = async (auditId: string) => {
        try {
            const fetchOptions = {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            };

            const [homeRes, landingRes, jinaHomeRes, jinaLandingRes, sitemapRes] = await Promise.all([
              fetch(targetUrl, fetchOptions).catch(() => null),
              landingPageUrl ? fetch(landingPageUrl, fetchOptions).catch(() => null) : Promise.resolve(null),
              fetch(`https://r.jina.ai/${targetUrl}`, { headers: { 'Accept': 'text/plain' } }).catch(() => null),
              landingPageUrl ? fetch(`https://r.jina.ai/${landingPageUrl}`, { headers: { 'Accept': 'text/plain' } }).catch(() => null) : Promise.resolve(null),
              fetch(`${baseUrl}/sitemap.xml`, fetchOptions).catch(() => null)
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

            // 2. Social & Amazon & Loyalty Checks (+ Pinterest)
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
                if (lowerHref.includes('pinterest.com') && !socialLinks.some(s => s.name === 'Pinterest')) socialLinks.push({ name: 'Pinterest', url: href });
            });

            const rawBodyText = $home('body').text().toLowerCase();
            loyaltyKeywords.forEach(keyword => {
               if (rawBodyText.includes(keyword)) loyaltyFound.push(keyword);
            });

            // 3. True Sitemap & CSV Meta Data Generator
            const sitemapUrls = new Set<string>();
            sitemapUrls.add(baseUrl + '/');
            
            if (sitemapRes && sitemapRes.ok) {
                const sitemapText = await sitemapRes.text();
                // Extract all <loc> tags
                const locRegex = /<loc>(.*?)<\/loc>/gi;
                let match;
                while ((match = locRegex.exec(sitemapText)) !== null) {
                    sitemapUrls.add(match[1]);
                }
            }
            
            // Fallback to internal links if sitemap was empty or failed
            if (sitemapUrls.size <= 1) {
                $home('a').each((_, el) => {
                    const href = $home(el).attr('href');
                    if (!href) return;
                    if (href.startsWith('/') && !href.startsWith('//')) {
                        sitemapUrls.add(baseUrl + href);
                    } else if (href.startsWith(baseUrl)) {
                        sitemapUrls.add(href);
                    }
                });
            }

            const urlsToCrawl = Array.from(sitemapUrls).slice(0, 50); // Upgraded from 20 to 50
            let csvContent = "URL,Meta Title,Meta Description\n";
            // Crawl top 10 for metadata to save execution time in the background
            const crawlResults = await Promise.all(urlsToCrawl.slice(0, 10).map(async (u) => {
                try {
                    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }).catch(() => null);
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
            
            // For the sitemap.csv download, we just map all found urls
            urlsToCrawl.forEach((u, i) => {
               if (i >= 10) csvContent += `"${u}","Not Fetched","Not Fetched"\n`; 
               else csvContent += crawlResults[i];
            });
            
            let seoSnippet = "Top Site Infrastructure Meta Mappings:\n" + crawlResults.slice(0, 5).join('');

            // 4. Technical checks
            const checkPixel = (htmlSource: string) => {
              const lower = htmlSource.toLowerCase();
              return lower.includes('fbq(') || lower.includes('fbevents.js') || lower.includes('googletagmanager.com/gtm.js');
            };
            const metaPixelFound = checkPixel(homeHtml) || (landingHtml ? checkPixel(landingHtml) : false);

            // 5. Content Extraction
            let textContent = "";
            if (jinaHomeRes && jinaHomeRes.ok) {
                 textContent = await jinaHomeRes.text();
            } else {
                $home('script, style, nav, footer, noscript').remove();
                textContent = $home('body').text().replace(/\s+/g, ' ').trim();
            }
            textContent = textContent.replace(/0 days 0 hrs 0 mins 0 secs/gi, '').substring(0, 15000);

            if (landingPageUrl) {
                let landingText = "";
                if (jinaLandingRes && jinaLandingRes.ok) {
                    landingText = await jinaLandingRes.text();
                } else if ($landing) {
                    $landing('script, style, nav, footer, noscript').remove();
                    landingText = $landing('body').text().replace(/\s+/g, ' ').trim();
                }
                if (landingText) {
                    landingText = landingText.replace(/0 days 0 hrs 0 mins 0 secs/gi, '').substring(0, 15000);
                    textContent += "\n\n--- LANDING PAGE CONTENT ---\n\n" + landingText;
                }
            }

            // Google PageSpeed
            let pageSpeedStr = "Google PageSpeed API data was rate limited.";
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
            if (process.env.ANTHROPIC_API_KEY) {
                let domSignals = `Technical DOM Signals:\nAffiliates Status: ${affiliateProgramsFound.length > 0 ? affiliateProgramsFound.join(', ') : 'None'}`;
                let styleRulesStr = "";
                try {
                    const rules = await prisma.styleRule.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
                    if (rules.length > 0) {
                        styleRulesStr = "\n--- CRITICAL STYLE RULES (LEARNED FROM PAST EDITS) ---\n" + rules.map((r: { section: string, rule: string }) => `- [${r.section}] ${r.rule}`).join('\n');
                    }
                } catch(e) {}

                const croPromptStr = CRO_PROMPT.replace(/{URL}/g, targetUrl).replace(/{BRAND}/g, brandName).replace('{CONTENT}', textContent).replace('{PAGESPEED_DATA}', pageSpeedStr).replace('{DOM_SIGNALS}', domSignals);
                const mediaPromptStr = MEDIA_PROMPT.replace(/{URL}/g, targetUrl).replace(/{BRAND}/g, brandName).replace('{SOCIALS}', socialLinks.length > 0 ? socialLinks.map(s => s.name).join(', ') : 'None Detected').replace('{AFFILIATE_STATUS}', affiliateProgramsFound.length > 0 ? 'Active Program Found' : 'No Program Found').replace('{SEO_SNIPPET}', seoSnippet).replace('{DOM_SIGNALS}', domSignals);
                const crmPromptStr = CRM_PROMPT.replace(/{URL}/g, targetUrl).replace(/{BRAND}/g, brandName).replace('{LOYALTY}', loyaltyFound.length > 0 ? loyaltyFound.join(', ') : 'No exact keywords matching rewards/loyalty/warranty found').replace('{DOM_SIGNALS}', domSignals);

                const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
                
                const [croRes, mediaRes, crmRes] = await Promise.all([
                    anthropic.messages.create({ max_tokens: 1500, messages: [{ role: 'user', content: croPromptStr }], model: 'claude-sonnet-4-6' }),
                    anthropic.messages.create({ max_tokens: 1500, messages: [{ role: 'user', content: mediaPromptStr }], model: 'claude-sonnet-4-6' }),
                    anthropic.messages.create({ max_tokens: 1500, messages: [{ role: 'user', content: crmPromptStr }], model: 'claude-sonnet-4-6' })
                ]);

                const synthPrompt = SYNTHESIZER_PROMPT.replace(/{URL}/g, targetUrl).replace(/{BRAND}/g, brandName).replace('{STYLE_RULES}', styleRulesStr).replace('{CRO_OUTPUT}', croRes.content[0].type==='text'?croRes.content[0].text:"").replace('{MEDIA_OUTPUT}', mediaRes.content[0].type==='text'?mediaRes.content[0].text:"").replace('{CRM_OUTPUT}', crmRes.content[0].type==='text'?crmRes.content[0].text:"");

                const message = await anthropic.messages.create({ max_tokens: 8192, messages: [{ role: 'user', content: synthPrompt }], model: 'claude-sonnet-4-6' });
                let rawAnswer = message.content[0].type === 'text' ? message.content[0].text : "";
                
                const sections: { title: string, content: string }[] = [];
                const sectionRegex = /<section>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<content>([\s\S]*?)<\/content>[\s\S]*?<\/section>/gi;
                let match;
                while ((match = sectionRegex.exec(rawAnswer)) !== null) {
                   const rawContent = match[2].trim();
                   const contentHtml = (await marked.parse(rawContent))
                        .replace(/<p>/g, '<p style="margin-bottom: 1.5rem;">')
                        .replace(/<ul>/g, '<ul style="margin-top: 1rem; margin-bottom: 1rem; padding-left: 1.5rem; list-style-type: disc;">')
                        .replace(/<li>/g, '<li style="margin-bottom: 0.5rem;">')
                        .replace(/<strong>/g, '<strong style="color: #f5ed38;">');
                   sections.push({ title: match[1].trim().replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'), content: contentHtml });
                }
                
                if (sections.length === 0) sections.push({ title: "Analysis Summary", content: (await marked.parse(rawAnswer)) });
                analysisResult = JSON.stringify(sections);
            }

            // Save Final Audit Update
            await prisma.audit.update({
                where: { id: auditId },
                data: {
                    metaPixelFound,
                    sitemapXml: Buffer.from(csvContent).toString('base64'),
                    affiliatePrograms: JSON.stringify(affiliateProgramsFound),
                    socialLinks: JSON.stringify(socialLinks),
                    aiAnalysis: analysisResult,
                }
            });

            // Notify Joel that the Audit is Ready for Review
            if (process.env.SMTP_USER) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
                });
                await transporter.sendMail({
                    from: '"Loom Auditor System" <no-reply@marketinghosting.agency>',
                    to: 'joel@marketinghosting.agency',
                    subject: `🚨 Audit Ready for Review: ${brandName}`,
                    html: `
                        <p>Joel,</p>
                        <p>The MHA Intelligence Engine has finished crunching data for <strong>${brandName}</strong>.</p>
                        <p>Lead info: ${leadName || 'No Name'} (${leadEmail || 'N/A'})</p>
                        <hr />
                        <p><strong>Next Steps:</strong> Review, edit, and dispatch the completed playbook to the prospect from the admin dashboard:</p>
                        <p><a href="https://audit.marketinghosting.agency/admin/dashboard/${auditId}">https://audit.marketinghosting.agency/admin/dashboard/${auditId}</a></p>
                    `
                }).catch(e => console.error("Internal notification email failed:", e));
            }

        } catch (err) {
            console.error("Background Audit Failed:", err);
            await prisma.audit.update({
                where: { id: auditId },
                data: { aiAnalysis: JSON.stringify([{ title: "Error", content: "<p>The scan failed to complete properly. Please contact support.</p>" }]) }
            });
        }
    };

    // 4. Fire Async Job completely disconnected from the HTTP response
    processAudit(auditRecord.id).catch(console.error);

    // 5. Respond immediately
    return NextResponse.json({ success: true, message: "Audit processing initiated in the background." });

  } catch (error: any) {
    console.error('Growth Audit Endpoint Initial Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start processing.' }, { status: 500 });
  }
}
