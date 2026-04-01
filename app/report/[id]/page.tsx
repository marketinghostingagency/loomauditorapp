import { prisma } from '../../../lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AuditAccordion from '../../../components/AuditAccordion';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

export default async function SharedAuditDetail(props: { params: Promise<{ id: string }>, searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const theme = searchParams?.theme === 'simplicity' ? 'simplicity' : 'mha';

  const isSimplicity = theme === 'simplicity';

  const brandObj = isSimplicity
    ? { 
        name: 'simplicity',
        title: "Simplicity Media Growth Audit", 
        accentColor: "text-[#116dff]", 
        primaryGlow: "text-[#116dff]", 
        bgGlow: "from-[#116dff] via-[#4A90E2] to-[#116dff]",
        bgMain: "bg-[#ffffff]",
        textMain: "text-[#07004C]",
        borderCard: "border-slate-200",
        bgCard: "bg-slate-50",
        logoUrl: "https://images.squarespace-cdn.com/content/v1/660481b4bda43f0cfc4bcee8/050ba1e0-c8f8-4e8c-859a-18e4785461c3/Simplicity+Media+Official+Logo-03.png"
      }
    : { 
        name: 'mha',
        title: "Marketing Science Growth Audit", 
        accentColor: "text-[#f5ed38]", 
        primaryGlow: "text-[#f5ed38]", 
        bgGlow: "from-[#dc9f0f] via-[#f5ed38] to-[#dc9f0f]",
        bgMain: "bg-[#111111]",
        textMain: "text-slate-200",
        borderCard: "border-[#464646]",
        bgCard: "glass-card",
        logoUrl: null
      };

  const audit = await prisma.audit.findUnique({
    where: { id: params.id }
  });

  if (!audit) {
    notFound();
  }

  let affiliatePrograms: string[] = [];
  let socialLinks: {name: string, url: string}[] = [];
  try {
     if (audit.affiliatePrograms) affiliatePrograms = JSON.parse(audit.affiliatePrograms);
     if (audit.socialLinks) socialLinks = JSON.parse(audit.socialLinks);
  } catch(e) {}

  return (
    <div className={`min-h-screen ${brandObj.bgMain} ${brandObj.textMain} font-sans selection:bg-[#f5ed38] selection:text-black print:bg-white print:text-black transition-colors relative`}>
      {/* NATIVE PDF MULTI-PAGE PRINT HEADER HACK */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin-top: 25mm !important;
            margin-bottom: 20mm !important;
          }
          .print-fixed-header {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            border-bottom: 2px solid ${isSimplicity ? '#116dff' : '#000'} !important;
            padding-bottom: 15px !important;
            padding-top: 10px !important;
            z-index: 9999 !important;
          }
          body {
            padding-top: 25mm !important;
          }
        }
      `}} />
      <div className="hidden print-fixed-header">
         <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Growth Playbook / {audit.brandName}</div>
         {brandObj.logoUrl ? (
             <img src={brandObj.logoUrl} className="h-6 object-contain" alt={brandObj.title} />
         ) : (
             <div className="text-[14px] font-black tracking-tighter text-black uppercase">
                Marketing Hosting<span className="text-[#dc9f0f]">Agency</span>
             </div>
         )}
      </div>

      {isSimplicity ? (
        <nav className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm print:hidden">
          <div className="flex flex-col justify-center select-none">
            <span className="text-[#07004C] font-black tracking-tighter text-2xl leading-none">SIMPLICITY</span>
            <span className="text-[#116dff] font-bold tracking-[0.25em] text-[0.65rem] uppercase pl-1">Media</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold hidden md:inline-block">Report ID: {audit.id.split('-')[0]}</span>
            <PrintButton />
          </div>
        </nav>
      ) : (
        <nav className="glass-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[#222222] print:hidden">
          <Link href="/" className={`text-white font-bold text-xl tracking-tight hover:${brandObj.accentColor} transition-colors flex items-center gap-2`}>
            {brandObj.title}
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold hidden md:inline-block">Report ID: {audit.id.split('-')[0]}</span>
            <PrintButton />
          </div>
        </nav>
      )}

      <main className="max-w-6xl mx-auto px-6 py-12 pb-24 print:p-0 print:m-0 print:max-w-none">
        <header className="mb-12 print:hidden">
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight mb-4 print:text-5xl print:text-black ${isSimplicity ? 'text-[#07004C]' : 'text-white'}`}>
            Audit Insight: <span className={brandObj.primaryGlow}>{audit.brandName}</span>
          </h1>
          <div className={`flex items-center gap-4 font-medium print:text-slate-600 ${isSimplicity ? 'text-slate-600' : 'text-slate-400'}`}>
            <a href={audit.url} target="_blank" rel="noopener noreferrer" className={`hover:${brandObj.accentColor} transition-colors flex items-center gap-1 print:text-black`}>
              {audit.apexDomain}
            </a>
            <span className={`w-1.5 h-1.5 rounded-full ${isSimplicity ? 'bg-slate-300' : 'bg-[#464646]'}`}></span>
            <span>{new Date(audit.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </header>

        {/* Dynamic Research Hub & Ad Library Quick Links */}
        {(audit.brandName || audit.apexDomain) && (
          <div className={`${brandObj.bgCard} rounded-2xl p-6 flex flex-col gap-4 border ${brandObj.borderCard} mb-8 print:hidden`}>
            <h2 className={`${brandObj.accentColor} font-bold text-lg mb-2 flex items-center justify-center gap-2`}>
              Advertising & Tech Intelligence Hub
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <a href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=${encodeURIComponent(audit.apexDomain || '')}`} target="_blank" rel="noopener noreferrer" className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-blue-600/50 shadow-sm">
                Meta Ads Library
              </a>
              
              <a href={`https://adstransparency.google.com/?region=US&domain=${audit.apexDomain || ''}`} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-slate-100 text-[#ea4335] font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-slate-200 shadow-sm">
                Google Ads Library
              </a>

              <a href={`https://trends.google.com/trends/explore?date=today%205-y&q=${encodeURIComponent(audit.brandName || '')}`} target="_blank" rel="noopener noreferrer" className={`${isSimplicity ? 'bg-white text-[#116dff]' : 'bg-[#222] text-[#f5ed38]'} font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border ${isSimplicity ? 'border-blue-200' : 'border-[#f5ed38]/30'} shadow-sm`}>
                Google Trends (5YR)
              </a>
              
              <a href={`https://builtwith.com/${audit.apexDomain || ''}`} target="_blank" rel="noopener noreferrer" className={`${isSimplicity ? 'bg-[#07004C] text-white hover:bg-blue-900' : 'bg-[#222] hover:bg-[#333] text-white'} font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border ${brandObj.borderCard} shadow-sm`}>
                BuiltWith Tech Analyzer
              </a>
              
              {/* PageSpeed */}
              {audit.url && (
                <a href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(audit.url || '')}`} target="_blank" rel="noopener noreferrer" className={`${isSimplicity ? 'bg-white text-green-600 border-green-200' : 'bg-[#222] text-green-400 border-green-500/30'} hover:opacity-80 font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-opacity border shadow-sm`}>
                  PageSpeed: Homepage
                </a>
              )}
              {audit.landingPageUrl && (
                <a href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(audit.landingPageUrl || '')}`} target="_blank" rel="noopener noreferrer" className={`${isSimplicity ? 'bg-white text-green-600 border-green-200' : 'bg-[#222] text-green-400 border-green-500/30'} hover:opacity-80 font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-opacity border shadow-sm`}>
                  PageSpeed: Landing Page
                </a>
              )}

              {/* Social Links Outbound */}
              {socialLinks && socialLinks.map((social: { name: string, url: string }) => (
                 <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className={`${isSimplicity ? 'bg-white text-[#07004C] hover:bg-blue-50' : 'bg-[#222] hover:bg-[#333] text-slate-200'} font-medium py-2 px-4 rounded-lg flex items-center justify-center border ${brandObj.borderCard} transition-colors shadow-sm`}>
                   {social.name} Profile
                 </a>
              ))}

              {/* Sitemap */}
              {audit.sitemapXml && (
                <a href={`data:text/csv;base64,${audit.sitemapXml}`} download={`seo-meta-${audit.brandName}.csv`} className={`${isSimplicity ? 'bg-white border-blue-200 text-[#116dff]' : 'bg-[#222] border-blue-500/30 text-blue-400'} font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border shadow-sm`}>
                  Download SEO Meta (CSV)
                </a>
              )}

              {/* Affiliate */}
              {affiliatePrograms && affiliatePrograms.length > 0 ? (
                 <div className={`${isSimplicity ? 'bg-white border-purple-200 text-purple-700' : 'bg-[#222] border-purple-500/30 text-purple-400'} font-medium py-2 px-4 rounded-lg flex items-center justify-center border text-center text-sm md:col-span-full shadow-sm`}>
                   Affiliates Detected: {affiliatePrograms.join(', ')}
                 </div>
              ) : (
                 <div className={`${isSimplicity ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-[#222] text-slate-400 border-[#464646]'} font-medium py-2 px-4 rounded-lg flex items-center justify-center border text-sm md:col-span-full shadow-sm`}>
                   No Affiliate Footprint Detected
                 </div>
              )}
            </div>
          </div>
        )}

        {audit.aiAnalysis && (
          <div className={`${brandObj.bgCard} rounded-2xl p-6 md:p-10 border ${brandObj.borderCard} shadow-xl relative mb-8 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black`}>
            {/* Top Glow bar */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${brandObj.bgGlow} rounded-t-2xl print:hidden`}></div>
            
            <div className="flex flex-col gap-6">
              <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 print:hidden ${isSimplicity ? 'border-slate-200' : 'border-[#464646]/50'}`}>
                <div>
                  <h2 className={`text-3xl font-black tracking-tight mb-2 ${isSimplicity ? 'text-[#07004C]' : 'text-white'}`}>
                    In-Depth <span className={brandObj.primaryGlow}>Growth Playbook</span>
                  </h2>
                  {audit.metaPixelFound ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 border border-green-500/20 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                      Meta Pixel Traced
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20 shadow-sm">
                      No Tracking Pixels Found
                    </span>
                  )}
                </div>
              </div>

              {/* Ensure standard AuditAccordion prints open by forcing print classes in globals.css */}
              <AuditAccordion auditId={audit.id} data={audit.aiAnalysis} rawFallback={audit.aiAnalysis || ''} isEditable={false} themeObj={brandObj} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
