import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import * as cheerio from 'cheerio';

// POST /api/brands/[id]/rescan — re-scrape the brand's website and update fields

function resolveUrl(href: string, base: string): string | null {
  try { return new URL(href, base).href; } catch { return null; }
}
function extractHexColors(css: string): string[] {
  const hexes = css.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
  return hexes.map(h => h.length === 4 ? '#' + h[1]+h[1]+h[2]+h[2]+h[3]+h[3] : h.toLowerCase());
}
function topBrandColors(hexes: string[]): string[] {
  const freq: Record<string, number> = {};
  hexes.forEach(h => { freq[h] = (freq[h] || 0) + 1; });
  const neutral = ['#ffffff','#fff','#000000','#000','#f5f5f5','#eeeeee','#111111','#222222','#333333','#444444','#888888','#999999','#aaaaaa','#cccccc','#dddddd'];
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([c])=>c).filter(c=>!neutral.includes(c));
}
function weightLabel(w: string): string {
  const n = parseInt(w);
  if (n >= 700) return 'Bold'; if (n >= 600) return 'Semi-Bold'; if (n >= 500) return 'Medium'; return 'Regular';
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const brand = await prisma.brandBook.findUnique({ where: { id } });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    if (!brand.website) return NextResponse.json({ error: 'No website URL set for this brand' }, { status: 400 });

    const targetUrl = brand.website.startsWith('http') ? brand.website : `https://${brand.website}`;
    const htmlRes = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MHA-BrandIntelBot/2.0)', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(10000),
    });
    if (!htmlRes.ok) return NextResponse.json({ error: 'Could not fetch website' }, { status: 502 });

    const html = await htmlRes.text();
    const $ = cheerio.load(html);

    let logoUrl: string | null = brand.logoUrl;
    const logoSelectors = ['img[src*="logo"]','img[alt*="logo"]','img[class*="logo"]','.logo img','#logo img','header img','nav img'];
    for (const sel of logoSelectors) {
      const src = $(sel).first().attr('src');
      if (src) { logoUrl = resolveUrl(src, targetUrl); break; }
    }

    const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;
    const brandVoice = metaDesc?.trim() || brand.brandVoice;

    const iconMatches: string[] = [];
    $('img[src*="icon"], img[src*="svg"], img[alt*="icon"]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) { const abs = resolveUrl(src, targetUrl); if (abs) iconMatches.push(abs); }
    });
    const iconUrls = iconMatches.length > 0 ? JSON.stringify(iconMatches.slice(0, 12)) : brand.iconUrls;

    let typography: string | null = null;
    const gfLinks = $('link[href*="fonts.googleapis.com"]').toArray();
    for (const el of gfLinks) {
      const href = $(el).attr('href') || '';
      const m = href.match(/family=([^&:]+)/);
      if (m?.[1]) { typography = decodeURIComponent(m[1]).replace(/\+/g,' ').split(':')[0]; break; }
    }

    let allColors: string[] = [];
    let ctaColors: string[] = [];
    $('[style]').each((_, el) => allColors.push(...extractHexColors($(el).attr('style') || '')));
    $('style').each((_, el) => allColors.push(...extractHexColors($(el).text())));
    $('style').each((_, el) => {
      const css = $(el).text();
      const ctaRules = css.match(/[.#][^{]*(?:btn|button|cta|primary|hero)[^{]*\{[^}]*background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/gi) || [];
      ctaRules.forEach(rule => {
        const hexMatch = rule.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/i);
        if (hexMatch) ctaColors.push(hexMatch[1].toLowerCase());
      });
    });

    const cssUrl = resolveUrl($('link[rel="stylesheet"]').first().attr('href') || '', targetUrl);
    let fontColor: string | null = null, backgroundColor: string | null = null;
    let fontH1: string | null = null, fontH2: string | null = null, fontBody: string | null = null;
    if (cssUrl) {
      try {
        const cssRes = await fetch(cssUrl, { signal: AbortSignal.timeout(4000) });
        if (cssRes.ok) {
          const cssText = await cssRes.text();
          allColors.push(...extractHexColors(cssText));
          const bodyColorMatch = cssText.match(/body\s*\{[^}]*\bcolor:\s*(#[0-9a-fA-F]{3,6})/);
          if (bodyColorMatch) fontColor = bodyColorMatch[1].toLowerCase();
          const h1M = cssText.match(/h1\s*\{[\s\S]*?font-size:\s*([^;]+)[\s\S]*?font-weight:\s*([^;]+)[\s\S]*?\}/);
          const h2M = cssText.match(/h2\s*\{[\s\S]*?font-size:\s*([^;]+)[\s\S]*?font-weight:\s*([^;]+)[\s\S]*?\}/);
          const bodyM = cssText.match(/body\s*\{[\s\S]*?font-size:\s*([^;]+)[\s\S]*?\}/);
          if (h1M) fontH1 = JSON.stringify({ family: typography || 'inherit', size: h1M[1]?.trim(), weight: h1M[2]?.trim(), label: weightLabel(h1M[2]?.trim()) });
          if (h2M) fontH2 = JSON.stringify({ family: typography || 'inherit', size: h2M[1]?.trim(), weight: h2M[2]?.trim(), label: weightLabel(h2M[2]?.trim()) });
          if (bodyM) fontBody = JSON.stringify({ family: typography || 'inherit', size: bodyM[1]?.trim(), weight: '400', label: 'Regular' });
          const bgM = cssText.match(/(?:body|:root)\s*\{[\s\S]*?background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/);
          if (bgM) backgroundColor = bgM[1].toLowerCase();
        }
      } catch { /* ignore */ }
    }

    const themeColor = $('meta[name="theme-color"]').attr('content');
    const brandColors = topBrandColors(allColors);
    const topCtaColors = topBrandColors(ctaColors);

    const updated = await prisma.brandBook.update({
      where: { id },
      data: {
        logoUrl: logoUrl ?? brand.logoUrl,
        brandVoice: brandVoice ?? brand.brandVoice,
        iconUrls: iconUrls ?? brand.iconUrls,
        typography: typography ?? brand.typography,
        fontH1: fontH1 ?? brand.fontH1,
        fontH2: fontH2 ?? brand.fontH2,
        fontBody: fontBody ?? brand.fontBody,
        primaryColor: themeColor?.toLowerCase() || brandColors[0] || brand.primaryColor,
        secondaryColor: brandColors[1] || brand.secondaryColor,
        accentColor: brandColors[2] || brand.accentColor,
        ctaPrimaryColor: topCtaColors[0] || brandColors[3] || brand.ctaPrimaryColor,
        ctaSecondaryColor: topCtaColors[1] || brandColors[4] || brand.ctaSecondaryColor,
        backgroundColor: backgroundColor || brand.backgroundColor || '#ffffff',
        fontColor: fontColor || brand.fontColor || '#333333',
        brandBackground: backgroundColor || brand.brandBackground || '#ffffff',
        brandHeaderColor: fontColor || brand.brandHeaderColor || '#1a1a1a',
        brandTextColor: fontColor || brand.brandTextColor || '#333333',
        brandCtaColor: topCtaColors[0] || themeColor?.toLowerCase() || brandColors[0] || brand.brandCtaColor,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
