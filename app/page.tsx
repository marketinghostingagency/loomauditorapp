'use client';

import { useState } from 'react';
import AuditResults from '@/components/AuditResults';
import Link from 'next/link';

export default function Home() {
  const [url, setUrl] = useState('');
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [brand, setBrand] = useState('');
  
  // Lead info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !brand) return;
    setShowModal(true);
  };

  const handleGenerateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and Email are required.');
      return;
    }

    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    let targetLandingUrl = landingPageUrl;
    if (targetLandingUrl && !targetLandingUrl.startsWith('http://') && !targetLandingUrl.startsWith('https://')) {
      targetLandingUrl = 'https://' + targetLandingUrl;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/growth-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           url: targetUrl, 
           landingPageUrl: targetLandingUrl, 
           brand,
           leadName: name,
           leadEmail: email,
           leadPhone: phone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start audit generation.');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="glass-card p-10 rounded-3xl border border-green-500/30 text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-white">Analysis In Progress</h2>
          <p className="text-lg text-slate-400">
             The MHA Intelligence Engine is currently processing {brand}'s footprint. Because this is a master-level audit, this process takes time. Once completed and ready for review, you'll be emailed a secure link to your executive report.
          </p>
          <button onClick={() => { setIsSuccess(false); setShowModal(false); }} className="mt-8 px-6 py-3 bg-[#f5ed38] hover:bg-[#dc9f0f] text-black font-bold rounded-xl transition-colors">
            Audit Another Brand
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto mt-12 md:mt-0">
      
        <div className="w-full max-w-2xl flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-sm">
              Joel's
              <br/>
              <span className="text-gradient">Audits</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
              Enter a prospect's brand name and URL below. The MHA Intelligence Engine will rigorously audit their Mobile CRO, SEO architecture, Affiliate networks, and Paid Lifecycle flows to instantly architect an elite, board-level Omnichannel Growth Strategy.
            </p>
          </div>

          <form onSubmit={handleInitialSubmit} className="w-full relative group">
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
                  suppressHydrationWarning
                />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Homepage URL (e.g. mudplugz.com)"
                  className="w-full md:w-1/3 bg-black/20 border border-[#464646] rounded-xl outline-none px-6 py-4 text-lg text-white placeholder-slate-500 focus:border-[#f5ed38] transition-colors"
                  required
                  suppressHydrationWarning
                />
                <input
                  type="url"
                  value={landingPageUrl}
                  onChange={(e) => setLandingPageUrl(e.target.value)}
                  placeholder="Landing Page URL (Optional)"
                  className="w-full md:w-1/3 bg-black/20 border border-[#464646] rounded-xl outline-none px-6 py-4 text-lg text-white placeholder-slate-500 focus:border-[#f5ed38] transition-colors"
                  suppressHydrationWarning
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#f5ed38] hover:bg-[#dc9f0f] text-[#111111] font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(245,237,56,0.3)] hover:shadow-[0_0_30px_rgba(245,237,56,0.6)] flex items-center justify-center gap-2"
              >
                Generate Growth Audit
              </button>
            </div>
          </form>

          {error && (
             <div className="w-full p-4 border border-red-500/30 bg-red-500/10 text-red-400 rounded-xl text-center">
               {error}
             </div>
          )}

        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="glass-card max-w-md w-full rounded-2xl p-8 border border-[#dc9f0f]/50 relative">
             <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
               ✕
             </button>
             
             <h3 className="text-2xl font-black text-white mb-2">Almost there...</h3>
             <p className="text-slate-400 text-sm mb-6">
                Because we provide highly actionable hypothesis and gather robust intelligence, this audit can take up to <strong>48 hours</strong> to generate. Enter your details below and we will automatically email you the link when it's ready.
             </p>

             <form onSubmit={handleGenerateLead} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-black/40 border border-[#464646] rounded-lg outline-none px-4 py-3 text-white placeholder-slate-500 focus:border-[#f5ed38] transition-colors"
                  required
                  suppressHydrationWarning
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your Email"
                  className="w-full bg-black/40 border border-[#464646] rounded-lg outline-none px-4 py-3 text-white placeholder-slate-500 focus:border-[#f5ed38] transition-colors"
                  required
                  suppressHydrationWarning
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your Phone Number (Optional)"
                  className="w-full bg-black/40 border border-[#464646] rounded-lg outline-none px-4 py-3 text-white placeholder-slate-500 focus:border-[#f5ed38] transition-colors"
                  suppressHydrationWarning
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-[#dc9f0f] hover:bg-[#f5ed38] text-black font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Initializing Audit...
                    </>
                  ) : (
                    'Start Analysis'
                  )}
                </button>
             </form>
           </div>
        </div>
      )}
    </>
  );
}
