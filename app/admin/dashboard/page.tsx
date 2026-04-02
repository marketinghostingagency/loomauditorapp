import { prisma } from '../../../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const audits = await prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const leads = await prisma.lead.findMany({
    where: { auditId: { in: audits.map((a: any) => a.id) } }
  });

  const auditsWithLeads = audits.map((audit: any) => ({
    ...audit,
    lead: leads.find((l: any) => l.auditId === audit.id)
  }));

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      <nav className="glass-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[#222222]">
        <div className="text-white font-bold text-xl tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f5ed38] animate-pulse"></span>
          MHA Core <span className="text-[#464646]">/</span> <span className="text-slate-400 font-medium text-lg">Growth Auditor</span>
        </div>
        <Link href="/admin/studio" className="hover:bg-[#f5ed38] hover:text-black text-[#f5ed38] border border-[#f5ed38]/50 px-4 py-2 rounded-xl text-sm font-bold tracking-tight transition-colors">
          Launch Creative Studio &rarr;
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center border-b border-[#464646] pb-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#f5ed38] to-[#dc9f0f]">
            Historical Audits
          </h1>
          <p className="text-slate-400 font-medium bg-[#222222] px-4 py-1.5 rounded-full border border-[#464646]">
            Total Records: <span className="text-white">{audits.length}</span>
          </p>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden border border-[#464646] shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-[#464646]">
                <th className="p-5 font-bold text-slate-300">Date Generated</th>
                <th className="p-5 font-bold text-slate-300">Brand</th>
                <th className="p-5 font-bold text-slate-300">Target URL</th>
                <th className="p-5 font-bold text-slate-300">Target Contact</th>
                <th className="p-5 font-bold text-slate-300">Delivery</th>
                <th className="p-5 font-bold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#464646]">
              {auditsWithLeads.map((audit: any) => (
                <tr key={audit.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-5 text-sm text-slate-400">
                    {new Date(audit.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-5 font-semibold text-white">{audit.brandName}</td>
                  <td className="p-5 text-sm">
                    <a href={audit.url} target="_blank" rel="noopener noreferrer" className="text-[#f5ed38] hover:text-white transition-colors underline-offset-4 group-hover:underline">
                      {audit.url}
                    </a>
                  </td>
                  <td className="p-5">
                    {audit.lead ? (
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-[#f5ed38]">{audit.lead.name}</span>
                         <a href={`mailto:${audit.lead.email}`} className="text-xs text-slate-400 hover:text-white underline underline-offset-2">{audit.lead.email}</a>
                       </div>
                    ) : (
                       <span className="text-xs text-slate-600 block italic">Orphaned Audit (No Lead)</span>
                    )}
                  </td>
                  <td className="p-5">
                     {audit.sentAt ? (
                       <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded border border-green-500/20 uppercase w-fit tracking-wider">
                            Sent ({audit.sentTheme === 'mha' ? 'MHA' : 'Simplicity'})
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                             {new Date(audit.sentAt).toLocaleDateString()}
                          </span>
                       </div>
                     ) : (
                       <span className="px-2 py-1 bg-slate-500/10 text-slate-500 text-[10px] font-bold rounded border border-slate-500/20 uppercase tracking-wider">
                         Unsent
                       </span>
                     )}
                  </td>
                  <td className="p-5">
                    <Link href={`/admin/dashboard/${audit.id}`} className="text-[#f5ed38] hover:text-[#dc9f0f] text-sm font-bold flex items-center gap-1.5 transition-colors">
                      View Report
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </Link>
                  </td>
                </tr>
              ))}
              {auditsWithLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    No audits generated yet. Once someone generates an audit on the homepage, it will appear here permanently.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
