'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InternalAudit() {
  const [url, setUrl] = useState('');
  const [brand, setBrand] = useState('');
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // By omitting leadName and leadEmail, the backend won't create a Lead
      const res = await fetch('/api/growth-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, brand, landingPageUrl })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start audit processing');
      }

      setSuccess('Internal audit successfully initiated in the background! You can view it as an Orphaned Audit in the dashboard once it completes.');
      setUrl('');
      setBrand('');
      setLandingPageUrl('');
      
      // Optionally route back
      // router.push('/admin/dashboard');

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      <nav className="glass-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[#222222]">
        <div className="text-white font-bold text-xl tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f5ed38] animate-pulse"></span>
          MHA Core <span className="text-[#464646]">/</span> <span className="text-slate-400 font-medium text-lg">Internal Audit Tool</span>
        </div>
        <Link href="/admin/dashboard" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
          &larr; Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#f5ed38] to-[#dc9f0f]">
            Run Internal Audit
          </h1>
          <p className="text-slate-400 mt-2">
            Trigger the Growth Audit Engine directly. This bypasses the lead generation forms, so no fake CRM records are created. 
            Audits run here will appear as "Orphaned Audits" in the main dashboard.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-[#464646] shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="brand" className="block text-sm font-bold text-slate-300 mb-2">Brand Name*</label>
              <input
                type="text"
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5ed38] focus:ring-1 focus:ring-[#f5ed38] transition-colors"
                placeholder="e.g. Acme Corp"
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-bold text-slate-300 mb-2">Target Website URL*</label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5ed38] focus:ring-1 focus:ring-[#f5ed38] transition-colors"
                placeholder="e.g. https://acmecorp.com"
              />
            </div>

            <div>
              <label htmlFor="landingPageUrl" className="block text-sm font-bold text-slate-300 mb-2">Specific Landing Page URL (Optional)</label>
              <input
                type="url"
                id="landingPageUrl"
                value={landingPageUrl}
                onChange={(e) => setLandingPageUrl(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5ed38] transition-colors"
                placeholder="e.g. https://acmecorp.com/offer"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#f5ed38] to-[#dc9f0f] hover:from-[#ffff5c] hover:to-[#ffbd2d] text-black font-bold text-lg py-4 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(245,237,56,0.2)] hover:shadow-[0_0_25px_rgba(245,237,56,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Initializing Audit Engine...' : 'Run Audit directly'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
