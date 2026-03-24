import { prisma } from '../../../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const audits = await prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
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
                <th className="p-5 font-bold text-slate-300">Growth Module</th>
                <th className="p-5 font-bold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#464646]">
              {audits.map((audit: any) => (
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
                    {audit.aiAnalysis ? (
                      <span className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded-lg border border-cyan-500/20 uppercase tracking-wider">
                        Available
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-slate-500/10 text-slate-500 text-xs font-bold rounded-lg border border-slate-500/20 uppercase tracking-wider">
                        Pending
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
              {audits.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    No audits generated yet. Once someone generates an audit on the homepage, it will appear here permanently.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
