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
    return notFound();
  }

  let affiliatePrograms: string[] = [];
  try {
    if (audit.affiliatePrograms) {
      affiliatePrograms = JSON.parse(audit.affiliatePrograms);
    }
  } catch(e) {}

  return (
    <div className="min-h-screen p-8 text-white w-full max-w-4xl mx-auto space-y-6">
      <Link href="/admin/dashboard" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 mb-8 font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to Dashboard
      </Link>
      
      {/* Header section */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#f5ed38]">
        <div>
          <h3 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#f5ed38] to-[#dc9f0f]">
            Historical Growth Audit
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Target: <a href={audit.url} target="_blank" rel="noopener noreferrer" className="text-[#f5ed38] hover:underline font-medium">{audit.url}</a>
          </p>
          <p className="text-slate-500 text-xs mt-1 font-medium bg-[#222222] inline-block px-2 py-1 rounded">Generated on {new Date(audit.createdAt).toLocaleString()}</p>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-black/40 px-4 py-2 border border-[#464646] rounded-xl flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${audit.metaPixelFound ? 'bg-green-400' : 'bg-red-400'} shadow-[0_0_10px_currentColor]`}></div>
            <span className="text-sm font-bold text-white tracking-wide">
              Meta Pixel {audit.metaPixelFound ? 'Found' : 'Missing'}
            </span>
          </div>
        </div>
      </div>

      {/* Growth Audit Section (NOW PRIMARY/ABOVE) */}
      {audit.aiAnalysis && (
        <div className="glass-card rounded-2xl p-8 shadow-xl border border-[#464646] bg-gradient-to-b from-[#111111] to-[#0a0a0a]">
          <div className="flex flex-col mb-6 pb-6 border-b border-[#464646]">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#f5ed38] to-[#dc9f0f] flex items-center gap-3">
              <svg className="w-6 h-6 text-[#f5ed38]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              In-Depth Growth Audit
            </h2>
            <p className="text-slate-400 text-sm mt-2">Executive analysis of Mobile CRO, Lifecycle, Affiliate trajectory, and Omnichannel Strategy.</p>
          </div>

          <div className="space-y-8 mt-4">
            <div className="flex flex-col md:flex-row gap-4">
               <div className="flex-1 bg-black/40 border border-[#464646] rounded-xl p-6">
                 <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#f5ed38]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Affiliate Marketing
                 </h4>
                 {affiliatePrograms.length > 0 ? (
                   <div className="flex gap-2 flex-wrap">
                     {affiliatePrograms.map((p: string) => (
                       <span key={p} className="px-3 py-1.5 bg-[#f5ed38]/20 text-[#f5ed38] text-sm font-semibold rounded-lg border border-[#f5ed38]/30 capitalize">
                         {p} Found
                       </span>
                     ))}
                   </div>
                 ) : (
                   <div className="flex items-start gap-3 text-slate-400 text-sm">
                     <span className="shrink-0 p-1 bg-red-500/10 rounded-lg text-red-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                     </span>
                     <p>No networks found connected to the homepage.</p>
                   </div>
                 )}
               </div>

               {audit.sitemapXml && (
                 <div className="flex-1 bg-black/40 border border-[#464646] rounded-xl p-6 flex flex-col items-start justify-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5ed38]/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                   <h4 className="font-bold text-white mb-3">Technical SEO</h4>
                   <p className="text-slate-400 text-sm mb-4">Sitemap was successfully archived.</p>
                   <a 
                     href={`data:text/xml;base64,${audit.sitemapXml}`} 
                     download={`${audit.brandName || 'brand'}-sitemap.xml`}
                     className="bg-[#222222] hover:bg-[#333333] text-[#f5ed38] px-5 py-2.5 rounded-lg text-sm font-bold border border-[#f5ed38]/30 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,237,56,0.1)] hover:shadow-[0_0_20px_rgba(245,237,56,0.2)]"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                     Download XML
                   </a>
                 </div>
               )}
            </div>

            <AuditAccordion data={audit.aiAnalysis} rawFallback={audit.aiAnalysis || ''} />
          </div>
        </div>
      )}

      {/* Script section (NOW SECONDARY/BELOW) */}
      {audit.script && (
        <div className="glass-card rounded-2xl p-8 shadow-xl border border-[#464646]">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 border-b border-[#464646] pb-6 mb-6">
            <svg className="w-6 h-6 text-[#f5ed38]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            Presentation Video Script
          </h2>
          
          <div className="prose prose-invert max-w-none">
            <div className="text-lg leading-relaxed text-slate-200 whitespace-pre-wrap font-medium">
              {audit.script}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
