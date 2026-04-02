import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import * as cheerio from 'cheerio';

// --- Scraper helpers ---

/** Resolves a relative URL against a base */
function resolveUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

/** Extracts hex color codes from a CSS string */
function extractHexColors(css: string): string[] {
  const hexes = css.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
  return hexes.map(h => {
    if (h.length === 4) {
      return '#' + h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
    }
    return h.toLowerCase();
  });
}

/** Score colors — filters pure white/black/grey and sorts by frequency */
function topBrandColors(hexes: string[]): string[] {
  const frequency: Record<string, number> = {};
  hexes.forEach(h => {
    frequency[h] = (frequency[h] || 0) + 1;
  });
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
    .filter(c => {
      // Filter clear non-brand utility colors
      const neutral = ['#ffffff', '#fff', '#000000', '#000', '#f5f5f5', '#eeeeee', '#111111', '#222222', '#333333', '#444444', '#888888', '#999999', '#aaaaaa', '#cccccc', '#dddddd'];
      return !neutral.includes(c);
    });
}

/** Infer font weight label from numeric value */
function weightLabel(w: string): string {
  const n = parseInt(w);
  if (n >= 700) return 'Bold';
  if (n >= 600) return 'Semi-Bold';
  if (n >= 500) return 'Medium';
  return 'Regular';
}

export async function POST(req: Request) {
  try {
    const { brandName, website } = await req.json();

    if (!brandName) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    // ====== Brand Intel Extraction ======
    // Legacy extended palette fields
    let primaryColor = null;
    let secondaryColor = null;
    let accentColor = null;
    let backgroundColor = null;
    let fontColor = null;
    let ctaPrimaryColor = null;
    let ctaSecondaryColor = null;
    let typography = null;
    let fontH1: string | null = null;
    let fontH2: string | null = null;
    let fontBody: string | null = null;
    let logoUrl = null;

    // ── The 4 brand tokens (our simplified model) ──
    let brandBackground: string | null = null;
    let brandHeaderColor: string | null = null;
    let brandTextColor: string | null = null;
    let brandCtaColor: string | null = null;

    if (website) {
      try {
        const targetUrl = website.startsWith('http') ? website : `https://${website}`;

        const htmlRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MHA-BrandIntelBot/2.0; +https://marketinghosting.agency)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const $ = cheerio.load(html);

          // 1. Logo / Favicon
          const logoSelectors = [
            'img[src*="logo"]',
            'img[alt*="logo"]',
            'img[class*="logo"]',
            '.logo img',
            '#logo img',
            'header img',
            'nav img',
          ];
          for (const sel of logoSelectors) {
            const src = $(sel).first().attr('src');
            if (src) {
              logoUrl = resolveUrl(src, targetUrl);
              break;
            }
          }
          // Fallback: favicon
          if (!logoUrl) {
            const faviconHref = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').first().attr('href');
            if (faviconHref) {
              logoUrl = resolveUrl(faviconHref, targetUrl);
            }
          }

          // 2. Font Detection — multi-strategy
          // Strategy A: Google Fonts API link tags
          const googleFontLinks = $('link[href*="fonts.googleapis.com"]').toArray();
          const fontFamilies: string[] = [];
          for (const el of googleFontLinks) {
            const href = $(el).attr('href') || '';
            const matches = [...href.matchAll(/family=([^&:]+)/g)];
            matches.forEach(m => {
              if (m[1]) fontFamilies.push(decodeURIComponent(m[1]).replace(/\+/g, ' ').split(':')[0]);
            });
          }
          if (fontFamilies.length > 0) typography = fontFamilies[0];

          // Strategy B: @font-face src URL — extract font name from woff2 filenames
          // e.g. fonts.gstatic.com/s/barlow/... → 'Barlow'
          if (!typography) {
            $('style').each((_, el) => {
              const css = $(el).text();
              const faceMatch = css.match(/@font-face[^}]*src:[^}]*url\(['"]?(https?:\/\/fonts\.gstatic\.com\/s\/([a-z0-9]+)\/)/i);
              if (faceMatch && faceMatch[2]) {
                // Capitalize and use as font name
                typography = faceMatch[2].charAt(0).toUpperCase() + faceMatch[2].slice(1);
              }
            });
          }

          // Strategy C: inline style font-family on body or html element
          if (!typography) {
            const bodyStyle = $('body').attr('style') || $('html').attr('style') || '';
            const inlineFont = bodyStyle.match(/font-family:\s*([^;,]+)/);
            if (inlineFont) {
              const candidate = inlineFont[1].replace(/['";]/g, '').trim();
              // Only accept if it doesn't look like a generic family
              if (!['serif', 'sans-serif', 'monospace', 'inherit', 'initial', 'unset'].includes(candidate.toLowerCase())) {
                typography = candidate;
              }
            }
          }

          // 3. Extract all colors: inline styles + style tags + fetch first external stylesheet
          let allColors: string[] = [];
          let ctaColors: string[] = [];

          // CTA / Button element targeting (HIGH SIGNAL)
          // Scans actual button/anchor elements for inline background colors
          const ctaSelectors = ['button[style]','a[style]','[class*="btn"][style]','[class*="button"][style]','[class*="cta"][style]'];
          for (const sel of ctaSelectors) {
            $(sel).each((_, el) => {
              const style = $(el).attr('style') || '';
              const bg = style.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/i);
              if (bg) ctaColors.push(bg[1].toLowerCase());
            });
          }

          // Inline style attributes (high signal)
          $('[style]').each((_, el) => {
            allColors.push(...extractHexColors($(el).attr('style') || ''));
          });

          // Style tag CSS
          $('style').each((_, el) => {
            allColors.push(...extractHexColors($(el).text()));
          });

          // Scan inline style block for btn/cta class rules
          $('style').each((_, el) => {
            const css = $(el).text();
            const ctaRuleMatches = css.match(/[.#][^{]*(?:btn|button|cta|primary|hero)[^{]*\{[^}]*background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/gi) || [];
            ctaRuleMatches.forEach(rule => {
              const hexMatch = rule.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/i);
              if (hexMatch) ctaColors.push(hexMatch[1].toLowerCase());
            });
          });

          // First external stylesheet (high value)
          const firstStylesheetHref = $('link[rel="stylesheet"]').first().attr('href');
          if (firstStylesheetHref) {
            const cssUrl = resolveUrl(firstStylesheetHref, targetUrl);
            if (cssUrl) {
              try {
                const cssRes = await fetch(cssUrl, { signal: AbortSignal.timeout(4000) });
                if (cssRes.ok) {
                  const cssText = await cssRes.text();
                  allColors.push(...extractHexColors(cssText));

                  // Typography from CSS: try to extract font-family from body/root
                  if (!typography) {
                    // @font-face in external CSS — extract font name from src URL path
                    const gstaticMatch = cssText.match(/@font-face[\s\S]*?src:[\s\S]*?fonts\.gstatic\.com\/s\/([a-z0-9]+)\//i);
                    if (gstaticMatch && gstaticMatch[1]) {
                      typography = gstaticMatch[1].charAt(0).toUpperCase() + gstaticMatch[1].slice(1);
                    }
                  }
                  if (!typography) {
                    const bodyFont = cssText.match(/body\s*\{[^}]*font-family:\s*([^;]+)/);
                    if (bodyFont) {
                      const candidate = bodyFont[1].replace(/['"]/g, '').split(',')[0].trim();
                      if (!['serif', 'sans-serif', 'monospace', 'inherit'].includes(candidate.toLowerCase())) {
                        typography = candidate;
                      }
                    }
                  }

                  // Font color from body CSS
                  if (!fontColor) {
                    const bodyColorMatch = cssText.match(/body\s*\{[^}]*\bcolor:\s*(#[0-9a-fA-F]{3,6})/);
                    if (bodyColorMatch) fontColor = bodyColorMatch[1].toLowerCase();
                  }

                  // Font hierarchy: H1, H2, body
                  const h1Match = cssText.match(/h1\s*\{[\s\S]*?font-size:\s*([^;]+)[\s\S]*?font-weight:\s*([^;]+)[\s\S]*?\}/);
                  const h2Match = cssText.match(/h2\s*\{[\s\S]*?font-size:\s*([^;]+)[\s\S]*?font-weight:\s*([^;]+)[\s\S]*?\}/);
                  const bodyMatch = cssText.match(/body\s*\{[\s\S]*?font-size:\s*([^;]+)[\s\S]*?\}/);

                  if (h1Match) {
                    const size = h1Match[1]?.trim() || '2.5rem';
                    const weight = h1Match[2]?.trim() || '700';
                    fontH1 = JSON.stringify({ family: typography || 'inherit', size, weight, label: weightLabel(weight) });
                  }
                  if (h2Match) {
                    const size = h2Match[1]?.trim() || '2rem';
                    const weight = h2Match[2]?.trim() || '600';
                    fontH2 = JSON.stringify({ family: typography || 'inherit', size, weight, label: weightLabel(weight) });
                  }
                  if (bodyMatch) {
                    const size = bodyMatch[1]?.trim() || '1rem';
                    const weight = '400';
                    fontBody = JSON.stringify({ family: typography || 'inherit', size, weight, label: weightLabel(weight) });
                  }

                  // Background color typically on body or :root
                  const bgMatch = cssText.match(/(?:body|:root)\s*\{[\s\S]*?background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/);
                  if (bgMatch) backgroundColor = bgMatch[1].toLowerCase();
                }
              } catch {
                // Ignore external stylesheet fetch failure
              }
            }
          }

          // 4. Theme-color meta (highly reliable primary brand color)
          const themeColor = $('meta[name="theme-color"]').attr('content');

          // 5. Infer palette — prefer element-targeted CTA colors for CTA fields
          const brandColors = topBrandColors(allColors);
          const topCtaColors = topBrandColors(ctaColors);

          primaryColor = themeColor?.toLowerCase() || brandColors[0] || null;
          secondaryColor = brandColors[1] || null;
          accentColor = brandColors[2] || null;
          // Prioritize explicitly-detected CTA colors from button elements
          ctaPrimaryColor = topCtaColors[0] || brandColors[3] || null;
          ctaSecondaryColor = topCtaColors[1] || brandColors[4] || null;

          // 6. Apply sensible defaults for anything undetected
          // Background: default white (the universal majority)
          if (!backgroundColor) backgroundColor = '#ffffff';
          // Body text: prefer detected dark color, fall back to safe near-black
          if (!fontColor) {
            const textCandidate = allColors.find(c => {
              const hex = c.replace('#', '');
              if (hex.length !== 6) return false;
              const r = parseInt(hex.substring(0,2), 16);
              const g = parseInt(hex.substring(2,4), 16);
              const b = parseInt(hex.substring(4,6), 16);
              return (0.299*r + 0.587*g + 0.114*b) / 255 < 0.5;
            });
            fontColor = textCandidate || '#333333';
          }

          // ── Map detection results to the 4 token model ──
          // Background: from CSS body/root, default white
          brandBackground = backgroundColor || '#ffffff';
          // Header color: H1 color if found in CSS, otherwise near-black
          // (most sites don't explicitly set h1 color separately from body dark)
          brandHeaderColor = fontColor && fontColor !== '#333333' ? fontColor : '#1a1a1a';
          // Text/body color: the body font color
          brandTextColor = fontColor || '#333333';
          // CTA color: from button elements or theme-color — the brand's action color
          brandCtaColor = topCtaColors[0] || primaryColor || null;
        }
      } catch (scanErr) {
        console.log('Brand intel extraction failed gracefully:', scanErr);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newBrand = await (prisma.brandBook.create as any)({
      data: {
        brandName,
        website,
        // ── 4 Clean Brand Tokens ──
        brandBackground,
        brandHeaderColor,
        brandTextColor,
        brandCtaColor,
        // ── Legacy extended palette ──
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        fontColor,
        ctaPrimaryColor,
        ctaSecondaryColor,
        typography,
        fontH1,
        fontH2,
        fontBody,
        logoUrl,
      }
    });

    return NextResponse.json(newBrand);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create brand.' }, { status: 500 });
  }
}

export async function GET() {
  const brands = await prisma.brandBook.findMany({
    include: { assets: true },
    orderBy: { updatedAt: 'desc' }
  });
  return NextResponse.json(brands);
}
