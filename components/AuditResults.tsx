import { useState } from 'react';
import AuditAccordion from './AuditAccordion';

export default function AuditResults({ result }: { result: any }) {
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [loomScript, setLoomScript] = useState("");

  const downloadSitemap = () => {
    if (!result.sitemapXml) return;
    const blob = new Blob([atob(result.sitemapXml)], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitemap-${result.brandName || 'audit'}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateScript = async () => {
    try {
      setIsGeneratingScript(true);
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId: result.auditId }),
      });
      if (!response.ok) throw new Error('Failed to generate script');
      const data = await response.json();
      setLoomScript(data.script);
    } catch (e) {
      console.error(e);
      alert("Script generation failed.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  return (
    <div className="mt-8 space-y-6 animate-fade-in pb-12">
      
      {/* Dynamic Research Hub & Ad Library Quick Links */}
      {(result.brandName || result.apexDomain) && (
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 border border-[#464646]">
          <h2 className="text-[#f5ed38] font-bold text-lg mb-2 flex items-center justify-center gap-2">
            Advertising & Tech Intelligence Hub
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Core Trackers */}
            <a href={`https://builtwith.com/${result.apexDomain}`} target="_blank" rel="noopener noreferrer" className="bg-[#222] hover:bg-[#333] text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-[#464646]">
              BuiltWith Tech Analyzer
            </a>
            <a href={`https://trends.google.com/trends/explore?date=today%205-y&q=${encodeURIComponent(result.brandName)}`} target="_blank" rel="noopener noreferrer" className="bg-[#222] hover:bg-[#333] text-[#f5ed38] font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-[#f5ed38]/30">
              Google Trends (5YR)
            </a>
            {result.sitemapXml && (
              <button onClick={downloadSitemap} className="bg-[#222] hover:bg-[#333] text-blue-400 font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-blue-500/30">
                Download Sitemap XML
              </button>
            )}

            {/* Ad Libraries */}
            <a href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=${encodeURIComponent(result.brandName)}`} target="_blank" rel="noopener noreferrer" className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-[#464646]/50 shadow-sm shadow-blue-500/20">
              Meta Ads Library
            </a>
            <a href={`https://adstransparency.google.com/?region=US&domain=${result.apexDomain}`} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-slate-100 text-[#ea4335] font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-slate-200">
              Google Ads Library
            </a>
            
            {/* PageSpeed */}
            {result.url && (
              <a href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(result.url)}`} target="_blank" rel="noopener noreferrer" className="bg-[#222] hover:bg-[#333] text-green-400 font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-green-500/30">
                PageSpeed: Homepage
              </a>
            )}
            {result.landingPageUrl && (
              <a href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(result.landingPageUrl)}`} target="_blank" rel="noopener noreferrer" className="bg-[#222] hover:bg-[#333] text-green-400 font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-green-500/30">
                PageSpeed: Landing Page
              </a>
            )}

            {/* Social Links */}
            {result.socialLinks && result.socialLinks.map((social: string) => (
               <div key={social} className="bg-[#222] text-slate-300 font-medium py-2 px-4 rounded-lg flex items-center justify-center border border-[#464646]">
                 Found: {social}
               </div>
            ))}

            {/* Affiliate */}
            {result.affiliatePrograms && result.affiliatePrograms.length > 0 ? (
               <div className="bg-[#222] text-purple-400 font-medium py-2 px-4 rounded-lg flex items-center justify-center border border-purple-500/30 text-center text-sm md:col-span-full">
                 Affiliates Detected: {result.affiliatePrograms.join(', ')}
               </div>
            ) : (
               <div className="bg-[#222] text-slate-400 font-medium py-2 px-4 rounded-lg flex items-center justify-center border border-[#464646] text-sm md:col-span-full">
                 No Affiliate Footprint Detected
               </div>
            )}
          </div>
        </div>
      )}

      {/* Primary Generator Flow (Master Playbook / Audit) */}
      <div className="glass-card rounded-2xl p-6 md:p-10 border border-[#dc9f0f]/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#dc9f0f] via-[#f5ed38] to-[#dc9f0f]"></div>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#464646]/50 pb-6">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                In-Depth <span className="text-[#f5ed38]">Growth Playbook</span>
              </h2>
              {result.metaPixelFound ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                  Active Meta Pixel Detected
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                  No Meta Pixel Found
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-mono text-sm tracking-wider uppercase">
                {result.isShopify ? 'Shopify Core' : 'Custom Build'}
              </span>
            </div>
          </div>

          {/* AI Analysis */}
          <AuditAccordion data={result.aiAnalysis} rawFallback={result.aiAnalysis} />
        </div>
      </div>

      {/* Secondary Script Generator Output Block */}
      <div className="flex flex-col items-center mt-12 gap-6 w-full max-w-2xl mx-auto border-t border-[#464646]/30 pt-12">
        <p className="text-slate-400 text-center text-sm">
          Need to present this playbook to a client? Generate a supplementary Loom Script.
        </p>
        <button
          onClick={generateScript}
          disabled={isGeneratingScript}
          className="bg-black border border-[#464646] hover:bg-[#222222] hover:border-[#f5ed38]/50 text-white font-bold py-4 px-8 rounded-xl transition-all w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isGeneratingScript ? (
            <>
               <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#f5ed38]"></span>
               Drafting Loom Script...
            </>
          ) : (
            <>
              Generate Loom Pitch Script
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>

        {loomScript && (
          <div className="w-full bg-black/40 border border-[#dc9f0f]/30 rounded-xl p-8 prose prose-invert max-w-none shadow-xl mt-4">
             <div className="flex items-center justify-between border-b border-[#464646] mb-6 pb-4">
               <h3 className="text-[#dc9f0f] font-bold text-xl m-0 flex items-center gap-2">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                 Loom Presentation Script
               </h3>
             </div>
             <div className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap font-medium">
               {loomScript}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
