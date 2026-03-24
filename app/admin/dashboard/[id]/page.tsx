import { prisma } from '../../../../lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AuditAccordion from '../../../../components/AuditAccordion';

export const dynamic = 'force-dynamic';

export default async function AuditDetail({ params }: { params: { id: string } }) {
  const audit = await prisma.audit.findUnique({
    where: { id: params.id }
  });

  if (!audit) {
    notFound();
  }

  // Safely parse JSON strings from the database for the new UI Hub
  let affiliatePrograms: string[] = [];
  try {
     affiliatePrograms = audit.affiliatePrograms ? JSON.parse(audit.affiliatePrograms) : [];
  } catch(e) {}

  return (
    <div className="min-h-screen bg-[#111111] text-slate-200 font-sans selection:bg-[#f5ed38] selection:text-black">
      <nav className="glass-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[#222222]">
        <Link href="/admin/dashboard" className="text-white font-bold text-xl tracking-tight hover:text-[#f5ed38] transition-colors flex items-center gap-2">
          ← Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Audit Insight: <span className="text-[#f5ed38]">{audit.brandName}</span>
          </h1>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <a href={audit.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#dc9f0f] transition-colors flex items-center gap-1">
              {audit.apexDomain}
            </a>
            <span className="w-1.5 h-1.5 rounded-full bg-[#464646]"></span>
            <span>{new Date(audit.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </header>

        {/* Dynamic Research Hub & Ad Library Quick Links */}
        {(audit.brandName || audit.apexDomain) && (
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 border border-[#464646] mb-8">
            <h2 className="text-[#f5ed38] font-bold text-lg mb-2 flex items-center justify-center gap-2">
              Advertising & Tech Intelligence Hub
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <a href={`https://builtwith.com/${audit.apexDomain}`} target="_blank" rel="noopener noreferrer" className="bg-[#222] hover:bg-[#333] text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-[#464646]">
                BuiltWith Tech Analyzer
              </a>
              <a href={`https://trends.google.com/trends/explore?date=today%205-y&q=${encodeURIComponent(audit.brandName)}`} target="_blank" rel="noopener noreferrer" className="bg-[#222] hover:bg-[#333] text-[#f5ed38] font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-[#f5ed38]/30">
                Google Trends (5YR)
              </a>

              <a href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=${encodeURIComponent(audit.brandName)}`} target="_blank" rel="noopener noreferrer" className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-blue-600/50 shadow-sm">
                Meta Ads Library
              </a>
              <a href={`https://adstransparency.google.com/?region=US&domain=${audit.apexDomain}`} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-slate-100 text-[#ea4335] font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-slate-200">
                Google Ads Library
              </a>
              
              {/* PageSpeed */}
              <a href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(audit.url)}`} target="_blank" rel="noopener noreferrer" className="bg-[#222] hover:bg-[#333] text-green-400 font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors border border-green-500/30">
                PageSpeed: Homepage
              </a>

              {/* Affiliate */}
              {affiliatePrograms && affiliatePrograms.length > 0 ? (
                 <div className="bg-[#222] text-purple-400 font-medium py-2 px-4 rounded-lg flex items-center justify-center border border-purple-500/30 text-center text-sm md:col-span-full">
                   Affiliates Detected: {affiliatePrograms.join(', ')}
                 </div>
              ) : (
                 <div className="bg-[#222] text-slate-400 font-medium py-2 px-4 rounded-lg flex items-center justify-center border border-[#464646] text-sm md:col-span-full">
                   No Affiliate Footprint Detected
                 </div>
              )}
            </div>
          </div>
        )}

        {audit.aiAnalysis && (
          <div className="glass-card rounded-2xl p-6 md:p-10 border border-[#dc9f0f]/30 relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#dc9f0f] via-[#f5ed38] to-[#dc9f0f]"></div>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#464646]/50 pb-6">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                    In-Depth <span className="text-[#f5ed38]">Growth Playbook</span>
                  </h2>
                  {audit.metaPixelFound ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                      Meta Pixel Traced
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                      No Tracking Pixels Found
                    </span>
                  )}
                </div>
              </div>

              <AuditAccordion data={audit.aiAnalysis} rawFallback={audit.aiAnalysis || ''} />
            </div>
          </div>
        )}

        {audit.script && (
          <div className="glass-card rounded-2xl p-8 border border-[#222] shadow-xl">
            <h2 className="text-[#dc9f0f] font-bold text-2xl flex items-center gap-3 mb-6 pb-4 border-b border-[#464646]/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              Loom Pitch Script
            </h2>
            <div className="prose prose-invert max-w-none text-slate-200 text-lg leading-relaxed whitespace-pre-wrap font-medium">
               {audit.script}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
