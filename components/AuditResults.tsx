import { useState } from 'react';
import AuditAccordion from './AuditAccordion';

export default function AuditResults({ result }: { result: any }) {
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptResult, setScriptResult] = useState<string | null>(result.script || null);
  const [scriptError, setScriptError] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const copyScript = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(scriptResult || '');
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = scriptResult || '';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const generatePresentationScript = async () => {
    setIsGeneratingScript(true);
    setScriptError('');
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId: result.auditId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate script');
      setScriptResult(data.script);
    } catch (e: any) {
      setScriptError(e.message);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  if (!result) return null;

  return (
    <div className="w-full space-y-6">
      
      {/* Header section with Meta Pixel status */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#f5ed38]">
        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#f5ed38] to-[#dc9f0f]">
            Growth Audit Generated
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Target: <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-[#f5ed38] hover:underline font-medium">{result.url}</a>
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="glass px-4 py-2 rounded-lg flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${result.metaPixelFound ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium">
              Meta Pixel: {result.metaPixelFound ? 'Found' : 'Not Found'}
            </span>
          </div>
        </div>
      </div>

      {/* Ad Library Quick Links */}
      {(result.brandName || result.apexDomain) && (
        <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-4 border border-[#464646]">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white mb-2">Advertising Quick Research</h4>
            <div className="flex flex-wrap gap-3">
              <a 
                href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=${result.brandName}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors flex-1"
              >
                Meta Ads Library
              </a>
              <a 
                href={`https://adstransparency.google.com/?region=US&domain=${result.apexDomain}`}
                target="_blank"  
                rel="noopener noreferrer"
                className="bg-white hover:bg-slate-100 text-[#ea4335] font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors flex-1 border border-slate-200"
              >
                Google Ads Library
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Growth Audit Section (NOW PRIMARY) */}
      <div className="glass-card rounded-2xl p-8 shadow-xl border border-[#464646] bg-gradient-to-b from-[#111111] to-[#0a0a0a]">
        <div className="flex flex-col mb-6 pb-6 border-b border-[#464646]">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#f5ed38] to-[#dc9f0f] flex items-center gap-3">
            <svg className="w-6 h-6 text-[#f5ed38]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            In-Depth Growth Audit
          </h2>
          <p className="text-slate-400 text-sm mt-2">Executive analysis of Mobile CRO, Lifecycle, Affiliate trajectory, and Omnichannel Strategy.</p>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Affiliate & Sitemap Bar */}
          <div className="flex flex-col md:flex-row gap-4">
             <div className="flex-1 bg-black/40 border border-[#464646] rounded-xl p-6">
               <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#f5ed38]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Affiliate Marketing
               </h4>
               {result.affiliatePrograms && result.affiliatePrograms.length > 0 ? (
                 <div className="flex gap-2 flex-wrap">
                   {result.affiliatePrograms.map((p: string) => (
                     <span key={p} className="px-3 py-1.5 bg-[#f5ed38]/20 text-[#f5ed38] text-sm font-semibold rounded-lg border border-[#f5ed38]/30 capitalize">
                       {p} Found
                     </span>
                   ))}
                 </div>
               ) : (
                 <div className="flex items-start gap-3 text-slate-400 text-sm">
                   <span className="shrink-0 p-1.5 bg-red-500/10 rounded-lg text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                   </span>
                   <p>No standard affiliate footprint detected. Establishing a creator partnership program could be a massive growth horizon.</p>
                 </div>
               )}
             </div>

             <div className="flex-1 bg-black/40 border border-[#464646] rounded-xl p-6 flex flex-col items-start justify-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5ed38]/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
               <h4 className="font-bold text-white mb-3">Technical SEO</h4>
               <p className="text-slate-400 text-sm mb-4">We've mapped the internal routing and generated a normalized XML Sitemap.</p>
               {result.sitemapXml && (
                 <a 
                   href={`data:text/xml;base64,${result.sitemapXml}`} 
                   download={`${result.brandName || 'brand'}-sitemap.xml`}
                   className="bg-[#222222] hover:bg-[#333333] text-[#f5ed38] px-5 py-2.5 rounded-lg text-sm font-bold border border-[#f5ed38]/30 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,237,56,0.1)] hover:shadow-[0_0_20px_rgba(245,237,56,0.2)]"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                   Download Sitemap (.xml)
                 </a>
               )}
             </div>
          </div>

          {/* AI Analysis */}
          <AuditAccordion data={result.aiAnalysis} rawFallback={result.aiAnalysis} />
        </div>
      </div>

      {/* Script section (NOW SECONDARY) */}
      <div className="glass-card rounded-2xl p-8 border border-[#464646]">
        <div className="flex flex-col mb-6 pb-6 border-b border-[#464646]">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-[#f5ed38]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            Presentation Video Script
          </h2>
          <p className="text-slate-400 text-sm mt-2">Synthesize the exhaustive Growth Audit above into a 2-minute Loom outreach script.</p>
        </div>
        
        {!scriptResult ? (
          <div className="space-y-4">
            <button
              onClick={generatePresentationScript}
              disabled={isGeneratingScript}
              className="bg-gradient-to-r from-[#f5ed38] to-[#dc9f0f] hover:from-[#dc9f0f] hover:to-[#c28b0c] text-[#111111] font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-auto"
            >
              {isGeneratingScript ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Drafting Script...
                </>
              ) : (
                'Generate Video Pitch Script'
              )}
            </button>
            {scriptError && <p className="text-red-400 text-sm mt-2 font-medium">{scriptError}</p>}
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            <div className="flex justify-end mb-4">
               <button 
                onClick={copyScript}
                className="text-sm bg-[#333333] hover:bg-[#464646] text-[#f5ed38] py-2 px-4 rounded-lg flex items-center gap-2 transition-colors border border-[#464646]"
              >
                {isCopied ? "Copied!" : "Copy Script"}
               </button>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-lg leading-relaxed text-slate-200 whitespace-pre-wrap font-medium">
                {scriptResult}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
