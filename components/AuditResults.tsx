import { useState } from 'react';
import AuditAccordion from './AuditAccordion';
import LeadCaptureGate from './LeadCaptureGate';

export default function AuditResults({ result }: { result: any }) {
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [loomScript, setLoomScript] = useState("");

  const downloadSitemap = () => {
    if (!result.sitemapXml) return;
    
    const binStr = atob(result.sitemapXml);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
        bytes[i] = binStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-meta-${result.brandName || 'audit'}.csv`;
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
      
      {/* Front-End Mirrors Admin Header */}
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
          Audit Insight: <span className="text-[#f5ed38]">{result.brandName || result.apexDomain}</span>
        </h1>
        <div className="flex items-center gap-4 text-slate-400 font-medium">
          <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#dc9f0f] transition-colors flex items-center gap-1">
            {result.apexDomain}
          </a>
          <span className="w-1.5 h-1.5 rounded-full bg-[#464646]"></span>
          <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      {/* Dynamic Research Hub & Ad Library Quick Links */}
      {(result.brandName || result.apexDomain) && (
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 border border-[#464646]">
          <h2 className="text-[#f5ed38] font-bold text-lg mb-2 flex items-center justify-center gap-2">
            Advertising & Tech Intelligence Hub
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1) Meta Ads */}
            <a href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=${encodeURIComponent(result.apexDomain)}`} target="_blank" rel="noopener noreferrer" className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-[#464646]/50 shadow-sm shadow-blue-500/20">
              Meta Ads Library
            </a>
            
            {/* 2) Google Ads */}
            <a href={`https://adstransparency.google.com/?region=US&domain=${result.apexDomain}`} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-slate-100 text-[#ea4335] font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-slate-200">
              Google Ads Library
            </a>

            {/* 3) Google Trends */}
            <a href={`https://trends.google.com/trends/explore?date=today%205-y&q=${encodeURIComponent(result.brandName)}`} target="_blank" rel="noopener noreferrer" className="bg-[#222] hover:bg-[#333] text-[#f5ed38] font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-[#f5ed38]/30">
              Google Trends (5YR)
            </a>

            {/* 4) BuiltWith */}
            <a href={`https://builtwith.com/${result.apexDomain}`} target="_blank" rel="noopener noreferrer" className="bg-[#222] hover:bg-[#333] text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-[#464646]">
              BuiltWith Tech Analyzer
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

            {/* Social Links Outbound */}
            {result.socialLinks && result.socialLinks.map((social: { name: string, url: string }) => (
               <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="bg-[#222] hover:bg-[#333] text-slate-200 font-medium py-2 px-4 rounded-lg flex items-center justify-center border border-[#464646] transition-colors shadow-sm">
                 {social.name} Profile
               </a>
            ))}

            {/* Sitemap/CSV */}
            {result.sitemapXml && (
              <button onClick={downloadSitemap} className="bg-[#222] hover:bg-[#333] text-blue-400 font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-blue-500/30">
                Download SEO Meta (CSV)
              </button>
            )}

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
          <AuditAccordion auditId={result.auditId} data={result.aiAnalysis} rawFallback={result.aiAnalysis} isEditable={false} />
        </div>
      </div>

      {/* 60-Second Lead Generation Gate */}
      <LeadCaptureGate auditId={result.auditId} brandName={result.brandName || result.apexDomain || 'this brand'} />
    </div>
  );
}
