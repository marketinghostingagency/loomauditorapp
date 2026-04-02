import { prisma } from '../../../lib/prisma';
import Link from 'next/link';
import BrandBookManager from './BrandBookManager';

export const dynamic = 'force-dynamic';

export default async function CreativeStudio() {
  const brands = await prisma.brandBook.findMany({
    include: { assets: true },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      <nav className="glass-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[#222222]">
        <div className="flex items-center gap-6">
           <Link href="/admin/dashboard" className="text-slate-400 font-bold hover:text-white transition-colors">
             MHA Core
           </Link>
           <span className="text-[#464646]">/</span>
           <span className="text-[#f5ed38] font-bold tracking-tight text-xl">
             Creative Studio & DAM
           </span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
         <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Digital Asset <span className="text-[#f5ed38]">Manager</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Upload, generate, and orchestrate creative pipelines directly synced to your Core intelligence.
            </p>
         </div>

         <BrandBookManager initialBrands={brands} />
      </main>
    </div>
  );
}
