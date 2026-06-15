import { prisma } from '../../../lib/prisma';
import Link from 'next/link';
import BrandBookManager from './BrandBookManager';

export const dynamic = 'force-dynamic';

export default async function CreativeStudio() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brands = await (prisma.brandBook.findMany as any)({
    include: {
      assets: true,
      projects: {
        include: { assets: { orderBy: { createdAt: 'desc' } } },
        orderBy: { updatedAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white font-sans">
      <nav className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between border-b border-white/8 backdrop-blur-xl bg-[#0d0d1a]/80">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" className="text-white/40 font-bold hover:text-white transition-colors text-sm">
            ← Dashboard
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white font-black tracking-tight text-lg">
            Creative Hub
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/20 text-xs font-mono">Brand Portfolio Manager</span>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            Creative <span className="text-indigo-400">Hub</span>
          </h1>
          <p className="text-white/40 text-lg">
            Build brand portfolios. Organize projects. Create assets at scale.
          </p>
        </div>

        <BrandBookManager initialBrands={brands as unknown as any[]} />
      </main>
    </div>
  );
}
