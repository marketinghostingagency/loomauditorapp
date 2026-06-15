import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import * as cheerio from 'cheerio';

function resolveUrl(href: string, base: string): string | null {
  try { return new URL(href, base).href; } catch { return null; }
}
function extractHexColors(css: string): string[] {
  const hexes = css.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
  return hexes.map(h => h.length === 4
    ? '#' + h[1]+h[1]+h[2]+h[2]+h[3]+h[3]
    : h.toLowerCase());
}
function topBrandColors(hexes: string[]): string[] {
  const freq: Record<string, number> = {};
  hexes.forEach(h => { freq[h] = (freq[h] || 0) + 1; });
  const neutral = ['#ffffff','#fff','#000000','#000','#f5f5f5','#eeeeee','#111111','#222222','#333333','#444444','#888888','#999999','#aaaaaa','#cccccc','#dddddd'];
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([c])=>c).filter(c=>!neutral.includes(c));
}
function weightLabel(w: string): string {
  const n = parseInt(w);
  if (n >= 700) return 'Bold';
  if (n >= 600) return 'Semi-Bold';
  if (n >= 500) return 'Medium';
  return 'Regular';
}

async function scrapeWebsite(website: string) {
  const targetUrl = website.startsWith('http') ? website : `https://${website}`;
  const result: Record<string, string | null> = {
    primaryColor: null, secondaryColor: null, accentColor: null,
    backgroundColor: null, fontColor: null, ctaPrimaryColor: null,
    ctaSecondaryColor: null, typography: null, fontH1: null,
    fontH2: null, fontBody: null, logoUrl: null,
    brandBackground: null, brandHeaderColor: null,
    brandTextColor: null, brandCtaColor: null,
    brandVoice: null, iconUrls: null, socialLinks: null,
  };

  const htmlRes = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MHA-BrandIntelBot/2.0; +https://marketinghosting.agency)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!htmlRes.ok) return result;

  const html = await htmlRes.text();
  const $ = cheerio.load(html);

  // Logo
  const logoSelectors = ['img[src*="logo"]','img[alt*="logo"]','img[class*="logo"]','.logo img','#logo img','header img','nav img'];
  for (const sel of logoSelectors) {
    const src = $(sel).first().attr('src');
    if (src) { result.logoUrl = resolveUrl(src, targetUrl); break; }
  }
  if (!result.logoUrl) {
    const faviconHref = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').first().attr('href');
    if (faviconHref) result.logoUrl = resolveUrl(faviconHref, targetUrl);
  }

  // Brand Voice — meta description + OG description
  const metaDesc = $('meta[name="description"]').attr('content')
    || $('meta[property="og:description"]').attr('content')
    || null;
  if (metaDesc) result.brandVoice = metaDesc.trim();

  // Icons — small PNGs in header/nav, SVG logos
  const iconMatches: string[] = [];
  $('img[src*="icon"], img[src*="svg"], img[alt*="icon"]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) { const abs = resolveUrl(src, targetUrl); if (abs) iconMatches.push(abs); }
  });
  if (iconMatches.length > 0) result.iconUrls = JSON.stringify(iconMatches.slice(0, 12));

  // Social handles — scan all links for known social platform domains
  const SOCIAL_PLATFORMS = ['twitter.com','x.com','instagram.com','facebook.com','linkedin.com','youtube.com','tiktok.com','pinterest.com'];
  const foundSocials: Record<string, string> = {};
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href.startsWith('http')) return;
    for (const platform of SOCIAL_PLATFORMS) {
      if (href.includes(platform) && !foundSocials[platform]) {
        foundSocials[platform] = href;
      }
    }
  });
  const socialEntries = Object.entries(foundSocials).map(([platform, url]) => ({ platform, url }));
  if (socialEntries.length > 0) result.socialLinks = JSON.stringify(socialEntries);

  // Fonts
  let typography: string | null = null;
  const googleFontLinks = $('link[href*="fonts.googleapis.com"]').toArray();
  const fontFamilies: string[] = [];
  for (const el of googleFontLinks) {
    const href = $(el).attr('href') || '';
    const matches = [...href.matchAll(/family=([^&:]+)/g)];
    matches.forEach(m => { if (m[1]) fontFamilies.push(decodeURIComponent(m[1]).replace(/\+/g, ' ').split(':')[0]); });
  }
  if (fontFamilies.length > 0) typography = fontFamilies[0];
  if (!typography) {
    $('style').each((_, el) => {
      const css = $(el).text();
      const faceMatch = css.match(/@font-face[^}]*src:[^}]*url\(['"](https?:\/\/fonts\.gstatic\.com\/s\/([a-z0-9]+)\/)/i);
      if (faceMatch?.[2]) typography = faceMatch[2].charAt(0).toUpperCase() + faceMatch[2].slice(1);
    });
  }

  // Colors
  let allColors: string[] = [];
  let ctaColors: string[] = [];
  const ctaSelectors = ['button[style]','a[style]','[class*="btn"][style]','[class*="button"][style]','[class*="cta"][style]'];
  for (const sel of ctaSelectors) {
    $(sel).each((_, el) => {
      const style = $(el).attr('style') || '';
      const bg = style.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/i);
      if (bg) ctaColors.push(bg[1].toLowerCase());
    });
  }
  $('[style]').each((_, el) => { allColors.push(...extractHexColors($(el).attr('style') || '')); });
  $('style').each((_, el) => { allColors.push(...extractHexColors($(el).text())); });
  $('style').each((_, el) => {
    const css = $(el).text();
    const ctaRuleMatches = css.match(/[.#][^{]*(?:btn|button|cta|primary|hero)[^{]*\{[^}]*background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/gi) || [];
    ctaRuleMatches.forEach(rule => {
      const hexMatch = rule.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/i);
      if (hexMatch) ctaColors.push(hexMatch[1].toLowerCase());
    });
  });

  // External stylesheet
  const firstStylesheetHref = $('link[rel="stylesheet"]').first().attr('href');
  if (firstStylesheetHref) {
    const cssUrl = resolveUrl(firstStylesheetHref, targetUrl);
    if (cssUrl) {
      try {
        const cssRes = await fetch(cssUrl, { signal: AbortSignal.timeout(4000) });
        if (cssRes.ok) {
          const cssText = await cssRes.text();
          allColors.push(...extractHexColors(cssText));
          if (!typography) {
            const gstaticMatch = cssText.match(/@font-face[\s\S]*?src:[\s\S]*?fonts\.gstatic\.com\/s\/([a-z0-9]+)\//i);
            if (gstaticMatch?.[1]) typography = gstaticMatch[1].charAt(0).toUpperCase() + gstaticMatch[1].slice(1);
          }
          if (!typography) {
            const bodyFont = cssText.match(/body\s*\{[^}]*font-family:\s*([^;]+)/);
            if (bodyFont) {
              const candidate = bodyFont[1].replace(/['"]/g, '').split(',')[0].trim();
              if (!['serif','sans-serif','monospace','inherit'].includes(candidate.toLowerCase())) typography = candidate;
            }
          }
          const bodyColorMatch = cssText.match(/body\s*\{[^}]*\bcolor:\s*(#[0-9a-fA-F]{3,6})/);
          if (bodyColorMatch) result.fontColor = bodyColorMatch[1].toLowerCase();
          const h1Match = cssText.match(/h1\s*\{[\s\S]*?font-size:\s*([^;]+)[\s\S]*?font-weight:\s*([^;]+)[\s\S]*?\}/);
          const h2Match = cssText.match(/h2\s*\{[\s\S]*?font-size:\s*([^;]+)[\s\S]*?font-weight:\s*([^;]+)[\s\S]*?\}/);
          const bodyMatch = cssText.match(/body\s*\{[\s\S]*?font-size:\s*([^;]+)[\s\S]*?\}/);
          if (h1Match) {
            const size = h1Match[1]?.trim() || '2.5rem';
            const weight = h1Match[2]?.trim() || '700';
            result.fontH1 = JSON.stringify({ family: typography || 'inherit', size, weight, label: weightLabel(weight) });
          }
          if (h2Match) {
            const size = h2Match[1]?.trim() || '2rem';
            const weight = h2Match[2]?.trim() || '600';
            result.fontH2 = JSON.stringify({ family: typography || 'inherit', size, weight, label: weightLabel(weight) });
          }
          if (bodyMatch) {
            const size = bodyMatch[1]?.trim() || '1rem';
            result.fontBody = JSON.stringify({ family: typography || 'inherit', size, weight: '400', label: 'Regular' });
          }
          const bgMatch = cssText.match(/(?:body|:root)\s*\{[\s\S]*?background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/);
          if (bgMatch) result.backgroundColor = bgMatch[1].toLowerCase();
        }
      } catch { /* ignore */ }
    }
  }

  const themeColor = $('meta[name="theme-color"]').attr('content');
  const brandColors = topBrandColors(allColors);
  const topCtaColors = topBrandColors(ctaColors);

  result.typography = typography;
  result.primaryColor = themeColor?.toLowerCase() || brandColors[0] || null;
  result.secondaryColor = brandColors[1] || null;
  result.accentColor = brandColors[2] || null;
  result.ctaPrimaryColor = topCtaColors[0] || brandColors[3] || null;
  result.ctaSecondaryColor = topCtaColors[1] || brandColors[4] || null;
  if (!result.backgroundColor) result.backgroundColor = '#ffffff';
  if (!result.fontColor) {
    const textCandidate = allColors.find(c => {
      const hex = c.replace('#', '');
      if (hex.length !== 6) return false;
      const r = parseInt(hex.substring(0,2), 16);
      const g = parseInt(hex.substring(2,4), 16);
      const b = parseInt(hex.substring(4,6), 16);
      return (0.299*r + 0.587*g + 0.114*b) / 255 < 0.5;
    });
    result.fontColor = textCandidate || '#333333';
  }
  result.brandBackground = result.backgroundColor || '#ffffff';
  result.brandHeaderColor = (result.fontColor && result.fontColor !== '#333333') ? result.fontColor : '#1a1a1a';
  result.brandTextColor = result.fontColor || '#333333';
  result.brandCtaColor = topCtaColors[0] || result.primaryColor || null;

  return result;
}

export async function POST(req: Request) {
  try {
    const { brandName, website } = await req.json();
    if (!brandName) return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });

    let scraped: Record<string, string | null> = {
      primaryColor: null, secondaryColor: null, accentColor: null,
      backgroundColor: null, fontColor: null, ctaPrimaryColor: null,
      ctaSecondaryColor: null, typography: null, fontH1: null, fontH2: null, fontBody: null,
      logoUrl: null, brandBackground: null, brandHeaderColor: null,
      brandTextColor: null, brandCtaColor: null, brandVoice: null, iconUrls: null, socialLinks: null,
    };

    if (website) {
      try { scraped = await scrapeWebsite(website); } catch (e) {
        console.log('Brand intel extraction failed gracefully:', e);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newBrand = await (prisma.brandBook.create as any)({
      data: {
        brandName, website,
        brandBackground: scraped.brandBackground,
        brandHeaderColor: scraped.brandHeaderColor,
        brandTextColor: scraped.brandTextColor,
        brandCtaColor: scraped.brandCtaColor,
        primaryColor: scraped.primaryColor,
        secondaryColor: scraped.secondaryColor,
        accentColor: scraped.accentColor,
        backgroundColor: scraped.backgroundColor,
        fontColor: scraped.fontColor,
        ctaPrimaryColor: scraped.ctaPrimaryColor,
        ctaSecondaryColor: scraped.ctaSecondaryColor,
        typography: scraped.typography,
        fontH1: scraped.fontH1,
        fontH2: scraped.fontH2,
        fontBody: scraped.fontBody,
        logoUrl: scraped.logoUrl,
        brandVoice: scraped.brandVoice,
        iconUrls: scraped.iconUrls,
        socialLinks: scraped.socialLinks,
      }
    });

    return NextResponse.json(newBrand);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create brand.' }, { status: 500 });
  }
}

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brands = await (prisma.brandBook.findMany as any)({
    include: { assets: true, projects: { include: { assets: true } } },
    orderBy: { updatedAt: 'desc' }
  });
  return NextResponse.json(brands);
}
