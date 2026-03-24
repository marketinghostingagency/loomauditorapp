'use client';

import { useState } from 'react';
import AuditResults from '@/components/AuditResults';
import Link from 'next/link';

export default function Home() {
  const [url, setUrl] = useState('');
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [brand, setBrand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    // Basic validation for homepage
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Basic validation for landing page (optional)
    let targetLandingUrl = landingPageUrl;
    if (targetLandingUrl && !targetLandingUrl.startsWith('http://') && !targetLandingUrl.startsWith('https://')) {
      targetLandingUrl = 'https://' + targetLandingUrl;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, landingPageUrl: targetLandingUrl, brand }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate audit');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto mt-12 md:mt-0">
      
      {!result ? (
        <div className="w-full max-w-2xl flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-sm">
              Joel's
              <br/>
              <span className="text-gradient">Audits</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
              Enter a prospect's brand name, website URL, and primary landing page URL below. Joel will analyze their CRO and Marketing Tech to instantly generate a personalized report as a script and a video of Joel presenting the report.
            </p>
          </div>

          <form onSubmit={handleAudit} className="w-full relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#f5ed38] to-[#dc9f0f] rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative flex flex-col gap-4 glass-card p-4 rounded-3xl border border-[#464646]">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Brand Name (e.g. Omi Wellbeauty)"
                  className="w-full md:w-1/3 bg-black/20 border border-[#464646] rounded-xl outline-none px-6 py-4 text-lg text-white placeholder-slate-500 focus:border-[#f5ed38] transition-colors"
                  required
                />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Homepage URL (e.g. mudplugz.com)"
                  className="w-full md:w-1/3 bg-black/20 border border-[#464646] rounded-xl outline-none px-6 py-4 text-lg text-white placeholder-slate-500 focus:border-[#f5ed38] transition-colors"
                  required
                />
                <input
                  type="url"
                  value={landingPageUrl}
                  onChange={(e) => setLandingPageUrl(e.target.value)}
                  placeholder="Landing Page URL (Optional)"
                  className="w-full md:w-1/3 bg-black/20 border border-[#464646] rounded-xl outline-none px-6 py-4 text-lg text-white placeholder-slate-500 focus:border-[#f5ed38] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#f5ed38] hover:bg-[#dc9f0f] text-[#111111] font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(245,237,56,0.3)] hover:shadow-[0_0_30px_rgba(245,237,56,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Generate Script'
                )}
              </button>
            </div>
          </form>

          {error && (
             <div className="w-full p-4 border border-red-500/30 bg-red-500/10 text-red-400 rounded-xl text-center">
               {error}
             </div>
          )}

        </div>
      ) : (
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <button 
            onClick={() => setResult(null)}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            ← Audit another website
          </button>
          <AuditResults result={result} />
        </div>
      )}

    </div>
    </>
  );
}
